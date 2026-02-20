import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  SECRET_KEY: process.env.SECRET_KEY || 'dev-secret-key-change-in-production',

  // File Upload Configuration
  UPLOAD_FOLDER: path.join(__dirname, 'uploads'),
  MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB

  // Database Configuration
  DATABASE_PATH: path.join(__dirname, 'instance', 'yt_converter.db'),

  // File Cleanup Configuration
  FILE_CLEANUP_DAYS: 7,
  FILE_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds

  // Download Configuration
  ALLOWED_QUALITIES: ['128', '192', '256', '320'],
  DEFAULT_QUALITY: '192',

  // Rate Limiting
  RATELIMIT_PER_MINUTE: 5,

  // CORS Configuration
  CORS_ORIGINS: process.env.CORS_ORIGINS || 'http://localhost:3000',

  // FFmpeg Configuration
  FFMPEG_TIMEOUT: 300000, // 5 minutes

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

export default config;
