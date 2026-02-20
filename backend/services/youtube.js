import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import config from '../config.js';

const execFileAsync = promisify(execFile);

class YouTubeDownloadError extends Error {
  constructor(message) {
    super(message);
    this.name = 'YouTubeDownloadError';
  }
}

export class YouTubeService {
  constructor(outputPath = config.UPLOAD_FOLDER) {
    this.outputPath = outputPath;
  }

  // Validate YouTube URL
  validateUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//;
    return youtubeRegex.test(url);
  }

  // Sanitize filename
  sanitizeFilename(filename) {
    // Remove invalid characters
    let sanitized = filename.replace(/[<>:"/\\|?*]/g, '');
    // Remove leading/trailing spaces and dots
    sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, '');
    // Limit length
    if (sanitized.length > 200) {
      sanitized = sanitized.substring(0, 200);
    }
    return sanitized || 'download';
  }

  // Get video information using yt-dlp
  async getVideoInfo(url) {
    try {
      // Check if yt-dlp is installed
      try {
        await execFileAsync('yt-dlp', ['--version']);
      } catch (error) {
        throw new YouTubeDownloadError(
          'yt-dlp is not installed. Please install it first:\n' +
          'Ubuntu/Debian: sudo apt-get install yt-dlp\n' +
          'macOS: brew install yt-dlp\n' +
          'Windows: Download from https://github.com/yt-dlp/yt-dlp/releases'
        );
      }

      // Get video info in JSON format
      const { stdout } = await execFileAsync('yt-dlp', [
        '--dump-json',
        '--no-warnings',
        '-q',
        url,
      ]);

      const info = JSON.parse(stdout);

      return {
        title: info.title || 'Unknown',
        duration: info.duration || 0,
        uploader: info.uploader || 'Unknown',
        thumbnail: info.thumbnail || null,
      };
    } catch (error) {
      if (error instanceof YouTubeDownloadError) {
        throw error;
      }
      // Check if it's a yt-dlp error
      if (error.stderr && error.stderr.includes('ERROR')) {
        throw new YouTubeDownloadError(`Video not found or unavailable: ${error.message}`);
      }
      throw new YouTubeDownloadError(`Error fetching video info: ${error.message}`);
    }
  }

  // Download audio from YouTube
  async downloadAudio(url, quality = '192') {
    try {
      // Ensure output directory exists
      try {
        await fs.mkdir(this.outputPath, { recursive: true });
      } catch (err) {
        console.error('Error creating upload directory:', err);
      }

      // Get video info first
      const info = await this.getVideoInfo(url);
      const title = info.title;
      const safeTitle = this.sanitizeFilename(title);

      // Output template for yt-dlp
      const outputTemplate = path.join(this.outputPath, `${safeTitle}`);

      // Download audio and convert to MP3 using yt-dlp
      // yt-dlp can do the conversion directly
      await execFileAsync('yt-dlp', [
        url,
        '-f', 'bestaudio/best',
        '-x',                           // Extract audio
        '--audio-format', 'mp3',        // Convert to mp3
        '--audio-quality', quality,     // Audio quality
        '-o', outputTemplate + '.%(ext)s',
        '--quiet',
        '--no-warnings',
      ]);

      // Find the created MP3 file
      const files = await fs.readdir(this.outputPath);
      const mp3Files = files.filter(f => f.startsWith(safeTitle) && f.endsWith('.mp3'));

      if (mp3Files.length === 0) {
        throw new YouTubeDownloadError('MP3 file was not created');
      }

      const mp3File = path.join(this.outputPath, mp3Files[0]);
      const stats = await fs.stat(mp3File);

      return {
        filePath: mp3File,
        title: title,
        fileSize: stats.size,
      };
    } catch (error) {
      if (error instanceof YouTubeDownloadError) {
        throw error;
      }
      throw new YouTubeDownloadError(`Error downloading audio: ${error.message}`);
    }
  }

  // Cleanup file
  async cleanupFile(filePath) {
    try {
      if (filePath && (await fs.stat(filePath).then(() => true).catch(() => false))) {
        await fs.unlink(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
      return false;
    }
  }
}

export { YouTubeDownloadError };
