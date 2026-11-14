import express from 'express';
import cors from 'cors';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'node:url';

import { initDb, getDb } from './db.js';
import { initWebSocketServer, broadcastToCouple } from './websocket.js';
import * as authService from './services/authService.js';
import * as heartService from './services/heartService.js';
import * as letterService from './services/letterService.js';
import * as milestoneService from './services/milestoneService.js';
import * as minigameService from './services/minigameService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JWT_SECRET = process.env.JWT_SECRET || 'lovecapsule-secret-key-2026';

// Storage setup for user real photos and stickers
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
const upload = multer({ storage });

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Phiên đăng nhập hết hạn hoặc không hợp lệ' });
    }
    req.user = user;
    next();
  });
}

export function createServerApp(dbPath = null) {
  initDb(dbPath);

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(uploadsDir));

  // Health
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'LoveCapsule', time: new Date().toISOString() });
  });

  // Auth
  app.post('/api/auth/register', (req, res) => {
    try {
      const data = authService.registerUser(req.body);
      res.status(201).json(data);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const data = authService.loginUser(req.body);
      res.json(data);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get('/api/auth/me', authenticateToken, (req, res) => {
    try {
      const info = authService.getCoupleInfo(req.user.id);
      res.json(info);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put('/api/auth/profile', authenticateToken, (req, res) => {
    try {
      const result = authService.updateProfile(req.user.id, req.body);
      const user = getDb().prepare('SELECT couple_id FROM users WHERE id = ?').get(req.user.id);
      if (user && user.couple_id) {
        broadcastToCouple(user.couple_id, 'profile_updated', { user_id: req.user.id });
      }
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // Couple
  app.post('/api/couple/create', authenticateToken, (req, res) => {
    try {
      const data = authService.createCouple(req.user.id, req.body.anniversary_date);
      res.json(data);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/couple/join', authenticateToken, (req, res) => {
    try {
      const couple = authService.joinCouple(req.user.id, req.body.couple_code);
      // Initialize default milestones
      const u1 = getDb().prepare('SELECT * FROM users WHERE id = ?').get(couple.user1_id);
      const u2 = getDb().prepare('SELECT * FROM users WHERE id = ?').get(couple.user2_id);
      milestoneService.initDefaultMilestones(couple.id, u1, u2);

      broadcastToCouple(couple.id, 'couple_paired', { couple });
      res.json({ couple });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/couple/cancel-pending', authenticateToken, (req, res) => {
    try {
      const result = authService.cancelPendingCouple(req.user.id);
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get('/api/couple/info', authenticateToken, (req, res) => {
    try {
      const info = authService.getCoupleInfo(req.user.id);
      res.json(info);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // Heart Economy & Virtual Plant
  app.get('/api/heart/wallet', authenticateToken, (req, res) => {
    try {
      const balance = heartService.getBalance(req.user.id);
      const history = heartService.getTransactionHistory(req.user.id);
      res.json({ balance, history });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/heart/checkin', authenticateToken, (req, res) => {
    try {
      const result = heartService.dailyCheckIn(req.user.id);
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/heart/water', authenticateToken, (req, res) => {
    try {
      const user = getDb().prepare('SELECT couple_id FROM users WHERE id = ?').get(req.user.id);
      if (!user.couple_id) throw new Error('Chưa ghép đôi');
      const result = heartService.waterPlant(req.user.id, user.couple_id);
      broadcastToCouple(user.couple_id, 'plant_watered', result);
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/heart/gift', authenticateToken, (req, res) => {
    try {
      const { receiver_id, amount, message } = req.body;
      const result = heartService.sendGiftHearts(req.user.id, receiver_id, Number(amount), message);
      const user = getDb().prepare('SELECT couple_id, display_name FROM users WHERE id = ?').get(req.user.id);
      broadcastToCouple(user.couple_id, 'heart_gift_received', {
        amount,
        sender_name: user.display_name,
        message
      });
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // Minigame: Heart Miner Arcade
  app.post('/api/minigame/start', authenticateToken, (req, res) => {
    try {
      const result = minigameService.startMinigame(req.user.id);
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/minigame/complete', authenticateToken, (req, res) => {
    try {
      const { sessionId, levelsCompleted } = req.body;
      const result = minigameService.completeMinigame(req.user.id, sessionId, levelsCompleted);
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // Letters
  app.get('/api/letters', authenticateToken, (req, res) => {
    try {
      const user = getDb().prepare('SELECT couple_id FROM users WHERE id = ?').get(req.user.id);
      if (!user.couple_id) return res.json([]);
      const letters = letterService.getLettersForCouple(user.couple_id, req.user.id);
      res.json(letters);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/letters', authenticateToken, (req, res) => {
    try {
      const user = getDb().prepare('SELECT couple_id FROM users WHERE id = ?').get(req.user.id);
      if (!user.couple_id) throw new Error('Chưa ghép đôi');

      const letter = letterService.createLetter({
        couple_id: user.couple_id,
        sender_id: req.user.id,
        ...req.body
      });

      if (letter.status !== 'draft') {
        broadcastToCouple(user.couple_id, 'new_letter', {
          title: letter.title,
          sender_id: req.user.id
        });
      }

      res.status(201).json({ letter });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put('/api/letters/:id', authenticateToken, (req, res) => {
    try {
      const letter = letterService.updateLetter(Number(req.params.id), req.user.id, req.body);
      const user = getDb().prepare('SELECT couple_id FROM users WHERE id = ?').get(req.user.id);
      if (letter.status === 'sent') {
        broadcastToCouple(user.couple_id, 'new_letter', {
          title: letter.title,
          sender_id: req.user.id
        });
      }
      res.json({ letter });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete('/api/letters/:id', authenticateToken, (req, res) => {
    try {
      const result = letterService.deleteLetter(Number(req.params.id), req.user.id);
      broadcastToCouple(result.couple_id, 'letter_deleted', {
        letter_id: Number(req.params.id)
      });
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get('/api/letters/:id', authenticateToken, (req, res) => {
    try {
      const letter = letterService.getLetterDetail(Number(req.params.id), req.user.id);
      res.json(letter);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/letters/:id/unlock', authenticateToken, (req, res) => {
    try {
      const result = letterService.verifyQuizOrBypass(Number(req.params.id), req.user.id, req.body);
      const user = getDb().prepare('SELECT couple_id, display_name FROM users WHERE id = ?').get(req.user.id);
      broadcastToCouple(user.couple_id, 'letter_opened', {
        letter_id: Number(req.params.id),
        opener_name: user.display_name
      });
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // Milestones
  app.get('/api/milestones', authenticateToken, (req, res) => {
    try {
      const user = getDb().prepare('SELECT couple_id FROM users WHERE id = ?').get(req.user.id);
      if (!user.couple_id) return res.json({ todayMilestones: [], allMilestones: [] });
      const info = authService.getCoupleInfo(req.user.id);
      const check = milestoneService.checkUpcomingMilestones(
        user.couple_id,
        null,
        info.user,
        info.partner
      );
      res.json(check);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/milestones', authenticateToken, (req, res) => {
    try {
      const user = getDb().prepare('SELECT couple_id FROM users WHERE id = ?').get(req.user.id);
      if (!user.couple_id) throw new Error('Chưa ghép đôi');
      const milestone = milestoneService.addCustomMilestone(user.couple_id, req.body);
      res.status(201).json(milestone);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // Scrapbook Board
  app.get('/api/scrapbook', authenticateToken, (req, res) => {
    try {
      const user = getDb().prepare('SELECT couple_id FROM users WHERE id = ?').get(req.user.id);
      if (!user || !user.couple_id) return res.json({ photos: [], stickers: [], notes: [] });

      const row = getDb().prepare('SELECT * FROM scrapbook_boards WHERE couple_id = ?').get(user.couple_id);
      if (!row) {
        return res.json({ photos: [], stickers: [], notes: [] });
      }
      res.json({
        photos: JSON.parse(row.photos || '[]'),
        stickers: JSON.parse(row.stickers || '[]'),
        notes: JSON.parse(row.notes || '[]'),
        updated_at: row.updated_at
      });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put('/api/scrapbook', authenticateToken, (req, res) => {
    try {
      const user = getDb().prepare('SELECT couple_id FROM users WHERE id = ?').get(req.user.id);
      if (!user || !user.couple_id) throw new Error('Chưa ghép đôi');

      const { photos, stickers, notes } = req.body;
      const photosJson = JSON.stringify(photos || []);
      const stickersJson = JSON.stringify(stickers || []);
      const notesJson = JSON.stringify(notes || []);

      const existing = getDb().prepare('SELECT couple_id FROM scrapbook_boards WHERE couple_id = ?').get(user.couple_id);
      if (existing) {
        getDb().prepare(`
          UPDATE scrapbook_boards 
          SET photos = ?, stickers = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE couple_id = ?
        `).run(photosJson, stickersJson, notesJson, user.couple_id);
      } else {
        getDb().prepare(`
          INSERT INTO scrapbook_boards (couple_id, photos, stickers, notes, updated_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(user.couple_id, photosJson, stickersJson, notesJson);
      }

      broadcastToCouple(user.couple_id, 'scrapbook_updated', {
        boardState: { photos, stickers, notes },
        sender_id: req.user.id
      });

      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // File Upload
  app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Không tìm thấy file tải lên' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  // Serve static client dist in production if built
  const clientDist = path.resolve('client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next();
      }
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  const server = http.createServer(app);
  initWebSocketServer(server);

  return server;
}

if (process.env.NODE_ENV !== 'test' && process.argv[1] && process.argv[1].endsWith('server.js')) {
  const PORT = process.env.PORT || 4000;
  const server = createServerApp();
  server.listen(PORT, () => {
    console.log(`💌 LoveCapsule Backend running at http://localhost:${PORT}`);
  });
}
