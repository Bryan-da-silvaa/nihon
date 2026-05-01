import { NextResponse } from "next/server";
import { query, initDb } from "../../../lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) return NextResponse.json({ error: "api.unauthorized" }, { status: 401 });

    await initDb();
    const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return NextResponse.json({ error: "api.userNotFound" }, { status: 404 });
    }
    
    // Fetch basic user
    const { password, ...userWithoutPassword } = users[0];

    // Fetch total time spent
    const timeRows = await query('SELECT SUM(duration_seconds) as total_time FROM game_sessions WHERE user_id = ?', [userId]);
    const totalTime = timeRows[0]?.total_time || 0;

    // Fetch recent games (last 10)
    const recentGames = await query('SELECT * FROM game_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', [userId]);

    // Fetch strongest kanas (at least 3 attempts)
    const strongestKanas = await query(`
      SELECT kana, attempts, correct, (correct / attempts * 100) as ratio 
      FROM kana_stats 
      WHERE user_id = ? AND attempts >= 3 
      ORDER BY ratio DESC, attempts DESC 
      LIMIT 5
    `, [userId]);

    // Fetch weakest kanas (at least 3 attempts)
    const weakestKanas = await query(`
      SELECT kana, attempts, correct, (correct / attempts * 100) as ratio 
      FROM kana_stats 
      WHERE user_id = ? AND attempts >= 3 
      ORDER BY ratio ASC, attempts DESC 
      LIMIT 5
    `, [userId]);

    // Calculate Global Accuracy from game_sessions
    const accuracyRow = await query('SELECT SUM(score) as total_score, SUM(total) as total_questions FROM game_sessions WHERE user_id = ?', [userId]);
    let globalAccuracy = 0;
    if (accuracyRow[0] && accuracyRow[0].total_questions > 0) {
      globalAccuracy = Math.round((accuracyRow[0].total_score / accuracyRow[0].total_questions) * 100);
    }

    // Count Mastered Kanas (>= 80% accuracy, min 3 attempts)
    const masteredRow = await query(`
      SELECT COUNT(*) as count 
      FROM kana_stats 
      WHERE user_id = ? AND attempts >= 3 AND (correct / attempts) >= 0.8
    `, [userId]);
    const masteredCount = masteredRow[0]?.count || 0;

    // Fetch ALL kana stats for the mastery heatmap
    const allKanaStats = await query(`
      SELECT kana, attempts, correct, (correct / attempts * 100) as ratio 
      FROM kana_stats 
      WHERE user_id = ?
    `, [userId]);

    // Fetch extended history (up to 50 games)
    const allRecentGames = await query('SELECT * FROM game_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [userId]);

    return NextResponse.json({
      ...userWithoutPassword,
      learning_strategy: userWithoutPassword.learning_strategy || "balanced",
      session_intensity: userWithoutPassword.session_intensity || "standard",
      aivis_speaker_id: userWithoutPassword.aivis_speaker_id || 888753760,
      total_time: totalTime,
      recent_games: recentGames,
      strongest_kanas: strongestKanas,
      weakest_kanas: weakestKanas,
      global_accuracy: globalAccuracy,
      mastered_count: masteredCount,
      all_kana_stats: allKanaStats,
      all_recent_games: allRecentGames
    });
  } catch (error) {
    return NextResponse.json({ error: "api.dbConnection" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { userId, username, avatar, kanji, reading, learningStrategy, sessionIntensity, aivisSpeakerId } = await request.json();

    if (!userId) return NextResponse.json({ error: "api.unauthorized" }, { status: 401 });
    await initDb();

    // On vérifie que le nouveau pseudo n'est pas pris
    const existing = await query('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
    if (existing.length > 0) {
      return NextResponse.json({ error: "api.usernameTaken" }, { status: 400 });
    }

    const safeLearningStrategy = ["balanced", "review", "foundation", "weak"].includes(learningStrategy)
      ? learningStrategy
      : "balanced";
    const safeSessionIntensity = ["focused", "standard", "intensive"].includes(sessionIntensity)
      ? sessionIntensity
      : "standard";
    const parsedSpeakerId = Number.parseInt(String(aivisSpeakerId ?? "888753760"), 10);
    const safeAivisSpeakerId = Number.isFinite(parsedSpeakerId) && parsedSpeakerId > 0 ? parsedSpeakerId : 888753760;

    // Mettre à jour username, avatar, kanji, reading et préférences pédagogiques
    await query(
      "UPDATE users SET username = ?, avatar = ?, kanji = ?, reading = ?, learning_strategy = ?, session_intensity = ?, aivis_speaker_id = ? WHERE id = ?",
      [username, avatar, kanji, reading, safeLearningStrategy, safeSessionIntensity, safeAivisSpeakerId, userId]
    );

    return NextResponse.json({
      success: true,
      username,
      avatar,
      kanji,
      reading,
      learning_strategy: safeLearningStrategy,
      session_intensity: safeSessionIntensity,
      aivis_speaker_id: safeAivisSpeakerId,
    });
  } catch (error) {
    return NextResponse.json({ error: "api.updateError" }, { status: 500 });
  }
}
