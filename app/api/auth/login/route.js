import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "api.enterCredentials" }, { status: 400 });
    }

    const users = await query('SELECT * FROM users WHERE username = ?', [username]);
    
    if (users.length === 0) {
      return NextResponse.json({ error: "api.userNotFound" }, { status: 404 });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json({ error: "api.invalidPassword" }, { status: 401 });
    }

    // Le mot de passe est bon, on renvoie les infos de l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ success: true, user: userWithoutPassword });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "api.serverLogin" }, { status: 500 });
  }
}
