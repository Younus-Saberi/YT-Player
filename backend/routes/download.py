from flask import Blueprint, request, jsonify, send_file
import os
import threading
import uuid
from datetime import datetime
import database
from services.youtube import YouTubeService, YouTubeDownloadError
from middleware.rate_limit import rate_limit
import config

download_bp = Blueprint('download', __name__)
youtube_service = YouTubeService()


def process_download(download_id, url, quality):
    """Process download in background."""
    try:
        # Update status to processing
        database.run_query(
            'UPDATE downloads SET status = "processing" WHERE id = ?',
            [download_id]
        )

        # Download audio
        result = youtube_service.download_audio(url, quality)

        # Update download record with success
        now = datetime.now().isoformat()
        database.run_query(
            '''UPDATE downloads SET
                file_path = ?,
                file_size = ?,
                status = "completed",
                completed_at = ?
            WHERE id = ?''',
            [result['filePath'], result['fileSize'], now, download_id]
        )
    except Exception as error:
        # Update download record with error
        error_message = str(error) if str(error) else 'Unknown error occurred'
        database.run_query(
            'UPDATE downloads SET status = "failed", error_message = ? WHERE id = ?',
            [error_message, download_id]
        )

        print(f'Error processing download {download_id}: {error}')


@download_bp.route('/download', methods=['POST'])
@rate_limit
def create_download():
    """POST /api/download - Create a new download."""
    try:
        print('[DOWNLOAD] Request received')
        data = request.get_json()
        print(f'[DOWNLOAD] Request data: {data}')
        
        url = data.get('url', '').strip() if data else ''
        quality = data.get('quality', config.DEFAULT_QUALITY) if data else config.DEFAULT_QUALITY
        
        print(f'[DOWNLOAD] URL: {url}, Quality: {quality}')

        # Validation
        if not url:
            print('[DOWNLOAD] FAIL: URL is required')
            return jsonify({
                'success': False,
                'message': 'YouTube URL is required',
            }), 400

        if len(url) > 500:
            print('[DOWNLOAD] FAIL: URL too long')
            return jsonify({
                'success': False,
                'message': 'URL is too long',
            }), 400

        # Validate quality
        print(f'[DOWNLOAD] Allowed qualities: {config.ALLOWED_QUALITIES}')
        if quality not in config.ALLOWED_QUALITIES:
            print(f'[DOWNLOAD] FAIL: Invalid quality {quality}')
            return jsonify({
                'success': False,
                'message': f'Invalid quality. Allowed: {", ".join(config.ALLOWED_QUALITIES)}',
            }), 400

        # Validate YouTube URL
        url_valid = youtube_service.validate_url(url)
        print(f'[DOWNLOAD] URL valid: {url_valid}')
        if not url_valid:
            print('[DOWNLOAD] FAIL: Invalid YouTube URL')
            return jsonify({
                'success': False,
                'message': 'Invalid YouTube URL',
            }), 400

        # Get video info
        try:
            print('[DOWNLOAD] Fetching video info...')
            video_info = youtube_service.get_video_info(url)
            print(f'[DOWNLOAD] Video info: {video_info}')
        except YouTubeDownloadError as error:
            print(f'[DOWNLOAD] FAIL: Video info error: {error}')
            return jsonify({
                'success': False,
                'message': str(error),
            }), 400

        # Create download record
        result = database.run_query(
            'INSERT INTO downloads (youtube_url, title, quality, status) VALUES (?, ?, ?, "pending")',
            [url, video_info['title'], quality]
        )

        download_id = result['id']

        # Start background processing
        thread = threading.Thread(
            target=process_download,
            args=(download_id, url, quality),
            daemon=True
        )
        thread.start()

        return jsonify({
            'success': True,
            'download_id': download_id,
            'status': 'pending',
            'message': 'Download queued successfully',
        }), 202

    except Exception as error:
        print(f'Error creating download: {error}')
        return jsonify({
            'success': False,
            'message': f'Error creating download: {str(error)}',
        }), 500


@download_bp.route('/download/<int:download_id>', methods=['GET'])
def get_download_status(download_id):
    """GET /api/download/<id> - Get download status."""
    try:
        download = database.get_query(
            'SELECT * FROM downloads WHERE id = ?',
            [download_id]
        )

        if not download:
            return jsonify({
                'success': False,
                'message': 'Download not found',
            }), 404

        # Calculate progress percentage
        progress = 0
        if download.get('status') == 'pending':
            progress = 0
        elif download.get('status') == 'processing':
            progress = 50
        elif download.get('status') == 'completed':
            progress = 100
        elif download.get('status') == 'failed':
            progress = 0

        return jsonify({
            'success': True,
            'download_id': download.get('id'),
            'title': download.get('title'),
            'quality': download.get('quality'),
            'status': download.get('status'),
            'progress_percentage': progress,
            'error_message': download.get('error_message'),
            'file_size': download.get('file_size'),
            'created_at': download.get('created_at'),
            'completed_at': download.get('completed_at'),
        }), 200

    except Exception as error:
        print(f'Error fetching download status: {error}')
        return jsonify({
            'success': False,
            'message': f'Error fetching download status: {str(error)}',
        }), 500


@download_bp.route('/download/<int:download_id>/file', methods=['GET'])
def download_file(download_id):
    """GET /api/download/<id>/file - Download the MP3 file."""
    try:
        download = database.get_query(
            'SELECT * FROM downloads WHERE id = ?',
            [download_id]
        )

        if not download:
            return jsonify({
                'success': False,
                'message': 'Download not found',
            }), 404

        if download.get('status') != 'completed':
            return jsonify({
                'success': False,
                'message': f'Cannot download. Status: {download.get("status")}',
            }), 400

        file_path = download.get('file_path')

        if not file_path:
            return jsonify({
                'success': False,
                'message': 'File path not found',
            }), 404

        # Check if file exists
        if not os.path.isfile(file_path):
            return jsonify({
                'success': False,
                'message': 'File not found',
            }), 404

        # Send file
        return send_file(
            file_path,
            as_attachment=True,
            download_name=f'{download.get("title")}.mp3'
        )

    except Exception as error:
        print(f'Error downloading file: {error}')
        return jsonify({
            'success': False,
            'message': f'Error downloading file: {str(error)}',
        }), 500


@download_bp.route('/download/<int:download_id>', methods=['DELETE'])
def delete_download(download_id):
    """DELETE /api/download/<id> - Delete a download."""
    try:
        download = database.get_query(
            'SELECT * FROM downloads WHERE id = ?',
            [download_id]
        )

        if not download:
            return jsonify({
                'success': False,
                'message': 'Download not found',
            }), 404

        # Delete file if exists
        if download.get('file_path'):
            try:
                if os.path.isfile(download['file_path']):
                    os.unlink(download['file_path'])
            except Exception as error:
                print(f'Error deleting file: {error}')

        # Delete database record
        database.run_query(
            'DELETE FROM downloads WHERE id = ?',
            [download_id]
        )

        return jsonify({
            'success': True,
            'message': 'Download deleted successfully',
        }), 200

    except Exception as error:
        print(f'Error deleting download: {error}')
        return jsonify({
            'success': False,
            'message': f'Error deleting download: {str(error)}',
        }), 500
