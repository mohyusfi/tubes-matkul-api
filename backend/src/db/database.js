import { DatabaseSync } from 'node:sqlite';
import logger from '../services/logger.js';

// Muat .env jika belum termuat
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (e) {
    // Abaikan jika .env tidak ada di lingkungan tertentu
  }
}

const dbPath = process.env.DB_PATH || './watchlist.db';
export const db = new DatabaseSync(dbPath);

export function initDatabase() {
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS watchlist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      mal_id INTEGER NOT NULL,
      item_type TEXT CHECK(item_type IN ('anime', 'manga')) NOT NULL,
      title TEXT NOT NULL,
      image_url TEXT,
      status TEXT CHECK(status IN ('plan_to_watch', 'watching', 'completed', 'dropped')) NOT NULL DEFAULT 'plan_to_watch',
      progress INTEGER NOT NULL DEFAULT 0,
      total_units INTEGER DEFAULT 0,
      score INTEGER CHECK(score >= 0 AND score <= 10) DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, mal_id, item_type)
    );

    CREATE INDEX IF NOT EXISTS idx_watchlist_user_type ON watchlist_items(user_id, item_type);
  `);

  logger.info('DATABASE', `Database SQLite diinisialisasi pada: ${dbPath}`);
}

export default db;
