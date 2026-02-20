import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { initDb } from './database.js';
import { CleanupService } from './services/cleanup.js';
import downloadRoutes from './routes/download.js';
import historyRoutes from './routes/history.js';
import config from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: config.CORS_ORIGINS,
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Create necessary directories
async function ensureDirectories() {
  try {
    await fs.mkdir(config.UPLOAD_FOLDER, { recursive: true });
    await fs.mkdir(path.dirname(config.DATABASE_PATH), { recursive: true });
    console.log('✓ Directories ensured');
  } catch (error) {
    console.error('Error creating directories:', error);
    process.exit(1);
  }
}

// Initialize database
async function initializeDatabase() {
  try {
    await initDb();
    console.log('✓ Database initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'YouTube to MP3 Converter API is running',
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'YouTube to MP3 Converter API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      create_download: 'POST /api/download',
      get_status: 'GET /api/download/<id>',
      download_file: 'GET /api/download/<id>/file',
      delete_download: 'DELETE /api/download/<id>',
      history: 'GET /api/history',
      history_stats: 'GET /api/history/stats',
      recent_downloads: 'GET /api/history/recent',
      clear_history: 'DELETE /api/history/clear',
    },
  });
});

// Register routes
app.use('/api', downloadRoutes);
app.use('/api', historyRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Start cleanup task
function startCleanupTask() {
  const cleanup = new CleanupService();

  // Run cleanup immediately on startup
  cleanup.cleanupOldFiles()
    .then((stats) => {
      console.log('✓ Cleanup task completed:', stats);
    })
    .catch((error) => {
      console.error('Error running cleanup:', error);
    });

  // Schedule cleanup task
  setInterval(() => {
    cleanup.cleanupOldFiles()
      .then((stats) => {
        console.log('✓ Cleanup task completed:', stats);
      })
      .catch((error) => {
        console.error('Error running cleanup:', error);
      });
  }, config.FILE_CLEANUP_INTERVAL);

  console.log(`✓ Cleanup task scheduled every ${config.FILE_CLEANUP_INTERVAL / 1000 / 60 / 60} hours`);
}

// Start server
async function startServer() {
  try {
    console.log('🎵 YouTube to MP3 Converter - Starting...\n');

    // Ensure directories
    await ensureDirectories();

    // Initialize database
    await initializeDatabase();

    // Start cleanup task
    startCleanupTask();

    // Start server
    const PORT = config.PORT;
    app.listen(PORT, () => {
      console.log(`\n✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ API available at http://localhost:${PORT}/api`);
      console.log(`✓ Environment: ${config.NODE_ENV}`);
      console.log('\nReady for downloads! 🚀\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the application
startServer().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

export default app;
