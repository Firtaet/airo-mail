import Database from 'better-sqlite3';
import { join } from 'path';

let db: any = null;

export const useDb = () => {
  if (!db) {
    // In production, might use a specific path, but for now just data.db
    db = new Database(join(process.cwd(), 'data.db'));
    
    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        to_address TEXT NOT NULL,
        from_address TEXT,
        subject TEXT,
        body_text TEXT,
        body_html TEXT,
        received_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_to_address ON emails(to_address);
    `);
  }
  return db;
};
