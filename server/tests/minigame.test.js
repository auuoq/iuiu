import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServerApp } from '../src/server.js';
import { getDb } from '../src/db.js';

describe('Minigame Heart Wallet API', () => {
  let server, port, baseUrl, userToken, testUserId;

  beforeAll(async () => {
    const app = createServerApp(':memory:');
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    // Register a user
    const reg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'miner_guy',
        password: '123',
        display_name: 'Thợ Đào Tim',
        gender: 'male',
        pronoun: 'Anh'
      })
    });
    const regData = await reg.json();
    userToken = regData.token;
    testUserId = regData.user.id;
  });

  afterAll(async () => {
    if (server) {
      await new Promise(r => server.close(r));
    }
  });

  it('rejects start if user has 0 hearts', async () => {
    const db = getDb();
    db.prepare('UPDATE heart_wallets SET balance = 0 WHERE user_id = ?').run(testUserId);

    const res = await fetch(`${baseUrl}/api/minigame/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      }
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Bạn không đủ tim');
  });

  it('deducts 1 heart when starting minigame and awards hearts on complete', async () => {
    const db = getDb();
    db.prepare('UPDATE heart_wallets SET balance = 5 WHERE user_id = ?').run(testUserId);

    // 1. Start minigame -> should deduct 1 heart (5 -> 4)
    const startRes = await fetch(`${baseUrl}/api/minigame/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      }
    });

    expect(startRes.status).toBe(200);
    const startData = await startRes.json();
    expect(startData.ok).toBe(true);
    expect(startData.newBalance).toBe(4);
    expect(startData.sessionId).toBeDefined();

    // 2. Complete 3 stages -> should award 3 hearts (4 + 3 = 7)
    const completeRes = await fetch(`${baseUrl}/api/minigame/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        sessionId: startData.sessionId,
        levelsCompleted: 3
      })
    });

    expect(completeRes.status).toBe(200);
    const completeData = await completeRes.json();
    expect(completeData.ok).toBe(true);
    expect(completeData.heartsAwarded).toBe(3);
    expect(completeData.newBalance).toBe(7);

    // Verify in db
    const wallet = db.prepare('SELECT balance FROM heart_wallets WHERE user_id = ?').get(testUserId);
    expect(wallet.balance).toBe(7);
  });
});
