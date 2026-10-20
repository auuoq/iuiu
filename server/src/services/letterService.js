import { getDb } from '../db.js';
import { deductHearts } from './heartService.js';
import { compareAnswers } from '../utils/quizNormalizer.js';

export function createLetter({
  couple_id,
  sender_id,
  receiver_id,
  title,
  mood_tag = 'cheer',
  content,
  paper_style = 'kraft',
  photos = [],
  stickers = [],
  bgm_track = null,
  open_heart_cost = 5,
  time_lock_at = null,
  milestone_id = null,
  quiz = null
}) {
  const db = getDb();

  const stmt = db.prepare(`
    INSERT INTO letters (
      couple_id, sender_id, receiver_id, title, mood_tag, content,
      paper_style, photos, stickers, bgm_track, open_heart_cost,
      time_lock_at, milestone_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const res = stmt.run(
    couple_id,
    sender_id,
    receiver_id,
    title,
    mood_tag,
    content,
    paper_style,
    JSON.stringify(photos),
    JSON.stringify(stickers),
    bgm_track,
    open_heart_cost,
    time_lock_at,
    milestone_id
  );

  const letterId = Number(res.lastInsertRowid);

  if (quiz && quiz.question && quiz.correct_answer) {
    db.prepare(`
      INSERT INTO letter_quizzes (
        letter_id, quiz_type, question, options, correct_answer, hint, bypass_cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      letterId,
      quiz.quiz_type || 'text',
      quiz.question,
      JSON.stringify(quiz.options || []),
      quiz.correct_answer,
      quiz.hint || null,
      quiz.bypass_cost ?? 15
    );
  }

  return getLetterDetail(letterId, sender_id);
}

export function getLettersForCouple(coupleId, currentUserId) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT l.id, l.couple_id, l.sender_id, l.receiver_id, l.title, l.mood_tag,
           l.paper_style, l.open_heart_cost, l.time_lock_at, l.is_opened, l.opened_at,
           l.created_at, l.milestone_id,
           u.display_name as sender_name, u.avatar_url as sender_avatar,
           q.id as quiz_id, q.quiz_type, q.question as quiz_question, q.options as quiz_options, q.hint as quiz_hint, q.bypass_cost
    FROM letters l
    JOIN users u ON l.sender_id = u.id
    LEFT JOIN letter_quizzes q ON l.id = q.letter_id
    WHERE l.couple_id = ?
    ORDER BY l.id DESC
  `).all(coupleId);

  return rows.map(r => {
    const hasQuiz = Boolean(r.quiz_id);
    const isSender = r.sender_id === currentUserId;
    const isOpened = Boolean(r.is_opened);

    let parsedOptions = [];
    if (r.quiz_options) {
      try { parsedOptions = JSON.parse(r.quiz_options); } catch (e) {}
    }

    const item = {
      id: r.id,
      couple_id: r.couple_id,
      sender_id: r.sender_id,
      receiver_id: r.receiver_id,
      sender_name: r.sender_name,
      sender_avatar: r.sender_avatar,
      title: r.title,
      mood_tag: r.mood_tag,
      paper_style: r.paper_style,
      open_heart_cost: r.open_heart_cost,
      time_lock_at: r.time_lock_at,
      is_opened: isOpened ? 1 : 0,
      opened_at: r.opened_at,
      created_at: r.created_at,
      has_quiz: hasQuiz
    };

    if (hasQuiz) {
      item.quiz = {
        quiz_type: r.quiz_type,
        question: r.quiz_question,
        options: parsedOptions,
        hint: r.quiz_hint,
        bypass_cost: r.bypass_cost
      };
    }

    // Only include content if opened or if viewer is the sender
    if (isOpened || isSender) {
      const full = db.prepare('SELECT content, photos, stickers, bgm_track FROM letters WHERE id = ?').get(r.id);
      item.content = full.content;
      try { item.photos = JSON.parse(full.photos); } catch (e) { item.photos = []; }
      try { item.stickers = JSON.parse(full.stickers); } catch (e) { item.stickers = []; }
      item.bgm_track = full.bgm_track;
    }

    return item;
  });
}

export function getLetterDetail(letterId, currentUserId) {
  const db = getDb();
  const letter = db.prepare(`
    SELECT l.*, u.display_name as sender_name, u.avatar_url as sender_avatar
    FROM letters l
    JOIN users u ON l.sender_id = u.id
    WHERE l.id = ?
  `).get(letterId);

  if (!letter) {
    throw new Error('Lá thư không tồn tại');
  }

  const isSender = letter.sender_id === currentUserId;
  const isOpened = Boolean(letter.is_opened);

  if (!isOpened && !isSender) {
    throw new Error('Lá thư này chưa được mở khóa');
  }

  try { letter.photos = JSON.parse(letter.photos); } catch (e) { letter.photos = []; }
  try { letter.stickers = JSON.parse(letter.stickers); } catch (e) { letter.stickers = []; }

  const quiz = db.prepare('SELECT * FROM letter_quizzes WHERE letter_id = ?').get(letterId);
  if (quiz) {
    try { quiz.options = JSON.parse(quiz.options); } catch (e) { quiz.options = []; }
    letter.quiz = quiz;
  }

  return letter;
}

export function verifyQuizOrBypass(letterId, userId, { answer = '', useBypass = false } = {}) {
  const db = getDb();
  const letter = db.prepare('SELECT * FROM letters WHERE id = ?').get(letterId);
  if (!letter) {
    throw new Error('Lá thư không tồn tại');
  }

  if (letter.is_opened) {
    return { success: true, isOpened: true, alreadyOpened: true };
  }

  // Server-side time lock check (UTC)
  if (letter.time_lock_at) {
    const lockTime = new Date(letter.time_lock_at).getTime();
    const now = Date.now();
    if (now < lockTime) {
      throw new Error('Lá thư này chưa đến ngày mở hẹn giờ, hãy kiên nhẫn chờ đợi nhé!');
    }
  }

  const quiz = db.prepare('SELECT * FROM letter_quizzes WHERE letter_id = ?').get(letterId);

  let totalCost = letter.open_heart_cost || 0;

  if (useBypass) {
    const bypassCost = quiz ? quiz.bypass_cost : 10;
    totalCost += bypassCost;
    deductHearts(userId, totalCost, 'quiz_bypass', `Bypass câu đố & mở thư: ${letter.title}`);
  } else if (quiz) {
    const isCorrect = compareAnswers(answer, quiz.correct_answer);
    if (!isCorrect) {
      throw new Error('Câu trả lời chưa chính xác, hãy thử lại hoặc dùng Trái Tim để mở khóa nhé!');
    }
    if (totalCost > 0) {
      deductHearts(userId, totalCost, 'letter_open', `Mở lá thư: ${letter.title}`);
    }
  } else {
    if (totalCost > 0) {
      deductHearts(userId, totalCost, 'letter_open', `Mở lá thư: ${letter.title}`);
    }
  }

  // Mark as opened
  const nowStr = new Date().toISOString();
  db.prepare(`
    UPDATE letters SET is_opened = 1, opened_at = ? WHERE id = ?
  `).run(nowStr, letterId);

  return { success: true, isOpened: true, openedAt: nowStr };
}
