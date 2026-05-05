import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Création du pool de connexion
const pool = mysql.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
	multipleStatements: true,
});

export async function query(sql, values) {
	try {
		const [results] = await pool.query(sql, values);
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
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
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
      thumbnail_filename VARCHAR(500) DEFAULT NULL,
      tokenized_content LONGTEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
	await query(`
    CREATE TABLE IF NOT EXISTS user_vocabulary (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      word VARCHAR(255) NOT NULL,
      reading VARCHAR(255),
      status INT DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_word (user_id, word)
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
      srs_interval FLOAT DEFAULT 0,
      srs_repetition INT DEFAULT 0,
      srs_ease_factor FLOAT DEFAULT 2.5,
      srs_next_review TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      srs_streak INT DEFAULT 0,
      srs_lapses INT DEFAULT 0,
      srs_last_quality TINYINT DEFAULT NULL,
      UNIQUE KEY unique_user_kana (user_id, kana)
    )
  `);

	await query(`
		CREATE TABLE IF NOT EXISTS dictionary (
			id INT AUTO_INCREMENT PRIMARY KEY,
			ent_seq VARCHAR(50),
			word VARCHAR(100),
			reading VARCHAR(100) NOT NULL,
			meaning_en TEXT,
			meaning_fr TEXT,
			is_common BOOLEAN DEFAULT FALSE,
			pos VARCHAR(100),
			INDEX idx_word (word),
			INDEX idx_reading (reading),
			INDEX idx_common (is_common)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
	`);

	await query(`
    CREATE TABLE IF NOT EXISTS kanji_data (
      id INT AUTO_INCREMENT PRIMARY KEY,
      literal VARCHAR(10) UNIQUE NOT NULL,
      jlpt INT,
      grade INT,
      stroke_count INT,
      frequency INT,
      readings_on JSON,
      readings_kun JSON,
      meanings_en JSON,
      meanings_fr JSON,
      radicals JSON
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

	await query(`
    CREATE TABLE IF NOT EXISTS user_kanji_stats (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      kanji_id INT NOT NULL,
      level INT DEFAULT 0,
      next_review TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      interval_days FLOAT DEFAULT 0,
      repetition INT DEFAULT 0,
      ease_factor FLOAT DEFAULT 2.5,
      last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_kanji (user_id, kanji_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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

	const thumbCheck = await query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'whisper_sessions' AND COLUMN_NAME = 'thumbnail_filename'
  `, [dbName]);

	if (thumbCheck.length === 0) {
		await query(`ALTER TABLE whisper_sessions ADD COLUMN thumbnail_filename VARCHAR(500) AFTER language`);
	}

	const tokenizedCheck = await query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'whisper_sessions' AND COLUMN_NAME = 'tokenized_content'
  `, [dbName]);

	if (tokenizedCheck.length === 0) {
		await query(`ALTER TABLE whisper_sessions ADD COLUMN tokenized_content LONGTEXT AFTER subs_content`);
	}

	// Add last_position to user_library for syncing progress
	const libraryPosCheck = await query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'user_library' AND COLUMN_NAME = 'last_position'
  `, [dbName]);
	if (libraryPosCheck.length === 0) {
		await query(`ALTER TABLE user_library ADD COLUMN last_position FLOAT DEFAULT 0`);
	}

	const kanaStatsColumns = [
		["srs_interval", "FLOAT DEFAULT 0"],
		["srs_repetition", "INT DEFAULT 0"],
		["srs_ease_factor", "FLOAT DEFAULT 2.5"],
		["srs_next_review", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"],
		["srs_streak", "INT DEFAULT 0"],
		["srs_lapses", "INT DEFAULT 0"],
		["srs_last_quality", "TINYINT DEFAULT NULL"],
	];

	for (const [columnName, columnDefinition] of kanaStatsColumns) {
		const columnCheck = await query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'kana_stats' AND COLUMN_NAME = ?
    `, [dbName, columnName]);

		if (columnCheck.length === 0) {
			await query(`ALTER TABLE kana_stats ADD COLUMN ${columnName} ${columnDefinition}`);
		}
	}

	const userColumns = [
		["learning_strategy", "VARCHAR(20) DEFAULT 'balanced'"],
		["session_intensity", "VARCHAR(20) DEFAULT 'standard'"],
		["language", "VARCHAR(10) DEFAULT 'fr'"],
		["dark_mode", "BOOLEAN DEFAULT TRUE"],
		["require_voice_answer", "BOOLEAN DEFAULT FALSE"],
		["use_timer", "BOOLEAN DEFAULT FALSE"],
		["time_limit", "INT DEFAULT 60"],
		["last_setup_mode", "VARCHAR(20) DEFAULT 'both'"],
		["last_setup_selection", "JSON DEFAULT NULL"],
		["created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"],
		["is_admin", "BOOLEAN DEFAULT FALSE"],
		["banner", "LONGTEXT DEFAULT NULL"],
		["avatar", "LONGTEXT DEFAULT NULL"],
		["kanji", "VARCHAR(100) DEFAULT NULL"],
		["reading", "VARCHAR(100) DEFAULT NULL"],
	];

	for (const [columnName, columnDefinition] of userColumns) {
		const columnCheck = await query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = ?
    `, [dbName, columnName]);

		if (columnCheck.length === 0) {
			await query(`ALTER TABLE users ADD COLUMN ${columnName} ${columnDefinition}`);
		}
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
