import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { getKanaColumnIndex, getKanaLineGroups, getKanaRowKey } from "../lib/kana";

export default function LearningSetupScreen({
  mode,
  availableKana,
  selectedKana,
  toggleKana,
  toggleKanaLine,
  selectAllKana,
  clearKanaSelection,
  startGame,
  goHome,
  useTimer,
  setUseTimer,
  timeLimit,
  setTimeLimit,
  learningStrategy,
  sessionIntensity,
  setSessionIntensity,
  enableKanaAudio,
  setEnableKanaAudio,
  requireVoiceAnswer,
  setRequireVoiceAnswer,
  aivisSpeakerId,
  setAivisSpeakerId,
  errorMsg,
}) {
  const { tNode } = useLanguage();
  const [aivisSpeakers, setAivisSpeakers] = useState([]);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewAudioRef = useRef(null);

  useEffect(() => {
    const loadSpeakers = async () => {
      try {
        const res = await fetch("/api/tts/speakers");
        const data = await res.json();
        if (res.ok && Array.isArray(data.speakers)) {
          setAivisSpeakers(data.speakers);
        }
      } catch (error) {
        setAivisSpeakers([]);
      }
    };
    loadSpeakers();
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  const previewSpeakerVoice = async () => {
    if (isPreviewPlaying) return;
    setIsPreviewPlaying(true);
    try {
      const res = await fetch("/api/tts/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speaker: aivisSpeakerId, text: "こんにちは、これは選択中の音声です。" }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      previewAudioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        previewAudioRef.current = null;
      };
      await audio.play();
    } catch (error) {
      // ignore
    } finally {
      setIsPreviewPlaying(false);
    }
  };
  const selectedSet = new Set(selectedKana);
  const kanaLineGroups = getKanaLineGroups(availableKana);
  const strategyLabelMap = {
    balanced: tNode("home.focusBalanced"),
    review: tNode("home.focusReview"),
    foundation: tNode("home.focusFoundation"),
    weak: tNode("home.focusWeak"),
  };
  const intensityOptions = [
    { id: "focused", label: tNode("setup.intensityFocused"), desc: tNode("setup.intensityFocusedDesc") },
    { id: "standard", label: tNode("setup.intensityStandard"), desc: tNode("setup.intensityStandardDesc") },
    { id: "intensive", label: tNode("setup.intensityIntensive"), desc: tNode("setup.intensityIntensiveDesc") },
  ];

  const rows = availableKana.reduce((accumulator, item) => {
    const rowKey = getKanaRowKey(item.romaji);
    if (!accumulator[rowKey]) {
      accumulator[rowKey] = [];
    }
    accumulator[rowKey].push(item);
    return accumulator;
  }, {});

  Object.keys(rows).forEach((rowKey) => {
    rows[rowKey].sort((left, right) => getKanaColumnIndex(left.romaji) - getKanaColumnIndex(right.romaji));
  });

  const getRowLabel = (rowKey) => {
    if (rowKey === "vowel") {
      return "A";
    }
    return rowKey.toUpperCase();
  };

  return (
    <div className="flex flex-col w-full py-6 text-left">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 mb-2">
            {tNode("setup.title")}
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            {tNode("setup.subtitle").replace("{mode}", tNode(`home.${mode}`))}
          </p>
        </div>
        <button
          type="button"
          onClick={goHome}
          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 font-semibold"
        >
          {tNode("setup.back")}
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/40 p-6 shadow-sm mb-6">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-4">
          {tNode("home.sectionFocus")}
        </h3>
        <div className="rounded-2xl border border-cyan-200/70 dark:border-cyan-800/70 bg-cyan-50/60 dark:bg-cyan-900/20 px-4 py-3 mb-6">
          <p className="text-xs uppercase tracking-[0.16em] font-black text-cyan-700 dark:text-cyan-300 mb-1">
            {tNode("setup.objectiveManagedByProfile")}
          </p>
          <p className="font-bold text-slate-900 dark:text-slate-100">
            {strategyLabelMap[learningStrategy] || tNode("home.focusBalanced")}
          </p>
        </div>

        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-4">
          {tNode("setup.intensitySection")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {intensityOptions.map((option) => {
            const isActive = sessionIntensity === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSessionIntensity(option.id)}
                className={`text-left px-4 py-3 rounded-2xl border transition-all ${
                  isActive
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                    : "border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/40"
                }`}
              >
                <div className="font-bold text-slate-900 dark:text-slate-100">{option.label}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{option.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/40 p-6 shadow-sm mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {tNode("setup.kanaSection")}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAllKana}
              className="px-3 py-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-sm font-semibold"
            >
              {tNode("setup.selectAll")}
            </button>
            <button
              type="button"
              onClick={clearKanaSelection}
              className="px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-sm font-semibold"
            >
              {tNode("setup.clear")}
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          {tNode("setup.selectedCount").replace("{count}", String(selectedKana.length))}
        </p>

        <div className="space-y-4">
          {kanaLineGroups.map((group) => {
            const availableRows = group.rows.filter((rowKey) => (rows[rowKey] || []).length > 0);
            if (availableRows.length === 0) {
              return null;
            }

            return (
              <div key={group.id} className="rounded-2xl border border-slate-200/70 dark:border-slate-700/70 p-4 bg-white/60 dark:bg-slate-900/20">
                <div className="space-y-3">
                  {availableRows.map((rowKey) => {
                    const rowItems = rows[rowKey];
                    const rowKana = rowItems.map((item) => item.kana);
                    const rowAllSelected = rowKana.every((kana) => selectedSet.has(kana));

                    return (
                      <div key={rowKey} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                            {getRowLabel(rowKey)}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleKanaLine(rowKana)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${rowAllSelected
                              ? "border-rose-300 text-rose-700 bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:bg-rose-900/20"
                              : "border-cyan-300 text-cyan-700 bg-cyan-50 dark:border-cyan-800 dark:text-cyan-300 dark:bg-cyan-900/20"
                            }`}
                          >
                            {rowAllSelected ? tNode("setup.unselectLine") : tNode("setup.selectLine")}
                          </button>
                        </div>

                        <div className="grid grid-cols-5 gap-3">
                          {rowItems.map((item) => {
                            const isSelected = selectedSet.has(item.kana);
                            return (
                              <button
                                key={item.kana}
                                type="button"
                                onClick={() => toggleKana(item.kana)}
                                className={`h-14 rounded-xl border text-xl font-bold transition-all ${
                                  isSelected
                                    ? "border-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200"
                                    : "border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/20 text-slate-700 dark:text-slate-300"
                                }`}
                                title={item.romaji}
                              >
                                {item.kana}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/40 p-6 shadow-sm mb-6">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-4">
          {tNode("setup.timerSection")}
        </h3>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <label className="cursor-pointer font-semibold text-gray-700 dark:text-gray-300 flex items-center group">
            <div className="relative inline-block w-12 mr-3 align-middle select-none transition duration-200 ease-in">
              <input
                type="checkbox"
                checked={useTimer}
                onChange={(e) => setUseTimer(e.target.checked)}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-300 dark:border-gray-600 appearance-none cursor-pointer transition-all duration-300 checked:bg-indigo-500 checked:border-indigo-500 checked:right-0 right-6 z-10"
                style={{ top: "0" }}
              />
              <div className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${useTimer ? "bg-indigo-400" : "bg-gray-300 dark:bg-gray-600"}`}></div>
            </div>
            {tNode("home.timerLabel")}
          </label>

          <div className={`flex items-center transition-opacity duration-300 ${useTimer ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
            <input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value, 10) || 5)}
              min="5"
              max="3600"
              className="w-24 px-4 py-2 rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-center font-bold text-lg"
              disabled={!useTimer}
            />
            <span className="ml-3 text-gray-600 dark:text-gray-400 font-medium">{tNode("home.seconds")}</span>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/40 p-6 shadow-sm mb-6">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-4">
          {tNode("setup.audioSection")}
        </h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
            <span className="font-semibold text-slate-700 dark:text-slate-200">{tNode("setup.enablePronunciationAudio")}</span>
            <input
              type="checkbox"
              checked={enableKanaAudio}
              onChange={(e) => setEnableKanaAudio(e.target.checked)}
              className="w-5 h-5"
            />
          </label>
          <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">{tNode("setup.enableVoiceValidation")}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tNode("setup.voiceValidationDesc")}</p>
            </div>
            <input
              type="checkbox"
              checked={requireVoiceAnswer}
              onChange={(e) => setRequireVoiceAnswer(e.target.checked)}
              className="w-5 h-5"
            />
          </label>
          <div className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
            <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{tNode("setup.aivisSpeakerLabel")}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{tNode("setup.aivisSpeakerDesc")}</p>
            {aivisSpeakers.length > 0 ? (
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <select
                  value={aivisSpeakerId}
                  onChange={(e) => setAivisSpeakerId(parseInt(e.target.value, 10) || 888753760)}
                  className="w-full md:w-80 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60"
                >
                  {aivisSpeakers.map((speaker) => (
                    <option key={speaker.id} value={speaker.id}>{speaker.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={previewSpeakerVoice}
                  disabled={isPreviewPlaying}
                  className="px-4 py-2 rounded-xl border border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300 font-bold bg-cyan-50/70 dark:bg-cyan-900/20 disabled:opacity-60"
                >
                  {isPreviewPlaying ? tNode("setup.previewLoading") : tNode("setup.previewVoice")}
                </button>
              </div>
            ) : (
              <input
                type="number"
                min="1"
                value={aivisSpeakerId}
                onChange={(e) => setAivisSpeakerId(parseInt(e.target.value, 10) || 888753760)}
                className="w-full md:w-56 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60"
              />
            )}
          </div>
        </div>
      </div>

      {errorMsg && <div className="text-rose-500 font-bold mb-4 text-sm">{tNode(errorMsg)}</div>}

      <button
        type="button"
        onClick={startGame}
        className="self-start bg-gradient-to-r from-cyan-600 via-sky-500 to-emerald-500 hover:from-cyan-500 hover:to-emerald-400 text-white font-black text-lg px-10 py-4 rounded-2xl shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
      >
        {tNode("setup.start")}
      </button>
    </div>
  );
}
