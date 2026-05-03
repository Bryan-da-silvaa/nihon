import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

// GET: Fetch progress for a specific session
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const sessionId = searchParams.get('sessionId');

  if (!userId || !sessionId) {
    return NextResponse.json({ error: 'userId and sessionId required' }, { status: 400 });
  }

  try {
    await initDb();
    const rows = await query(
      `SELECT last_position FROM user_library WHERE user_id = ? AND session_id = ?`,
      [userId, sessionId]
    );
    
    return NextResponse.json({ 
      last_position: rows.length > 0 ? rows[0].last_position : 0 
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Update progress for a specific session
export async function POST(request) {
  try {
    const { userId, sessionId, position } = await request.json();
    if (!userId || !sessionId || position === undefined) {
      return NextResponse.json({ error: 'userId, sessionId and position required' }, { status: 400 });
    }

    await initDb();
    // Update only if the entry exists in library
    await query(
      `UPDATE user_library SET last_position = ? WHERE user_id = ? AND session_id = ?`,
      [position, userId, sessionId]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
