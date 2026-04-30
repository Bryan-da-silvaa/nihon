"use client";

import Navbar from "../components/Navbar";
import HomeScreen from "../components/HomeScreen";
import GameScreen from "../components/GameScreen";
import ScoreScreen from "../components/ScoreScreen";
import ProfileScreen from "../components/ProfileScreen";
import AuthScreen from "../components/AuthScreen";
import useKanaEngine from "../hooks/useKanaEngine";

export default function Home() {
  const {
    currentUser, setCurrentUser, isAuthLoaded, logout,
    screen, kanaCount, setKanaCount, useTimer, setUseTimer, 
    timeLimit, setTimeLimit, timeLeft, errorMsg, 
    currentList, score, answers, setAnswers, status, inputsRef,
    startGame, checkAnswer, goHome, goProfile, maxWidthClass
  } = useKanaEngine();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 w-full pt-4 pb-8 text-black dark:text-white">
      <Navbar 
        goProfile={goProfile} 
        screen={screen} 
        goHome={goHome} 
        currentUser={currentUser} 
        logout={logout} 
      />

      <div className={`bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md w-[98%] text-center ${maxWidthClass} mx-auto transition-all duration-300`}>
        {!isAuthLoaded ? (
           <div className="text-xl py-10">Chargement...</div>
        ) : !currentUser ? (
          <AuthScreen onLogin={setCurrentUser} />
        ) : (
          <>
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

        {screen === "profile" && (
          <ProfileScreen goHome={goHome} currentUser={currentUser} setCurrentUser={setCurrentUser} />
        )}
      </>)}
      </div>
    </div>
  );
}
