// Simple Express server to store sessions and ratings in a local JSON file
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const DB_FILE = path.join(__dirname, 'ratings.db.json');
function loadDb() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { sessions: {} };
  }
}
function saveDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
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
  if (!sessionId || !song || !rating) {
    return res.status(400).json({ error: 'sessionId, song and rating are required' });
  }
  const db = loadDb();
  if (!db.sessions[sessionId]) {
    return res.status(404).json({ error: 'session not found' });
  }
  db.sessions[sessionId].ratings.push({ song, rating, ts: new Date().toISOString() });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`music-suggestions server running on http://localhost:${PORT}`);
});
