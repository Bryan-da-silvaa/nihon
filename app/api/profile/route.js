import { NextResponse } from "next/server";
import { query } from "../../../lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) return NextResponse.json({ error: "api.unauthorized" }, { status: 401 });

    const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return NextResponse.json({ error: "api.userNotFound" }, { status: 404 });
    }
    
    // On ne renvoie pas le mot de passe
    const { password, ...userWithoutPassword } = users[0];
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    return NextResponse.json({ error: "api.dbConnection" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { userId, username, avatar, kanji, reading } = await request.json();

    if (!userId) return NextResponse.json({ error: "api.unauthorized" }, { status: 401 });

    // On vérifie que le nouveau pseudo n'est pas pris
    const existing = await query('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
    if (existing.length > 0) {
      return NextResponse.json({ error: "api.usernameTaken" }, { status: 400 });
    }

    // Mettre à jour username, avatar, kanji et reading
    await query('UPDATE users SET username = ?, avatar = ?, kanji = ?, reading = ? WHERE id = ?', [username, avatar, kanji, reading, userId]);

    return NextResponse.json({ success: true, username, avatar, kanji, reading });
  } catch (error) {
    return NextResponse.json({ error: "api.updateError" }, { status: 500 });
  }
}
