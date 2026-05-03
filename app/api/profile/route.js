import { NextResponse } from "next/server";
import { query, initDb } from "@/lib/db";

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
      SELECT kana, attempts, correct, COALESCE(correct / attempts * 100, 0) as ratio 
      FROM kana_stats 
      WHERE user_id = ? AND attempts >= 3 
      ORDER BY ratio DESC, attempts DESC 
      LIMIT 5
    `, [userId]);

    // Fetch weakest kanas (at least 3 attempts)
    const weakestKanas = await query(`
      SELECT kana, attempts, correct, COALESCE(correct / attempts * 100, 0) as ratio 
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

    // SRS Stages Distribution
    const srsDistribution = await query(`
      SELECT 
        CASE 
          WHEN attempts = 0 THEN 'new'
          WHEN srs_repetition BETWEEN 1 AND 3 THEN 'apprentice'
          WHEN srs_repetition BETWEEN 4 AND 6 THEN 'guru'
          WHEN srs_repetition BETWEEN 7 AND 8 THEN 'master'
          WHEN srs_repetition BETWEEN 9 AND 10 THEN 'enlightened'
          WHEN srs_repetition >= 11 THEN 'burned'
          ELSE 'new'
        END as stage,
        COUNT(*) as count
      FROM kana_stats
      WHERE user_id = ?
      GROUP BY stage
    `, [userId]);

    // Due for Review Count
    const dueRow = await query(`
      SELECT COUNT(*) as count
      FROM kana_stats
      WHERE user_id = ? AND srs_next_review <= NOW()
    `, [userId]);
    const dueCount = dueRow[0]?.count || 0;

    // Fetch ALL kana stats for the mastery heatmap
    const allKanaStats = await query(`
      SELECT kana, attempts, correct, COALESCE(correct / attempts * 100, 0) as ratio 
      FROM kana_stats 
      WHERE user_id = ?
    `, [userId]);

    // Fetch extended history (up to 50 games)
    const allRecentGames = await query('SELECT * FROM game_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [userId]);

    return NextResponse.json({
      ...userWithoutPassword,
      learning_strategy: userWithoutPassword.learning_strategy || "balanced",
      session_intensity: userWithoutPassword.session_intensity || "standard",
      language: userWithoutPassword.language || "fr",
      dark_mode: userWithoutPassword.dark_mode !== undefined ? Boolean(userWithoutPassword.dark_mode) : true,
      require_voice_answer: userWithoutPassword.require_voice_answer !== undefined ? Boolean(userWithoutPassword.require_voice_answer) : false,
      use_timer: userWithoutPassword.use_timer !== undefined ? Boolean(userWithoutPassword.use_timer) : false,
      time_limit: userWithoutPassword.time_limit || 60,
      last_setup_mode: userWithoutPassword.last_setup_mode || "both",
      last_setup_selection: typeof userWithoutPassword.last_setup_selection === 'string' 
        ? JSON.parse(userWithoutPassword.last_setup_selection) 
        : userWithoutPassword.last_setup_selection,
      total_time: totalTime,
      recent_games: recentGames,
      strongest_kanas: strongestKanas,
      weakest_kanas: weakestKanas,
      global_accuracy: globalAccuracy,
      mastered_count: masteredCount,
      all_kana_stats: allKanaStats,
      all_recent_games: allRecentGames,
      srs_distribution: srsDistribution,
      due_count: dueCount
    });
  } catch (error) {
    return NextResponse.json({ error: "api.dbConnection" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { userId, username, avatar, banner, kanji, reading, learningStrategy, sessionIntensity } = await request.json();

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

    // Mettre à jour username, avatar, banner, kanji, reading et préférences pédagogiques
    await query(
      "UPDATE users SET username = ?, avatar = ?, banner = ?, kanji = ?, reading = ?, learning_strategy = ?, session_intensity = ? WHERE id = ?",
      [username, avatar, banner, kanji, reading, safeLearningStrategy, safeSessionIntensity, userId]
    );

    return NextResponse.json({
      success: true,
      username,
      avatar,
      banner,
      kanji,
      reading,
      learning_strategy: safeLearningStrategy,
      session_intensity: safeSessionIntensity,
    });
  } catch (error) {
    return NextResponse.json({ error: "api.updateError" }, { status: 500 });
  }
}
