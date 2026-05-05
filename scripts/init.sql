-- Nihon Database Initialization Script
-- Generated from lib/db.js
-- Database: nihon_db

SET FOREIGN_KEY_CHECKS = 0;

-- ========================================
-- Table: system_settings
-- ========================================
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE IF NOT EXISTS system_settings (
  id INT PRIMARY KEY DEFAULT 1,
  config JSON
);

-- ========================================
-- Table: users
-- ========================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  learning_strategy VARCHAR(20) DEFAULT 'balanced',
  session_intensity VARCHAR(20) DEFAULT 'standard',
  language VARCHAR(10) DEFAULT 'fr',
  dark_mode BOOLEAN DEFAULT TRUE,
  require_voice_answer BOOLEAN DEFAULT FALSE,
  use_timer BOOLEAN DEFAULT FALSE,
  time_limit INT DEFAULT 60,
  last_setup_mode VARCHAR(20) DEFAULT 'both',
  last_setup_selection JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_admin BOOLEAN DEFAULT FALSE,
  banner LONGTEXT DEFAULT NULL,
  avatar LONGTEXT DEFAULT NULL,
  kanji VARCHAR(100) DEFAULT NULL,
  reading VARCHAR(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: whisper_sessions
-- ========================================
DROP TABLE IF EXISTS `whisper_sessions`;
CREATE TABLE IF NOT EXISTS whisper_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  audio_filename VARCHAR(500),
  video_filename VARCHAR(500),
  subs_content LONGTEXT,
  romaji_content LONGTEXT,
  tokenized_content LONGTEXT DEFAULT NULL,
  language VARCHAR(10) DEFAULT 'auto',
  thumbnail_filename VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: user_vocabulary
-- ========================================
DROP TABLE IF EXISTS `user_vocabulary`;
CREATE TABLE IF NOT EXISTS user_vocabulary (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  word VARCHAR(255) NOT NULL,
  reading VARCHAR(255),
  status INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_word (user_id, word)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: user_library
-- ========================================
DROP TABLE IF EXISTS `user_library`;
CREATE TABLE IF NOT EXISTS user_library (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_id INT NOT NULL,
  last_position FLOAT DEFAULT 0,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_session (user_id, session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: user_tags
-- ========================================
DROP TABLE IF EXISTS `user_tags`;
CREATE TABLE IF NOT EXISTS user_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_id INT NOT NULL,
  tag_name VARCHAR(50) NOT NULL,
  UNIQUE KEY unique_user_session_tag (user_id, session_id, tag_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: game_sessions
-- ========================================
DROP TABLE IF EXISTS `game_sessions`;
CREATE TABLE IF NOT EXISTS game_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  mode VARCHAR(20),
  score INT,
  total INT,
  duration_seconds INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: kana_stats
-- ========================================
DROP TABLE IF EXISTS `kana_stats`;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: dictionary
-- ========================================
DROP TABLE IF EXISTS `dictionary`;
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

-- ========================================
-- Table: kanji_data
-- ========================================
DROP TABLE IF EXISTS `kanji_data`;
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

-- ========================================
-- Table: user_kanji_stats
-- ========================================
DROP TABLE IF EXISTS `user_kanji_stats`;
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

SET FOREIGN_KEY_CHECKS = 1;
