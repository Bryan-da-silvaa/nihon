import { NextResponse } from 'next/server';
import { query, initDb } from '../../../../../lib/db';

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
      subs_content: session.subs_content,
      romaji_content: session.romaji_content,
      language: session.language,
      created_at: session.created_at,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
