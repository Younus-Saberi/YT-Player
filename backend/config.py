import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Get the base directory
BASE_DIR = Path(__file__).parent

# Server Configuration
PORT = int(os.getenv('PORT', 5000))
NODE_ENV = os.getenv('NODE_ENV', 'development')
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

# File Upload Configuration
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB

# Database Configuration
DATABASE_PATH = os.path.join(BASE_DIR, 'instance', 'yt_converter.db')

# File Cleanup Configuration
FILE_CLEANUP_DAYS = 7
FILE_CLEANUP_INTERVAL = 24 * 60 * 60  # 24 hours in seconds

# Download Configuration
ALLOWED_QUALITIES = ['128', '192', '256', '320']
DEFAULT_QUALITY = '192'

# Rate Limiting
RATELIMIT_PER_MINUTE = 5

# CORS Configuration
CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')

# FFmpeg Configuration
FFMPEG_TIMEOUT = 300  # 5 minutes

# Logging
LOG_LEVEL = os.getenv('LOG_LEVEL', 'info').lower()
