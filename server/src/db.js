import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance = null;

export function initDb(dbPath = null) {
  if (!dbPath) {
    const dataDir = path.resolve(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    dbPath = path.join(dataDir, 'lovecapsule.db');
  }

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');

  // 1. users
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      gender TEXT CHECK(gender IN ('male', 'female', 'other')) NOT NULL DEFAULT 'other',
      pronoun TEXT NOT NULL DEFAULT 'Bạn',
      avatar_url TEXT,
      couple_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. couples
  db.exec(`
    CREATE TABLE IF NOT EXISTS couples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_code TEXT UNIQUE NOT NULL,
      user1_id INTEGER NOT NULL REFERENCES users(id),
      user2_id INTEGER REFERENCES users(id),
      anniversary_date TEXT,
      plant_stage INTEGER DEFAULT 1,
      plant_exp INTEGER DEFAULT 0,
      last_watered_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. heart_wallets
  db.exec(`
    CREATE TABLE IF NOT EXISTS heart_wallets (
      user_id INTEGER PRIMARY KEY REFERENCES users(id),
      balance INTEGER DEFAULT 20,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. heart_transactions
  db.exec(`
    CREATE TABLE IF NOT EXISTS heart_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. letters
  db.exec(`
    CREATE TABLE IF NOT EXISTS letters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER NOT NULL REFERENCES couples(id),
      sender_id INTEGER NOT NULL REFERENCES users(id),
      receiver_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      mood_tag TEXT NOT NULL,
      content TEXT NOT NULL,
      paper_style TEXT DEFAULT 'kraft',
      photos TEXT DEFAULT '[]',
      stickers TEXT DEFAULT '[]',
      bgm_track TEXT,
      open_heart_cost INTEGER DEFAULT 5,
      time_lock_at TEXT,
      is_opened INTEGER DEFAULT 0,
      opened_at TEXT,
      status TEXT DEFAULT 'sent',
      milestone_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    const cols = db.prepare("PRAGMA table_info(letters)").all();
    if (!cols.some(c => c.name === 'status')) {
      db.exec("ALTER TABLE letters ADD COLUMN status TEXT DEFAULT 'sent'");
    }
    if (!cols.some(c => c.name === 'wax_seal')) {
      db.exec("ALTER TABLE letters ADD COLUMN wax_seal TEXT DEFAULT '{\"color\":\"red\",\"emblem\":\"heart\"}'");
    }
    if (!cols.some(c => c.name === 'scent_tag')) {
      db.exec("ALTER TABLE letters ADD COLUMN scent_tag TEXT DEFAULT 'rose'");
    }
    if (!cols.some(c => c.name === 'bg_image')) {
      db.exec("ALTER TABLE letters ADD COLUMN bg_image TEXT DEFAULT NULL");
    }
    if (!cols.some(c => c.name === 'envelope_config')) {
      db.exec("ALTER TABLE letters ADD COLUMN envelope_config TEXT DEFAULT '{\"color\":\"dusty_rose\",\"stamp_design\":\"rose\",\"stamp_image\":null}'");
    }

    const userCols = db.prepare("PRAGMA table_info(users)").all();
    if (!userCols.some(c => c.name === 'birthday')) {
      db.exec("ALTER TABLE users ADD COLUMN birthday TEXT DEFAULT NULL");
    }
  } catch (e) {}

  // 6. letter_quizzes
  db.exec(`
    CREATE TABLE IF NOT EXISTS letter_quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      letter_id INTEGER NOT NULL REFERENCES letters(id),
      quiz_type TEXT CHECK(quiz_type IN ('text', 'choice')) NOT NULL,
      question TEXT NOT NULL,
      options TEXT DEFAULT '[]',
      correct_answer TEXT NOT NULL,
      hint TEXT,
      bypass_cost INTEGER DEFAULT 15
    );
  `);

  // 7. milestones
  db.exec(`
    CREATE TABLE IF NOT EXISTS milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER NOT NULL REFERENCES couples(id),
      title TEXT NOT NULL,
      event_date TEXT NOT NULL,
      category TEXT NOT NULL,
      writer_rule TEXT CHECK(writer_rule IN ('user1_only', 'user2_only', 'both')) NOT NULL,
      interactive_fx TEXT,
      is_completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 8. scrapbook_boards
  db.exec(`
    CREATE TABLE IF NOT EXISTS scrapbook_boards (
      couple_id INTEGER PRIMARY KEY REFERENCES couples(id),
      photos TEXT DEFAULT '[]',
      stickers TEXT DEFAULT '[]',
      notes TEXT DEFAULT '[]',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  dbInstance = db;
  return db;
}

export function getDb() {
  if (!dbInstance) {
    return initDb();
  }
  return dbInstance;
}
