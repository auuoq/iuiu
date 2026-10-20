import { describe, it, expect, beforeEach } from 'vitest';
import { initDb } from '../src/db.js';
import { registerUser, createCouple, joinCouple } from '../src/services/authService.js';
import { 
  getExpectedWriter, 
  initDefaultMilestones, 
  getMilestonesForCouple, 
  calculateDaysTogether, 
  checkUpcomingMilestones,
  addCustomMilestone
} from '../src/services/milestoneService.js';

describe('Milestone Service & Event Assignment', () => {
  let u1, u2, couple;

  beforeEach(() => {
    initDb(':memory:');
    // u1 is male, u2 is female
    u1 = registerUser({ username: 'huy', password: '123', display_name: 'Huy', gender: 'male', pronoun: 'Anh' });
    u2 = registerUser({ username: 'lan', password: '123', display_name: 'Lan', gender: 'female', pronoun: 'Em' });
    const c = createCouple(u1.user.id, '2025-01-01');
    couple = joinCouple(u2.user.id, c.couple_code);
  });

  it('correctly assigns 1-way writing for gender-based holidays and 2-way for mutual events', () => {
    // Women's Day: male writes for female
    expect(getExpectedWriter('women_day', u1.user, u2.user)).toBe(u1.user.id);

    // Men's Day: female writes for male
    expect(getExpectedWriter('men_day', u1.user, u2.user)).toBe(u2.user.id);

    // Valentine & Anniversary: both write
    expect(getExpectedWriter('valentine', u1.user, u2.user)).toBe('both');
    expect(getExpectedWriter('anniversary', u1.user, u2.user)).toBe('both');
    expect(getExpectedWriter('christmas', u1.user, u2.user)).toBe('both');
  });

  it('initializes default milestones for a couple with interactive animations', () => {
    initDefaultMilestones(couple.id, u1.user, u2.user);
    const list = getMilestonesForCouple(couple.id);
    expect(list.length).toBeGreaterThanOrEqual(6);

    const womenDay = list.find(m => m.category === 'women_day');
    expect(womenDay).toBeDefined();
    expect(womenDay.writer_rule).toBe('user1_only');
    expect(womenDay.interactive_fx).toBe('flower_bloom');

    const valentine = list.find(m => m.category === 'valentine');
    expect(valentine.writer_rule).toBe('both');
    expect(valentine.interactive_fx).toBe('chocolate_box');
  });

  it('calculates days together accurately and detects milestones', () => {
    const days = calculateDaysTogether('2025-01-01', new Date('2026-01-01'));
    expect(days).toBe(365);

    initDefaultMilestones(couple.id, u1.user, u2.user);

    // On Valentine's Day (02-14)
    const check = checkUpcomingMilestones(couple.id, '2026-02-14', u1.user, u2.user);
    expect(check.todayMilestones.length).toBe(1);
    expect(check.todayMilestones[0].category).toBe('valentine');
    expect(check.todayMilestones[0].mustWrite).toBe(true);
  });

  it('allows adding custom milestones like exam or interview encouragement', () => {
    const custom = addCustomMilestone(couple.id, {
      title: 'Ngày bảo vệ đồ án tốt nghiệp của em',
      event_date: '2026-06-15',
      category: 'custom',
      writer_rule: 'user1_only',
      interactive_fx: 'lucky_clover'
    });

    expect(custom.id).toBeDefined();
    expect(custom.interactive_fx).toBe('lucky_clover');
  });
});
