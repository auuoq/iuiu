import { getDb } from '../db.js';

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

export function getBalance(userId) {
  const db = getDb();
  const wallet = db.prepare('SELECT balance FROM heart_wallets WHERE user_id = ?').get(userId);
  return wallet ? wallet.balance : 0;
}

export function dailyCheckIn(userId) {
  const db = getDb();
  const today = getTodayString();

  // Check if already checked in today
  const existing = db.prepare(`
    SELECT id FROM heart_transactions 
    WHERE user_id = ? AND type = 'daily_checkin' AND date(created_at) = ?
  `).get(userId, today);

  if (existing) {
    throw new Error('Hôm nay bạn đã điểm danh rồi, hãy quay lại vào ngày mai nhé!');
  }

  // Award 5 hearts
  db.prepare(`
    UPDATE heart_wallets SET balance = balance + 5, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?
  `).run(userId);

  db.prepare(`
    INSERT INTO heart_transactions (user_id, amount, type, message)
    VALUES (?, 5, 'daily_checkin', 'Điểm danh hằng ngày')
  `).run(userId);

  const balance = getBalance(userId);
  return { balance, added: 5 };
}

export function waterPlant(userId, coupleId) {
  const db = getDb();
  const today = getTodayString();

  // Check if this specific user already watered the plant today
  const userWateredToday = db.prepare(`
    SELECT id FROM heart_transactions
    WHERE user_id = ? AND type = 'plant_water' AND date(created_at) = ?
  `).get(userId, today);

  if (userWateredToday) {
    throw new Error('Hôm nay bạn đã tưới cây rồi, người ấy cũng có thể tưới đấy!');
  }

  // Reward 5 hearts to user
  db.prepare(`
    UPDATE heart_wallets SET balance = balance + 5, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?
  `).run(userId);

  db.prepare(`
    INSERT INTO heart_transactions (user_id, amount, type, message)
    VALUES (?, 5, 'plant_water', 'Tưới cây tình yêu')
  `).run(userId);

  // Update plant exp and stage
  const couple = db.prepare('SELECT plant_stage, plant_exp FROM couples WHERE id = ?').get(coupleId);
  const newExp = (couple.plant_exp || 0) + 10;
  // Stage increases every 50 exp up to stage 10
  const newStage = Math.min(10, Math.floor(newExp / 50) + 1);

  db.prepare(`
    UPDATE couples 
    SET plant_exp = ?, plant_stage = ?, last_watered_date = ?
    WHERE id = ?
  `).run(newExp, newStage, today, coupleId);

  const balance = getBalance(userId);
  return { balance, added: 5, plant_stage: newStage, plant_exp: newExp };
}

export function sendGiftHearts(senderId, receiverId, amount, message = 'Tặng em/anh tim nè!') {
  if (amount <= 0) {
    throw new Error('Số tim tặng phải lớn hơn 0');
  }

  const db = getDb();
  const senderBalance = getBalance(senderId);
  if (senderBalance < amount) {
    throw new Error('Số dư Trái Tim của bạn không đủ để tặng');
  }

  // Deduct from sender
  db.prepare(`
    UPDATE heart_wallets SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?
  `).run(amount, senderId);

  db.prepare(`
    INSERT INTO heart_transactions (user_id, amount, type, message)
    VALUES (?, -?, 'gift_sent', ?)
  `).run(senderId, amount, message);

  // Add to receiver
  db.prepare(`
    UPDATE heart_wallets SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?
  `).run(amount, receiverId);

  db.prepare(`
    INSERT INTO heart_transactions (user_id, amount, type, message)
    VALUES (?, ?, 'gift_received', ?)
  `).run(receiverId, amount, message);

  return { senderBalance: getBalance(senderId) };
}

export function deductHearts(userId, amount, type, message) {
  const db = getDb();
  const current = getBalance(userId);
  if (current < amount) {
    throw new Error('Không đủ Trái Tim để thực hiện hành động này');
  }

  db.prepare(`
    UPDATE heart_wallets SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?
  `).run(amount, userId);

  db.prepare(`
    INSERT INTO heart_transactions (user_id, amount, type, message)
    VALUES (?, -?, ?, ?)
  `).run(userId, amount, type, message);

  return getBalance(userId);
}

export function addHearts(userId, amount, type, message) {
  const db = getDb();
  db.prepare(`
    UPDATE heart_wallets SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?
  `).run(amount, userId);

  db.prepare(`
    INSERT INTO heart_transactions (user_id, amount, type, message)
    VALUES (?, ?, ?, ?)
  `).run(userId, amount, type, message);

  return getBalance(userId);
}

export function getTransactionHistory(userId, limit = 20) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM heart_transactions WHERE user_id = ? ORDER BY id DESC LIMIT ?
  `).all(userId, limit);
}
