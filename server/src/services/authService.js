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
    const existing = db.prepare('SELECT * FROM couples WHERE id = ?').get(user.couple_id);
    if (existing) {
      if (existing.user2_id) {
        throw new Error('Bạn đã ở trong một mối quan hệ');
      }
      // If user already created a room and is waiting for partner, reuse and update anniversaryDate
      if (anniversaryDate) {
        db.prepare('UPDATE couples SET anniversary_date = ? WHERE id = ?').run(anniversaryDate, existing.id);
      }
      const updated = db.prepare('SELECT * FROM couples WHERE id = ?').get(existing.id);
      return { couple: updated, couple_code: updated.couple_code };
    }
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
    const existing = db.prepare('SELECT * FROM couples WHERE id = ?').get(user.couple_id);
    if (existing && existing.user2_id) {
      throw new Error('Bạn đã ở trong một mối quan hệ');
    }
  }

  const targetCouple = db.prepare('SELECT * FROM couples WHERE couple_code = ?').get(coupleCode);
  if (!targetCouple) {
    throw new Error('Mã kết đôi không hợp lệ hoặc không tồn tại');
  }
  if (targetCouple.user1_id === userId) {
    throw new Error('Đây là mã do chính bạn tạo ra. Hãy gửi mã này cho người yêu!');
  }
  if (targetCouple.user2_id) {
    throw new Error('Không gian này đã kết đôi đủ 2 người');
  }

  // If user previously created an empty pending room without a partner, clean it up
  if (user.couple_id) {
    const existing = db.prepare('SELECT * FROM couples WHERE id = ?').get(user.couple_id);
    if (existing && !existing.user2_id && existing.user1_id === userId) {
      db.prepare('UPDATE users SET couple_id = NULL WHERE id = ?').run(userId);
      db.prepare('DELETE FROM couples WHERE id = ?').run(existing.id);
    }
  }

  db.prepare('UPDATE couples SET user2_id = ? WHERE id = ?').run(userId, targetCouple.id);
  db.prepare('UPDATE users SET couple_id = ? WHERE id = ?').run(targetCouple.id, userId);

  return db.prepare('SELECT * FROM couples WHERE id = ?').get(targetCouple.id);
}

export function cancelPendingCouple(userId) {
  const db = getDb();
  const user = db.prepare('SELECT id, couple_id FROM users WHERE id = ?').get(userId);
  if (!user || !user.couple_id) {
    return { success: true };
  }
  const existing = db.prepare('SELECT * FROM couples WHERE id = ?').get(user.couple_id);
  if (existing && !existing.user2_id && existing.user1_id === userId) {
    db.prepare('UPDATE users SET couple_id = NULL WHERE id = ?').run(userId);
    db.prepare('DELETE FROM couples WHERE id = ?').run(existing.id);
  }
  return { success: true };
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
