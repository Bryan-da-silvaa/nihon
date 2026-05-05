import fs from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const INPUT_FILE = './public/kanjidic2-en-3.6.2.json';
const CHECKPOINT_FILE = './scratch/kanji_import_checkpoint.json';
const BATCH_SIZE = 10;
const LM_STUDIO_URL = "http://localhost:1234/v1/chat/completions";
const LOCAL_MODEL = "gemma4-26b-a4b";

async function translateMeanings(batch) {
	const prompt = `Translate these Japanese Kanji definitions from English to French. 
	Return ONLY a valid JSON array of arrays of strings. 
	IMPORTANT: Every single string MUST be enclosed in double quotes. 
	Example Input: [{"literal":"亜", "meanings":["Asia","rank next"]}]
	Example Output: [["Asie", "Rang suivant"]]
	
	Data: ${JSON.stringify(batch.map(k => ({ literal: k.literal, meanings: k.meanings_en })))}`

	try {
		const response = await fetch(LM_STUDIO_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model: LOCAL_MODEL,
				messages: [
					{ role: "system", content: "You are a Japanese-French translator. Return only raw JSON." },
					{ role: "user", content: prompt }
				],
				temperature: 0.1
			})
		});

		const data = await response.json();
		const text = data.choices[0].message.content;

		try {
			// Nettoyage du texte pour extraire le JSON
			const jsonMatch = text.match(/\[\s*\[.*\]\s*\]/s);
			const jsonString = jsonMatch ? jsonMatch[0] : text;
			return JSON.parse(jsonString);
		} catch (parseErr) {
			console.error("❌ Erreur de parsing JSON :");
			console.error("--- TEXTE REÇU DU MODÈLE ---");
			console.error(text);
			console.error("----------------------------");
			throw parseErr;
		}
	} catch (err) {
		console.error("❌ Erreur API LM Studio:", err.message);
		return null;
	}
}

async function run() {
	const connection = await mysql.createConnection({
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME
	});

	console.log("⏳ Lecture du fichier Kanjidic...");
	const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
	const characters = data.characters;
	console.log(`✅ ${characters.length} Kanjis trouvés.`);

	let startIndex = 0;
	if (fs.existsSync(CHECKPOINT_FILE)) {
		startIndex = JSON.parse(fs.readFileSync(CHECKPOINT_FILE)).lastIndex + 1;
		console.log(`🔄 Reprise à l'index ${startIndex}`);
	}

	for (let i = startIndex; i < characters.length; i += BATCH_SIZE) {
		const end = Math.min(i + BATCH_SIZE, characters.length);
		const batch = characters.slice(i, end).map(c => {
			const rm = c.readingMeaning?.groups?.[0] || {};
			const meanings_en = (rm.meanings || []).filter(m => !m.lang || m.lang === 'en').map(m => typeof m === 'string' ? m : m.value || m.text);
			const readings_on = (rm.readings || []).filter(r => r.type === 'ja_on').map(r => r.value);
			const readings_kun = (rm.readings || []).filter(r => r.type === 'ja_kun').map(r => r.value);

			return {
				literal: c.literal,
				jlpt: c.misc?.jlptLevel || null,
				grade: c.misc?.grade || null,
				stroke_count: c.misc?.strokeCounts?.[0] || null,
				frequency: c.misc?.frequency || null,
				readings_on,
				readings_kun,
				meanings_en,
				radicals: (c.radicals || []).map(r => r.value)
			};
		});

		console.log(`⏳ Traduction du bloc ${i} à ${end}...`);
		const meanings_fr_batch = await translateMeanings(batch);

		if (!meanings_fr_batch) {
			console.error(`\n❌ ERREUR FATALE : Le bloc ${i} n'a pas pu être traduit (problème API ou Parsing).`);
			console.error(`Le script s'arrête pour vous laisser vérifier l'erreur ci-dessus.`);
			process.exit(1);
		}

		if (meanings_fr_batch.length !== batch.length) {
			console.error(`\n❌ ERREUR DE LONGUEUR : Le bloc ${i} a renvoyé ${meanings_fr_batch.length} résultats au lieu de ${batch.length}.`);
			console.error(`Contenu reçu :`, JSON.stringify(meanings_fr_batch));
			console.error(`Le script s'arrête pour éviter de décaler les données.`);
			process.exit(1);
		}

		console.log(`🚀 Insertion du bloc ${i} dans la DB...`);
		for (let j = 0; j < batch.length; j++) {
			const k = batch[j];
			const meanings_fr = meanings_fr_batch[j];

			await connection.query(`
				INSERT INTO kanji_data (literal, jlpt, grade, stroke_count, frequency, readings_on, readings_kun, meanings_en, meanings_fr, radicals)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				ON DUPLICATE KEY UPDATE 
					jlpt = VALUES(jlpt), 
					grade = VALUES(grade), 
					stroke_count = VALUES(stroke_count), 
					frequency = VALUES(frequency),
					readings_on = VALUES(readings_on),
					readings_kun = VALUES(readings_kun),
					meanings_en = VALUES(meanings_en),
					meanings_fr = VALUES(meanings_fr),
					radicals = VALUES(radicals)
			`, [
				k.literal, k.jlpt, k.grade, k.stroke_count, k.frequency,
				JSON.stringify(k.readings_on),
				JSON.stringify(k.readings_kun),
				JSON.stringify(k.meanings_en),
				JSON.stringify(meanings_fr),
				JSON.stringify(k.radicals)
			]);
		}

		// Update checkpoint
		fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify({ lastIndex: end - 1 }));
	}

	console.log("🎉 Importation terminée avec succès !");
	fs.unlinkSync(CHECKPOINT_FILE);
	await connection.end();
}

run().catch(console.error);
