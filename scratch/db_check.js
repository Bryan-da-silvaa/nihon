const { query, initDb } = require('./lib/db');
require('dotenv').config();

async function check() {
  try {
    await initDb();
    const rows = await query('SELECT id, title, thumbnail_filename, video_filename FROM whisper_sessions ORDER BY created_at DESC LIMIT 5');
    console.log('--- DERNIÈRES SESSIONS ---');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Erreur:', err.message);
  }
}

check();
