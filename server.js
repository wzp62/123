// Simple Express server to store sessions, ratings and uploads in a local JSON file
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const DB_FILE = path.join(__dirname, 'ratings.db.json');

function loadDb() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    // ensure expected shape
    if (!parsed.sessions || typeof parsed.sessions !== 'object') parsed.sessions = {};
    if (!Array.isArray(parsed.uploads)) parsed.uploads = [];
    return parsed;
  } catch (e) {
    // If file missing or invalid, return fresh structure
    return { sessions: {}, uploads: [] };
  }
}

function saveDb(db) {
  // atomic write: write to tmp then rename
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmp, DB_FILE);
}

const app = express();
app.use(cors());
app.use(express.json());

// create a new session for a set of picks
app.post('/session', (req, res) => {
  const { mbti, picks } = req.body || {};
  const db = loadDb();
  const sessionId = uuidv4();
  db.sessions[sessionId] = {
    mbti: mbti || null,
    picks: picks || [],
    ratings: [],
    created_at: new Date().toISOString()
  };
  saveDb(db);
  res.json({ sessionId });
});

// record a rating for a song under a session
app.post('/rate', (req, res) => {
  const { sessionId, song, rating } = req.body || {};
  // allow rating 0 if needed; check for null/undefined
  if (!sessionId || !song || rating == null) {
    return res.status(400).json({ error: 'sessionId, song and rating are required' });
  }
  const db = loadDb();
  if (!db.sessions[sessionId]) {
    return res.status(404).json({ error: 'session not found' });
  }
  const entry = { song, rating, ts: new Date().toISOString() };
  db.sessions[sessionId].ratings.push(entry);

  // record every upload as its own entry for easy retrieval and audit
  if (!Array.isArray(db.uploads)) db.uploads = [];
  db.uploads.push({
    sessionId,
    song,
    rating,
    ts: entry.ts
  });

  saveDb(db);
  res.json({ ok: true });
});

// query ratings: all or by session
app.get('/ratings', (req, res) => {
  const { sessionId } = req.query;
  const db = loadDb();
  if (sessionId) {
    const s = db.sessions[sessionId];
    if (!s) return res.status(404).json({ error: 'session not found' });
    return res.json({ sessionId, ...s });
  }
  res.json(db);
});

// NEW: list all uploads (each /rate call). Optional ?sessionId=...
app.get('/uploads', (req, res) => {
  const { sessionId } = req.query;
  const db = loadDb();
  const uploads = Array.isArray(db.uploads) ? db.uploads : [];
  if (sessionId) {
    return res.json(uploads.filter(u => u.sessionId === sessionId));
  }
  res.json(uploads);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`music-suggestions server running on http://localhost:${PORT}`);
});
