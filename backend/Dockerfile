# Base Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (FFmpeg and yt-dlp)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    yt-dlp \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads instance

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app.py
ENV PORT=5000

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/api/health')" || exit 1

# Start the Flask application
CMD ["python", "app.py"]
