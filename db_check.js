require('dotenv').config({ path: '.env.local' });
// Force set environment variables if dotenv didn't work as expected
if (!process.env.DB_NAME) {
   process.env.DB_HOST = '127.0.0.1';
   process.env.DB_USER = 'nihon';
   process.env.DB_PASSWORD = 'nihon123';
   process.env.DB_NAME = 'nihon_db';
}

const { query, initDb } = require('./lib/db');

async function check() {
  try {
    await initDb();
    const rows = await query('SELECT id, title, thumbnail_filename, video_filename FROM whisper_sessions ORDER BY created_at DESC LIMIT 5');
    console.log('--- DERNIÈRES SESSIONS ---');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  }
}

check();
