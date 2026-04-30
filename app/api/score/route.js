import { NextResponse } from "next/server";
import { query } from "../../../lib/db";

export async function POST(request) {
  try {
    const { userId, mode, score, total } = await request.json();
    
    if (!userId) return NextResponse.json({ error: "api.unauthorized" }, { status: 401 });

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
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "api.scoreSaveError" }, { status: 500 });
  }
}
