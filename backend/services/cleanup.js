import fs from 'fs/promises';
import path from 'path';
import { allQuery, runQuery } from '../database.js';
import config from '../config.js';

export class CleanupService {
  constructor(uploadFolder = config.UPLOAD_FOLDER, cleanupDays = config.FILE_CLEANUP_DAYS) {
    this.uploadFolder = uploadFolder;
    this.cleanupDays = cleanupDays;
  }

  // Delete old files and database records
  async cleanupOldFiles() {
    const stats = {
      filesDeleted: 0,
      dbRecordsDeleted: 0,
      errors: 0,
    };

    try {
      const cutoffTime = Date.now() - (this.cleanupDays * 24 * 60 * 60 * 1000);

      // Delete old files from filesystem
      try {
        const files = await fs.readdir(this.uploadFolder);

        for (const filename of files) {
          const filePath = path.join(this.uploadFolder, filename);

          try {
            const stat = await fs.stat(filePath);

            if (stat.isFile() && stat.mtimeMs < cutoffTime) {
              await fs.unlink(filePath);
              stats.filesDeleted++;
            }
          } catch (error) {
            console.error(`Error processing file ${filePath}:`, error);
            stats.errors++;
          }
        }
      } catch (error) {
        console.error('Error reading upload folder:', error);
        stats.errors++;
      }

      // Delete old database records
      try {
        const cutoffDate = new Date(Date.now() - (this.cleanupDays * 24 * 60 * 60 * 1000))
          .toISOString();

        // Get old completed records
        const oldRecords = await allQuery(
          `SELECT * FROM downloads WHERE status = 'completed' AND completed_at < ?`,
          [cutoffDate]
        );

        // Delete associated files
        for (const record of oldRecords) {
          if (record.file_path) {
            try {
              const exists = await fs.stat(record.file_path).then(() => true).catch(() => false);
              if (exists) {
                await fs.unlink(record.file_path);
                stats.filesDeleted++;
              }
            } catch (error) {
              console.error(`Error deleting file ${record.file_path}:`, error);
              stats.errors++;
            }
          }
        }

        // Delete database records
        if (oldRecords.length > 0) {
          await runQuery(
            `DELETE FROM downloads WHERE status = 'completed' AND completed_at < ?`,
            [cutoffDate]
          );
          stats.dbRecordsDeleted = oldRecords.length;
        }
      } catch (error) {
        console.error('Error cleaning database:', error);
        stats.errors++;
      }
    } catch (error) {
      console.error('Error in cleanupOldFiles:', error);
      stats.errors++;
    }

    return stats;
  }

  // Clean up failed downloads
  async cleanupFailedDownloads() {
    const stats = {
      filesDeleted: 0,
      dbRecordsDeleted: 0,
      errors: 0,
    };

    try {
      // Get failed records
      const failedRecords = await allQuery(`SELECT * FROM downloads WHERE status = 'failed'`);

      // Delete associated files
      for (const record of failedRecords) {
        if (record.file_path) {
          try {
            const exists = await fs.stat(record.file_path).then(() => true).catch(() => false);
            if (exists) {
              await fs.unlink(record.file_path);
              stats.filesDeleted++;
            }
          } catch (error) {
            console.error(`Error deleting file ${record.file_path}:`, error);
            stats.errors++;
          }
        }

        // Delete failed records after 24 hours
        const createdAt = new Date(record.created_at);
        const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

        if (hoursOld > 24) {
          try {
            await runQuery(`DELETE FROM downloads WHERE id = ?`, [record.id]);
            stats.dbRecordsDeleted++;
          } catch (error) {
            console.error(`Error deleting record ${record.id}:`, error);
            stats.errors++;
          }
        }
      }
    } catch (error) {
      console.error('Error in cleanupFailedDownloads:', error);
      stats.errors++;
    }

    return stats;
  }

  // Get cleanup status
  async getCleanupStatus() {
    const status = {
      oldFilesCount: 0,
      oldFilesSize: 0,
      failedRecordsCount: 0,
    };

    try {
      const cutoffTime = Date.now() - (this.cleanupDays * 24 * 60 * 60 * 1000);

      // Count old files
      try {
        const files = await fs.readdir(this.uploadFolder);

        for (const filename of files) {
          const filePath = path.join(this.uploadFolder, filename);

          try {
            const stat = await fs.stat(filePath);

            if (stat.isFile() && stat.mtimeMs < cutoffTime) {
              status.oldFilesCount++;
              status.oldFilesSize += stat.size;
            }
          } catch (error) {
            // Ignore errors for individual files
          }
        }
      } catch (error) {
        // Ignore errors reading directory
      }

      // Count failed records
      const failedResult = await allQuery(
        `SELECT COUNT(*) as count FROM downloads WHERE status = 'failed'`
      );
      status.failedRecordsCount = failedResult[0]?.count || 0;
    } catch (error) {
      console.error('Error in getCleanupStatus:', error);
    }

    return status;
  }
}
