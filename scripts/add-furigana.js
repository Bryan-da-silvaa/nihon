const fs = require('fs');
const path = require('path');

// Read furigana mapping
const furiganaPath = path.join(__dirname, '../data/furigana.json');
const furiganaMap = JSON.parse(fs.readFileSync(furiganaPath, 'utf8'));

// Read Japanese translations
const jaPath = path.join(__dirname, '../locales/ja.json');
const ja = JSON.parse(fs.readFileSync(jaPath, 'utf8'));

// Function to check if a character is kanji (rough check: Unicode range for CJK Unified Ideographs)
function isKanji(char) {
  const code = char.charCodeAt(0);
  return (code >= 0x4E00 && code <= 0x9FFF) || // CJK Unified Ideographs
         (code >= 0x3400 && code <= 0x4DBF);   // CJK Extension A
}

// Function to check if a character is hiragana
function isHiragana(char) {
  const code = char.charCodeAt(0);
  return code >= 0x3040 && code <= 0x309F;
}

// Function to check if a character is katakana
function isKatakana(char) {
  const code = char.charCodeAt(0);
  return code >= 0x30A0 && code <= 0x30FF;
}

// Function to add furigana to text
function addFuriganaToText(text) {
  if (typeof text !== 'string') return text;
  
  // Sort by key length (longest first) for greedy matching
  const sortedKeys = Object.keys(furiganaMap)
    .filter(key => key.split('').some(isKanji)) // only kanji keys
    .sort((a, b) => b.length - a.length);
  
  // Greedy segmentation: scan left to right and match longest possible substring
  let result = '';
  let i = 0;
  
  while (i < text.length) {
    let matched = false;
    
    for (const key of sortedKeys) {
      if (text.substr(i, key.length) === key) {
        const reading = furiganaMap[key];
        result += `{ruby:${key}|${reading}}`;
        i += key.length;
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      result += text[i];
      i++;
    }
  }
  
  return result;
}

// Recursively add furigana to all values in object
function processObject(obj) {
  if (typeof obj === 'string') {
    return addFuriganaToText(obj);
  }
  if (typeof obj === 'object' && obj !== null) {
    const result = {};
    for (const key in obj) {
      result[key] = processObject(obj[key]);
    }
    return result;
  }
  return obj;
}

// Process the Japanese translations
const jaWithFurigana = processObject(ja);

// Write back to file
fs.writeFileSync(jaPath, JSON.stringify(jaWithFurigana, null, '\t'), 'utf8');
console.log('✓ Added furigana to locales/ja.json');
