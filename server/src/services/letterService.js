import { getDb } from '../db.js';
import { deductHearts } from './heartService.js';
import { compareAnswers } from '../utils/quizNormalizer.js';

export function createLetter({
  couple_id,
  sender_id,
  receiver_id,
  title,
  mood_tag = 'Thư mới',
  content,
  paper_style = 'kraft',
  photos = [],
  stickers = [],
  bgm_track = null,
  wax_seal = { color: 'red', emblem: 'heart' },
  scent_tag = 'rose',
  bg_image = null,
  envelope_config = { color: 'dusty_rose', stamp_design: 'rose', stamp_image: null },
  open_heart_cost = 5,
  time_lock_at = null,
  status = 'sent',
  milestone_id = null,
  font_family = null,
  text_color = null,
  quiz = null
}) {
  const db = getDb();

  const stmt = db.prepare(`
    INSERT INTO letters (
      couple_id, sender_id, receiver_id, title, mood_tag, content,
      paper_style, photos, stickers, bgm_track, wax_seal, scent_tag,
      bg_image, envelope_config,
      open_heart_cost, time_lock_at, status, milestone_id, font_family, text_color
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    typeof wax_seal === 'object' ? JSON.stringify(wax_seal) : (wax_seal || '{"color":"red","emblem":"heart"}'),
    scent_tag || 'rose',
    bg_image || null,
    typeof envelope_config === 'object' ? JSON.stringify(envelope_config) : (envelope_config || '{"color":"dusty_rose","stamp_design":"rose","stamp_image":null}'),
    open_heart_cost,
    time_lock_at,
    status || 'sent',
    milestone_id,
    font_family || null,
    text_color || null
  );

  const letterId = Number(res.lastInsertRowid);

  if (milestone_id && (status === 'sent')) {
    try {
      db.prepare('UPDATE milestones SET is_completed = 1 WHERE id = ?').run(milestone_id);
    } catch (e) {}
  }

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

export function updateLetter(letterId, userId, data) {
  const db = getDb();
  const letter = db.prepare('SELECT * FROM letters WHERE id = ?').get(letterId);
  if (!letter) {
    throw new Error('Lá thư không tồn tại');
  }
  if (letter.sender_id !== userId) {
    throw new Error('Bạn không có quyền chỉnh sửa lá thư này');
  }

  // If already opened by receiver, cannot edit content or quiz
  if (letter.is_opened === 1) {
    if (data.status === 'archived') {
      db.prepare('UPDATE letters SET status = ? WHERE id = ?').run('archived', letterId);
      return getLetterDetail(letterId, userId);
    }
    throw new Error('Không thể chỉnh sửa lá thư đã được người ấy mở đọc');
  }

  let existingPhotos = [];
  try { existingPhotos = JSON.parse(letter.photos); } catch (e) {}
  let existingStickers = [];
  try { existingStickers = JSON.parse(letter.stickers); } catch (e) {}

  const title = data.title !== undefined ? data.title : letter.title;
  const mood_tag = data.mood_tag !== undefined ? data.mood_tag : letter.mood_tag;
  const content = data.content !== undefined ? data.content : letter.content;
  const paper_style = data.paper_style !== undefined ? data.paper_style : letter.paper_style;
  const photos = data.photos !== undefined ? data.photos : existingPhotos;
  const stickers = data.stickers !== undefined ? data.stickers : existingStickers;
  const bgm_track = data.bgm_track !== undefined ? data.bgm_track : letter.bgm_track;
  const wax_seal = data.wax_seal !== undefined ? (typeof data.wax_seal === 'object' ? JSON.stringify(data.wax_seal) : data.wax_seal) : letter.wax_seal;
  const scent_tag = data.scent_tag !== undefined ? data.scent_tag : letter.scent_tag;
  const open_heart_cost = data.open_heart_cost !== undefined ? data.open_heart_cost : letter.open_heart_cost;
  const time_lock_at = data.time_lock_at !== undefined ? data.time_lock_at : letter.time_lock_at;
  const status = data.status !== undefined ? data.status : (letter.status || 'sent');

  const bg_image = data.bg_image !== undefined ? data.bg_image : letter.bg_image;
  const envelope_config = data.envelope_config !== undefined
    ? (typeof data.envelope_config === 'object' ? JSON.stringify(data.envelope_config) : data.envelope_config)
    : letter.envelope_config;
  const milestone_id = data.milestone_id !== undefined ? data.milestone_id : letter.milestone_id;
  const font_family = data.font_family !== undefined ? data.font_family : letter.font_family;
  const text_color = data.text_color !== undefined ? data.text_color : letter.text_color;

  db.prepare(`
    UPDATE letters
    SET title = ?, mood_tag = ?, content = ?, paper_style = ?,
        photos = ?, stickers = ?, bgm_track = ?, wax_seal = ?, scent_tag = ?,
        bg_image = ?, envelope_config = ?,
        open_heart_cost = ?, time_lock_at = ?, status = ?, milestone_id = ?,
        font_family = ?, text_color = ?
    WHERE id = ?
  `).run(
    title,
    mood_tag,
    content,
    paper_style,
    JSON.stringify(photos),
    JSON.stringify(stickers),
    bgm_track,
    wax_seal,
    scent_tag,
    bg_image,
    envelope_config,
    open_heart_cost,
    time_lock_at,
    status,
    milestone_id,
    font_family || null,
    text_color || null,
    letterId
  );

  if (milestone_id && status === 'sent') {
    try {
      db.prepare('UPDATE milestones SET is_completed = 1 WHERE id = ?').run(milestone_id);
    } catch (e) {}
  }

  if (data.quiz !== undefined) {
    db.prepare('DELETE FROM letter_quizzes WHERE letter_id = ?').run(letterId);
    if (data.quiz && data.quiz.question && data.quiz.correct_answer) {
      db.prepare(`
        INSERT INTO letter_quizzes (
          letter_id, quiz_type, question, options, correct_answer, hint, bypass_cost
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        letterId,
        data.quiz.quiz_type || 'text',
        data.quiz.question,
        JSON.stringify(data.quiz.options || []),
        data.quiz.correct_answer,
        data.quiz.hint || null,
        data.quiz.bypass_cost ?? 15
      );
    }
  }

  return getLetterDetail(letterId, userId);
}

