import os
import time
from pathlib import Path
from datetime import datetime, timedelta
import database
import config


class CleanupService:
    """Service for cleaning up old files and database records."""

    def __init__(self, upload_folder=None, cleanup_days=None):
        if upload_folder is None:
            upload_folder = config.UPLOAD_FOLDER
        if cleanup_days is None:
            cleanup_days = config.FILE_CLEANUP_DAYS

        self.upload_folder = upload_folder
        self.cleanup_days = cleanup_days

    def cleanup_old_files(self):
        """Delete old files and database records."""
        stats = {
            'filesDeleted': 0,
            'dbRecordsDeleted': 0,
            'errors': 0,
        }

        try:
            cutoff_time = time.time() - (self.cleanup_days * 24 * 60 * 60)

            # Delete old files from filesystem
            try:
                if os.path.isdir(self.upload_folder):
                    files = os.listdir(self.upload_folder)

                    for filename in files:
                        file_path = os.path.join(self.upload_folder, filename)

                        try:
                            if os.path.isfile(file_path):
                                stat = os.stat(file_path)
                                if stat.st_mtime < cutoff_time:
                                    os.unlink(file_path)
                                    stats['filesDeleted'] += 1
                        except Exception as e:
                            print(f'Error processing file {file_path}: {e}')
                            stats['errors'] += 1
            except Exception as e:
                print(f'Error reading upload folder: {e}')
                stats['errors'] += 1

            # Delete old database records
            try:
                cutoff_date = (datetime.now() - timedelta(days=self.cleanup_days)).isoformat()

                # Get old completed records
                old_records = database.all_query(
                    'SELECT * FROM downloads WHERE status = "completed" AND completed_at < ?',
                    [cutoff_date]
                )

                # Delete associated files
                for record in old_records:
                    if record.get('file_path'):
                        try:
                            if os.path.isfile(record['file_path']):
                                os.unlink(record['file_path'])
                                stats['filesDeleted'] += 1
                        except Exception as e:
                            print(f'Error deleting file {record["file_path"]}: {e}')
                            stats['errors'] += 1

                # Delete database records
                if old_records:
                    database.run_query(
                        'DELETE FROM downloads WHERE status = "completed" AND completed_at < ?',
                        [cutoff_date]
                    )
                    stats['dbRecordsDeleted'] = len(old_records)

            except Exception as e:
                print(f'Error cleaning database: {e}')
                stats['errors'] += 1

        except Exception as e:
            print(f'Error in cleanup_old_files: {e}')
            stats['errors'] += 1

        return stats

    def cleanup_failed_downloads(self):
        """Clean up failed downloads."""
        stats = {
            'filesDeleted': 0,
            'dbRecordsDeleted': 0,
            'errors': 0,
        }

        try:
            # Get failed records
            failed_records = database.all_query('SELECT * FROM downloads WHERE status = "failed"')

            # Delete associated files
            for record in failed_records:
                if record.get('file_path'):
                    try:
                        if os.path.isfile(record['file_path']):
                            os.unlink(record['file_path'])
                            stats['filesDeleted'] += 1
                    except Exception as e:
                        print(f'Error deleting file {record["file_path"]}: {e}')
                        stats['errors'] += 1

                # Delete failed records after 24 hours
                created_at = datetime.fromisoformat(record['created_at'])
                hours_old = (datetime.now() - created_at).total_seconds() / 3600

                if hours_old > 24:
                    try:
                        database.run_query('DELETE FROM downloads WHERE id = ?', [record['id']])
                        stats['dbRecordsDeleted'] += 1
                    except Exception as e:
                        print(f'Error deleting record {record["id"]}: {e}')
                        stats['errors'] += 1

        except Exception as e:
            print(f'Error in cleanup_failed_downloads: {e}')
            stats['errors'] += 1

        return stats

    def get_cleanup_status(self):
        """Get cleanup status."""
        status = {
            'oldFilesCount': 0,
            'oldFilesSize': 0,
            'failedRecordsCount': 0,
        }

        try:
            cutoff_time = time.time() - (self.cleanup_days * 24 * 60 * 60)

            # Count old files
            try:
                if os.path.isdir(self.upload_folder):
                    files = os.listdir(self.upload_folder)

                    for filename in files:
                        file_path = os.path.join(self.upload_folder, filename)

                        try:
                            if os.path.isfile(file_path):
                                stat = os.stat(file_path)
                                if stat.st_mtime < cutoff_time:
                                    status['oldFilesCount'] += 1
                                    status['oldFilesSize'] += stat.st_size
                        except Exception:
                            pass
            except Exception:
                pass

            # Count failed records
            failed_result = database.all_query(
                'SELECT COUNT(*) as count FROM downloads WHERE status = "failed"'
            )
            status['failedRecordsCount'] = failed_result[0].get('count', 0) if failed_result else 0

        except Exception as e:
            print(f'Error in get_cleanup_status: {e}')

        return status
