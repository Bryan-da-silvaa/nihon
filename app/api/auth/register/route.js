import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { username, password, avatar } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Veuillez remplir tous les champs obligatoires" }, { status: 400 });
    }

    const existingUsers = await query('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "Ce nom d'utilisateur est déjà pris" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userAvatar = avatar || null;

    await query('INSERT INTO users (username, password, avatar) VALUES (?, ?, ?)', [username, hashedPassword, userAvatar]);

    const newUser = await query('SELECT id, username, avatar FROM users WHERE username = ?', [username]);
    
    return NextResponse.json({ success: true, user: newUser[0] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur lors de l'inscription" }, { status: 500 });
  }
}
