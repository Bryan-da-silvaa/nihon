import mysql from 'mysql2/promise';

// Création du pool de connexion
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function query(sql, values) {
  try {
    const [results] = await pool.execute(sql, values);
    return results;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// Initialize database structure
export async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id INT PRIMARY KEY DEFAULT 1,
      config JSON
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS whisper_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      audio_filename VARCHAR(500),
      subs_content LONGTEXT,
      romaji_content LONGTEXT,
      language VARCHAR(10) DEFAULT 'auto',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS user_library (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      session_id INT NOT NULL,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_session (user_id, session_id)
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS user_tags (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      session_id INT NOT NULL,
      tag_name VARCHAR(50) NOT NULL,
      UNIQUE KEY unique_user_session_tag (user_id, session_id, tag_name)
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      mode VARCHAR(20),
      score INT,
      total INT,
      duration_seconds INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS kana_stats (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      kana VARCHAR(10) NOT NULL,
      attempts INT DEFAULT 0,
      correct INT DEFAULT 0,
      last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_kana (user_id, kana)
    )
  `);
  const dbName = process.env.DB_NAME;
  const columnCheck = await query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'whisper_sessions' AND COLUMN_NAME = 'video_filename'
  `, [dbName]);

  if (columnCheck.length === 0) {
    await query(`ALTER TABLE whisper_sessions ADD COLUMN video_filename VARCHAR(500) AFTER audio_filename`);
  }
}

export async function getSystemConfig() {
  await initDb();
  const rows = await query(`SELECT config FROM system_settings WHERE id = 1`);
  if (rows.length > 0 && rows[0].config) {
    return typeof rows[0].config === 'string' ? JSON.parse(rows[0].config) : rows[0].config;
  }
  return null;
}

export async function saveSystemConfig(config) {
  await initDb();
  const jsonStr = JSON.stringify(config);
  await query(`
    INSERT INTO system_settings (id, config) 
    VALUES (1, ?)
    ON DUPLICATE KEY UPDATE config = ?
  `, [jsonStr, jsonStr]);
}
