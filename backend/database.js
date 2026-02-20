import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'instance', 'yt_converter.db');

let db = null;

// Initialize database
export async function initDb() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        db.serialize(() => {
          // Create downloads table if it doesn't exist
          db.run(`
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
          `, (err) => {
            if (err) {
              reject(err);
            } else {
              console.log('Database initialized successfully!');
              resolve();
            }
          });
        });
      }
    });
  });
}

// Get database instance
export function getDb() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
    } else {
      reject(new Error('Database not initialized'));
    }
  });
}

// Execute query with promisification
export function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

// Execute get query (single row)
export function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Execute all query (multiple rows)
export function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

// Close database
export function closeDb() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          db = null;
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}
