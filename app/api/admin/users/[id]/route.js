import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";

export async function DELETE(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    // Check if it's the last admin or prevent self-deletion
    const users = await query("SELECT COUNT(*) as count FROM users");
    if (users[0].count <= 1) {
      return NextResponse.json({ error: "Cannot delete the last user" }, { status: 400 });
    }

    // Delete related records first (cascade)
    await query("DELETE FROM game_sessions WHERE user_id = ?", [userId]);
    await query("DELETE FROM kana_stats WHERE user_id = ?", [userId]);
    await query("DELETE FROM user_library WHERE user_id = ?", [userId]);
    await query("DELETE FROM user_tags WHERE user_id = ?", [userId]);

    // Delete the user
    await query("DELETE FROM users WHERE id = ?", [userId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
