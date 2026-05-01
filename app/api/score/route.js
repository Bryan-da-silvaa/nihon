import { NextResponse } from "next/server";
import { query, initDb } from "../../../lib/db";

export async function POST(request) {
  try {
    const { userId, mode, score, total, duration_seconds, kana_details } = await request.json();
    
    if (!userId) return NextResponse.json({ error: "api.unauthorized" }, { status: 401 });

    await initDb();

    // 1. Update basic user stats (legacy)
    const queryStr = `
      UPDATE users 
      SET games_played = games_played + 1, 
          total_correct = total_correct + ?,
          best_score_hiragana = IF(? = 'hiragana' AND ? > best_score_hiragana, ?, best_score_hiragana),
          best_score_katakana = IF(? = 'katakana' AND ? > best_score_katakana, ?, best_score_katakana),
          best_score_mixed = IF(? = 'both' AND ? > best_score_mixed, ?, best_score_mixed)
      WHERE id = ?
    `;
    
    await query(queryStr, [
      score,
      mode, score, score,
      mode, score, score,
      mode, score, score,
      userId
    ]);

    // 2. Insert into game_sessions
    const duration = duration_seconds || 0;
    await query(
      `INSERT INTO game_sessions (user_id, mode, score, total, duration_seconds) VALUES (?, ?, ?, ?, ?)`,
      [userId, mode, score, total, duration]
    );

    // 3. Update individual kana_stats
    if (kana_details && Array.isArray(kana_details) && kana_details.length > 0) {
      // Build a bulk insert/update query
      const values = [];
      const placeholders = [];
      kana_details.forEach(item => {
        placeholders.push(`(?, ?, 1, ?)`);
        values.push(userId, item.kana, item.correct ? 1 : 0);
      });
      
      const bulkQuery = `
        INSERT INTO kana_stats (user_id, kana, attempts, correct)
        VALUES ${placeholders.join(', ')}
        ON DUPLICATE KEY UPDATE 
          attempts = attempts + 1,
          correct = correct + VALUES(correct)
      `;
      await query(bulkQuery, values);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "api.scoreSaveError" }, { status: 500 });
  }
}
