"use client";

import Navbar from "../components/Navbar";
import HomeScreen from "../components/HomeScreen";
import GameScreen from "../components/GameScreen";
import ScoreScreen from "../components/ScoreScreen";
import useKanaEngine from "../hooks/useKanaEngine";

export default function Home() {
  const {
    screen, kanaCount, setKanaCount, useTimer, setUseTimer, 
    timeLimit, setTimeLimit, timeLeft, errorMsg, 
    currentList, score, answers, setAnswers, status, inputsRef,
    startGame, checkAnswer, goHome, maxWidthClass
  } = useKanaEngine();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 w-full pt-4 pb-8 text-black dark:text-white">
      <Navbar />

      <div className={`bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md w-[98%] text-center ${maxWidthClass} mx-auto transition-all duration-300`}>
        {screen === "home" && (
          <HomeScreen
            startGame={startGame}
            kanaCount={kanaCount}
            setKanaCount={setKanaCount}
            errorMsg={errorMsg}
            useTimer={useTimer}
            setUseTimer={setUseTimer}
            timeLimit={timeLimit}
            setTimeLimit={setTimeLimit}
          />
        )}

        {screen === "game" && (
          <GameScreen
            goHome={goHome}
            useTimer={useTimer}
            timeLeft={timeLeft}
            currentList={currentList}
            status={status}
            answers={answers}
            setAnswers={setAnswers}
            checkAnswer={checkAnswer}
            inputsRef={inputsRef}
          />
        )}

        {screen === "score" && (
          <ScoreScreen
            score={score}
            currentListLength={currentList.length}
            goHome={goHome}
          />
        )}
      </div>
    </div>
  );
}
