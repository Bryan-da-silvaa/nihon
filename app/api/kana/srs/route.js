import { NextResponse } from "next/server";
import { query, initDb } from "../../../../lib/db";
import { getKanaDeck, normalizeKanaMode, shuffleDeck } from "../../../../lib/kana";

function uniqueByKana(deck) {
  const seen = new Set();
  return deck.filter((item) => {
    if (seen.has(item.kana)) {
      return false;
    }
    seen.add(item.kana);
    return true;
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildBucket(card, now) {
  const attempts = card.attempts || 0;
  const correct = card.correct || 0;
  const accuracy = attempts > 0 ? correct / attempts : 0;
  const dueAt = card.srs_next_review ? new Date(card.srs_next_review) : null;
  const isDue = !dueAt || Number.isNaN(dueAt.getTime()) || dueAt <= now;
  const repetitions = card.srs_repetition || 0;

  if (attempts === 0) {
    return "new";
  }

  if (isDue) {
    return repetitions >= 3 && accuracy >= 0.85 ? "mastered_due" : "due";
  }

  if (accuracy < 0.65 || (card.srs_lapses || 0) > 0) {
    return "weak";
  }

  if (repetitions >= 3 && accuracy >= 0.85) {
    return "mastered";
  }

  return "learning";
}

function getStrategyTargets(strategy, limit) {
  if (strategy === "due_only") {
    return {
      due: limit,
      weak: 0,
      fresh: 0,
      strict: true, // New flag for strict filtering
    };
  }

  if (strategy === "review") {
    return {
      due: clamp(Math.ceil(limit * 0.7), 1, limit),
      weak: clamp(Math.ceil(limit * 0.25), 0, limit),
      fresh: clamp(Math.ceil(limit * 0.05), 0, limit),
    };
  }

  if (strategy === "foundation") {
    return {
      due: clamp(Math.ceil(limit * 0.2), 0, limit),
      weak: clamp(Math.ceil(limit * 0.3), 0, limit),
      fresh: clamp(Math.ceil(limit * 0.5), 1, limit),
    };
  }

  if (strategy === "weak") {
    return {
      due: clamp(Math.ceil(limit * 0.35), 0, limit),
      weak: clamp(Math.ceil(limit * 0.55), 1, limit),
      fresh: clamp(Math.ceil(limit * 0.1), 0, limit),
    };
  }

  return {
    due: clamp(Math.ceil(limit * 0.55), 1, limit),
    weak: clamp(Math.ceil(limit * 0.3), 0, limit),
    fresh: clamp(Math.ceil(limit * 0.15), 0, limit),
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = clamp(parseInt(searchParams.get("limit") || "12", 10) || 12, 1, 500);
    const scope = normalizeKanaMode(searchParams.get("scope") || "both");
    const strategy = searchParams.get("strategy") || "balanced";
    const include = searchParams.get("include") || "";

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    await initDb();

    const selectedKana = include
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const selectedKanaSet = new Set(selectedKana);

    const deck = uniqueByKana(getKanaDeck(scope)).filter((item) => (
      selectedKanaSet.size === 0 ? true : selectedKanaSet.has(item.kana)
    ));
    const statsRows = await query(
      `SELECT kana, attempts, correct, srs_interval, srs_repetition, srs_ease_factor, srs_next_review, srs_streak, srs_lapses, srs_last_quality
       FROM kana_stats
       WHERE user_id = ?`,
      [parseInt(userId, 10)]
    );

    const statsByKana = new Map(statsRows.map((row) => [row.kana, row]));
    const now = new Date();

    const cards = deck.map((item) => {
      const stats = statsByKana.get(item.kana) || null;
      const bucket = stats ? buildBucket(stats, now) : "new";
      const attempts = stats?.attempts || 0;
      const correct = stats?.correct || 0;

      return {
        ...item,
        reviewType: bucket,
        mastery: attempts > 0 ? Number((correct / attempts).toFixed(2)) : 0,
        attempts,
        correct,
        srs: stats
          ? {
              interval: stats.srs_interval || 0,
              repetition: stats.srs_repetition || 0,
              easeFactor: stats.srs_ease_factor || 2.5,
              nextReview: stats.srs_next_review,
              streak: stats.srs_streak || 0,
              lapses: stats.srs_lapses || 0,
              lastQuality: stats.srs_last_quality,
            }
          : null,
      };
    });

    const due = shuffleDeck(cards.filter((card) => card.reviewType === "due" || card.reviewType === "mastered_due"));
    const weak = shuffleDeck(cards.filter((card) => card.reviewType === "weak" || card.reviewType === "learning"));
    const mastered = shuffleDeck(cards.filter((card) => card.reviewType === "mastered"));
    const fresh = shuffleDeck(cards.filter((card) => card.reviewType === "new"));

    const targets = getStrategyTargets(strategy, limit);

    const sessionCards = [];

    // 1. Fill with Due cards (up to limit)
    sessionCards.push(...due.slice(0, limit));

    // 2. Fill with Weak cards (up to limit)
    if (!targets.strict && sessionCards.length < limit) {
      const needed = limit - sessionCards.length;
      sessionCards.push(...weak.slice(0, needed));
    }

    // 3. Fill with Fresh cards (up to limit)
    if (!targets.strict && sessionCards.length < limit) {
      const needed = limit - sessionCards.length;
      sessionCards.push(...fresh.slice(0, needed));
    }

    // 4. Fill with Mastered cards (up to limit)
    if (!targets.strict && sessionCards.length < limit) {
      const needed = limit - sessionCards.length;
      sessionCards.push(...mastered.slice(0, needed));
    }

    const finalCards = sessionCards;

    const summary = {
      scope,
      available: cards.length,
      due: due.length,
      weak: weak.length,
      new: fresh.length,
      mastered: mastered.length,
      strategy,
      targets,
      limit,
      planned: finalCards.length,
    };

    return NextResponse.json({ cards: finalCards, summary });
  } catch (error) {
    console.error("SRS fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch SRS kana" }, { status: 500 });
  }
}
