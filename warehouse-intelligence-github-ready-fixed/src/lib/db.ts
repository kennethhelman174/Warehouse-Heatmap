import Database, { Database as DatabaseInstance } from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let db: DatabaseInstance | null = null;

export function initializeDatabase(dbPath: string): DatabaseInstance {
  if (db) return db;

  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  // Enable WAL mode for better concurrency and stability
  db.pragma('journal_mode = WAL');
  return db;
}

export function getDb(): DatabaseInstance {
  if (!db) throw new Error("Database not initialized. Ensure `initializeDatabase` was called correctly.");
  return db;
}
