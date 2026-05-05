import { NextResponse } from 'next/server';
import { query, initDb } from '../../../../lib/db';
import { getKanaDeck } from '../../../../lib/kana';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        await initDb();

        // 1. Get user's current progress
        const statsRows = await query(
            `SELECT kana FROM kana_stats WHERE user_id = ?`,
            [parseInt(userId, 10)]
        );
        const learnedKana = new Set(statsRows.map(r => r.kana));

        // 2. Get full deck in learning order
        // We prioritize Hiragana first
        const hDeck = getKanaDeck('hiragana');
        const kDeck = getKanaDeck('katakana');

        let nextItems = [];

        // Check Hiragana first
        for (const item of hDeck) {
            if (!learnedKana.has(item.kana)) {
                nextItems.push(item);
                if (nextItems.length >= 5) break;
            }
        }

        // If we still need items, check Katakana
        if (nextItems.length < 5) {
            for (const item of kDeck) {
                if (!learnedKana.has(item.kana)) {
                    nextItems.push(item);
                    if (nextItems.length >= 5) break;
                }
            }
        }

        return NextResponse.json({ 
            nextItems,
            mode: nextItems.length > 0 && hDeck.some(h => nextItems.some(n => n.kana === h.kana)) ? 'hiragana' : 'katakana'
        });
    } catch (error) {
        console.error("Next learning error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
