import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { runQuery, getQuery, allQuery } from '../database.js';
import { YouTubeService, YouTubeDownloadError } from '../services/youtube.js';
import { AudioConverter, ConversionError } from '../services/converter.js';
import { rateLimit } from '../middleware/rateLimit.js';
import config from '../config.js';

const router = express.Router();
const youtubeService = new YouTubeService();

// Helper function to validate YouTube URL
function isValidYouTubeUrl(url) {
  return youtubeService.validateUrl(url);
}

// Process download in background
async function processDownload(downloadId, url, quality) {
  try {
    // Update status to processing
    await runQuery(
      `UPDATE downloads SET status = 'processing' WHERE id = ?`,
      [downloadId]
    );

    // Download audio
    const result = await youtubeService.downloadAudio(url, quality);

    // Update download record with success
    const now = new Date().toISOString();
    await runQuery(
      `UPDATE downloads SET
        file_path = ?,
        file_size = ?,
        status = 'completed',
        completed_at = ?
       WHERE id = ?`,
      [result.filePath, result.fileSize, now, downloadId]
    );
  } catch (error) {
    // Update download record with error
    const errorMessage = error.message || 'Unknown error occurred';
    await runQuery(
      `UPDATE downloads SET status = 'failed', error_message = ? WHERE id = ?`,
      [errorMessage, downloadId]
    );

    console.error(`Error processing download ${downloadId}:`, error);
  }
}

// POST /api/download - Create a new download
router.post('/download', rateLimit, async (req, res) => {
  try {
    const { url, quality = config.DEFAULT_QUALITY } = req.body;

    // Validation
    if (!url || !url.trim()) {
      return res.status(400).json({
        success: false,
        message: 'YouTube URL is required',
      });
    }

    if (url.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'URL is too long',
      });
    }

    // Validate quality
    if (!config.ALLOWED_QUALITIES.includes(quality)) {
      return res.status(400).json({
        success: false,
        message: `Invalid quality. Allowed: ${config.ALLOWED_QUALITIES.join(', ')}`,
      });
    }

    // Validate YouTube URL
    if (!isValidYouTubeUrl(url)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid YouTube URL',
      });
    }

    // Get video info
    let videoInfo;
    try {
      videoInfo = await youtubeService.getVideoInfo(url);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Create download record
    const result = await runQuery(
      `INSERT INTO downloads (youtube_url, title, quality, status)
       VALUES (?, ?, ?, 'pending')`,
      [url, videoInfo.title, quality]
    );

    const downloadId = result.id;

    // Start background processing
    processDownload(downloadId, url, quality).catch((error) => {
      console.error('Error in background processing:', error);
    });

    return res.status(202).json({
      success: true,
      download_id: downloadId,
      status: 'pending',
      message: 'Download queued successfully',
    });
  } catch (error) {
    console.error('Error creating download:', error);
    return res.status(500).json({
      success: false,
      message: `Error creating download: ${error.message}`,
    });
  }
});

// GET /api/download/:id - Get download status
router.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const download = await getQuery(
      `SELECT * FROM downloads WHERE id = ?`,
      [id]
    );

    if (!download) {
      return res.status(404).json({
        success: false,
        message: 'Download not found',
      });
    }

    // Calculate progress percentage
    let progress = 0;
    if (download.status === 'pending') {
      progress = 0;
    } else if (download.status === 'processing') {
      progress = 50;
    } else if (download.status === 'completed') {
      progress = 100;
    } else if (download.status === 'failed') {
      progress = 0;
    }

    return res.json({
      success: true,
      download_id: download.id,
      title: download.title,
      quality: download.quality,
      status: download.status,
      progress_percentage: progress,
      error_message: download.error_message,
      file_size: download.file_size,
      created_at: download.created_at,
      completed_at: download.completed_at,
    });
  } catch (error) {
    console.error('Error fetching download status:', error);
    return res.status(500).json({
      success: false,
      message: `Error fetching download status: ${error.message}`,
    });
  }
});

// GET /api/download/:id/file - Download the MP3 file
router.get('/download/:id/file', async (req, res) => {
  try {
    const { id } = req.params;

    const download = await getQuery(
      `SELECT * FROM downloads WHERE id = ?`,
      [id]
    );

    if (!download) {
      return res.status(404).json({
        success: false,
        message: 'Download not found',
      });
    }

    if (download.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: `Cannot download. Status: ${download.status}`,
      });
    }

    const filePath = download.file_path;

    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: 'File path not found',
      });
    }

    // Check if file exists
    const exists = await fs.stat(filePath).then(() => true).catch(() => false);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // Send file
    const filename = `${download.title}.mp3`;
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Error sending file:', err);
      }
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return res.status(500).json({
      success: false,
      message: `Error downloading file: ${error.message}`,
    });
  }
});

// DELETE /api/download/:id - Delete a download
router.delete('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const download = await getQuery(
      `SELECT * FROM downloads WHERE id = ?`,
      [id]
    );

    if (!download) {
      return res.status(404).json({
        success: false,
        message: 'Download not found',
      });
    }

    // Delete file if exists
    if (download.file_path) {
      try {
        const exists = await fs.stat(download.file_path).then(() => true).catch(() => false);
        if (exists) {
          await fs.unlink(download.file_path);
        }
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    // Delete database record
    await runQuery(
      `DELETE FROM downloads WHERE id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: 'Download deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting download:', error);
    return res.status(500).json({
      success: false,
      message: `Error deleting download: ${error.message}`,
    });
  }
});

export default router;
