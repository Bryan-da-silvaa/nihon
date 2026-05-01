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
      const statsRows = await query(
        `SELECT kana, attempts, correct, srs_interval, srs_repetition, srs_ease_factor, srs_lapses, srs_streak
         FROM kana_stats
         WHERE user_id = ?`,
        [userId]
      );
      const statsByKana = new Map(statsRows.map((row) => [row.kana, row]));

      for (const item of kana_details) {
        const existing = statsByKana.get(item.kana) || {};
        let repetition = existing.srs_repetition || 0;
        let intervalDays = existing.srs_interval || 0;
        let easeFactor = existing.srs_ease_factor || 2.5;
        let lapses = existing.srs_lapses || 0;
        let streak = existing.srs_streak || 0;
        const isCorrect = item.correct ? 1 : 0;
        let nextQuality = isCorrect ? 5 : 2;

        if (isCorrect) {
          repetition += 1;
          streak += 1;

          if (repetition === 1) {
            intervalDays = 0.01;
          } else if (repetition === 2) {
            intervalDays = 1;
          } else if (repetition === 3) {
            intervalDays = 3;
          } else {
            intervalDays = Math.max(1, intervalDays * easeFactor);
          }

          easeFactor = Math.min(3, easeFactor + 0.08);
        } else {
          repetition = 0;
          streak = 0;
          lapses += 1;
          intervalDays = 0.01;
          easeFactor = Math.max(1.3, easeFactor - 0.2);
        }

        const minutesToAdd = Math.max(1, Math.round(intervalDays * 24 * 60));

        await query(`
          INSERT INTO kana_stats (
            user_id,
            kana,
            attempts,
            correct,
            srs_interval,
            srs_repetition,
            srs_ease_factor,
            srs_next_review,
            srs_streak,
            srs_lapses,
            srs_last_quality
          )
          VALUES (?, ?, 1, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            attempts = attempts + 1,
            correct = correct + VALUES(correct),
            srs_interval = VALUES(srs_interval),
            srs_repetition = VALUES(srs_repetition),
            srs_ease_factor = VALUES(srs_ease_factor),
            srs_next_review = VALUES(srs_next_review),
            srs_streak = VALUES(srs_streak),
            srs_lapses = VALUES(srs_lapses),
            srs_last_quality = VALUES(srs_last_quality)
        `, [userId, item.kana, isCorrect, intervalDays, repetition, easeFactor, minutesToAdd, streak, lapses, nextQuality]);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "api.scoreSaveError" }, { status: 500 });
  }
}
