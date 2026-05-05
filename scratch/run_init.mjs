import { initDb } from '../lib/db.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function runInit() {
	try {
		console.log("⏳ Initialisation de la base de données...");
		await initDb();
		console.log("✅ Tables créées avec succès.");
	} catch (err) {
		console.error("❌ Erreur:", err);
	} finally {
		process.exit(0);
	}
}

runInit();
