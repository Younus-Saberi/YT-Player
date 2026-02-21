from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import database

history_bp = Blueprint('history', __name__)


@history_bp.route('/history', methods=['GET'])
def get_history():
    """GET /api/history - Get download history."""
    try:
        status = request.args.get('status')
        limit = min(int(request.args.get('limit', 50)), 100)
        offset = int(request.args.get('offset', 0))

        # Build query
        query = 'SELECT * FROM downloads'
        params = []

        # Filter by status if provided
        if status:
            allowed_statuses = ['pending', 'processing', 'completed', 'failed']
            if status not in allowed_statuses:
                return jsonify({
                    'success': False,
                    'message': f'Invalid status. Allowed: {", ".join(allowed_statuses)}',
                }), 400

            query += ' WHERE status = ?'
            params.append(status)

        # Get total count
        count_query = query.replace('SELECT *', 'SELECT COUNT(*) as count')
        count_result = database.all_query(count_query, params)
        total = count_result[0].get('count', 0) if count_result else 0

        # Get paginated results
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
        params.extend([limit, offset])

        downloads = database.all_query(query, params)

        return jsonify({
            'success': True,
            'data': downloads,
            'total': total,
            'limit': limit,
            'offset': offset,
        }), 200

    except Exception as error:
        print(f'Error fetching history: {error}')
        return jsonify({
            'success': False,
            'message': f'Error fetching history: {str(error)}',
        }), 500


@history_bp.route('/history/stats', methods=['GET'])
def get_stats():
    """GET /api/history/stats - Get statistics."""
    try:
        stats = {}

        # Total downloads
        total_result = database.all_query('SELECT COUNT(*) as count FROM downloads')
        stats['total_downloads'] = total_result[0].get('count', 0) if total_result else 0

        # Completed downloads
        completed_result = database.all_query(
            'SELECT COUNT(*) as count FROM downloads WHERE status = "completed"'
        )
        stats['completed_downloads'] = completed_result[0].get('count', 0) if completed_result else 0

        # Failed downloads
        failed_result = database.all_query(
            'SELECT COUNT(*) as count FROM downloads WHERE status = "failed"'
        )
        stats['failed_downloads'] = failed_result[0].get('count', 0) if failed_result else 0

        # Pending downloads
        pending_result = database.all_query(
            'SELECT COUNT(*) as count FROM downloads WHERE status = "pending"'
        )
        stats['pending_downloads'] = pending_result[0].get('count', 0) if pending_result else 0

        # Processing downloads
        processing_result = database.all_query(
            'SELECT COUNT(*) as count FROM downloads WHERE status = "processing"'
        )
        stats['processing_downloads'] = processing_result[0].get('count', 0) if processing_result else 0

        # Total data processed
        size_result = database.all_query(
            'SELECT SUM(file_size) as total_size FROM downloads WHERE status = "completed"'
        )
        stats['total_data_processed'] = size_result[0].get('total_size', 0) if size_result else 0

        return jsonify({
            'success': True,
            'stats': stats,
        }), 200

    except Exception as error:
        print(f'Error fetching stats: {error}')
        return jsonify({
            'success': False,
            'message': f'Error fetching stats: {str(error)}',
        }), 500


@history_bp.route('/history/recent', methods=['GET'])
def get_recent():
    """GET /api/history/recent - Get recent downloads."""
    try:
        downloads = database.all_query(
            'SELECT * FROM downloads WHERE status = "completed" ORDER BY completed_at DESC LIMIT 10'
        )

        return jsonify({
            'success': True,
            'data': downloads,
        }), 200

    except Exception as error:
        print(f'Error fetching recent downloads: {error}')
        return jsonify({
            'success': False,
            'message': f'Error fetching recent downloads: {str(error)}',
        }), 500


@history_bp.route('/history/clear', methods=['DELETE'])
def clear_history():
    """DELETE /api/history/clear - Clear history."""
    try:
        older_than_days = request.args.get('older_than_days', type=int)

        query = 'DELETE FROM downloads WHERE status = "completed"'
        params = []

        # Filter by age if specified
        if older_than_days:
            cutoff_date = (datetime.now() - timedelta(days=older_than_days)).isoformat()
            query += ' AND created_at < ?'
            params.append(cutoff_date)

        database.run_query(query, params)

        return jsonify({
            'success': True,
            'message': 'History cleared successfully',
        }), 200

    except Exception as error:
        print(f'Error clearing history: {error}')
        return jsonify({
            'success': False,
            'message': f'Error clearing history: {str(error)}',
        }), 500
