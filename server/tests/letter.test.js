import { describe, it, expect, beforeEach } from 'vitest';
import { initDb } from '../src/db.js';
import { registerUser, createCouple, joinCouple } from '../src/services/authService.js';
import { getBalance } from '../src/services/heartService.js';
import { normalizeAnswer } from '../src/utils/quizNormalizer.js';
import { 
  createLetter, 
  getLettersForCouple, 
  getLetterDetail, 
  verifyQuizOrBypass 
} from '../src/services/letterService.js';

describe('Quiz Normalizer', () => {
  it('normalizes Vietnamese accents, cases, and extra spaces', () => {
    expect(normalizeAnswer('  Hồ Tây  ')).toBe('ho tay');
    expect(normalizeAnswer('ĐÀ NẴNG ')).toBe('da nang');
    expect(normalizeAnswer('phố CỔ')).toBe('pho co');
    expect(normalizeAnswer('Trà Sữa Trân Châu 100%')).toBe('tra sua tran chau 100%');
  });
});

describe('Letter Service & Unlock Pipeline', () => {
  let u1, u2, couple;

  beforeEach(() => {
    initDb(':memory:');
    u1 = registerUser({ username: 'huy', password: '123', display_name: 'Huy', gender: 'male', pronoun: 'Anh' });
    u2 = registerUser({ username: 'lan', password: '123', display_name: 'Lan', gender: 'female', pronoun: 'Em' });
    const c = createCouple(u1.user.id, '2025-01-01');
    couple = joinCouple(u2.user.id, c.couple_code);
  });

  it('creates letter with kraft paper, polaroid photos, stickers, and quiz', () => {
    const letter = createLetter({
      couple_id: couple.id,
      sender_id: u1.user.id,
      receiver_id: u2.user.id,
      title: 'Mở khi em thấy mệt mỏi vì công việc',
      mood_tag: 'sad',
      content: 'Đừng lo lắng nhé, có anh luôn ở bên em...',
      paper_style: 'kraft',
      photos: ['/uploads/photo1.jpg'],
      stickers: [{ id: 'cat1', x: 20, y: 30 }],
      open_heart_cost: 5,
      quiz: {
        quiz_type: 'text',
        question: 'Lần đầu mình hẹn hò ở đâu?',
        correct_answer: 'Hồ Tây',
        hint: 'Gần chùa Trấn Quốc',
        bypass_cost: 10
      }
    });

    expect(letter.id).toBeDefined();
    expect(letter.title).toBe('Mở khi em thấy mệt mỏi vì công việc');
    expect(letter.is_opened).toBe(0);

    const list = getLettersForCouple(couple.id, u2.user.id);
    expect(list.length).toBe(1);
    expect(list[0].has_quiz).toBe(true);
    // Unopened letter does not reveal secret content in list
    expect(list[0].content).toBeUndefined();
  });

  it('handles multiple choice quiz verification and heart cost unlock', () => {
    const letter = createLetter({
      couple_id: couple.id,
      sender_id: u1.user.id,
      receiver_id: u2.user.id,
      title: 'Thử thách tình yêu',
      mood_tag: 'cheer',
      content: 'Em giỏi lắm mới đoán đúng đấy!',
      open_heart_cost: 5,
      quiz: {
        quiz_type: 'choice',
        question: 'Ai là người tỏ tình trước?',
        options: ['Anh', 'Em', 'Cả hai cùng nói'],
        correct_answer: 'Anh',
        bypass_cost: 15
      }
    });

    // Receiver initially has 20 hearts
    expect(getBalance(u2.user.id)).toBe(20);

    // Wrong answer without bypass throws error
    expect(() => verifyQuizOrBypass(letter.id, u2.user.id, { answer: 'Em', useBypass: false }))
      .toThrow(/Câu trả lời chưa chính xác/);

    // Correct answer unlocks letter, deducts open_heart_cost (5)
    const result = verifyQuizOrBypass(letter.id, u2.user.id, { answer: 'Anh', useBypass: false });
    expect(result.success).toBe(true);
    expect(result.isOpened).toBe(true);
    expect(getBalance(u2.user.id)).toBe(15); // 20 - 5 = 15

    // Letter is now opened, reading detail returns full content
    const detail = getLetterDetail(letter.id, u2.user.id);
    expect(detail.content).toBe('Em giỏi lắm mới đoán đúng đấy!');
    expect(detail.is_opened).toBe(1);

    // Subsequent reads do not charge any hearts
    getLetterDetail(letter.id, u2.user.id);
    expect(getBalance(u2.user.id)).toBe(15);
  });

  it('allows heart bypass when user cannot answer quiz', () => {
    const letter = createLetter({
      couple_id: couple.id,
      sender_id: u1.user.id,
      receiver_id: u2.user.id,
      title: 'Câu hỏi khó nè',
      mood_tag: 'secret',
      content: 'Bí mật đã được mở!',
      open_heart_cost: 5,
      quiz: {
        quiz_type: 'text',
        question: 'Ngày sinh của cún cưng?',
        correct_answer: '12/12',
        bypass_cost: 10
      }
    });

    // Use bypass: deducts open_heart_cost (5) + bypass_cost (10) = 15
    const result = verifyQuizOrBypass(letter.id, u2.user.id, { useBypass: true });
    expect(result.success).toBe(true);
    expect(getBalance(u2.user.id)).toBe(5); // 20 - 15 = 5
  });

  it('enforces time lock and prevents opening before scheduled date', () => {
    // Schedule in future (year 2099)
    const futureDate = '2099-01-01T00:00:00.000Z';
    const letter = createLetter({
      couple_id: couple.id,
      sender_id: u1.user.id,
      receiver_id: u2.user.id,
      title: 'Thư tương lai',
      mood_tag: 'anniversary',
      content: 'Chào tương lai!',
      time_lock_at: futureDate
    });

    expect(() => verifyQuizOrBypass(letter.id, u2.user.id, {}))
      .toThrow(/Lá thư này chưa đến ngày mở hẹn giờ/);

    expect(() => getLetterDetail(letter.id, u2.user.id))
      .toThrow(/Lá thư này chưa được mở khóa/);
  });
});
