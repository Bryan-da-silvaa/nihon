import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { username, password, avatar } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "api.requiredFields" }, { status: 400 });
    }

    const existingUsers = await query('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "api.usernameTaken" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userAvatar = avatar || null;

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await query('INSERT INTO users (username, password, avatar, created_at) VALUES (?, ?, ?, ?)', [username, hashedPassword, userAvatar, now]);

    const newUser = await query('SELECT * FROM users WHERE username = ?', [username]);
    const { password: _, ...userWithoutPassword } = newUser[0];
    
    return NextResponse.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "api.serverRegister" }, { status: 500 });
  }
}
