import { NextResponse } from 'next/server';
import { query, initDb } from '../../../../lib/db';

// GET: All available sessions with inLibrary flag for a given user
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  try {
    await initDb();

    if (userId) {
      const rows = await query(
        `SELECT ws.id, ws.title, ws.audio_filename, ws.video_filename, ws.language, ws.created_at,
                CASE WHEN ul.id IS NOT NULL THEN 1 ELSE 0 END AS inLibrary,
                GROUP_CONCAT(ut.tag_name SEPARATOR ',') as tags
         FROM whisper_sessions ws
         LEFT JOIN user_library ul ON ws.id = ul.session_id AND ul.user_id = ?
         LEFT JOIN user_tags ut ON ws.id = ut.session_id AND ut.user_id = ?
         GROUP BY ws.id, ul.id
         ORDER BY ws.created_at DESC`,
        [userId, userId]
      );
      const catalog = rows.map(row => ({
        ...row,
        tags: row.tags ? row.tags.split(',') : []
      }));
      return NextResponse.json({ catalog });
    } else {
      const rows = await query(
        `SELECT id, title, audio_filename, video_filename, language, created_at, 0 AS inLibrary, '' AS tags
         FROM whisper_sessions ORDER BY created_at DESC`
      );
      const catalog = rows.map(row => ({
        ...row,
        tags: []
      }));
      return NextResponse.json({ catalog });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
