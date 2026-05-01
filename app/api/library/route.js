import { NextResponse } from 'next/server';
import { query, initDb } from '../../../lib/db';

// GET: Fetch user's library (sessions they've saved)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  try {
    await initDb();
    const rows = await query(
      `SELECT ws.id, ws.title, ws.audio_filename, ws.video_filename, ws.language, ws.created_at, ul.added_at,
              GROUP_CONCAT(ut.tag_name SEPARATOR ',') as tags
       FROM user_library ul
       JOIN whisper_sessions ws ON ul.session_id = ws.id
       LEFT JOIN user_tags ut ON ws.id = ut.session_id AND ut.user_id = ul.user_id
       WHERE ul.user_id = ?
       GROUP BY ws.id, ul.added_at
       ORDER BY ul.added_at DESC`,
      [userId]
    );
    
    // Parse tags string into array
    const library = rows.map(row => ({
      ...row,
      tags: row.tags ? row.tags.split(',') : []
    }));
    
    return NextResponse.json({ library });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Add a session to user's library
export async function POST(request) {
  try {
    const { userId, sessionId } = await request.json();
    if (!userId || !sessionId) {
      return NextResponse.json({ error: 'userId and sessionId required' }, { status: 400 });
    }

    await initDb();
    await query(
      `INSERT IGNORE INTO user_library (user_id, session_id) VALUES (?, ?)`,
      [userId, sessionId]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Remove a session from user's library
export async function DELETE(request) {
  try {
    const { userId, sessionId } = await request.json();
    if (!userId || !sessionId) {
      return NextResponse.json({ error: 'userId and sessionId required' }, { status: 400 });
    }

    await initDb();
    await query(
      `DELETE FROM user_library WHERE user_id = ? AND session_id = ?`,
      [userId, sessionId]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
