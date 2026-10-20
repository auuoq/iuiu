import { describe, it, expect, beforeEach } from 'vitest';
import { initDb } from '../src/db.js';
import { registerUser, createCouple, joinCouple } from '../src/services/authService.js';
import { 
  dailyCheckIn, 
  waterPlant, 
  sendGiftHearts, 
  deductHearts, 
  getBalance, 
  getTransactionHistory 
} from '../src/services/heartService.js';

describe('Heart & Plant Service', () => {
  let u1, u2, couple;

  beforeEach(() => {
    initDb(':memory:');
    u1 = registerUser({ username: 'huy', password: '123', display_name: 'Huy', gender: 'male', pronoun: 'Anh' });
    u2 = registerUser({ username: 'lan', password: '123', display_name: 'Lan', gender: 'female', pronoun: 'Em' });
    const c = createCouple(u1.user.id, '2025-01-01');
    couple = joinCouple(u2.user.id, c.couple_code);
  });

  it('handles daily check-in once per day and awards 5 hearts', () => {
    // Initial balance is 20
    expect(getBalance(u1.user.id)).toBe(20);

    const firstCheckIn = dailyCheckIn(u1.user.id);
    expect(firstCheckIn.balance).toBe(25);
    expect(firstCheckIn.added).toBe(5);

    // Second checkin on the same day should throw
    expect(() => dailyCheckIn(u1.user.id)).toThrow(/Hôm nay bạn đã điểm danh rồi/);
  });

  it('allows each partner to water plant once per day and grows plant', () => {
    const res1 = waterPlant(u1.user.id, couple.id);
    expect(res1.balance).toBe(25); // +5 hearts
    expect(res1.plant_exp).toBe(10);
    expect(res1.plant_stage).toBe(1);

    // Partner can also water on the same day
    const res2 = waterPlant(u2.user.id, couple.id);
    expect(res2.balance).toBe(25);
    expect(res2.plant_exp).toBe(20);

    // Partner 1 tries watering again today
    expect(() => waterPlant(u1.user.id, couple.id)).toThrow(/Hôm nay bạn đã tưới cây rồi/);
  });

  it('allows gifting hearts to partner with custom message and logs transactions', () => {
    sendGiftHearts(u1.user.id, u2.user.id, 10, 'Tặng em 10 tim đọc thư nhé!');

    expect(getBalance(u1.user.id)).toBe(10);
    expect(getBalance(u2.user.id)).toBe(30);

    const history1 = getTransactionHistory(u1.user.id);
    expect(history1[0].type).toBe('gift_sent');
    expect(history1[0].amount).toBe(-10);

    const history2 = getTransactionHistory(u2.user.id);
    expect(history2[0].type).toBe('gift_received');
    expect(history2[0].amount).toBe(10);
  });

  it('deducts hearts and rejects deduction when balance is insufficient', () => {
    const newBal = deductHearts(u1.user.id, 15, 'letter_open', 'Mở thư tình');
    expect(newBal).toBe(5);

    expect(() => deductHearts(u1.user.id, 10, 'letter_open', 'Mở tiếp')).toThrow(/Không đủ Trái Tim/);
  });
});
