import { getDb } from '../db.js';

export function getExpectedWriter(category, user1, user2) {
  const male = user1.gender === 'male' ? user1 : (user2.gender === 'male' ? user2 : null);
  const female = user1.gender === 'female' ? user1 : (user2.gender === 'female' ? user2 : null);

  switch (category) {
    case 'women_day':
      return male ? male.id : user1.id;
    case 'men_day':
      return female ? female.id : user2.id;
    case 'birthday_user1':
      return user2.id;
    case 'birthday_user2':
      return user1.id;
    case 'valentine':
    case 'anniversary':
    case 'christmas':
    case 'new_year':
    case 'happiness_day':
    case 'that_tich':
      return 'both';
    default:
      return 'both';
  }
}

export function initDefaultMilestones(coupleId, user1, user2) {
  const db = getDb();

  const isUser1Male = user1.gender === 'male';

  const defaults = [
    {
      title: 'Lễ Tình Nhân (Valentine)',
      event_date: '02-14',
      category: 'valentine',
      writer_rule: 'both',
      interactive_fx: 'chocolate_box'
    },
    {
      title: 'Quốc Tế Phụ Nữ (8/3)',
      event_date: '03-08',
      category: 'women_day',
      writer_rule: isUser1Male ? 'user1_only' : 'user2_only',
      interactive_fx: 'flower_bloom'
    },
    {
      title: 'Valentine Trắng (14/3)',
      event_date: '03-14',
      category: 'white_day',
      writer_rule: isUser1Male ? 'user1_only' : 'user2_only',
      interactive_fx: 'marshmallow'
    },
    {
      title: 'Phụ Nữ Việt Nam (20/10)',
      event_date: '10-20',
      category: 'women_day',
      writer_rule: isUser1Male ? 'user1_only' : 'user2_only',
      interactive_fx: 'flower_bloom'
    },
    {
      title: 'Quốc Tế Nam Giới (19/11)',
      event_date: '11-19',
      category: 'men_day',
      writer_rule: isUser1Male ? 'user2_only' : 'user1_only',
      interactive_fx: 'gift_ribbon'
    },
    {
      title: 'Giáng Sinh & Năm Mới',
      event_date: '12-25',
      category: 'christmas',
      writer_rule: 'both',
      interactive_fx: 'snow_fireplace'
    }
  ];

  const couple = db.prepare('SELECT anniversary_date FROM couples WHERE id = ?').get(coupleId);
  if (couple && couple.anniversary_date) {
    const annDateStr = couple.anniversary_date.slice(5); // MM-DD
    defaults.push({
      title: 'Kỷ Niệm Ngày Yêu Nhau',
      event_date: annDateStr,
      category: 'anniversary',
      writer_rule: 'both',
      interactive_fx: 'galaxy_heart'
    });
  }

  const stmt = db.prepare(`
    INSERT INTO milestones (couple_id, title, event_date, category, writer_rule, interactive_fx)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const item of defaults) {
    stmt.run(coupleId, item.title, item.event_date, item.category, item.writer_rule, item.interactive_fx);
  }
}

export function calculateDaysTogether(anniversaryDate, fromDate = new Date()) {
  if (!anniversaryDate) return 0;
  const start = new Date(anniversaryDate);
  const end = new Date(fromDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}

export function checkUpcomingMilestones(coupleId, targetDateStr = null, user1 = null, user2 = null) {
  const db = getDb();
  const dateObj = targetDateStr ? new Date(targetDateStr) : new Date();
  const monthDay = dateObj.toISOString().slice(5, 10); // MM-DD

  const couple = db.prepare('SELECT * FROM couples WHERE id = ?').get(coupleId);
  const daysTogether = calculateDaysTogether(couple ? couple.anniversary_date : null, dateObj);

  const milestones = db.prepare('SELECT * FROM milestones WHERE couple_id = ?').all(coupleId);

  const todayMilestones = milestones.filter(m => {
    return m.event_date === monthDay || m.event_date === targetDateStr;
  }).map(m => {
    let mustWrite = true;
    if (user1 && user2) {
      const expected = getExpectedWriter(m.category, user1, user2);
      mustWrite = expected === 'both' || expected === user1.id;
    }
    return { ...m, mustWrite };
  });

  return { daysTogether, todayMilestones, allMilestones: milestones };
}

export function addCustomMilestone(coupleId, { title, event_date, category = 'custom', writer_rule = 'both', interactive_fx = 'lucky_clover' }) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO milestones (couple_id, title, event_date, category, writer_rule, interactive_fx)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const res = stmt.run(coupleId, title, event_date, category, writer_rule, interactive_fx);
  return db.prepare('SELECT * FROM milestones WHERE id = ?').get(Number(res.lastInsertRowid));
}

export function getMilestonesForCouple(coupleId) {
  const db = getDb();
  return db.prepare('SELECT * FROM milestones WHERE couple_id = ? ORDER BY event_date ASC').all(coupleId);
}
