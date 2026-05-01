import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import Ruby from "./Ruby";

export default function GameScreen({
  goHome,
  useTimer,
  timeLeft,
  currentList,
  status,
  answers,
  setAnswers,
  checkAnswer,
  markIncorrect,
  inputsRef,
  enableKanaAudio,
  requireVoiceAnswer,
  aivisSpeakerId,
}) {
  const { t, tNode, language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState("");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const recognitionRef = useRef(null);
  const [preferredJaVoice, setPreferredJaVoice] = useState(null);
  const localAudioRef = useRef(null);

  const answeredCount = Object.keys(status).length;
  const correctCount = Object.values(status).filter((value) => value === "correct").length;
  const progressPercent = currentList.length > 0 ? Math.round((answeredCount / currentList.length) * 100) : 0;

  const currentItem = currentList[currentIndex];
  const currentStatus = status[currentIndex];
  const isCurrentAnswered = currentStatus !== undefined;
  const currentAnswer = answers[currentIndex] || "";

  useEffect(() => {
    if (!isCurrentAnswered && inputsRef.current[currentIndex]) {
      inputsRef.current[currentIndex].focus();
    }
  }, [currentIndex, isCurrentAnswered, inputsRef]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (localAudioRef.current) {
        localAudioRef.current.pause();
        localAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const pickBestJaVoice = () => {
      const voices = window.speechSynthesis.getVoices() || [];
      if (voices.length === 0) return;

      const jaVoices = voices.filter((voice) => (voice.lang || "").toLowerCase().startsWith("ja"));
      if (jaVoices.length === 0) return;

      const preferredNameHints = [
        "kyoko",
        "otoya",
        "siri",
        "haruka",
        "ichiro",
        "japanese",
      ];

      const scored = jaVoices.map((voice) => {
        const lowerName = (voice.name || "").toLowerCase();
        let score = 0;
        if (voice.localService) score += 3;
        if (voice.default) score += 2;
        for (let i = 0; i < preferredNameHints.length; i += 1) {
          if (lowerName.includes(preferredNameHints[i])) {
            score += (preferredNameHints.length - i);
            break;
          }
        }
        return { voice, score };
      });

      scored.sort((left, right) => right.score - left.score);
      setPreferredJaVoice(scored[0].voice);
    };

    pickBestJaVoice();
    window.speechSynthesis.addEventListener("voiceschanged", pickBestJaVoice);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", pickBestJaVoice);
    };
  }, []);

  const reviewClass = useMemo(() => {
    if (!currentItem?.reviewType) return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    if (currentItem.reviewType === "due" || currentItem.reviewType === "mastered_due") {
      return "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300";
    }
    if (currentItem.reviewType === "weak") {
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
    }
    if (currentItem.reviewType === "learning") {
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
    }
    if (currentItem.reviewType === "mastered") {
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
    }
    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }, [currentItem]);

  const reviewLabels = {
    new: tNode('game.reviewNew'),
    due: tNode('game.reviewDue'),
    weak: tNode('game.reviewWeak'),
    learning: tNode('game.reviewLearning'),
    mastered: tNode('game.reviewMastered'),
    mastered_due: tNode('game.reviewMastered'),
  };

  const handleSubmit = () => {
    if (!currentItem || isCurrentAnswered) return;

    const nextValue = currentAnswer.toLowerCase();
    setAnswers((previous) => ({ ...previous, [currentIndex]: nextValue }));
    checkAnswer(currentIndex, nextValue);
  };

  const handleUnknown = () => {
    if (!currentItem || isCurrentAnswered) return;
    setAnswers((previous) => ({ ...previous, [currentIndex]: "" }));
    markIncorrect(currentIndex);
  };

  const goNextCard = () => {
    if (currentIndex + 1 < currentList.length) {
      setCurrentIndex((previous) => previous + 1);
    }
  };

  if (!currentItem) {
    return null;
  }

  const toHiragana = (value) => value.replace(/[\u30a1-\u30f6]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0x60));

  const normalizeSpeech = (value) => (value || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

  const isSpeechCorrect = (spokenText) => {
    const normalized = normalizeSpeech(spokenText);
    const expectedKana = normalizeSpeech(currentItem.kana);
    const expectedHiragana = normalizeSpeech(toHiragana(currentItem.kana));
    const expectedRomaji = normalizeSpeech(currentItem.romaji);

    return normalized.includes(expectedKana) || normalized.includes(expectedHiragana) || normalized === expectedRomaji;
  };

  const playBrowserPronunciation = () => {
    if (!enableKanaAudio || typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(currentItem.kana);
    utterance.lang = "ja-JP";
    utterance.rate = 0.88;
    utterance.pitch = 1.0;
    if (preferredJaVoice) {
      utterance.voice = preferredJaVoice;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const playPronunciation = async () => {
    if (!enableKanaAudio || isPlayingAudio || typeof window === "undefined") return;

    setIsPlayingAudio(true);
    try {
      const res = await fetch("/api/tts/kana", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentItem.kana, speaker: aivisSpeakerId }),
      });

      if (!res.ok) {
        playBrowserPronunciation();
        return;
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      localAudioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        localAudioRef.current = null;
      };
      await audio.play();
    } catch (error) {
      playBrowserPronunciation();
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const startVoiceValidation = () => {
    if (isCurrentAnswered || isListening || (useTimer && timeLeft <= 0)) return;
    if (typeof window === "undefined") return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceFeedback(tNode("game.voiceNotSupported"));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceFeedback(tNode("game.listening"));
    };

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setVoiceFeedback(tNode("game.voiceHeard").replace("{value}", transcript));
      setAnswers((previous) => ({ ...previous, [currentIndex]: transcript }));

      if (isSpeechCorrect(transcript)) {
        checkAnswer(currentIndex, currentItem.romaji);
      } else {
        markIncorrect(currentIndex);
      }
    };

    recognition.onerror = () => {
      setVoiceFeedback(tNode("game.voiceError"));
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="relative w-full mx-auto py-4">
      <div className="sticky top-4 backdrop-blur-2xl bg-white/80 dark:bg-gray-900/80 z-50 py-4 px-6 md:px-8 border border-white/50 dark:border-gray-700/50 rounded-3xl shadow-lg mb-8 transition-all duration-300">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">{tNode("game.sessionTitle")}</h2>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
              {tNode("game.cardXofY")
                .replace("{current}", String(currentIndex + 1))
                .replace("{total}", String(currentList.length))}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {tNode("game.progress").replace("{value}", String(progressPercent))}
            </div>
            {useTimer && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg ${timeLeft <= 5 ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 animate-pulse border border-red-300 dark:border-red-800' : 'bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-gray-200 dark:border-gray-700'}`}>
                ⏱ <span>{timeLeft}{language === 'fr' ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>{tNode("game.correctCount").replace("{value}", String(correctCount))}</span>
          <span>{tNode("game.answeredCount").replace("{value}", String(answeredCount))}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
        <div className="lg:col-span-2 rounded-[2rem] border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-gray-800/70 p-8 shadow-xl">
          <div className="flex items-start justify-between gap-3 mb-8">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
              {tNode("game.currentPrompt")}
            </div>
            {currentItem.reviewType && (
              <div className={`text-[11px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-full ${reviewClass}`}>
                {reviewLabels[currentItem.reviewType] || currentItem.reviewType}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="text-7xl md:text-8xl font-black text-gray-800 dark:text-white drop-shadow-sm mb-8">
              {currentItem.kanji && currentItem.reading ? (
                <Ruby base={currentItem.kanji} reading={currentItem.reading} />
              ) : (
                currentItem.kana
              )}
            </div>

            <div className="w-full max-w-md mb-5">
              <input
                ref={(element) => {
                  inputsRef.current[currentIndex] = element;
                }}
                type="text"
                placeholder={tNode("game.answerPlaceholder")}
                className={`w-full py-4 px-4 rounded-2xl text-center text-2xl font-bold transition-all duration-300 shadow-inner outline-none border-2 ${
                  currentStatus === "correct"
                    ? "bg-emerald-100/80 dark:bg-emerald-900/80 border-emerald-500 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300"
                    : currentStatus === "incorrect"
                    ? "bg-red-100/80 dark:bg-red-900/80 border-red-500 dark:border-red-400 text-red-700 dark:text-red-300"
                    : "border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-gray-800 text-gray-800 dark:text-white"
                }`}
                value={currentAnswer}
                onChange={(event) => {
                  if (!isCurrentAnswered) {
                    setAnswers((previous) => ({ ...previous, [currentIndex]: event.target.value.toLowerCase() }));
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    if (!isCurrentAnswered) {
                      if (!requireVoiceAnswer) {
                        handleSubmit();
                      }
                    } else {
                      goNextCard();
                    }
                  }
                }}
                disabled={requireVoiceAnswer || isCurrentAnswered || (useTimer && timeLeft <= 0)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
              />
            </div>

            <div className="h-8 mb-6">
              {!currentStatus && voiceFeedback && (
                <span className="inline-flex items-center gap-2 text-cyan-600 dark:text-cyan-300 font-bold text-sm">
                  {voiceFeedback}
                </span>
              )}
              {currentStatus === "correct" && (
                <span className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black">
                  ✓ {tNode("game.feedbackCorrect")}
                </span>
              )}
              {currentStatus === "incorrect" && (
                <span className="inline-flex items-center gap-2 text-red-600 dark:text-red-400 font-black">
                  {tNode("game.feedbackIncorrect").replace("{answer}", currentItem.romaji.toUpperCase())}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {enableKanaAudio && (
                <button
                  type="button"
                  onClick={playPronunciation}
                  disabled={isPlayingAudio}
                  className="px-5 py-3 rounded-xl border border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300 font-bold bg-cyan-50/80 dark:bg-cyan-900/20"
                >
                  🔊 {isPlayingAudio ? tNode("game.loadingAudio") : tNode("game.playPronunciation")}
                </button>
              )}
              {!isCurrentAnswered && (
                <>
                  <button
                    type="button"
                    onClick={handleUnknown}
                    className="px-5 py-3 rounded-xl border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 font-bold bg-rose-50/80 dark:bg-rose-900/20"
                  >
                    {tNode("game.unknownButton")}
                  </button>
                  {requireVoiceAnswer ? (
                    <button
                      type="button"
                      onClick={startVoiceValidation}
                      className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-black shadow-lg"
                    >
                      {isListening ? tNode("game.listening") : tNode("game.speakToAnswer")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-500 text-white font-black shadow-lg"
                    >
                      {tNode("game.checkButton")}
                    </button>
                  )}
                </>
              )}

              {isCurrentAnswered && currentIndex + 1 < currentList.length && (
                <button
                  type="button"
                  onClick={goNextCard}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-black shadow-lg"
                >
                  {tNode("game.nextButton")}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-gray-800/70 p-6 shadow-xl">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-4">
            {tNode("game.sessionActions")}
          </h3>

          <button
            onClick={goHome}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-5 py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 font-bold transition-colors shadow-sm"
          >
            <span>⬅</span> {tNode('game.backToHome')}
          </button>

          <div className="mt-6 p-4 rounded-xl bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {tNode("game.coachHint")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
