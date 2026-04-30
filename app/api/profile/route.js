import { NextResponse } from "next/server";
import { query } from "../../../lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }
    
    // On ne renvoie pas le mot de passe
    const { password, ...userWithoutPassword } = users[0];
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    return NextResponse.json({ error: "Erreur de connexion à la base de données" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { userId, username, avatar } = await request.json();
    
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    // On vérifie que le nouveau pseudo n'est pas pris
    const existing = await query('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
    if (existing.length > 0) {
      return NextResponse.json({ error: "Ce pseudo est déjà pris" }, { status: 400 });
    }

    if (avatar !== undefined) {
      await query('UPDATE users SET username = ?, avatar = ? WHERE id = ?', [username, avatar, userId]);
    } else {
      await query('UPDATE users SET username = ? WHERE id = ?', [username, userId]);
    }
    
    return NextResponse.json({ success: true, username, avatar });
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}
