import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServerApp } from '../src/server.js';
import { WebSocket } from 'ws';

describe('Scrapbook Board Sync & Realtime API', () => {
  let server, port, baseUrl, wsUrl;
  let token1, token2, coupleId;

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

    // Register User 1
    const r1 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'user1_sb', password: '123', display_name: 'User 1' })
    });
    const d1 = await r1.json();
    token1 = d1.token;

    // Register User 2
    const r2 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'user2_sb', password: '123', display_name: 'User 2' })
    });
    const d2 = await r2.json();
    token2 = d2.token;

    // Create Couple by User 1
    const cRes = await fetch(`${baseUrl}/api/couple/create`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ anniversary_date: '2025-10-20' })
    });
    const cData = await cRes.json();
    coupleId = cData.couple.id;

    // User 2 joins couple
    await fetch(`${baseUrl}/api/couple/join`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token2}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ couple_code: cData.couple.couple_code })
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise(r => server.close(r));
    }
  });

  it('gets empty scrapbook initially', async () => {
    const res = await fetch(`${baseUrl}/api/scrapbook`, {
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.photos).toEqual([]);
    expect(data.stickers).toEqual([]);
    expect(data.notes).toEqual([]);
  });

  it('saves scrapbook board items and partner gets the exact same state', async () => {
    const boardState = {
      photos: [
        { id: 'p1', url: '/test.jpg', caption: 'Kỷ niệm yêu', rotation: 4, scale: 1.2, textColor: '#e06d7e' }
      ],
      stickers: [
        { id: 's1', url: '/stk.svg', x: 100, y: 150, rotation: -6, scale: 1.1 }
      ],
      notes: [
        { id: 'n1', text: 'Yêu em nhiều!', color: 'pink', x: 200, y: 300, rotation: 2, scale: 1 }
      ]
    };

    // User 1 saves
    const saveRes = await fetch(`${baseUrl}/api/scrapbook`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(boardState)
    });
    const saveJson = await saveRes.json();
    expect(saveRes.status).toBe(200);
    expect(saveJson.success).toBe(true);

    // User 2 fetches
    const getRes = await fetch(`${baseUrl}/api/scrapbook`, {
      headers: { 'Authorization': `Bearer ${token2}` }
    });
    const partnerData = await getRes.json();
    expect(getRes.status).toBe(200);
    expect(partnerData.photos).toHaveLength(1);
    expect(partnerData.photos[0].caption).toBe('Kỷ niệm yêu');
    expect(partnerData.photos[0].scale).toBe(1.2);
    expect(partnerData.stickers).toHaveLength(1);
    expect(partnerData.notes).toHaveLength(1);
    expect(partnerData.notes[0].text).toBe('Yêu em nhiều!');
  });

  it('broadcasts scrapbook_update via WebSocket to partner in real-time', async () => {
    const ws2 = new WebSocket(wsUrl);
    await new Promise(r => ws2.on('open', r));

    ws2.send(JSON.stringify({ type: 'join', couple_id: coupleId }));

    const receivedPromise = new Promise((resolve) => {
      ws2.on('message', (msg) => {
        const parsed = JSON.parse(msg.toString());
        if (parsed.type === 'scrapbook_updated') {
          resolve(parsed);
        }
      });
    });

    // User 1 sends WS update or triggers PUT
    const ws1 = new WebSocket(wsUrl);
    await new Promise(r => ws1.on('open', r));
    ws1.send(JSON.stringify({ type: 'join', couple_id: coupleId }));

    ws1.send(JSON.stringify({
      type: 'scrapbook_update',
      couple_id: coupleId,
      sender_id: 1,
      boardState: { photos: [{ id: 'p2' }], stickers: [], notes: [] }
    }));

    const received = await receivedPromise;
    expect(received.type).toBe('scrapbook_updated');
    expect(received.boardState.photos[0].id).toBe('p2');

    ws1.close();
    ws2.close();
  });
});
