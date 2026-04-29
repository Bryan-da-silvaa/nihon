import { useState, useRef } from "react";
import Hiragana from "../data/Hiragana.json";
import Katakana from "../data/Katakana.json";
import useGameTimer from "./useGameTimer";
import useGameCompletion from "./useGameCompletion";

export default function useKanaEngine() {
  const [screen, setScreen] = useState("home");
  const [mode, setMode] = useState("hiragana");
  const [kanaCount, setKanaCount] = useState(10);
  const [useTimer, setUseTimer] = useState(false);
  const [timeLimit, setTimeLimit] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [errorMsg, setErrorMsg] = useState("");

  const [currentList, setCurrentList] = useState([]);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState({}); 
  const [status, setStatus] = useState({}); 

  const inputsRef = useRef([]);

  const finishGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setScreen("score");
  };

  const timerRef = useGameTimer(screen, useTimer, timeLeft, setTimeLeft, finishGame);
  useGameCompletion(screen, currentList, status, finishGame);

  const startGame = (selectedMode) => {
    if (kanaCount > 500) {
      setErrorMsg("Erreur : La limite est de 500 Kana maximum.");
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
    if (timerRef.current) clearInterval(timerRef.current);
    setScreen("home");
  };

  let maxWidthClass = "max-w-[600px]";
  if (currentList.length > 40) maxWidthClass = "max-w-[1800px]";
  else if (currentList.length > 20) maxWidthClass = "max-w-[1200px]";
  else if (currentList.length > 10) maxWidthClass = "max-w-[900px]";

  return {
    screen, kanaCount, setKanaCount, useTimer, setUseTimer, 
    timeLimit, setTimeLimit, timeLeft, errorMsg, 
    currentList, score, answers, setAnswers, status, inputsRef,
    startGame, checkAnswer, goHome, maxWidthClass
  };
}
