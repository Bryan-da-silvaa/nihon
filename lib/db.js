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
