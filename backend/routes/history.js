import express from 'express';
import { allQuery, runQuery } from '../database.js';

const router = express.Router();

// GET /api/history - Get download history
router.get('/history', async (req, res) => {
  try {
    const status = req.query.status;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    // Build query
    let query = 'SELECT * FROM downloads';
    let params = [];

    // Filter by status if provided
    if (status) {
      const allowedStatuses = ['pending', 'processing', 'completed', 'failed'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}`,
        });
      }
      query += ' WHERE status = ?';
      params.push(status);
    }

    // Get total count
    const countResult = await allQuery(
      query.replace('SELECT *', 'SELECT COUNT(*) as count'),
      params
    );
    const total = countResult[0]?.count || 0;

    // Get paginated results
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const downloads = await allQuery(query, params);

    return res.json({
      success: true,
      data: downloads,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return res.status(500).json({
      success: false,
      message: `Error fetching history: ${error.message}`,
    });
  }
});

// GET /api/history/stats - Get statistics
router.get('/history/stats', async (req, res) => {
  try {
    const stats = {};

    // Total downloads
    const totalResult = await allQuery('SELECT COUNT(*) as count FROM downloads');
    stats.total_downloads = totalResult[0]?.count || 0;

    // Completed downloads
    const completedResult = await allQuery(
      "SELECT COUNT(*) as count FROM downloads WHERE status = 'completed'"
    );
    stats.completed_downloads = completedResult[0]?.count || 0;

    // Failed downloads
    const failedResult = await allQuery(
      "SELECT COUNT(*) as count FROM downloads WHERE status = 'failed'"
    );
    stats.failed_downloads = failedResult[0]?.count || 0;

    // Pending downloads
    const pendingResult = await allQuery(
      "SELECT COUNT(*) as count FROM downloads WHERE status = 'pending'"
    );
    stats.pending_downloads = pendingResult[0]?.count || 0;

    // Processing downloads
    const processingResult = await allQuery(
      "SELECT COUNT(*) as count FROM downloads WHERE status = 'processing'"
    );
    stats.processing_downloads = processingResult[0]?.count || 0;

    // Total data processed
    const sizeResult = await allQuery(
      "SELECT SUM(file_size) as total_size FROM downloads WHERE status = 'completed'"
    );
    stats.total_data_processed = sizeResult[0]?.total_size || 0;

    return res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({
      success: false,
      message: `Error fetching stats: ${error.message}`,
    });
  }
});

// GET /api/history/recent - Get recent downloads
router.get('/history/recent', async (req, res) => {
  try {
    const downloads = await allQuery(
      "SELECT * FROM downloads WHERE status = 'completed' ORDER BY completed_at DESC LIMIT 10"
    );

    return res.json({
      success: true,
      data: downloads,
    });
  } catch (error) {
    console.error('Error fetching recent downloads:', error);
    return res.status(500).json({
      success: false,
      message: `Error fetching recent downloads: ${error.message}`,
    });
  }
});

// DELETE /api/history/clear - Clear history
router.delete('/history/clear', async (req, res) => {
  try {
    const olderThanDays = parseInt(req.query.older_than_days) || null;

    let query = "DELETE FROM downloads WHERE status = 'completed'";
    let params = [];

    // Filter by age if specified
    if (olderThanDays) {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();
      query += ' AND created_at < ?';
      params.push(cutoffDate);
    }

    await runQuery(query, params);

    return res.json({
      success: true,
      message: 'History cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing history:', error);
    return res.status(500).json({
      success: false,
      message: `Error clearing history: ${error.message}`,
    });
  }
});

export default router;
