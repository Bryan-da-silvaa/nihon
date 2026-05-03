import { useState, useRef, useEffect, useCallback } from "react";
import useGameTimer from "./useGameTimer";
import useGameCompletion from "./useGameCompletion";
import { useLanguage } from "../context/LanguageContext";
import { getKanaDeck, normalizeKanaMode, shuffleDeck, getKanaRowKey } from "../lib/kana";

const DEFAULT_LEARNING_STRATEGY = "balanced";

const SESSION_INTENSITY_LIMITS = {
  focused: 12,
  standard: 24,
  intensive: 40,
  marathon: 142,
};

function resolveSessionLimit(intensity, selectedCount) {
  const baseLimit = SESSION_INTENSITY_LIMITS[intensity] || SESSION_INTENSITY_LIMITS.standard;
  return Math.max(1, Math.min(baseLimit, selectedCount));
}

export default function useKanaEngine() {
  const { language, changeLanguage } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("nihon_user");
    if (savedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentUser(JSON.parse(savedUser));
    }
    setIsAuthLoaded(true);
  }, []);

  const handleSetCurrentUser = (user) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem("nihon_user", JSON.stringify(user));
      // Load preferences into local state
      if (user.learning_strategy) setLearningStrategy(user.learning_strategy);
      if (user.session_intensity) setSessionIntensity(user.session_intensity);
      if (user.require_voice_answer !== undefined) setRequireVoiceAnswer(Boolean(user.require_voice_answer));
      if (user.use_timer !== undefined) setUseTimer(Boolean(user.use_timer));
      if (user.time_limit) setTimeLimit(user.time_limit);
      if (user.last_setup_mode) setSetupMode(user.last_setup_mode);
      if (user.last_setup_selection) setSelectedKana(user.last_setup_selection);
      if (user.dark_mode !== undefined) setIsDarkMode(Boolean(user.dark_mode));
      if (user.language) changeLanguage(user.language);
    } else {
      localStorage.removeItem("nihon_user");
    }
  };

  const [screen, setScreen] = useState("home");
  const [profileTab, setProfileTab] = useState("overview");
  const [mode, setMode] = useState("hiragana");
  const [setupMode, setSetupMode] = useState("both");
  const [availableKana, setAvailableKana] = useState([]);
  const [selectedKana, setSelectedKana] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [userSummary, setUserSummary] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [learningStrategy, setLearningStrategy] = useState(DEFAULT_LEARNING_STRATEGY);
  const [sessionIntensity, setSessionIntensity] = useState("standard");
  const [enableKanaAudio, setEnableKanaAudio] = useState(true);
  const [requireVoiceAnswer, setRequireVoiceAnswer] = useState(false);
  const [useTimer, setUseTimer] = useState(false);
  const [timeLimit, setTimeLimit] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [errorMsg, setErrorMsg] = useState("");
  const [isRevisionPhase, setIsRevisionPhase] = useState(false);
  const [sessionResults, setSessionResults] = useState({ score: 0, total: 0 });
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [currentList, setCurrentList] = useState([]);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState({});
  const [gameStartTime, setGameStartTime] = useState(null);

  // Sync preferences to DB
  useEffect(() => {
    if (!currentUser?.id || !isAuthLoaded) return;
    
    const timer = setTimeout(() => {
      fetch('/api/profile/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          learning_strategy: learningStrategy,
          session_intensity: sessionIntensity,
          require_voice_answer: requireVoiceAnswer,
          use_timer: useTimer,
          time_limit: timeLimit,
          last_setup_mode: setupMode,
          last_setup_selection: selectedKana,
          dark_mode: isDarkMode,
          language: language
        })
      });
    }, 2000); // 2s debounce to avoid too many writes
    
    return () => clearTimeout(timer);
  }, [learningStrategy, sessionIntensity, requireVoiceAnswer, useTimer, timeLimit, setupMode, selectedKana, isDarkMode, language, currentUser?.id, isAuthLoaded]);

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Initial dark mode detect if no user
  useEffect(() => {
    if (!currentUser && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, [currentUser]);

  const inputsRef = useRef([]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const loadUserLearningPreferences = async () => {
      try {
        const res = await fetch(`/api/profile?userId=${currentUser.id}`);
        const data = await res.json();
        if (res.ok) {
          setLearningStrategy(data.learning_strategy || DEFAULT_LEARNING_STRATEGY);
          setSessionIntensity(data.session_intensity || "standard");
        }
      } catch (error) {
        console.error("Unable to load learning preferences", error);
      }
    };

    loadUserLearningPreferences();
  }, [currentUser]);

  const saveScoreToDb = async (finalScore) => {
    if (!currentUser) return;

    const duration_seconds = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;

    const kana_details = currentList.map((item, index) => ({
      kana: item.kana,
      correct: status[index] === "correct",
    }));

    try {
      await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          mode,
          score: finalScore,
          total: currentList.length,
          duration_seconds,
          kana_details,
        }),
      });
    } catch (err) {
      console.error("Erreur de sauvegarde en DB", err);
    }

    // Refresh summary after game
    fetchUserSummary();
  };

  const fetchUserSummary = useCallback(async () => {
    if (!currentUser?.id) return;
    setIsLoadingSummary(true);
    try {
      const res = await fetch(`/api/profile?userId=${currentUser.id}`);
      const data = await res.json();
      if (!data.error) {
        setUserSummary(data);
      }
    } catch (err) {
      console.error("Failed to fetch user summary:", err);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) fetchUserSummary();
  }, [currentUser, fetchUserSummary]);

  const buildFallbackSession = (selectedMode, requestedCount) => {
    const baseDeck = shuffleDeck(getKanaDeck(normalizeKanaMode(selectedMode === "srs" ? "both" : selectedMode)));
    if (baseDeck.length === 0) {
      return [];
    }

    const session = [];
    for (let index = 0; index < requestedCount; index += 1) {
      session.push(baseDeck[index % baseDeck.length]);
    }

    return session;
  };

  const finishGame = () => {
    if (!isRevisionPhase) {
      setSessionResults({ score, total: currentList.length });
      saveScoreToDb(score);
      
      const mistakes = currentList.filter((_, idx) => status[idx] !== "correct");
      if (mistakes.length > 0) {
        setCurrentList(mistakes);
        setStatus({});
        setAnswers({});
        setIsRevisionPhase(true);
        return;
      }
    }
    
    setScreen("score");
    setIsRevisionPhase(false);
  };

  useGameTimer(screen, useTimer, timeLeft, setTimeLeft, finishGame);
  useGameCompletion(screen, currentList, status, finishGame);

  const startGame = async (params = {}) => {
    const finalSetupMode = params.mode || setupMode;
    const finalIntensity = params.intensity || sessionIntensity;
    const finalStrategy = params.strategy || learningStrategy;
    const finalSelected = params.selectedKana || selectedKana;

    if (finalSelected.length === 0) {
      setErrorMsg("errors.selectAtLeastOneKana");
      return;
    }

    setErrorMsg("");
    setMode(finalSetupMode);

    let generatedList = [];
    const scope = normalizeKanaMode(finalSetupMode);
    const limit = resolveSessionLimit(finalIntensity, finalSelected.length);
    const includeParam = encodeURIComponent(finalSelected.join(","));

    if (!currentUser) {
      setErrorMsg("errors.srsNotLoggedIn");
      return;
    }

    try {
      const res = await fetch(`/api/kana/srs?userId=${currentUser.id}&limit=${limit}&scope=${scope}&strategy=${finalStrategy}&include=${includeParam}`);
      const data = await res.json();

      if (res.ok && Array.isArray(data.cards) && data.cards.length > 0) {
        generatedList = data.cards;
      } else {
        generatedList = buildFallbackSession(finalSetupMode, limit).filter((item) => finalSelected.includes(item.kana));
      }
    } catch (err) {
      console.error(err);
      generatedList = buildFallbackSession(finalSetupMode, limit).filter((item) => finalSelected.includes(item.kana));
    }

    if (generatedList.length === 0) {
      setErrorMsg("errors.noKanaAvailable");
      return;
    }

    setCurrentList(generatedList);
    setScore(0);
    setAnswers({});
    setStatus({});
    setTimeLeft(timeLimit);
    setGameStartTime(Date.now());
    inputsRef.current = [];
    setScreen("game");

    setTimeout(() => {
      if (inputsRef.current[0]) inputsRef.current[0].focus();
    }, 100);
  };

  const startDirectSrsSession = (config = {}) => {
    const allDeck = getKanaDeck(config.mode || "both");
    const allKana = allDeck.map(item => item.kana);
    
    // If no config provided, we assume it's a direct click on "Review Due"
    // In that case we want ONLY due cards.
    const finalStrategy = config.strategy || (Object.keys(config).length === 0 ? "due_only" : "review");

    startGame({
      mode: config.mode || "both",
      strategy: finalStrategy,
      intensity: config.intensity || "standard",
      selectedKana: allKana
    });
  };

  const checkAnswer = (index, value) => {
    const val = value.trim().toLowerCase();
    if (!val) return;

    const correctRomaji = currentList[index].romaji;
    const isCorrect = val === correctRomaji;

    setStatus((prev) => ({ ...prev, [index]: isCorrect ? "correct" : "incorrect" }));
    if (isCorrect) setScore((prev) => prev + 1);

    if (index + 1 < currentList.length) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const markIncorrect = (index) => {
    if (status[index] !== undefined) return;
    setStatus((previous) => ({ ...previous, [index]: "incorrect" }));
  };

  const goHome = () => {
    setErrorMsg("");
    setScreen("home");
  };

  const openSetup = (selectedMode) => {
    const normalizedMode = normalizeKanaMode(selectedMode);
    const deck = getKanaDeck(normalizedMode);
    const kanaValues = deck.map((item) => item.kana);

    setSetupMode(normalizedMode);
    setAvailableKana(deck);
    setSelectedKana(kanaValues);
    setErrorMsg("");
    setScreen("session_setup");
  };

  const toggleKana = (kana) => {
    setSelectedKana((previous) => (
      previous.includes(kana)
        ? previous.filter((value) => value !== kana)
        : [...previous, kana]
    ));
  };

  const toggleKanaLine = (kanaLine) => {
    setSelectedKana((previous) => {
      const allSelected = kanaLine.every((kana) => previous.includes(kana));

      if (allSelected) {
        return previous.filter((kana) => !kanaLine.includes(kana));
      }

      const merged = new Set([...previous, ...kanaLine]);
      return Array.from(merged);
    });
  };

  const toggleMultipleKanaLines = (lines) => {
    setSelectedKana((previous) => {
      const allKana = lines.flat();
      const allSelected = allKana.every((kana) => previous.includes(kana));

      if (allSelected) {
        return previous.filter((kana) => !allKana.includes(kana));
      }

      const merged = new Set([...previous, ...allKana]);
      return Array.from(merged);
    });
  };

  const selectAllKana = () => {
    setSelectedKana(availableKana.map((item) => item.kana));
  };

  const selectContrastPairs = () => {
    const pairs = ["k", "g", "s", "z", "t", "d", "b", "p"];
    const filtered = availableKana
      .filter(item => pairs.includes(getKanaRowKey(item.romaji)))
      .map(item => item.kana);
    setSelectedKana(filtered);
  };

  const clearKanaSelection = () => {
    setSelectedKana([]);
  };

  const goProfile = (tab = "overview") => {
    setProfileTab(tab);
    setScreen("profile");
  };

  const goAdmin = () => {
    setScreen("admin");
  };

  const goWhisper = () => {
    setScreen("admin_whisper");
  };

  const goLibrary = () => {
    setScreen("library");
  };

  const goPlayer = (sessionId) => {
    setSelectedSessionId(sessionId);
    setScreen("player");
  };

  const logout = () => {
    handleSetCurrentUser(null);
    setScreen("home");
  };

  let maxWidthClass = "max-w-7xl";
  if (screen === "game") {
    maxWidthClass = "max-w-[98%]";
  } else if (screen === "score") {
    maxWidthClass = "max-w-2xl";
  } else if (screen === "session_setup") {
    maxWidthClass = "max-w-6xl";
  } else if (screen === "library") {
    maxWidthClass = "max-w-7xl";
  } else if (screen === "player") {
    maxWidthClass = "max-w-[1600px]";
  }

  return {
    currentUser, setCurrentUser: handleSetCurrentUser, isAuthLoaded, logout,
    screen, useTimer, setUseTimer,
    timeLimit, setTimeLimit, timeLeft, errorMsg,
    setupMode, availableKana, selectedKana, toggleKana, toggleKanaLine, toggleMultipleKanaLines, selectContrastPairs, selectAllKana, clearKanaSelection,
    learningStrategy, setLearningStrategy, sessionIntensity, setSessionIntensity,
    enableKanaAudio, setEnableKanaAudio, requireVoiceAnswer, setRequireVoiceAnswer,
    currentList, score, answers, setAnswers, status, inputsRef,
    startGame, startDirectSrsSession, openSetup, checkAnswer, markIncorrect, goHome, goProfile, goAdmin, goWhisper, goLibrary, goPlayer,
    selectedSessionId, maxWidthClass, profileTab, isRevisionPhase, sessionResults,
    isDarkMode, setIsDarkMode,
    userSummary, isLoadingSummary, fetchUserSummary
  };
}