export function deleteLetter(letterId, userId) {
  const db = getDb();
  const letter = db.prepare('SELECT * FROM letters WHERE id = ?').get(letterId);
  if (!letter) {
    throw new Error('Lá thư không tồn tại');
  }
  if (letter.sender_id !== userId) {
    throw new Error('Bạn không có quyền xóa lá thư này');
  }

  db.prepare('DELETE FROM letter_quizzes WHERE letter_id = ?').run(letterId);
  db.prepare('DELETE FROM letters WHERE id = ?').run(letterId);

  return { success: true, id: letterId, couple_id: letter.couple_id };
}

export function getLettersForCouple(coupleId, currentUserId) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT l.id, l.couple_id, l.sender_id, l.receiver_id, l.title, l.mood_tag,
           l.paper_style, l.open_heart_cost, l.time_lock_at, l.is_opened, l.opened_at,
           l.status, l.created_at, l.milestone_id, l.envelope_config,
           u.display_name as sender_name, u.avatar_url as sender_avatar,
           q.id as quiz_id, q.quiz_type, q.question as quiz_question, q.options as quiz_options, q.hint as quiz_hint, q.bypass_cost
    FROM letters l
    JOIN users u ON l.sender_id = u.id
    LEFT JOIN letter_quizzes q ON l.id = q.letter_id
    WHERE l.couple_id = ?
    ORDER BY l.id DESC
  `).all(coupleId);

  return rows
    .filter(r => {
      // Draft letters are only visible to the sender
      if (r.status === 'draft' && r.sender_id !== currentUserId) {
        return false;
      }
      return true;
    })
    .map(r => {
      const hasQuiz = Boolean(r.quiz_id);
      const isSender = r.sender_id === currentUserId;
      const isOpened = Boolean(r.is_opened);

      let parsedOptions = [];
      if (r.quiz_options) {
        try { parsedOptions = JSON.parse(r.quiz_options); } catch (e) {}
      }

      let envCfg = { color: 'dusty_rose', stamp_design: 'rose', stamp_image: null };
      if (r.envelope_config) {
        try { envCfg = JSON.parse(r.envelope_config); } catch (e) {}
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
        envelope_config: envCfg,
        open_heart_cost: r.open_heart_cost,
        time_lock_at: r.time_lock_at,
        is_opened: isOpened ? 1 : 0,
        opened_at: r.opened_at,
        status: r.status || 'sent',
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
        const full = db.prepare('SELECT content, photos, stickers, bgm_track, wax_seal, scent_tag, bg_image FROM letters WHERE id = ?').get(r.id);
        item.content = full.content;
        try { item.photos = JSON.parse(full.photos); } catch (e) { item.photos = []; }
        try { item.stickers = JSON.parse(full.stickers); } catch (e) { item.stickers = []; }
        try { item.wax_seal = JSON.parse(full.wax_seal); } catch (e) { item.wax_seal = { color: 'red', emblem: 'heart' }; }
        item.bgm_track = full.bgm_track;
        item.scent_tag = full.scent_tag || 'rose';
        item.bg_image = full.bg_image || null;
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

  if (letter.status === 'draft' && letter.sender_id !== currentUserId) {
    throw new Error('Lá thư không tồn tại');
  }

  const isSender = letter.sender_id === currentUserId;
  const isOpened = Boolean(letter.is_opened);

  if (!isOpened && !isSender) {
    throw new Error('Lá thư này chưa được mở khóa');
  }

  try { letter.photos = JSON.parse(letter.photos); } catch (e) { letter.photos = []; }
  try { letter.stickers = JSON.parse(letter.stickers); } catch (e) { letter.stickers = []; }
  try { letter.wax_seal = JSON.parse(letter.wax_seal); } catch (e) { letter.wax_seal = { color: 'red', emblem: 'heart' }; }
  try {
    letter.envelope_config = JSON.parse(letter.envelope_config);
  } catch (e) {
    letter.envelope_config = { color: 'dusty_rose', stamp_design: 'rose', stamp_image: null };
  }

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
