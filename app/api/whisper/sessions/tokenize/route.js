import { NextResponse } from 'next/server';
import { query, initDb } from '../../../../../lib/db';
import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";
import path from 'path';

export const maxDuration = 300;

export async function POST(request) {
	try {
		await initDb();

		const sessions = await query(
			`SELECT id, title, subs_content FROM whisper_sessions`
		);

		if (!sessions || sessions.length === 0) {
			return NextResponse.json({ message: "No sessions to tokenize", count: 0 });
		}

		const kuroshiro = new Kuroshiro();
		const dictPath = path.join(process.cwd(), 'node_modules', 'kuromoji', 'dict');
		const analyzer = new KuromojiAnalyzer({ dictPath });
		await kuroshiro.init(analyzer);

		let processedCount = 0;

		for (const session of sessions) {
			if (!session.subs_content) continue;

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
						if (!tokens || tokens.length === 0) continue;

						const tokensWithRomaji = [];
						for (let i = 0; i < tokens.length; i++) {
							let t = tokens[i];
							let nextT = tokens[i + 1];
							
							let surface = t.surface_form;
							let basic = (t.basic_form && t.basic_form !== "*") ? t.basic_form : t.surface_form;
							let reading = t.reading || "";
							
							// Fusion si le token est un petit "tsu" ou finit par un petit "tsu"
							if ((surface === "っ" || surface === "ッ" || surface.endsWith("っ") || surface.endsWith("ッ")) && nextT) {
								surface += nextT.surface_form;
								basic += (nextT.basic_form && nextT.basic_form !== "*") ? nextT.basic_form : nextT.surface_form;
								reading += nextT.reading || "";
								i++; // On saute le prochain token puisqu'on l'a fusionné
							}

							let r = "";
							const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(surface);
							
							if (hasJapanese) {
								try {
									r = await kuroshiro.convert(reading || surface, { to: "romaji", mode: "normal" });
									r = r.replace(/undefined/g, '').trim();
									
									// Phonétique harmonisée pour les verbes fréquents
									if (surface === "いう" || surface === "言う") r = "yuu";
									if (surface === "という") r = "toyuu";

									// Correction des particules (ha -> wa, he -> e, wo -> o)
									if (t.pos === "助詞") {
										if (surface === "は") r = "wa";
										if (surface === "へ") r = "e";
										if (surface === "を") r = "o";
									}
								} catch (err) { r = ""; }
							}
							
							tokensWithRomaji.push({
								w: surface,
								b: basic,
								r: reading,
								romaji: r,
								p: t.pos
							});
						}
						blockTokens.push(...tokensWithRomaji);
					} catch (e) {
						console.error(`Error parsing text: ${text}`, e);
					}
				}
				tokenizedBlocks.push(blockTokens);
			}

			await query(
				`UPDATE whisper_sessions SET tokenized_content = ? WHERE id = ?`,
				[JSON.stringify(tokenizedBlocks), session.id]
			);
			processedCount++;
		}

		return NextResponse.json({ 
			success: true, 
			message: `${processedCount} sessions tokenized successfully`,
			count: processedCount 
		});

	} catch (err) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
