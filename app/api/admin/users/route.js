import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const users = await query(
      `SELECT u.id, u.username, u.avatar, u.kanji, u.reading, u.created_at, u.is_admin,
              COUNT(gs.id) AS total_games,
              COALESCE(SUM(gs.score), 0) AS total_score,
              COALESCE(SUM(gs.total), 0) AS total_attempts
       FROM users u
       LEFT JOIN game_sessions gs ON u.id = gs.user_id
       GROUP BY u.id, u.username, u.avatar, u.kanji, u.reading, u.created_at, u.is_admin
       ORDER BY u.id DESC`
    );

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
