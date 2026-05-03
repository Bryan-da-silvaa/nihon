const mysql = require('mysql2/promise');
const fs = require('fs/promises');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function fixRomajiUndefined() {
	console.log("🛠️ Starting Romaji 'undefined' cleanup...");

	const pool = mysql.createPool({
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
	});

	try {
		// 1. Fix Database
		const [sessions] = await pool.execute(
			`SELECT id, title, romaji_content FROM whisper_sessions WHERE romaji_content LIKE '%undefined%'`
		);

		console.log(`📦 Found ${sessions.length} sessions in DB to fix.`);

		for (const session of sessions) {
			const fixed = session.romaji_content.replace(/undefined/g, '');
			await pool.execute(
				`UPDATE whisper_sessions SET romaji_content = ? WHERE id = ?`,
				[fixed, session.id]
			);
			console.log(`✅ Fixed DB entry for: "${session.title}"`);
		}

		// 2. Fix Files on disk (optional but good for consistency)
		const transcriptDir = path.join(process.cwd(), 'media', 'transcripts');
		const files = await fs.readdir(transcriptDir);
		const romajiFiles = files.filter(f => f.endsWith('_romaji.srt'));

		console.log(`📁 Checking ${romajiFiles.length} Romaji files on disk...`);

		for (const file of romajiFiles) {
			const filePath = path.join(transcriptDir, file);
			const content = await fs.readFile(filePath, 'utf8');
			if (content.includes('undefined')) {
				const fixed = content.replace(/undefined/g, '');
				await fs.writeFile(filePath, fixed);
				console.log(`✅ Fixed file: ${file}`);
			}
		}

		console.log("🏁 Cleanup completed!");
	} catch (error) {
		console.error("❌ Cleanup failed:", error);
	} finally {
		await pool.end();
	}
}

fixRomajiUndefined();
