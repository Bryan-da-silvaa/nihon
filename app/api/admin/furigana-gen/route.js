import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';

export async function POST() {
  try {
    const JA_PATH = path.join(process.cwd(), 'locales', 'ja.json');
    const FURIGANA_PATH = path.join(process.cwd(), 'data', 'furigana.json');

    // 1. Initialize Kuroshiro
    const kuroshiro = new Kuroshiro();
    await kuroshiro.init(new KuromojiAnalyzer());

    // 2. Read ja.json
    const jaRaw = fs.readFileSync(JA_PATH, 'utf8');
    const ja = JSON.parse(jaRaw);

    function collectStrings(obj) {
      const strings = [];
      if (typeof obj === 'string') {
        strings.push(obj);
      } else if (typeof obj === 'object' && obj !== null) {
        for (const val of Object.values(obj)) {
          strings.push(...collectStrings(val));
        }
      }
      return strings;
    }

    const allStrings = collectStrings(ja);
    const hasKanji = (str) => /[\u4E00-\u9FFF]/.test(str);
    const kanjiStrings = allStrings.filter(hasKanji);

    // 3. Manual Overrides
    const OVERRIDES = {
      '仮名': 'かな',
      '日本': 'にほん',
      '編集': 'へんしゅう',
      '正しく': 'ただしく',
      '読': 'よ',
      '込': 'こ',
      '戻': 'もど',
      '残': 'のこ',
      '語': 'ご',
    };

    const EXCLUDE_LIST = new Set(['フランス語', 'ローマ字']);

    // 4. Tokenize and Map
    const furiganaMap = {};
    for (const text of kanjiStrings) {
      const tokens = await kuroshiro._analyzer.parse(text);
      for (const token of tokens) {
        const surface = token.surface_form;
        if (!hasKanji(surface) || EXCLUDE_LIST.has(surface) || surface.length === 1) continue;
        
        let reading = token.reading;
        if (!reading) continue;
        
        reading = Kuroshiro.Util.kanaToHiragna(reading);
        if (surface === reading) continue;
        
        if (!furiganaMap[surface]) furiganaMap[surface] = reading;
      }
    }

    // Apply Overrides
    for (const [kanji, reading] of Object.entries(OVERRIDES)) {
      furiganaMap[kanji] = reading;
    }

    // Sort by length descending
    const sortedMap = {};
    const sortedKeys = Object.keys(furiganaMap).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      sortedMap[key] = furiganaMap[key];
    }

    // Write back to data/furigana.json
    fs.writeFileSync(FURIGANA_PATH, JSON.stringify(sortedMap, null, '  ') + '\n', 'utf8');

    return NextResponse.json({ success: true, count: Object.keys(sortedMap).length });
  } catch (error) {
    console.error("Furigana Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate furigana" }, { status: 500 });
  }
}
