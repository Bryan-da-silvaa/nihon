"use client";

import Navbar from "../components/Navbar";
import HomeScreen from "../components/HomeScreen";
import GameScreen from "../components/GameScreen";
import ScoreScreen from "../components/ScoreScreen";
import ProfileScreen from "../components/ProfileScreen";
import AuthScreen from "../components/AuthScreen";
import AdminScreen from "../components/AdminScreen";
import WhisperScreen from "../components/WhisperScreen";
import LibraryScreen from "../components/LibraryScreen";
import PlayerScreen from "../components/PlayerScreen";
import useKanaEngine from "../hooks/useKanaEngine";
import { useLanguage } from "../context/LanguageContext";

export default function Home() {
  const { t } = useLanguage();
  const {
    currentUser, setCurrentUser, isAuthLoaded, logout,
    screen, kanaCount, setKanaCount, useTimer, setUseTimer, 
    timeLimit, setTimeLimit, timeLeft, errorMsg, 
    currentList, score, answers, setAnswers, status, inputsRef,
    startGame, checkAnswer, goHome, goProfile, goAdmin, goWhisper, goLibrary, goPlayer,
    selectedSessionId, maxWidthClass
  } = useKanaEngine();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-900 transition-colors duration-500 w-full pt-4 pb-8 text-black dark:text-white relative overflow-hidden">
      <Navbar 
        goProfile={goProfile} 
        goAdmin={goAdmin}
        goLibrary={goLibrary}
        screen={screen} 
        goHome={goHome} 
        currentUser={currentUser} 
        logout={logout} 
      />

      <div className={`backdrop-blur-xl bg-white/70 dark:bg-gray-800/60 border border-white/50 dark:border-gray-700/50 p-8 rounded-3xl shadow-2xl w-[98%] text-center ${maxWidthClass} mx-auto transition-all duration-500 relative z-10`}>
        {!isAuthLoaded ? (
           <div className="text-xl py-10">{t("common.loading")}</div>
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

        {screen === "admin" && (
          <AdminScreen goHome={goHome} goWhisper={goWhisper} currentUser={currentUser} />
        )}

        {screen === "admin_whisper" && (
          <WhisperScreen goAdmin={goAdmin} />
        )}

        {screen === "library" && (
          <LibraryScreen goHome={goHome} goPlayer={goPlayer} currentUser={currentUser} />
        )}

        {screen === "player" && (
          <PlayerScreen sessionId={selectedSessionId} goLibrary={goLibrary} currentUser={currentUser} />
        )}
      </>)}
      </div>
    </div>
  );
}
