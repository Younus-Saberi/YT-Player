import sqlite3
import os
from datetime import datetime
from contextlib import contextmanager
from pathlib import Path
import config

# Initialize database path
DB_PATH = config.DATABASE_PATH
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

db_connection = None


def init_db():
    """Initialize the database and create tables if they don't exist."""
    global db_connection
    try:
        db_connection = sqlite3.connect(DB_PATH)
        db_connection.row_factory = sqlite3.Row

        cursor = db_connection.cursor()

        # Create downloads table if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS downloads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                youtube_url TEXT NOT NULL,
                title TEXT NOT NULL,
                quality TEXT NOT NULL DEFAULT '192',
                file_path TEXT,
                file_size INTEGER,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                error_message TEXT
            )
        ''')

        db_connection.commit()
        print('Database initialized successfully!')
        return True
    except sqlite3.Error as e:
        print(f'Database initialization error: {e}')
        return False


def get_db():
    """Get the database connection."""
    global db_connection
    if db_connection is None:
        init_db()
    return db_connection


@contextmanager
def get_db_cursor():
    """Context manager for database cursor."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        yield cursor
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()


def run_query(sql, params=None):
    """Execute INSERT, UPDATE, or DELETE query."""
    if params is None:
        params = []

    with get_db_cursor() as cursor:
        cursor.execute(sql, params)
        return {
            'id': cursor.lastrowid,
            'changes': cursor.rowcount
        }


def get_query(sql, params=None):
    """Execute SELECT query and return a single row."""
    if params is None:
        params = []

    with get_db_cursor() as cursor:
        cursor.execute(sql, params)
        result = cursor.fetchone()
        if result:
            return dict(result)
        return None


def all_query(sql, params=None):
    """Execute SELECT query and return all rows."""
    if params is None:
        params = []

    with get_db_cursor() as cursor:
        cursor.execute(sql, params)
        results = cursor.fetchall()
        return [dict(row) for row in results]


def close_db():
    """Close the database connection."""
    global db_connection
    if db_connection:
        db_connection.close()
        db_connection = None
