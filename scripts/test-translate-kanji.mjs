import fs from 'fs';

const INPUT_FILE = './public/kanjidic2-en-3.6.2.json';
const BATCH_SIZE = 20; // On réduit pour le test
const LM_STUDIO_URL = "http://localhost:1234/v1/chat/completions";
const LOCAL_MODEL = "gemma4-26b-a4b";

async function translateMeanings(batch) {
	const prompt = `Translate these Japanese Kanji definitions from English to French. 
	Return ONLY a JSON array of arrays of strings. Each sub-array contains the French meanings for the corresponding Kanji.
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

		const jsonMatch = text.match(/\[\s*\[.*\]\s*\]/s);
		if (jsonMatch) {
			return JSON.parse(jsonMatch[0]);
		}
		return JSON.parse(text);
	} catch (err) {
		console.error("❌ Erreur API LM Studio:", err);
		return null;
	}
}

async function run() {
	console.log("⏳ Lecture du fichier Kanjidic...");
	const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
	const characters = data.characters;
	console.log(`✅ ${characters.length} Kanjis trouvés.`);

	const CHECKPOINT_FILE = './scratch/test_kanji_checkpoint.json';
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
			return {
				literal: c.literal,
				meanings_en
			};
		});

		console.log(`⏳ Traduction test du bloc ${i} à ${end}...`);
		const meanings_fr_batch = await translateMeanings(batch);

		if (!meanings_fr_batch || meanings_fr_batch.length !== batch.length) {
			console.error(`⚠️ Erreur de traduction pour le bloc ${i}. On attend 2 secondes et on réessaie...`);
			await new Promise(r => setTimeout(r, 2000));
			i -= BATCH_SIZE; 
			continue;
		}

		// Simulation d'insertion (Log seulement)
		console.log(`✅ Bloc ${i} traduit avec succès :`);
		for (let j = 0; j < batch.length; j++) {
			console.log(`   ${batch[j].literal} : ${meanings_fr_batch[j].join(', ')}`);
		}

		// Update checkpoint
		fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify({ lastIndex: end - 1 }));
	}

	console.log("🎉 Test de traduction terminé !");
	if (fs.existsSync(CHECKPOINT_FILE)) fs.unlinkSync(CHECKPOINT_FILE);
}

run().catch(console.error);
