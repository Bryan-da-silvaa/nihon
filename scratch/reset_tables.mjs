import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function resetDictTables() {
	const connection = await mysql.createConnection({
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME
	});

	try {
		console.log("🗑️ Suppression des anciennes tables...");
		await connection.query('SET FOREIGN_KEY_CHECKS = 0');
		const tables = ['dictionary', 'dictionary_kana', 'dictionary_kanji', 'dictionary_meaning'];
		for (const table of tables) {
			await connection.query(`DROP TABLE IF EXISTS ${table}`);
			console.log(`✅ Table ${table} supprimée.`);
		}
		await connection.query('SET FOREIGN_KEY_CHECKS = 1');
	} catch (err) {
		console.error("❌ Erreur:", err);
	} finally {
		await connection.end();
	}
}

resetDictTables();
