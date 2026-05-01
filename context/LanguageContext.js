"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import fr from '../locales/fr.json';
import ja from '../locales/ja.json';
import Ruby from '../components/Ruby';
import defaultFuriganaMap from '../data/furigana.json';

const LanguageContext = createContext();

const translations = {
  fr,
  ja
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("fr");
  const [furiganaMap, setFuriganaMap] = useState(defaultFuriganaMap);

  useEffect(() => {
    const savedLang = localStorage.getItem("app_lang");
    if (savedLang && translations[savedLang]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguage(savedLang);
    }
  }, []);

  // Load fresh furigana data from API
  const refreshFurigana = useCallback(async () => {
    try {
      const res = await fetch('/api/furigana');
      if (res.ok) {
        const data = await res.json();
        setFuriganaMap(data);
      }
    } catch (_) {}
  }, []);

  // Fetch fresh furigana on mount
  useEffect(() => {
    refreshFurigana();
  }, [refreshFurigana]);

  const changeLanguage = (newLang) => {
    if (translations[newLang]) {
      setLanguage(newLang);
      localStorage.setItem('app_lang', newLang);
    }
  };

  // Helper function to get nested translation keys like 'home.title'
  const t = (path) => {
    const keys = path.split('.');
    let result = translations[language];
    for (const key of keys) {
      if (result && result[key] !== undefined) {
        result = result[key];
      } else {
        return path; // Return the path itself if not found
      }
    }
    return result;
  };

  // Helper function for translations with variables like 'score.resultText'
  const tWithVars = (path, vars) => {
    let text = t(path);
    if (typeof text === 'string') {
      Object.keys(vars).forEach(key => {
        text = text.replace(`{${key}}`, vars[key]);
      });
    }
    return text;
  };

  // Helper to check if string contains kanji
  const hasKanji = (str) => /[\u4E00-\u9FFF]/.test(str);

  // Return a React node where kanji is converted to <Ruby /> components
  // Uses greedy left-to-right matching on furiganaMap
  // Only adds furigana for words that contain kanji
  const tNode = (path) => {
    const raw = t(path);
    if (language !== 'ja' || typeof raw !== 'string') return raw;

    const mapKeys = Object.keys(furiganaMap || {}).filter(key => hasKanji(key));
    if (mapKeys.length === 0) return raw;

    // Sort by descending length for greedy matching (longest first)
    mapKeys.sort((a, b) => b.length - a.length);

    const parts = [];
    let i = 0;

    while (i < raw.length) {
      let matched = false;

      // Try to match each kanji word starting at position i
      for (const key of mapKeys) {
        if (raw.substr(i, key.length) === key) {
          // Found a match - add Ruby component
          parts.push(<Ruby key={`${i}-${key}`} base={key} reading={furiganaMap[key]} />);
          i += key.length;
          matched = true;
          break;
        }
      }

      // If no match, add single character as text
      if (!matched) {
        parts.push(raw[i]);
        i++;
      }
    }

    // Return either single element or fragment with multiple elements
    return parts.length === 0 ? raw : parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, tWithVars, tNode, refreshFurigana }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
