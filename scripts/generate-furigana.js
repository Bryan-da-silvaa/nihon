/**
 * generate-furigana.js
 * 
 * Scans locales/ja.json, extracts all kanji words using kuroshiro + kuromoji,
 * and regenerates data/furigana.json automatically.
 * 
 * Features:
 * - Uses kuromoji tokenizer for proper word-level analysis
 * - Manual overrides for ambiguous words (kanji with multiple readings)
 * - Filters out single-character entries and non-kanji tokens
 * - Sorted by descending key length for greedy matching
 * 
 * Usage:  node scripts/generate-furigana.js
 */

const fs = require('fs');
const path = require('path');
const Kuroshiro = require('kuroshiro').default;
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji');

// ── Paths ──────────────────────────────────────────────
const JA_PATH = path.join(__dirname, '../locales/ja.json');
const FURIGANA_PATH = path.join(__dirname, '../data/furigana.json');

// ── Manual overrides for ambiguous words ───────────────
// Kuromoji sometimes picks the wrong reading for words with multiple
// pronunciations. Add corrections here.
const OVERRIDES = {
  '仮名': 'かな',        // not かめい (surname)
  '日本': 'にほん',      // not にっぽん (both correct, にほん preferred here)
  '編集': 'へんしゅう',   // ensure correct reading
  '正しく': 'ただしく',
  '読': 'よ',
  '込': 'こ',
  '戻': 'もど',
  '残': 'のこ',
  '語': 'ご',
};

// ── Words to EXCLUDE from furigana.json ────────────────
// Single kanji that appear as parts of compound words and would
// interfere with the greedy matcher when standalone.
const EXCLUDE_SINGLE_KANJI = true;   // filter out single-character entries
const MIN_KANJI_LENGTH = 1;          // minimum surface length (kanji chars only) to include

// Entries that should never be in the map (katakana-only, etc.)
const EXCLUDE_LIST = new Set([
  'フランス語',  // katakana + kanji, but furigana on フランス makes no sense
  'ローマ字',    // same
]);

// ── Helpers ────────────────────────────────────────────

function isKanji(char) {
  const code = char.charCodeAt(0);
  return (code >= 0x4E00 && code <= 0x9FFF) ||
         (code >= 0x3400 && code <= 0x4DBF);
}

function hasKanji(str) {
  return [...str].some(isKanji);
}

/** Count kanji characters in a string */
function kanjiCount(str) {
  return [...str].filter(isKanji).length;
}

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

// ── Main ───────────────────────────────────────────────

async function main() {
  console.log('🔄 Initializing Kuroshiro + Kuromoji...');
  const kuroshiro = new Kuroshiro();
  await kuroshiro.init(new KuromojiAnalyzer());
  console.log('✅ Kuroshiro ready.\n');

  // 1. Read ja.json
  const ja = JSON.parse(fs.readFileSync(JA_PATH, 'utf8'));
  const allStrings = collectStrings(ja);
  console.log(`📖 Found ${allStrings.length} strings in ja.json`);

  const kanjiStrings = allStrings.filter(hasKanji);
  console.log(`🔍 ${kanjiStrings.length} strings contain kanji\n`);

  // 2. Tokenize all strings and collect kanji words + readings
  const furiganaMap = {};

  for (const text of kanjiStrings) {
    try {
      const tokens = await kuroshiro._analyzer.parse(text);

      for (const token of tokens) {
        const surface = token.surface_form;

        // Skip if no kanji
        if (!hasKanji(surface)) continue;

        // Skip excluded words
        if (EXCLUDE_LIST.has(surface)) continue;

        // Skip single-character kanji (they create matching issues)
        if (EXCLUDE_SINGLE_KANJI && surface.length === 1) continue;

        // Get reading
        let reading = token.reading;
        if (!reading) continue;

        // Convert katakana reading → hiragana
        reading = Kuroshiro.Util.kanaToHiragna(reading);

        // Skip if surface equals reading (pure kana)
        if (surface === reading) continue;

        // Store (first occurrence wins, unless override exists)
        if (!furiganaMap[surface]) {
          furiganaMap[surface] = reading;
        }
      }
    } catch (err) {
      console.warn(`⚠️  Tokenize error: "${text.substring(0, 50)}…" — ${err.message}`);
    }
  }

  // 3. Apply manual overrides (always wins)
  for (const [kanji, reading] of Object.entries(OVERRIDES)) {
    furiganaMap[kanji] = reading;
  }

  // 4. Remove any excluded entries that slipped through
  for (const key of EXCLUDE_LIST) {
    delete furiganaMap[key];
  }

  // 5. Sort by descending key length (for greedy left-to-right matching)
  const sortedMap = {};
  const sortedKeys = Object.keys(furiganaMap).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    sortedMap[key] = furiganaMap[key];
  }

  // 6. Write output
  fs.writeFileSync(FURIGANA_PATH, JSON.stringify(sortedMap, null, '  ') + '\n', 'utf8');

  console.log(`✅ Generated ${Object.keys(sortedMap).length} entries in data/furigana.json\n`);

  // Print a preview
  console.log('📋 Preview:');
  const entries = Object.entries(sortedMap);
  for (const [kanji, reading] of entries.slice(0, 20)) {
    console.log(`   ${kanji} → ${reading}`);
  }
  if (entries.length > 20) {
    console.log(`   ... and ${entries.length - 20} more.`);
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
