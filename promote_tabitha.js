require('dotenv').config({ path: '.env.local' });
if (!process.env.DB_NAME) {
   process.env.DB_HOST = '127.0.0.1';
   process.env.DB_USER = 'nihon';
   process.env.DB_PASSWORD = 'nihon123';
   process.env.DB_NAME = 'nihon_db';
}

const { query, initDb } = require('./lib/db');

async function promote() {
  try {
    await initDb();
    const result = await query("UPDATE users SET is_admin = 1 WHERE username = 'Tabitha'");
    console.log('Promotion réussie !', result.affectedRows, 'ligne(s) modifiée(s).');
    process.exit(0);
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  }
}

promote();
