import subprocess
import os
import config


class ConversionError(Exception):
    """Custom exception for audio conversion errors."""
    def __init__(self, message):
        self.message = message
        super().__init__(self.message)


class AudioConverter:
    """Service for converting audio to MP3 format."""

    QUALITY_BITRATE_MAP = {
        '128': '128k',
        '192': '192k',
        '256': '256k',
        '320': '320k',
    }

    @staticmethod
    def check_ffmpeg():
        """Check if FFmpeg is available."""
        try:
            result = subprocess.run(['ffmpeg', '-version'], capture_output=True, timeout=5)
            return result.returncode == 0
        except Exception:
            return False

    @staticmethod
    def convert_to_mp3(input_file, output_file, quality='192', title=''):
        """Convert audio to MP3 format using FFmpeg."""
        if quality not in AudioConverter.QUALITY_BITRATE_MAP:
            raise ConversionError(f'Invalid quality: {quality}')

        bitrate = AudioConverter.QUALITY_BITRATE_MAP[quality]

        # Build ffmpeg command
        cmd = [
            'ffmpeg',
            '-i', input_file,
            '-codec:a', 'libmp3lame',
            '-b:a', bitrate,
            '-ac', '2',
            '-ar', '44100',
            '-q:a', '0',
        ]

        # Add metadata if title is provided
        if title:
            cmd.extend(['-metadata', f'title={title}'])

        cmd.extend(['-y', output_file])  # -y to overwrite output file

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=config.FFMPEG_TIMEOUT
            )

            if result.returncode != 0:
                raise ConversionError(f'FFmpeg error: {result.stderr}')

            return output_file

        except subprocess.TimeoutExpired:
            raise ConversionError(f'FFmpeg conversion timed out after {config.FFMPEG_TIMEOUT} seconds')
        except Exception as e:
            raise ConversionError(f'Conversion error: {str(e)}')

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
