import { getBalance, deductHearts, addHearts } from './heartService.js';
import crypto from 'node:crypto';

const activeSessions = new Map();

export function startMinigame(userId) {
  const currentBalance = getBalance(userId);
  if (currentBalance < 1) {
    throw new Error('Bạn không đủ tim (cần tối thiểu 1 ❤️) để bắt đầu đào tim!');
  }

  // Deduct 1 heart
  const newBalance = deductHearts(userId, 1, 'minigame_fee', 'Vé tham gia Đào Tim Cổ Điển');
  const sessionId = crypto.randomUUID ? crypto.randomUUID() : `sess_${Date.now()}_${Math.random()}`;
  activeSessions.set(sessionId, { userId, startTime: Date.now() });

  return { ok: true, sessionId, newBalance };
}

export function completeMinigame(userId, sessionId, levelsCompleted) {
  const count = Math.max(0, parseInt(levelsCompleted, 10) || 0);
  let newBalance = getBalance(userId);

  if (count > 0) {
    newBalance = addHearts(userId, count, 'minigame_reward', `Thưởng vượt ${count} màn Đào Tim Cổ Điển`);
  }

  if (sessionId) {
    activeSessions.delete(sessionId);
  }

  return { ok: true, heartsAwarded: count, newBalance };
}

