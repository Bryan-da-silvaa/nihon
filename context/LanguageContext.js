"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
  const [systemSettings, setSystemSettings] = useState({ defaultAvatar: "" });

  useEffect(() => {
    const savedLang = localStorage.getItem("app_lang");
    if (savedLang && translations[savedLang]) {
      setLanguage(savedLang);
    }
  }, []);

  const refreshFurigana = useCallback(async () => {
    try {
      const res = await fetch('/api/furigana');
      if (res.ok) {
        const data = await res.json();
        setFuriganaMap(data);
      }
    } catch (_) {}
  }, []);

  const refreshSystemSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSystemSettings(data || { defaultAvatar: "" });
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    refreshFurigana();
    refreshSystemSettings();
  }, [refreshFurigana, refreshSystemSettings]);

  const changeLanguage = useCallback((newLang) => {
    if (translations[newLang]) {
      setLanguage(newLang);
      localStorage.setItem('app_lang', newLang);
    }
  }, []);

  const t = useCallback((path) => {
    const keys = path.split('.');
    let result = translations[language];
    for (const key of keys) {
      if (result && result[key] !== undefined) {
        result = result[key];
      } else {
        return path;
      }
    }
    return result;
  }, [language]);

  const tWithVars = useCallback((path, vars) => {
    let text = t(path);
    if (typeof text === 'string') {
      Object.keys(vars).forEach(key => {
        text = text.replace(`{${key}}`, vars[key]);
      });
    }
    return text;
  }, [t]);

  const tNode = useCallback((path) => {
    const raw = t(path);
    if (language !== 'ja' || typeof raw !== 'string') return raw;

    const parts = [];
    let i = 0;
    while (i < raw.length) {
      let matched = false;
      for (const kanji in furiganaMap) {
        if (raw.substring(i).startsWith(kanji)) {
          parts.push(<Ruby key={i} base={kanji} reading={furiganaMap[kanji]} />);
          i += kanji.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        parts.push(raw[i]);
        i++;
      }
    }

    return parts.length === 0 ? raw : parts.length === 1 ? parts[0] : <>{parts}</>;
  }, [language, t, furiganaMap]);

  const contextValue = useMemo(() => ({
    language,
    changeLanguage,
    t,
    tWithVars,
    tNode,
    refreshFurigana,
    systemSettings,
    refreshSystemSettings
  }), [language, changeLanguage, t, tWithVars, tNode, refreshFurigana, systemSettings, refreshSystemSettings]);

  return (
    <LanguageContext.Provider value={contextValue}>
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
