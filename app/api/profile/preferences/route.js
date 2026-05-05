import { NextResponse } from "next/server";
import { query, initDb } from "@/lib/db";

export async function POST(request) {
  try {
    const { userId, ...preferences } = await request.json();

    if (!userId) return NextResponse.json({ error: "api.unauthorized" }, { status: 401 });
    await initDb();

    // List of allowed preference keys to prevent SQL injection or pollution
    const allowedKeys = [
      "learning_strategy",
      "session_intensity",
      "language",
      "dark_mode",
      "require_voice_answer",
      "use_timer",
      "time_limit",
      "last_setup_mode",
      "last_setup_selection",
      "kanji_per_page"
    ];

    const updates = [];
    const values = [];

    for (const key of allowedKeys) {
      if (preferences[key] !== undefined) {
        updates.push(`${key} = ?`);
        // Handle JSON for last_setup_selection
        if (key === "last_setup_selection" && preferences[key] !== null) {
          values.push(JSON.stringify(preferences[key]));
        } else {
          values.push(preferences[key]);
        }
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: true, message: "No changes" });
    }

    values.push(userId);
    await query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json({ error: "api.updateError" }, { status: 500 });
  }
}
