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
		setupMode, availableKana, selectedKana, toggleKana, toggleKanaLine, toggleMultipleKanaLines, selectContrastPairs, selectAllKana, clearKanaSelection,
		learningStrategy, sessionIntensity, setSessionIntensity,
		enableKanaAudio, setEnableKanaAudio, requireVoiceAnswer, setRequireVoiceAnswer,
		currentList, score, answers, setAnswers, status, inputsRef,
		startGame, startDirectSrsSession, openSetup, checkAnswer, markIncorrect, goHome, goProfile, goAdmin, goWhisper, goLibrary, goPlayer,
		selectedSessionId, maxWidthClass, profileTab, isRevisionPhase, sessionResults,
		isDarkMode, setIsDarkMode,
		userSummary, isLoadingSummary
	} = useKanaEngine();

	// Screens that should NOT be wrapped in the standard glass container
	const isFullScreen = screen === "admin" || screen === "admin_whisper" || !currentUser;

	return (
		<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-900 transition-colors duration-500 w-full pt-4 pb-8 text-black dark:text-white relative overflow-hidden">
			{!isFullScreen && (
				<Navbar
					goProfile={goProfile}
					goAdmin={goAdmin}
					goLibrary={goLibrary}
					goHome={goHome}
					screen={screen}
					currentUser={currentUser}
					logout={logout}
					isDarkMode={isDarkMode}
					setIsDarkMode={setIsDarkMode}
				/>
			)}

			{!isAuthLoaded ? (
				<div className="flex flex-col items-center justify-center py-20 gap-4 mt-20">
					<div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
					<p className="text-sm font-black uppercase tracking-widest text-slate-400">{t("common.loading")}</p>
				</div>
			) : !currentUser ? (
				<AuthScreen onLogin={setCurrentUser} />
			) : (
				<div className={isFullScreen ? "w-full h-full" : `backdrop-blur-2xl bg-white/60 dark:bg-slate-900/40 border border-white dark:border-slate-800 p-8 md:p-12 rounded-[3rem] shadow-2xl w-[96%] text-center ${maxWidthClass} mx-auto transition-all duration-500 relative z-10`}>
					{screen === "home" && (
						<HomeScreen
							openSetup={openSetup}
							startDirectSrsSession={startDirectSrsSession}
							userSummary={userSummary}
							isLoadingSummary={isLoadingSummary}
							currentUser={currentUser}
						/>
					)}

					{screen === "session_setup" && (
						<LearningSetupScreen
							mode={setupMode}
							availableKana={availableKana}
							selectedKana={selectedKana}
							toggleKana={toggleKana}
							toggleKanaLine={toggleKanaLine}
							toggleMultipleKanaLines={toggleMultipleKanaLines}
							selectContrastPairs={selectContrastPairs}
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
							setRequireVoiceAnswer={setRequireVoiceAnswer}
							isRevisionPhase={isRevisionPhase}
						/>
					)}

					{screen === "score" && (
						<ScoreScreen
							score={sessionResults.score}
							currentListLength={sessionResults.total}
							goHome={goHome}
						/>
					)}

					{screen === "profile" && (
						<ProfileScreen
							key={profileTab}
							goHome={goHome}
							currentUser={currentUser}
							setCurrentUser={setCurrentUser}
							initialTab={profileTab}
							startDirectSrsSession={startDirectSrsSession}
						/>
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
				</div>
			)}
		</div>
	);
}
