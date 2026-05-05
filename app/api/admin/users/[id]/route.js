import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function DELETE(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    const users = await query("SELECT COUNT(*) as count FROM users");
    if (users[0].count <= 1) {
      return NextResponse.json({ error: "Cannot delete the last user" }, { status: 400 });
    }

    await query("DELETE FROM game_sessions WHERE user_id = ?", [userId]);
    await query("DELETE FROM kana_stats WHERE user_id = ?", [userId]);
    await query("DELETE FROM user_library WHERE user_id = ?", [userId]);
    await query("DELETE FROM user_tags WHERE user_id = ?", [userId]);
    await query("DELETE FROM users WHERE id = ?", [userId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { username, avatar, banner, password, is_admin } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

		let queryStr = "UPDATE users SET username = ?, avatar = ?, banner = ?, is_admin = ?";
		let queryParams = [username || null, avatar || null, banner || null, is_admin === undefined ? false : is_admin];

    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      queryStr += ", password = ?";
      queryParams.push(hash);
    }

    queryStr += " WHERE id = ?";
    queryParams.push(id);

    await query(queryStr, queryParams);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
