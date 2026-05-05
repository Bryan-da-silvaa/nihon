import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
        return NextResponse.json({ error: "No search query provided" }, { status: 400 });
    }

    try {
        let results = [];
        try {
            const sql = `
                SELECT 
                    d.id,
                    d.part_of_speech,
                    (SELECT JSON_ARRAYAGG(kanji) FROM dictionary_kanji dk WHERE dk.dict_id = d.id) AS kanjitexts,
                    (SELECT JSON_ARRAYAGG(kana) FROM dictionary_kana dka WHERE dka.dict_id = d.id) AS kanatexts,
                    (SELECT JSON_ARRAYAGG(meaning) FROM dictionary_meaning dm WHERE dm.dict_id = d.id) AS meanings
                FROM dictionary d
                WHERE d.id IN (
                    SELECT dict_id FROM dictionary_kanji WHERE kanji = ?
                    UNION
                    SELECT dict_id FROM dictionary_kana WHERE kana = ?
                )
                LIMIT 5;
            `;
            results = await query(sql, [q, q]);
        } catch (dbErr) {
            console.warn("Dictionary tables missing or query failed, attempting fallbacks...");
        }

        const parseJSON = (val) => {
            if (!val) return [];
            if (typeof val === 'string') {
                try { return JSON.parse(val); } catch (e) { return [val]; }
            }
            return Array.isArray(val) ? val : [val];
        };

        let formattedResults = results.map(row => ({
            id: row.id,
            kanji: parseJSON(row.kanjitexts),
            kana: parseJSON(row.kanatexts),
            meanings: parseJSON(row.meanings),
            partOfSpeech: row.part_of_speech ? (typeof row.part_of_speech === 'string' ? JSON.parse(row.part_of_speech) : row.part_of_speech) : []
        }));

        if (formattedResults.length === 0) {
            // Fallback 1: Kanji data if it's a single character
            if (q.length === 1) {
                const kanjiResults = await query(
                    `SELECT literal, meanings_en, meanings_fr, readings_on, readings_kun 
                     FROM kanji_data WHERE literal = ?`,
                    [q]
                );
                
                if (kanjiResults.length > 0) {
                    const k = kanjiResults[0];
                    formattedResults = [{
                        id: `kanji_${k.literal}`,
                        kanji: [k.literal],
                        kana: [...parseJSON(k.readings_on), ...parseJSON(k.readings_kun)],
                        meanings: parseJSON(k.meanings_fr).length > 0 ? parseJSON(k.meanings_fr) : parseJSON(k.meanings_en),
                        partOfSpeech: ["Kanji"]
                    }];
                }
            }

            // Fallback 2: Prefix search if still no results
            if (formattedResults.length === 0) {
                try {
                    const fallbackSql = `
                        SELECT 
                            d.id,
                            d.part_of_speech,
                            (SELECT JSON_ARRAYAGG(kanji) FROM dictionary_kanji dk WHERE dk.dict_id = d.id) AS kanjitexts,
                            (SELECT JSON_ARRAYAGG(kana) FROM dictionary_kana dka WHERE dka.dict_id = d.id) AS kanatexts,
                            (SELECT JSON_ARRAYAGG(meaning) FROM dictionary_meaning dm WHERE dm.dict_id = d.id) AS meanings
                        FROM dictionary d
                        WHERE d.id IN (
                            SELECT dict_id FROM dictionary_kanji WHERE kanji LIKE ?
                            UNION
                            SELECT dict_id FROM dictionary_kana WHERE kana LIKE ?
                        )
                        LIMIT 3;
                    `;
                    const fallbackResults = await query(fallbackSql, [`${q}%`, `${q}%`]);
                    
                    formattedResults = fallbackResults.map(row => ({
                         id: row.id,
                         kanji: parseJSON(row.kanjitexts),
                         kana: parseJSON(row.kanatexts),
                         meanings: parseJSON(row.meanings),
                         partOfSpeech: row.part_of_speech ? (typeof row.part_of_speech === 'string' ? JSON.parse(row.part_of_speech) : row.part_of_speech) : []
                    }));
                } catch (fallbackErr) {
                    console.warn("Prefix search fallback failed (likely missing tables).");
                }
            }
        }

        return NextResponse.json({ results: formattedResults });

    } catch (error) {
        console.error("Dictionary search error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}