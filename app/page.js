"use client";

import Navbar from "../components/Navbar";
import HomeScreen from "../components/HomeScreen";
import LearningSetupScreen from "../components/LearningSetupScreen";
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
    screen, useTimer, setUseTimer, 
    timeLimit, setTimeLimit, timeLeft, errorMsg, 
    setupMode, availableKana, selectedKana, toggleKana, toggleKanaLine, selectAllKana, clearKanaSelection,
    learningStrategy, sessionIntensity, setSessionIntensity,
    aivisSpeakerId, setAivisSpeakerId,
    enableKanaAudio, setEnableKanaAudio, requireVoiceAnswer, setRequireVoiceAnswer,
    currentList, score, answers, setAnswers, status, inputsRef,
    startGame, openSetup, checkAnswer, markIncorrect, goHome, goProfile, goAdmin, goWhisper, goLibrary, goPlayer,
    selectedSessionId, maxWidthClass, profileTab
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
                openSetup={openSetup}
              />
            )}

            {screen === "session_setup" && (
              <LearningSetupScreen
                mode={setupMode}
                availableKana={availableKana}
                selectedKana={selectedKana}
                toggleKana={toggleKana}
                toggleKanaLine={toggleKanaLine}
                selectAllKana={selectAllKana}
                clearKanaSelection={clearKanaSelection}
                startGame={startGame}
                goHome={goHome}
                useTimer={useTimer}
                setUseTimer={setUseTimer}
                timeLimit={timeLimit}
                setTimeLimit={setTimeLimit}
                learningStrategy={learningStrategy}
                sessionIntensity={sessionIntensity}
                setSessionIntensity={setSessionIntensity}
                enableKanaAudio={enableKanaAudio}
                setEnableKanaAudio={setEnableKanaAudio}
                requireVoiceAnswer={requireVoiceAnswer}
                setRequireVoiceAnswer={setRequireVoiceAnswer}
                aivisSpeakerId={aivisSpeakerId}
                setAivisSpeakerId={setAivisSpeakerId}
                errorMsg={errorMsg}
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
            markIncorrect={markIncorrect}
            inputsRef={inputsRef}
            enableKanaAudio={enableKanaAudio}
            requireVoiceAnswer={requireVoiceAnswer}
            aivisSpeakerId={aivisSpeakerId}
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
          <ProfileScreen key={profileTab} goHome={goHome} currentUser={currentUser} setCurrentUser={setCurrentUser} initialTab={profileTab} />
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
