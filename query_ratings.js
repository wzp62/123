#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'ratings.db.json');
function loadDb() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { return { sessions: {} }; }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  const db = loadDb();
  const sessions = Object.keys(db.sessions);
  if (sessions.length === 0) {
    console.log('No sessions found.');
    process.exit(0);
  }
  console.log('Sessions:');
  sessions.forEach(id => {
    const s = db.sessions[id];
    console.log(`- ${id} (mbti: ${s.mbti || 'N/A'}, created: ${s.created_at}, ratings: ${s.ratings.length})`);
  });
  process.exit(0);
}

// if session id provided, print details
const sessionId = args[0];
const db = loadDb();
const s = db.sessions[sessionId];
if (!s) {
  console.error('Session not found:', sessionId);
  process.exit(2);
}
console.log(`Session: ${sessionId}`);
console.log('MBTI:', s.mbti);
console.log('Created:', s.created_at);
console.log('Picks:');
s.picks.forEach((p, i) => console.log(`  ${i+1}. ${p.title} — ${p.artist}`));
console.log('Ratings:');
if (!s.ratings || s.ratings.length === 0) console.log('  (no ratings yet)');
else {
  s.ratings.forEach(r => console.log(`  - ${r.song.title} — ${r.song.artist}: ${r.rating} (at ${r.ts})`));
}
