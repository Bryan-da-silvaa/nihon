import { useState, useRef, useEffect } from "react";
import useGameTimer from "./useGameTimer";
import useGameCompletion from "./useGameCompletion";
import { getKanaDeck, normalizeKanaMode, shuffleDeck } from "../lib/kana";

const DEFAULT_LEARNING_STRATEGY = "balanced";

export default function useKanaEngine() {
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
    } else {
      localStorage.removeItem("nihon_user");
    }
  };

  const [screen, setScreen] = useState("home");
  const [mode, setMode] = useState("hiragana");
  const [setupMode, setSetupMode] = useState("both");
  const [availableKana, setAvailableKana] = useState([]);
  const [selectedKana, setSelectedKana] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [kanaCount, setKanaCount] = useState(10);
  const [useTimer, setUseTimer] = useState(false);
  const [timeLimit, setTimeLimit] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [errorMsg, setErrorMsg] = useState("");

  const [currentList, setCurrentList] = useState([]);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState({}); 
  const [status, setStatus] = useState({}); 
  const [gameStartTime, setGameStartTime] = useState(null);

  const inputsRef = useRef([]);

  const saveScoreToDb = async (finalScore) => {
    if (!currentUser) return;
    
    // Calculate duration
    const duration_seconds = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
    
    // Prepare detailed kana stats
    const kana_details = currentList.map((item, index) => ({
      kana: item.kana,
      correct: status[index] === "correct"
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
          kana_details
        }),
      });
    } catch (err) {
      console.error("Erreur de sauvegarde en DB", err);
    }
  };

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
    saveScoreToDb(score);
    setScreen("score");
  };

  useGameTimer(screen, useTimer, timeLeft, setTimeLeft, finishGame);
  useGameCompletion(screen, currentList, status, finishGame);

  const startGame = async () => {
    if (kanaCount > 500) {
      setErrorMsg("errors.kanaLimit");
      return;
    }
    if (selectedKana.length === 0) {
      setErrorMsg("errors.selectAtLeastOneKana");
      return;
    }
    setErrorMsg("");
    setMode(setupMode);

    let generatedList = [];
    const scope = normalizeKanaMode(setupMode);
    const limit = selectedKana.length;
    const includeParam = encodeURIComponent(selectedKana.join(","));

    if (!currentUser) {
      setErrorMsg("errors.srsNotLoggedIn");
      return;
    }

    try {
      const res = await fetch(`/api/kana/srs?userId=${currentUser.id}&limit=${limit}&scope=${scope}&strategy=${DEFAULT_LEARNING_STRATEGY}&include=${includeParam}`);
      const data = await res.json();

      if (res.ok && Array.isArray(data.cards) && data.cards.length > 0) {
        generatedList = data.cards;
      } else {
        generatedList = buildFallbackSession(setupMode, limit).filter((item) => selectedKana.includes(item.kana));
      }
    } catch (err) {
      console.error(err);
      generatedList = buildFallbackSession(setupMode, limit).filter((item) => selectedKana.includes(item.kana));
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

  const selectAllKana = () => {
    setSelectedKana(availableKana.map((item) => item.kana));
  };

  const clearKanaSelection = () => {
    setSelectedKana([]);
  };

  const goProfile = () => {
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

  let maxWidthClass = "max-w-3xl"; // Home and Auth screens
  if (screen === "game") {
    maxWidthClass = "max-w-[98%]";
  } else if (screen === "session_setup") {
    maxWidthClass = "max-w-6xl";
  } else if (screen === "profile") {
    maxWidthClass = "max-w-4xl";
  } else if (screen === "admin" || screen === "admin_whisper") {
    maxWidthClass = "max-w-6xl";
  } else if (screen === "library") {
    maxWidthClass = "max-w-6xl";
  } else if (screen === "player") {
    maxWidthClass = "max-w-7xl";
  } else if (screen === "score") {
    maxWidthClass = "max-w-2xl";
  }

  return {
    currentUser, setCurrentUser: handleSetCurrentUser, isAuthLoaded, logout,
    screen, kanaCount, setKanaCount, useTimer, setUseTimer, 
    timeLimit, setTimeLimit, timeLeft, errorMsg, 
    setupMode, availableKana, selectedKana, toggleKana, toggleKanaLine, selectAllKana, clearKanaSelection,
    currentList, score, answers, setAnswers, status, inputsRef,
    startGame, openSetup, checkAnswer, markIncorrect, goHome, goProfile, goAdmin, goWhisper, goLibrary, goPlayer,
    selectedSessionId, maxWidthClass
  };
}

