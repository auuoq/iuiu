import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServerApp } from '../src/server.js';
import { WebSocket } from 'ws';

describe('Server REST API & WebSocket Hub', () => {
  let server, port, baseUrl, wsUrl;

  beforeAll(async () => {
    const app = createServerApp(':memory:');
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        wsUrl = `ws://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise(r => server.close(r));
    }
  });

  it('exposes health check endpoint', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.app).toBe('LoveCapsule');
  });

  it('registers user, pairs couple, and creates letter via REST API', async () => {
    // 1. Register User 1
    const reg1 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'huy_api',
        password: '123',
        display_name: 'Huy',
        gender: 'male',
        pronoun: 'Anh'
      })
    });
    const d1 = await reg1.json();
    expect(reg1.status).toBe(201);
    expect(d1.token).toBeDefined();

    // 2. Register User 2
    const reg2 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'lan_api',
        password: '123',
        display_name: 'Lan',
        gender: 'female',
        pronoun: 'Em'
      })
    });
    const d2 = await reg2.json();
    expect(reg2.status).toBe(201);

    // 3. User 1 creates couple
    const createRes = await fetch(`${baseUrl}/api/couple/create`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${d1.token}`
      },
      body: JSON.stringify({ anniversary_date: '2025-05-20' })
    });
    const cData = await createRes.json();
    expect(createRes.status).toBe(200);
    expect(cData.couple_code).toBeDefined();

    // 4. User 2 joins couple
    const joinRes = await fetch(`${baseUrl}/api/couple/join`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${d2.token}`
      },
      body: JSON.stringify({ couple_code: cData.couple_code })
    });
    expect(joinRes.status).toBe(200);

    // 5. User 1 sends letter
    const letterRes = await fetch(`${baseUrl}/api/letters`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${d1.token}`
      },
      body: JSON.stringify({
        receiver_id: d2.user.id,
        title: 'Thư đầu tiên cho em',
        mood_tag: 'cheer',
        content: 'Yêu em nhiều lắm!',
        open_heart_cost: 5
      })
    });
    const lData = await letterRes.json();
    expect(letterRes.status).toBe(201);
    expect(lData.letter.title).toBe('Thư đầu tiên cho em');
  });

  it('connects to WebSocket and receives live broadcast messages', async () => {
    const ws = new WebSocket(wsUrl);

    await new Promise((resolve) => ws.on('open', resolve));

    const messagePromise = new Promise((resolve) => {
      ws.on('message', (msg) => {
        const parsed = JSON.parse(msg.toString());
        resolve(parsed);
      });
    });

    // Send a live poke message
    ws.send(JSON.stringify({
      type: 'poke',
      couple_id: 1,
      sender_name: 'Huy'
    }));

    const received = await messagePromise;
    expect(received.type).toBe('poke');
    expect(received.sender_name).toBe('Huy');

    ws.close();
  });
});
