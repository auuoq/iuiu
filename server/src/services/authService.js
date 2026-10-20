import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'lovecapsule-secret-key-2026';

function generateCoupleCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LOVE-${code}`;
}

export function registerUser({ username, password, display_name, gender = 'other', pronoun = 'Bạn', avatar_url = null }) {
  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    throw new Error('Tên đăng nhập đã được sử dụng');
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);

  const stmt = db.prepare(`
    INSERT INTO users (username, password_hash, display_name, gender, pronoun, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(username, password_hash, display_name, gender, pronoun, avatar_url);
  const userId = Number(result.lastInsertRowid);

  // Initialize heart wallet with 20 starting hearts
  db.prepare(`
    INSERT INTO heart_wallets (user_id, balance) VALUES (?, 20)
  `).run(userId);

  db.prepare(`
    INSERT INTO heart_transactions (user_id, amount, type, message)
    VALUES (?, 20, 'welcome_bonus', 'Quà chào mừng thành viên mới!')
  `).run(userId);

  const user = db.prepare('SELECT id, username, display_name, gender, pronoun, avatar_url, couple_id, created_at FROM users WHERE id = ?').get(userId);
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });

  return { user, token };
}

export function loginUser({ username, password }) {
  const db = getDb();
  const userRow = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!userRow) {
    throw new Error('Tài khoản không tồn tại');
  }

  const isMatch = bcrypt.compareSync(password, userRow.password_hash);
  if (!isMatch) {
    throw new Error('Mật khẩu không chính xác');
  }

  const { password_hash, ...user } = userRow;
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });

  return { user, token };
}

export function createCouple(userId, anniversaryDate = null) {
  const db = getDb();
  const user = db.prepare('SELECT id, couple_id FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }
  if (user.couple_id) {
    throw new Error('Bạn đã ở trong một mối quan hệ');
  }

  let code = generateCoupleCode();
  // Ensure unique code
  while (db.prepare('SELECT id FROM couples WHERE couple_code = ?').get(code)) {
    code = generateCoupleCode();
  }

  const stmt = db.prepare(`
    INSERT INTO couples (couple_code, user1_id, anniversary_date)
    VALUES (?, ?, ?)
  `);
  const res = stmt.run(code, userId, anniversaryDate);
  const coupleId = Number(res.lastInsertRowid);

  db.prepare('UPDATE users SET couple_id = ? WHERE id = ?').run(coupleId, userId);

  const couple = db.prepare('SELECT * FROM couples WHERE id = ?').get(coupleId);
  return { couple, couple_code: code };
}

export function joinCouple(userId, coupleCode) {
  const db = getDb();
  const user = db.prepare('SELECT id, couple_id FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }
  if (user.couple_id) {
    throw new Error('Bạn đã ở trong một mối quan hệ');
  }

  const couple = db.prepare('SELECT * FROM couples WHERE couple_code = ?').get(coupleCode);
  if (!couple) {
    throw new Error('Mã uyên ương không hợp lệ');
  }
  if (couple.user2_id) {
    throw new Error('Không gian này đã kết đôi đủ 2 người');
  }
  if (couple.user1_id === userId) {
    throw new Error('Bạn không thể tự kết đôi với chính mình');
  }

  db.prepare('UPDATE couples SET user2_id = ? WHERE id = ?').run(userId, couple.id);
  db.prepare('UPDATE users SET couple_id = ? WHERE id = ?').run(couple.id, userId);

  return db.prepare('SELECT * FROM couples WHERE id = ?').get(couple.id);
}

export function getCoupleInfo(userId) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user || !user.couple_id) {
    return { user, couple: null, partner: null };
  }

  const couple = db.prepare('SELECT * FROM couples WHERE id = ?').get(user.couple_id);
  const partnerId = couple.user1_id === userId ? couple.user2_id : couple.user1_id;
  let partner = null;
  if (partnerId) {
    const partnerRow = db.prepare('SELECT id, username, display_name, gender, pronoun, avatar_url FROM users WHERE id = ?').get(partnerId);
    partner = partnerRow;
  }

  const { password_hash, ...safeUser } = user;
  return { user: safeUser, couple, partner };
}
