import { NextResponse } from "next/server";
import { initDb, query } from "../../../../lib/db";

export async function DELETE(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "api.unauthorized" }, { status: 401 });
    }

    await initDb();

    await query("DELETE FROM game_sessions WHERE user_id = ?", [userId]);
    await query("DELETE FROM kana_stats WHERE user_id = ?", [userId]);
    await query("DELETE FROM user_library WHERE user_id = ?", [userId]);
    await query("DELETE FROM user_tags WHERE user_id = ?", [userId]);

    await query(
      `UPDATE users
       SET games_played = 0,
           total_correct = 0,
           best_score_hiragana = 0,
           best_score_katakana = 0,
           best_score_mixed = 0
       WHERE id = ?`,
      [userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to clear user data:", error);
    return NextResponse.json({ error: "api.updateError" }, { status: 500 });
  }
}

