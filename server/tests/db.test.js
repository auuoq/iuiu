import { describe, it, expect } from 'vitest';
import { initDb, getDb } from '../src/db.js';

describe('Database Schema', () => {
  it('should initialize all required tables without error', () => {
    const db = initDb(':memory:');
    const rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const tables = rows.map(t => t.name);
    
    expect(tables).toContain('users');
    expect(tables).toContain('couples');
    expect(tables).toContain('heart_wallets');
    expect(tables).toContain('heart_transactions');
    expect(tables).toContain('letters');
    expect(tables).toContain('letter_quizzes');
    expect(tables).toContain('milestones');
  });

  it('should support foreign key constraints', () => {
    const db = initDb(':memory:');
    const fk = db.prepare('PRAGMA foreign_keys').get();
    expect(fk.foreign_keys).toBe(1);
  });
});
