import { WebSocketServer } from 'ws';

let wss = null;
const coupleClients = new Map(); // coupleId -> Set of sockets

export function initWebSocketServer(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    let currentCoupleId = null;

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'join' && msg.couple_id) {
          currentCoupleId = msg.couple_id;
          if (!coupleClients.has(currentCoupleId)) {
            coupleClients.set(currentCoupleId, new Set());
          }
          coupleClients.get(currentCoupleId).add(ws);
        } else if (msg.type === 'poke') {
          // Broadcast poke to all connected clients or couple clients
          broadcastToCouple(msg.couple_id, 'poke', {
            sender_name: msg.sender_name || 'Người yêu',
            timestamp: Date.now()
          });
        } else if (msg.type === 'scrapbook_update') {
          broadcastToCouple(msg.couple_id, 'scrapbook_updated', {
            boardState: msg.boardState,
            sender_id: msg.sender_id
          }, ws);
        }
      } catch (err) {
        console.error('WS message error:', err.message);
      }
    });

    ws.on('close', () => {
      if (currentCoupleId && coupleClients.has(currentCoupleId)) {
        coupleClients.get(currentCoupleId).delete(ws);
      }
    });
  });

  return wss;
}

export function broadcastToCouple(coupleId, type, payload, exceptWs = null) {
  if (!wss) return;

  const data = JSON.stringify({ type, ...payload });

  // If specific couple has clients, send to them
  if (coupleId && coupleClients.has(coupleId) && coupleClients.get(coupleId).size > 0) {
    for (const client of coupleClients.get(coupleId)) {
      if (client !== exceptWs && client.readyState === 1) { // OPEN
        client.send(data);
      }
    }
  } else {
    // Broadcast to all clients
    for (const client of wss.clients) {
      if (client !== exceptWs && client.readyState === 1) {
        client.send(data);
      }
    }
  }
}
