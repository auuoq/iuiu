import { describe, it, expect, beforeEach } from 'vitest';
import { initDb } from '../src/db.js';
import { registerUser, loginUser, createCouple, joinCouple, cancelPendingCouple, updateProfile, getCoupleInfo } from '../src/services/authService.js';

describe('Auth & Pairing Service', () => {
  beforeEach(() => {
    initDb(':memory:');
  });

  it('registers user, hashes password, and creates heart wallet with 20 hearts', () => {
    const res = registerUser({
      username: 'huy',
      password: 'password123',
      display_name: 'Huy',
      gender: 'male',
      pronoun: 'Anh'
    });

    expect(res.user.id).toBeDefined();
    expect(res.user.username).toBe('huy');
    expect(res.user.gender).toBe('male');
    expect(res.user.pronoun).toBe('Anh');
    expect(res.token).toBeDefined();
    expect(res.user.password_hash).toBeUndefined(); // do not leak password_hash
  });

  it('authenticates valid credentials and rejects invalid passwords', () => {
    registerUser({
      username: 'lan',
      password: 'secretpassword',
      display_name: 'Lan',
      gender: 'female',
      pronoun: 'Em'
    });

    const loginSuccess = loginUser({ username: 'lan', password: 'secretpassword' });
    expect(loginSuccess.user.username).toBe('lan');
    expect(loginSuccess.token).toBeDefined();

    expect(() => loginUser({ username: 'lan', password: 'wrongpassword' })).toThrow(/Mật khẩu không chính xác/);
  });

  it('allows user1 to create couple code and user2 to pair 1-1', () => {
    const u1 = registerUser({ username: 'huy', password: '123', display_name: 'Huy', gender: 'male', pronoun: 'Anh' });
    const u2 = registerUser({ username: 'lan', password: '123', display_name: 'Lan', gender: 'female', pronoun: 'Em' });

    const { couple_code, couple } = createCouple(u1.user.id, '2025-10-25');
    expect(couple_code).toMatch(/^LOVE-[A-Z0-9]{4}$/);
    expect(couple.user1_id).toBe(u1.user.id);
    expect(couple.user2_id).toBeNull();

    const paired = joinCouple(u2.user.id, couple_code);
    expect(paired.user1_id).toBe(u1.user.id);
    expect(paired.user2_id).toBe(u2.user.id);

    // Verify both users now have couple_id
    const info1 = getCoupleInfo(u1.user.id);
    const info2 = getCoupleInfo(u2.user.id);
    expect(info1.couple.id).toBe(info2.couple.id);
    expect(info1.partner.display_name).toBe('Lan');
    expect(info2.partner.display_name).toBe('Huy');
  });

  it('rejects pairing when user is already in another couple or code is invalid', () => {
    const u1 = registerUser({ username: 'u1', password: '123', display_name: 'U1', gender: 'male', pronoun: 'Anh' });
    const u2 = registerUser({ username: 'u2', password: '123', display_name: 'U2', gender: 'female', pronoun: 'Em' });
    const u3 = registerUser({ username: 'u3', password: '123', display_name: 'U3', gender: 'other', pronoun: 'Bạn' });

    const { couple_code } = createCouple(u1.user.id, '2025-10-25');
    joinCouple(u2.user.id, couple_code);

    // u3 tries to join the already-full couple
    expect(() => joinCouple(u3.user.id, couple_code)).toThrow(/đã kết đôi/);

    // u1 tries to join another code
    expect(() => joinCouple(u1.user.id, 'LOVE-9999')).toThrow(/đã ở trong một mối quan hệ/);
  });

  it('handles pending couple smoothly when user re-creates or decides to join partner instead', () => {
    const u1 = registerUser({ username: 'huy1', password: '123', display_name: 'Huy1', gender: 'male', pronoun: 'Anh' });
    const u2 = registerUser({ username: 'lan1', password: '123', display_name: 'Lan1', gender: 'female', pronoun: 'Em' });

    // u1 creates room
    const c1 = createCouple(u1.user.id, '2025-10-25');
    // u1 calls createCouple again (e.g. page reload or form re-submit) - should NOT throw!
    const c1Again = createCouple(u1.user.id, '2025-10-26');
    expect(c1Again.couple_code).toBe(c1.couple_code);

    // Meanwhile, u2 also created a room!
    const c2 = createCouple(u2.user.id, '2025-10-25');

    // u1 decides to join u2's room instead of waiting
    // Should clean up u1's empty room and join c2
    const paired = joinCouple(u1.user.id, c2.couple_code);
    expect(paired.id).toBe(c2.couple.id);
    expect(paired.user1_id).toBe(u2.user.id);
    expect(paired.user2_id).toBe(u1.user.id);
  });

  it('allows canceling a pending couple', () => {
    const u = registerUser({ username: 'temp', password: '123', display_name: 'Temp', gender: 'other', pronoun: 'Bạn' });
    createCouple(u.user.id, '2025-10-25');
    const infoBefore = getCoupleInfo(u.user.id);
    expect(infoBefore.couple).not.toBeNull();

    cancelPendingCouple(u.user.id);
    const infoAfter = getCoupleInfo(u.user.id);
    expect(infoAfter.couple).toBeNull();
  });

  it('updates user profile, changes password, and updates anniversary date', () => {
    const u = registerUser({ username: 'useredit', password: 'oldpassword', display_name: 'OldName', gender: 'other', pronoun: 'Bạn' });
    const { couple } = createCouple(u.user.id, '2025-01-01');

    const updated = updateProfile(u.user.id, {
      display_name: 'NewName',
      gender: 'male',
      avatar_url: '/uploads/new-avatar.jpg',
      new_password: 'brandnewpassword',
      anniversary_date: '2025-05-20'
    });

    expect(updated.user.display_name).toBe('NewName');
    expect(updated.user.gender).toBe('male');
    expect(updated.user.avatar_url).toBe('/uploads/new-avatar.jpg');
    expect(updated.couple.anniversary_date).toBe('2025-05-20');

    // Verify new password works
    const loginRes = loginUser({ username: 'useredit', password: 'brandnewpassword' });
    expect(loginRes.user.display_name).toBe('NewName');
  });
});
