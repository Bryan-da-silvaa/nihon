const mysql = require('mysql2/promise');
const path = require('path');
const Kuroshiro = require('kuroshiro').default || require('kuroshiro');
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji');
require('dotenv').config({ path: '.env.local' });

async function tokenizeExisting() {
	console.log("🚀 Starting tokenization migration for existing sessions...");

	const pool = mysql.createPool({
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
	});

	try {
		// 1. Initialize Kuroshiro
		const kuroshiro = new Kuroshiro();
		const dictPath = path.join(process.cwd(), 'node_modules', 'kuromoji', 'dict');
		const analyzer = new KuromojiAnalyzer({ dictPath });
		await kuroshiro.init(analyzer);
		console.log("✅ Kuroshiro initialized.");

		// 2. Get sessions without tokenized_content (or empty)
		const [sessions] = await pool.execute(
			`SELECT id, title, subs_content FROM whisper_sessions 
			 WHERE tokenized_content IS NULL OR tokenized_content = '' OR tokenized_content = '[]'
			 OR LENGTH(tokenized_content) < 100` // Force redo if suspiciously small
		);

		if (sessions.length === 0) {
			console.log("✨ No sessions found that require tokenization.");
			return;
		}

		console.log(`📦 Found ${sessions.length} sessions to process.`);

		for (const session of sessions) {
			console.log(`🔍 Processing: "${session.title}" (ID: ${session.id})...`);
			
			if (!session.subs_content) {
				console.log(`⚠️ Skip: No transcript content for session ${session.id}`);
				continue;
			}

			const blocks = session.subs_content.trim().replace(/\r\n/g, '\n').split(/\n\s*\n/);
			const tokenizedBlocks = [];

			for (let block of blocks) {
				const lines = block.split('\n');
				const textLines = lines.slice(2);
				const blockTokens = [];

				for (let text of textLines) {
					if (!text.trim()) continue;
					try {
						const tokens = await analyzer.parse(text);
						if (tokens && tokens.length > 0) {
							blockTokens.push(...tokens.map(t => ({
								w: t.surface_form,
								b: (t.basic_form && t.basic_form !== "*") ? t.basic_form : t.surface_form,
								r: t.reading || "",
								p: t.pos
							})));
						} else {
							blockTokens.push({ w: text, b: text, r: "", p: "" });
						}
					} catch (e) {
						blockTokens.push({ w: text, b: text, r: "", p: "" });
					}
				}
				tokenizedBlocks.push(blockTokens);
			}

			// 3. Update DB
			await pool.execute(
				`UPDATE whisper_sessions SET tokenized_content = ? WHERE id = ?`,
				[JSON.stringify(tokenizedBlocks), session.id]
			);
			console.log(`✅ Success: "${session.title}" tokenized.`);
		}

		console.log("🏁 Migration completed successfully.");
	} catch (error) {
		console.error("❌ Migration failed:", error);
	} finally {
		await pool.end();
	}
}

tokenizeExisting();
