import { useState, useRef, useEffect } from "react";
import Hiragana from "../data/Hiragana.json";
import Katakana from "../data/Katakana.json";
import useGameTimer from "./useGameTimer";
import useGameCompletion from "./useGameCompletion";

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

  const finishGame = () => {
    saveScoreToDb(score);
    setScreen("score");
  };

  useGameTimer(screen, useTimer, timeLeft, setTimeLeft, finishGame);
  useGameCompletion(screen, currentList, status, finishGame);

  const startGame = (selectedMode) => {
    if (kanaCount > 500) {
      setErrorMsg("errors.kanaLimit");
      return;
    }
    setErrorMsg("");
    setMode(selectedMode);

    let fullList = [];
    if (selectedMode === "hiragana" || selectedMode === "both") fullList = [...fullList, ...Hiragana];
    if (selectedMode === "katakana" || selectedMode === "both") fullList = [...fullList, ...Katakana];

    if (fullList.length === 0) return;

    const generatedList = [];
    for (let i = 0; i < kanaCount; i++) {
      const randomIndex = Math.floor(Math.random() * fullList.length);
      generatedList.push(fullList[randomIndex]);
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

  const goHome = () => {
    setScreen("home");
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
    currentList, score, answers, setAnswers, status, inputsRef,
    startGame, checkAnswer, goHome, goProfile, goAdmin, goWhisper, goLibrary, goPlayer,
    selectedSessionId, maxWidthClass
  };
}

