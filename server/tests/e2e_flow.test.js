import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServerApp } from '../src/server.js';

describe('End-to-End Couple Journey', () => {
  let server, baseUrl;

  beforeAll(async () => {
    const app = createServerApp(':memory:');
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise(r => server.close(r));
    }
  });

  it('runs complete lifecycle between 2 partners without failure', async () => {
    // 1. Huy registers
    const r1 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'huy_e2e',
        password: 'pass',
        display_name: 'Huy',
        gender: 'male',
        pronoun: 'Anh'
      })
    });
    const d1 = await r1.json();
    const token1 = d1.token;

    // 2. Lan registers
    const r2 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'lan_e2e',
        password: 'pass',
        display_name: 'Lan',
        gender: 'female',
        pronoun: 'Em'
      })
    });
    const d2 = await r2.json();
    const token2 = d2.token;

    // 3. Huy creates couple
    const cRes = await fetch(`${baseUrl}/api/couple/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({ anniversary_date: '2025-02-14' })
    });
    const cData = await cRes.json();
    expect(cData.couple_code).toBeDefined();

    // 4. Lan joins couple
    const jRes = await fetch(`${baseUrl}/api/couple/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token2}`
      },
      body: JSON.stringify({ couple_code: cData.couple_code })
    });
    expect(jRes.status).toBe(200);

    // 5. Daily check-in for Huy (+5 ❤️)
    const checkinRes = await fetch(`${baseUrl}/api/heart/checkin`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    const checkinData = await checkinRes.json();
    expect(checkinData.balance).toBe(25);

    // 6. Lan waters love plant (+5 ❤️, +10 plant EXP)
    const waterRes = await fetch(`${baseUrl}/api/heart/water`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token2}` }
    });
    const waterData = await waterRes.json();
    expect(waterData.balance).toBe(25);
    expect(waterData.plant_exp).toBe(10);

    // 7. Huy writes letter with quiz for Lan
    const letterRes = await fetch(`${baseUrl}/api/letters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({
        receiver_id: d2.user.id,
        title: 'Mở khi em buồn',
        mood_tag: 'sad',
        content: 'Anh yêu em rất nhiều, đừng buồn nhé!',
        paper_style: 'kraft',
        open_heart_cost: 5,
        quiz: {
          quiz_type: 'choice',
          question: 'Lần đầu gặp nhau mặc áo màu gì?',
          options: ['Trắng', 'Đen', 'Hồng'],
          correct_answer: 'Trắng',
          bypass_cost: 10
        }
      })
    });
    const letterData = await letterRes.json();
    const letterId = letterData.letter.id;

    // 8. Lan unlocks letter with correct quiz answer
    const unlockRes = await fetch(`${baseUrl}/api/letters/${letterId}/unlock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token2}`
      },
      body: JSON.stringify({ answer: 'Trắng', useBypass: false })
    });
    const unlockData = await unlockRes.json();
    expect(unlockData.success).toBe(true);

    // 9. Lan checks heart wallet: 25 - 5 = 20 ❤️
    const walletRes = await fetch(`${baseUrl}/api/heart/wallet`, {
      headers: { 'Authorization': `Bearer ${token2}` }
    });
    const wData = await walletRes.json();
    expect(wData.balance).toBe(20);

    // 10. Lan reads full letter
    const readRes = await fetch(`${baseUrl}/api/letters/${letterId}`, {
      headers: { 'Authorization': `Bearer ${token2}` }
    });
    const readData = await readRes.json();
    expect(readData.content).toBe('Anh yêu em rất nhiều, đừng buồn nhé!');
    expect(readData.is_opened).toBe(1);
  });
});
