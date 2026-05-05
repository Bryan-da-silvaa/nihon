import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function audit() {
	const connection = await mysql.createConnection({
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME
	});

	const [kanjis] = await connection.query('SELECT id, literal, meanings_en, meanings_fr FROM kanji_data ORDER BY id ASC');
	
	const blockSize = 50;
	let errors = [];
	let suspicious = [];

	console.log(`🔍 Audit de ${kanjis.length} Kanjis par blocs de ${blockSize}...`);

	for (let i = 0; i < kanjis.length; i += blockSize) {
		const block = kanjis.slice(i, i + blockSize);
		const blockNum = (i / blockSize) + 1;
		let blockErrors = 0;

		block.forEach(k => {
			// Check 1: Empty or Null
			if (!k.meanings_fr || k.meanings_fr === '[]') {
				errors.push(`Bloc ${blockNum}: [${k.literal}] Traduction vide`);
				blockErrors++;
			}

			// Check 2: JSON Validity
			try {
				const fr = JSON.parse(k.meanings_fr);
				if (!Array.isArray(fr)) throw new Error("Not an array");
				
				// Check 3: Suspiciously identical to English (heuristic)
				const en = JSON.parse(k.meanings_en);
				if (k.meanings_fr === k.meanings_en && fr.length > 0) {
					// On ne le marque que si c'est un mot long qui ne devrait pas être identique
					const isLikelyEnglish = fr.some(word => word.length > 5 && !['obstacle', 'condition', 'situation', 'tradition'].includes(word.toLowerCase()));
					if (isLikelyEnglish) {
						suspicious.push(`Bloc ${blockNum}: [${k.literal}] Identique à l'anglais (${fr[0]})`);
					}
				}
			} catch (e) {
				errors.push(`Bloc ${blockNum}: [${k.literal}] JSON malformé`);
				blockErrors++;
			}
		});

		if (blockErrors === 0) {
			process.stdout.write(`✅ Bloc ${blockNum} OK | `);
		} else {
			process.stdout.write(`❌ Bloc ${blockNum} ERR | `);
		}
		if (blockNum % 5 === 0) console.log(""); // Retour à la ligne tous les 5 blocs
	}

	console.log("\n\n--- RÉSULTAT DE L'AUDIT ---");
	if (errors.length === 0 && suspicious.length === 0) {
		console.log("✨ Félicitations ! Aucun défaut majeur détecté sur les 2000 Kanjis.");
	} else {
		if (errors.length > 0) {
			console.log("🚨 ERREURS CRITIQUES :");
			errors.forEach(e => console.log(e));
		}
		if (suspicious.length > 0) {
			console.log("⚠️ TRADUCTIONS SUSPECTES (À VÉRIFIER) :");
			suspicious.forEach(s => console.log(s));
		}
	}
	
	await connection.end();
}

audit();
