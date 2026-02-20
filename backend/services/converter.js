import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import config from '../config.js';

class ConversionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConversionError';
  }
}

export class AudioConverter {
  static QUALITY_BITRATE_MAP = {
    '128': '128k',
    '192': '192k',
    '256': '256k',
    '320': '320k',
  };

  // Check if FFmpeg is available
  static async checkFFmpeg() {
    try {
      return await new Promise((resolve) => {
        ffmpeg.ffprobe('version', (err) => {
          resolve(!err);
        });
      });
    } catch (error) {
      return false;
    }
  }

  // Convert audio to MP3
  static async convertToMp3(inputFile, outputFile, quality = '192', title = '') {
    return new Promise((resolve, reject) => {
      if (!AudioConverter.QUALITY_BITRATE_MAP[quality]) {
        reject(new ConversionError(`Invalid quality: ${quality}`));
        return;
      }

      const bitrate = AudioConverter.QUALITY_BITRATE_MAP[quality];

      ffmpeg(inputFile)
        .audioBitrate(bitrate)
        .audioCodec('libmp3lame')
        .audioChannels(2)
        .audioFrequency(44100)
        .on('end', () => {
          resolve(outputFile);
        })
        .on('error', (err) => {
          reject(new ConversionError(`FFmpeg error: ${err.message}`));
        })
        .outputOptions('-q:a 0')
        .outputOptions(`-metadata Title="${title}"`)
        .output(outputFile)
        .run();
    }).catch((error) => {
      throw error;
    });
  }

  // Cleanup file
  static async cleanupFile(filePath) {
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

export { ConversionError };
