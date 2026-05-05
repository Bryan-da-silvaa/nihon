import { NextResponse } from 'next/server';
import { query, initDb } from '../../../../lib/db';

// GET: List all whisper sessions
export async function GET() {
	try {
		await initDb();
		const rows = await query(
			`SELECT id, title, audio_filename, video_filename, thumbnail_filename, language, created_at, (subs_content IS NOT NULL AND subs_content != '') as has_transcript FROM whisper_sessions ORDER BY created_at DESC`
		);
		return NextResponse.json({ sessions: rows });
	} catch (err) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

// DELETE: Remove a session by id
export async function DELETE(request) {
	try {
		const { id } = await request.json();
		await initDb();
		await query(`DELETE FROM whisper_sessions WHERE id = ?`, [id]);
		return NextResponse.json({ success: true });
	} catch (err) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
