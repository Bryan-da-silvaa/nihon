import Hiragana from "../data/Hiragana.json";
import Katakana from "../data/Katakana.json";

const DECKS = {
  hiragana: Hiragana,
  katakana: Katakana,
  both: [...Hiragana, ...Katakana],
};

function getScriptWeight(kana) {
  if (!kana) return 2;
  const code = kana.codePointAt(0) || 0;
  if (code >= 0x3040 && code <= 0x309f) return 0;
  if (code >= 0x30a0 && code <= 0x30ff) return 1;
  return 2;
}

function getFallbackRowKey(romaji) {
  if (romaji === "a" || romaji === "i" || romaji === "u" || romaji === "e" || romaji === "o") return "vowel";
  if (romaji === "n" || romaji === "wa" || romaji === "wo") return "w";
  if (["shi", "sa", "su", "se", "so"].includes(romaji)) return "s";
  if (["ji", "za", "zu", "ze", "zo"].includes(romaji)) return "z";
  if (["chi", "tsu", "ta", "te", "to"].includes(romaji)) return "t";
  if (["di", "du", "da", "de", "do"].includes(romaji)) return "d";
  if (["fu", "ha", "hi", "he", "ho"].includes(romaji)) return "h";
  const char = (romaji || "")[0];
  if (char === "k" || char === "g" || char === "n" || char === "b" || char === "p" || char === "m" || char === "y" || char === "r") {
    return char;
  }
  return "other";
}

function getFallbackColumnRank(romaji) {
  if (romaji === "n") return 4;
  if ((romaji || "").endsWith("a")) return 0;
  if ((romaji || "").endsWith("i")) return 1;
  if ((romaji || "").endsWith("u")) return 2;
  if ((romaji || "").endsWith("e")) return 3;
  if ((romaji || "").endsWith("o")) return 4;
  return 99;
}

function getFallbackFamilyKey(rowKey) {
  if (rowKey === "g") return "k";
  if (rowKey === "z") return "s";
  if (rowKey === "d") return "t";
  if (rowKey === "b" || rowKey === "p") return "h";
  return rowKey;
}

const ROW_ORDER = ["vowel", "k", "g", "s", "z", "t", "d", "n", "h", "b", "p", "m", "y", "r", "w", "other"];
const ROW_ORDER_INDEX = new Map(ROW_ORDER.map((rowKey, rank) => [rowKey, rank]));

function getRowKey(itemOrRomaji) {
  if (typeof itemOrRomaji === "object" && itemOrRomaji !== null) {
    return itemOrRomaji.rowKey || getFallbackRowKey(itemOrRomaji.romaji || "");
  }
  return getFallbackRowKey(itemOrRomaji || "");
}

function getColumnRank(itemOrRomaji) {
  if (typeof itemOrRomaji === "object" && itemOrRomaji !== null) {
    return Number.isInteger(itemOrRomaji.columnRank)
      ? itemOrRomaji.columnRank
      : getFallbackColumnRank(itemOrRomaji.romaji || "");
  }
  return getFallbackColumnRank(itemOrRomaji || "");
}

function getRowRank(item) {
  if (Number.isInteger(item.rowRank)) {
    return item.rowRank;
  }
  return ROW_ORDER_INDEX.get(getRowKey(item)) ?? 999;
}

function getFamilyKey(item) {
  if (item.familyKey) {
    return item.familyKey;
  }
  return getFallbackFamilyKey(getRowKey(item));
}

export function getKanaLineGroups(deck) {
  const rowsByFamily = new Map();

  for (const item of deck) {
    const familyKey = getFamilyKey(item);
    const rowKey = getRowKey(item);
    const rowRank = getRowRank(item);

    if (!rowsByFamily.has(familyKey)) {
      rowsByFamily.set(familyKey, new Map());
    }
    const rowMap = rowsByFamily.get(familyKey);

    if (!rowMap.has(rowKey)) {
      rowMap.set(rowKey, rowRank);
    }
  }

  return Array.from(rowsByFamily.entries())
    .map(([familyKey, rowMap]) => {
      const rows = Array.from(rowMap.entries())
        .sort((left, right) => left[1] - right[1])
        .map(([rowKey]) => rowKey);

      const firstRank = Math.min(...Array.from(rowMap.values()));

      return {
        id: familyKey,
        rows,
        rank: firstRank,
      };
    })
    .sort((left, right) => left.rank - right.rank)
    .map(({ id, rows }) => ({ id, rows }));
}

export function getKanaRowKey(romaji) {
  return getRowKey(romaji);
}

export function getKanaColumnIndex(romaji) {
  return getColumnRank(romaji);
}

function orderDeckForLearning(deck) {
  return [...deck].sort((left, right) => {
    const leftRowIndex = getRowRank(left);
    const rightRowIndex = getRowRank(right);

    if (leftRowIndex !== rightRowIndex) {
      return leftRowIndex - rightRowIndex;
    }

    const leftColumn = getColumnRank(left);
    const rightColumn = getColumnRank(right);

    if (leftColumn !== rightColumn) {
      return leftColumn - rightColumn;
    }

    const leftScript = getScriptWeight(left.kana);
    const rightScript = getScriptWeight(right.kana);

    if (leftScript !== rightScript) {
      return leftScript - rightScript;
    }

    return left.kana.localeCompare(right.kana);
  });
}

export function normalizeKanaMode(mode) {
  if (mode === "hiragana" || mode === "katakana" || mode === "both") {
    return mode;
  }

  return "both";
}

export function getKanaDeck(mode) {
  return orderDeckForLearning(DECKS[normalizeKanaMode(mode)] || DECKS.both);
}

export function shuffleDeck(deck) {
  const copy = [...deck];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function validateKanaMetadata() {
  const missingMetadata = DECKS.both
    .filter((item) => !item.rowKey || !item.familyKey || !Number.isInteger(item.rowRank) || !Number.isInteger(item.columnRank))
    .map((item) => item.romaji);

  if (missingMetadata.length > 0) {
    console.warn("[kana-schema] Missing metadata in kana JSON for:", missingMetadata.join(", "));
  }
}

validateKanaMetadata();
