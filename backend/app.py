import os
import signal
import sys
import threading
from pathlib import Path
from flask import Flask, jsonify
from flask_cors import CORS
import database
import config
from routes.download import download_bp
from routes.history import history_bp
from services.cleanup import CleanupService
from middleware.rate_limit import start_cleanup_task

# Get the base directory
BASE_DIR = Path(__file__).parent

app = Flask(__name__)

# CORS Configuration - Allow all origins globally
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# JSON configuration
app.config['JSON_SORT_KEYS'] = False


def ensure_directories():
    """Create necessary directories."""
    try:
        os.makedirs(config.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(os.path.dirname(config.DATABASE_PATH), exist_ok=True)
        print('✓ Directories ensured')
        return True
    except Exception as error:
        print(f'Error creating directories: {error}')
        return False


def initialize_database():
    """Initialize database."""
    try:
        database.init_db()
        print('✓ Database initialized')
        return True
    except Exception as error:
        print(f'Error initializing database: {error}')
        return False


def start_cleanup_service():
    """Start the cleanup service."""
    cleanup = CleanupService()

    # Run cleanup immediately on startup
    try:
        stats = cleanup.cleanup_old_files()
        print(f'✓ Cleanup task completed: {stats}')
    except Exception as error:
        print(f'Error running cleanup: {error}')

    # Schedule cleanup task to run every 24 hours
    def cleanup_loop():
        while True:
            import time
            time.sleep(config.FILE_CLEANUP_INTERVAL)
            try:
                stats = cleanup.cleanup_old_files()
                print(f'✓ Cleanup task completed: {stats}')
            except Exception as error:
                print(f'Error running cleanup: {error}')

    thread = threading.Thread(target=cleanup_loop, daemon=True)
    thread.start()

    hours = config.FILE_CLEANUP_INTERVAL / 3600
    print(f'✓ Cleanup task scheduled every {hours} hours')


# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'YouTube to MP3 Converter API is running',
    }), 200


# Root endpoint
@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'YouTube to MP3 Converter API',
        'version': '1.0.0',
        'endpoints': {
            'health': '/api/health',
            'create_download': 'POST /api/download',
            'get_status': 'GET /api/download/<id>',
            'download_file': 'GET /api/download/<id>/file',
            'delete_download': 'DELETE /api/download/<id>',
            'history': 'GET /api/history',
            'history_stats': 'GET /api/history/stats',
            'recent_downloads': 'GET /api/history/recent',
            'clear_history': 'DELETE /api/history/clear',
        },
    }), 200


# Register blueprints
app.register_blueprint(download_bp, url_prefix='/api')
app.register_blueprint(history_bp, url_prefix='/api')


# Error handling middleware
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'Endpoint not found',
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': 'Internal server error',
    }), 500


def start_server():
    """Start the server."""
    try:
        print('🎵 YouTube to MP3 Converter - Starting...\n')

        # Ensure directories
        if not ensure_directories():
            sys.exit(1)

        # Initialize database
        if not initialize_database():
            sys.exit(1)

        # Start cleanup task
        start_cleanup_service()

        # Start rate limit cleanup
        start_cleanup_task(app)

        # Start server
        PORT = config.PORT
        print(f'\n✓ Server running on http://localhost:{PORT}')
        print(f'✓ API available at http://localhost:{PORT}/api')
        print(f'✓ Environment: {config.NODE_ENV}')
        print('\nReady for downloads! 🚀\n')

        # Handle graceful shutdown
        def signal_handler(sig, frame):
            print('\nSIGINT signal received: closing HTTP server')
            database.close_db()
            sys.exit(0)

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

        app.run(host='0.0.0.0', port=PORT, debug=(config.NODE_ENV == 'development'))

    except Exception as error:
        print(f'Failed to start server: {error}')
        sys.exit(1)


if __name__ == '__main__':
    start_server()
