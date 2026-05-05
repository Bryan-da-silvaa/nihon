import { NextResponse } from "next/server";
import { query, initDb } from "../../../lib/db";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { userId, oldPassword, newPassword } = await request.json();

    if (!userId || !oldPassword || !newPassword) {
      return NextResponse.json({ error: "Tous les champs sont requis." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Le nouveau mot de passe doit faire au moins 6 caractères." }, { status: 400 });
    }

    await initDb();

    // 1. Fetch current password hash
    const users = await query("SELECT password FROM users WHERE id = ?", [userId]);
    if (users.length === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé." }, { status: 404 });
    }

    const currentHash = users[0].password;

    // 2. Compare old password
    const isMatch = await bcrypt.compare(oldPassword, currentHash);
    if (!isMatch) {
      return NextResponse.json({ error: "L'ancien mot de passe est incorrect." }, { status: 401 });
    }

    // 3. Hash new password
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    // 4. Update DB
    await query("UPDATE users SET password = ? WHERE id = ?", [newHash, userId]);

    return NextResponse.json({ success: true, message: "Mot de passe modifié avec succès." });
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 });
  }
}
