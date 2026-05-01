import { NextResponse } from 'next/server';
import { query, initDb } from '../../../../lib/db';

export async function POST(request) {
  try {
    const { userId, sessionId, tagName } = await request.json();
    if (!userId || !sessionId || !tagName) {
      return NextResponse.json({ error: 'userId, sessionId, and tagName required' }, { status: 400 });
    }

    const cleanTag = tagName.trim().toLowerCase();
    if (!cleanTag) {
      return NextResponse.json({ error: 'invalid tagName' }, { status: 400 });
    }

    await initDb();
    
    // Add tag
    await query(
      `INSERT IGNORE INTO user_tags (user_id, session_id, tag_name) VALUES (?, ?, ?)`,
      [userId, sessionId, cleanTag]
    );

    // Also auto-add to library if not there
    await query(
      `INSERT IGNORE INTO user_library (user_id, session_id) VALUES (?, ?)`,
      [userId, sessionId]
    );

    return NextResponse.json({ success: true, tag: cleanTag });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { userId, sessionId, tagName } = await request.json();
    if (!userId || !sessionId || !tagName) {
      return NextResponse.json({ error: 'userId, sessionId, and tagName required' }, { status: 400 });
    }

    await initDb();
    await query(
      `DELETE FROM user_tags WHERE user_id = ? AND session_id = ? AND tag_name = ?`,
      [userId, sessionId, tagName]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
