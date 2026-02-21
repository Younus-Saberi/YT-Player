import subprocess
import os
import re
import json
from pathlib import Path
import config


class YouTubeDownloadError(Exception):
    """Custom exception for YouTube download errors."""
    def __init__(self, message):
        self.message = message
        super().__init__(self.message)


class YouTubeService:
    """Service for downloading and processing YouTube videos."""

    def __init__(self, output_path=None):
        if output_path is None:
            output_path = config.UPLOAD_FOLDER
        self.output_path = output_path

    @staticmethod
    def validate_url(url):
        """Validate if the URL is a valid YouTube URL."""
        youtube_regex = r'^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/'
        return re.match(youtube_regex, url) is not None

    @staticmethod
    def sanitize_filename(filename):
        """Sanitize filename by removing invalid characters."""
        # Remove invalid characters
        sanitized = re.sub(r'[<>:"/\\|?*]', '', filename)
        # Remove leading/trailing spaces and dots
        sanitized = re.sub(r'^[\s.]+|[\s.]+$', '', sanitized)
        # Limit length
        if len(sanitized) > 200:
            sanitized = sanitized[:200]
        return sanitized or 'download'

    def get_video_info(self, url):
        """Get video information using yt-dlp."""
        try:
            # Check if yt-dlp is installed
            try:
                subprocess.run(['yt-dlp', '--version'], capture_output=True, check=True)
            except (subprocess.CalledProcessError, FileNotFoundError):
                raise YouTubeDownloadError(
                    'yt-dlp is not installed. Please install it first:\n'
                    'Ubuntu/Debian: sudo apt-get install yt-dlp\n'
                    'macOS: brew install yt-dlp\n'
                    'Windows: Download from https://github.com/yt-dlp/yt-dlp/releases'
                )

            # Get video info in JSON format
            result = subprocess.run([
                'yt-dlp',
                '--dump-json',
                '--no-warnings',
                '-q',
                url
            ], capture_output=True, text=True, timeout=30)

            if result.returncode != 0:
                if 'ERROR' in result.stderr:
                    raise YouTubeDownloadError(f'Video not found or unavailable: {result.stderr}')
                raise YouTubeDownloadError(f'Error fetching video info: {result.stderr}')

            info = json.loads(result.stdout)

            return {
                'title': info.get('title', 'Unknown'),
                'duration': info.get('duration', 0),
                'uploader': info.get('uploader', 'Unknown'),
                'thumbnail': info.get('thumbnail', None),
            }

        except YouTubeDownloadError:
            raise
        except json.JSONDecodeError as e:
            raise YouTubeDownloadError(f'Invalid response from yt-dlp: {e}')
        except subprocess.TimeoutExpired:
            raise YouTubeDownloadError('Video info request timed out')
        except Exception as e:
            raise YouTubeDownloadError(f'Error fetching video info: {str(e)}')

    def download_audio(self, url, quality='192'):
        """Download audio from YouTube as MP3."""
        try:
            # Ensure output directory exists
            os.makedirs(self.output_path, exist_ok=True)

            # Get video info first
            info = self.get_video_info(url)
            title = info['title']
            safe_title = self.sanitize_filename(title)

            # Output template for yt-dlp
            output_template = os.path.join(self.output_path, safe_title)

            # Download audio and convert to MP3 using yt-dlp
            result = subprocess.run([
                'yt-dlp',
                url,
                '-f', 'bestaudio/best',
                '-x',                           # Extract audio
                '--audio-format', 'mp3',        # Convert to mp3
                '--audio-quality', quality,     # Audio quality
                '-o', output_template + '.%(ext)s',
                '--quiet',
                '--no-warnings',
            ], capture_output=True, text=True, timeout=600)

            if result.returncode != 0:
                raise YouTubeDownloadError(f'yt-dlp failed: {result.stderr}')

            # Find the created MP3 file
            files = os.listdir(self.output_path)
            mp3_files = [f for f in files if f.startswith(safe_title) and f.endswith('.mp3')]

            if not mp3_files:
                raise YouTubeDownloadError('MP3 file was not created')

            mp3_file = os.path.join(self.output_path, mp3_files[0])
            file_size = os.path.getsize(mp3_file)

            return {
                'filePath': mp3_file,
                'title': title,
                'fileSize': file_size,
            }

        except YouTubeDownloadError:
            raise
        except subprocess.TimeoutExpired:
            raise YouTubeDownloadError('Download timed out')
        except Exception as e:
            raise YouTubeDownloadError(f'Error downloading audio: {str(e)}')

    @staticmethod
    def cleanup_file(file_path):
        """Delete a file if it exists."""
        try:
            if file_path and os.path.isfile(file_path):
                os.unlink(file_path)
                return True
            return False
        except Exception as e:
            print(f'Error deleting file {file_path}: {e}')
            return False
