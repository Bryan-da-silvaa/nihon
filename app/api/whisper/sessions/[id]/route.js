import { NextResponse } from 'next/server';
import { query, initDb } from '../../../../../lib/db';
import fs from 'fs/promises';
import path from 'path';

// GET: Export a single session's files (subs + romaji) as JSON
export async function GET(request, { params }) {
	try {
		const { id } = await params;
		await initDb();
		const rows = await query(
			`SELECT * FROM whisper_sessions WHERE id = ?`, [id]
		);

		if (rows.length === 0) {
			return NextResponse.json({ error: 'Session not found' }, { status: 404 });
		}

		const session = rows[0];
		return NextResponse.json({
			id: session.id,
			title: session.title,
			audio_filename: session.audio_filename,
			video_filename: session.video_filename,
			thumbnail_filename: session.thumbnail_filename,
			subs_content: session.subs_content,
			romaji_content: session.romaji_content,
			language: session.language,
			tokenized_content: session.tokenized_content,
			created_at: session.created_at,
		});
	} catch (err) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

// DELETE: Remove a session and its files
export async function DELETE(request, { params }) {
	try {
		const { id } = await params;
		await initDb();

		// Get filenames first
		const rows = await query(`SELECT audio_filename, video_filename, thumbnail_filename, title FROM whisper_sessions WHERE id = ?`, [id]);
		if (rows.length === 0) {
			return NextResponse.json({ error: 'Session not found' }, { status: 404 });
		}

		const session = rows[0];
		const mediaDir = path.join(process.cwd(), 'media');

		// Delete files if they exist
		const filesToDelete = [
			path.join(mediaDir, 'audio', session.audio_filename),
			session.video_filename ? path.join(mediaDir, 'video', session.video_filename) : null,
			session.thumbnail_filename ? path.join(mediaDir, 'thumbnails', session.thumbnail_filename) : null,
			path.join(mediaDir, 'transcripts', `${session.title.replace(/[/\\?%*:|"<>]/g, '-').trim()}.srt`),
			path.join(mediaDir, 'transcripts', `${session.title.replace(/[/\\?%*:|"<>]/g, '-').trim()}_romaji.srt`),
		];

		for (const f of filesToDelete) {
			if (f) {
				await fs.unlink(f).catch(() => { }); // Ignore if file missing
			}
		}

		// Delete from DB (foreign keys should handle library/tags if set up, but let's be explicit if not)
		await query(`DELETE FROM user_tags WHERE session_id = ?`, [id]);
		await query(`DELETE FROM user_library WHERE session_id = ?`, [id]);
		await query(`DELETE FROM whisper_sessions WHERE id = ?`, [id]);

		return NextResponse.json({ success: true });
	} catch (err) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

// PUT: Update session metadata
export async function PUT(request, { params }) {
	try {
		const { id } = await params;
		const { title, language } = await request.json();
		await initDb();

		await query(
			`UPDATE whisper_sessions SET title = ?, language = ? WHERE id = ?`,
			[title, language, id]
		);

		return NextResponse.json({ success: true });
	} catch (err) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
