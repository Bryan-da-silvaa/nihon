import { NextResponse } from 'next/server';
import { query, initDb } from '../../lib/db';
import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";
import path from 'path';
import fs from 'fs/promises';

export const maxDuration = 300;

export async function POST(request) {
	try {
		await initDb();
		const formData = await request.formData();
		const file = formData.get('file');
		const title = formData.get('title') || 'Untitled Session';
		const language = formData.get('language') || 'auto';

		if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

		const kuroshiro = new Kuroshiro();
		const analyzer = new KuromojiAnalyzer({
			dictPath: path.join(process.cwd(), 'node_modules', 'kuromoji', 'dict')
		});
		await kuroshiro.init(analyzer);

		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'audio');
		const subsDestDir = path.join(process.cwd(), 'public', 'uploads', 'subs');
		await fs.mkdir(uploadDir, { recursive: true });
		await fs.mkdir(subsDestDir, { recursive: true });

		const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
		const filename = `${Date.now()}_${safeTitle}${path.extname(file.name)}`;
		const filePath = path.join(uploadDir, filename);
		await fs.writeFile(filePath, buffer);

		const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
			method: 'POST',
			headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
			body: (() => {
				const fd = new FormData();
				fd.append('file', new Blob([buffer], { type: file.type }), file.name);
				fd.append('model', 'whisper-1');
				fd.append('response_format', 'verbose_json');
				if (language !== 'auto') fd.append('language', language);
				return fd;
			})()
		});

		if (!whisperResponse.ok) throw new Error("Whisper API failed");

		const data = await whisperResponse.json();
		const formatTime = (s) => new Date(s * 1000).toISOString().substr(11, 8) + ',' + Math.floor((s % 1) * 1000).toString().padStart(3, '0');

		const srtLines = [];
		const tokenizedBlocks = [];
		const romajiLines = [];

		if (data.segments) {
			for (let i = 0; i < data.segments.length; i++) {
				const segment = data.segments[i];
				const start = formatTime(segment.start);
				const end = formatTime(segment.end);
				const text = segment.text.trim();

				srtLines.push(`${i + 1}\n${start} --> ${end}\n${text}\n`);

				try {
					const tokens = await kuroshiro.analyzer.parse(text);
					const tokensWithRomaji = [];
					for (let j = 0; j < tokens.length; j++) {
						let t = tokens[j];
						let nextT = tokens[j + 1];
						
						let surface = t.surface_form;
						let basic = (t.basic_form && t.basic_form !== "*") ? t.basic_form : t.surface_form;
						let reading = t.reading || "";
						
						if ((surface === "っ" || surface === "ッ" || surface.endsWith("っ") || surface.endsWith("ッ")) && nextT) {
							surface += nextT.surface_form;
							basic += (nextT.basic_form && nextT.basic_form !== "*") ? nextT.basic_form : nextT.surface_form;
							reading += nextT.reading || "";
							j++;
						}

						let r = "";
						const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(surface);
						if (hasJapanese) {
							try {
								r = await kuroshiro.convert(reading || surface, { to: "romaji", mode: "normal" });
								r = r.replace(/undefined/g, '').trim();
								if (surface === "いう" || surface === "言う") r = "yuu";
								if (surface === "という") r = "toyuu";
								
								// Correction des particules (ha -> wa, he -> e, wo -> o)
								if (t.pos === "助詞") {
									if (surface === "は") r = "wa";
									if (surface === "へ") r = "e";
									if (surface === "を") r = "o";
								}
							} catch (e) { r = ""; }
						}
						tokensWithRomaji.push({ w: surface, b: basic, r: reading, romaji: r, p: t.pos });
					}
					tokenizedBlocks.push(tokensWithRomaji);
				} catch (e) {
					tokenizedBlocks.push([{ w: text, b: text, r: "", romaji: "", p: "" }]);
				}

				let globalRomaji = await kuroshiro.convert(text, { to: "romaji", mode: "spaced" });
				romajiLines.push(`${i + 1}\n${start} --> ${end}\n${globalRomaji.replace(/undefined/g, '')}\n`);
			}
		}

		const srtFilename = `${Date.now()}_${safeTitle}.srt`;
		await fs.writeFile(path.join(subsDestDir, srtFilename), srtLines.join('\n'));
		const romajiSrtFilename = `${Date.now()}_${safeTitle}_romaji.srt`;
		await fs.writeFile(path.join(subsDestDir, romajiSrtFilename), romajiLines.join('\n'));

		const result = await query(
			`INSERT INTO whisper_sessions (title, audio_filename, subs_content, romaji_content, language, tokenized_content) 
			 VALUES (?, ?, ?, ?, ?, ?)`,
			[title, filename, srtLines.join('\n'), romajiLines.join('\n'), language, JSON.stringify(tokenizedBlocks)]
		);

		return NextResponse.json({ success: true, sessionId: result.insertId });
	} catch (err) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
