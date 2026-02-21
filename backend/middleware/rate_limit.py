import time
from functools import wraps
from flask import request, jsonify
import config

# Store IP requests
ip_requests = {}


def cleanup_old_ips():
    """Clean up IPs with old requests."""
    global ip_requests
    now = time.time()
    one_hour_ago = now - 60 * 60

    ips_to_delete = []
    for ip, requests_data in ip_requests.items():
        recent_requests = [t for t in requests_data if t > one_hour_ago]
        if not recent_requests:
            ips_to_delete.append(ip)
        else:
            ip_requests[ip] = recent_requests

    for ip in ips_to_delete:
        del ip_requests[ip]


def rate_limit(f):
    """Rate limiting decorator for routes."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        global ip_requests

        ip = request.remote_addr
        now = time.time()
        one_minute_ago = now - 60

        # Initialize or get requests for this IP
        if ip not in ip_requests:
            ip_requests[ip] = []

        # Clean old requests (older than 1 minute)
        recent_requests = [t for t in ip_requests[ip] if t > one_minute_ago]
        ip_requests[ip] = recent_requests

        # Check rate limit
        max_per_minute = config.RATELIMIT_PER_MINUTE or 5

        if len(recent_requests) >= max_per_minute:
            return jsonify({
                'success': False,
                'message': f'Rate limit exceeded. Max {max_per_minute} downloads per minute.',
            }), 429

        # Add current request
        recent_requests.append(now)
        ip_requests[ip] = recent_requests

        # Clean up old IPs periodically
        if int(now) % 600 == 0:  # Every 10 minutes
            cleanup_old_ips()

        return f(*args, **kwargs)

    return decorated_function


def start_cleanup_task(app):
    """Start periodic cleanup of old IP entries."""
    def cleanup():
        with app.app_context():
            cleanup_old_ips()

    # Schedule cleanup every 10 minutes
    import threading
    def schedule_cleanup():
        while True:
            time.sleep(10 * 60)  # 10 minutes
            cleanup()

    thread = threading.Thread(target=schedule_cleanup, daemon=True)
    thread.start()
