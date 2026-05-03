import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { getKanaColumnIndex, getKanaLineGroups, getKanaRowKey } from "../lib/kana";

export default function LearningSetupScreen({
  mode,
  availableKana,
  selectedKana,
  toggleKana,
  toggleKanaLine,
  toggleMultipleKanaLines,
  selectContrastPairs,
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
  errorMsg,
}) {
  const { t, tNode } = useLanguage();
  const selectedSet = new Set(selectedKana);
  const kanaLineGroups = getKanaLineGroups(availableKana);
  
  const strategyLabelMap = {
    balanced: tNode("home.focusBalanced"),
    review: tNode("home.focusReview"),
    foundation: tNode("home.focusFoundation"),
    weak: tNode("home.focusWeak"),
  };

  const intensityOptions = [
    { id: "focused", label: tNode("setup.intensityFocused"), desc: tNode("setup.intensityFocusedDesc"), color: "bg-blue-500" },
    { id: "standard", label: tNode("setup.intensityStandard"), desc: tNode("setup.intensityStandardDesc"), color: "bg-indigo-500" },
    { id: "intensive", label: tNode("setup.intensityIntensive"), desc: tNode("setup.intensityIntensiveDesc"), color: "bg-purple-500" },
    { id: "marathon", label: tNode("setup.intensityMarathon"), desc: tNode("setup.intensityMarathonDesc"), color: "bg-amber-500" },
  ];

  const getRows = (list) => {
    const r = list.reduce((acc, item) => {
      const rk = getKanaRowKey(item.romaji);
      if (!acc[rk]) acc[rk] = [];
      acc[rk].push(item);
      return acc;
    }, {});
    Object.keys(r).forEach(rk => {
      r[rk].sort((a, b) => getKanaColumnIndex(a.romaji) - getKanaColumnIndex(b.romaji));
    });
    return r;
  };

  const getRowLabel = (rk) => (rk === "vowel" ? "A" : rk.toUpperCase());

  const hiraganaList = availableKana.filter(k => k.kana.codePointAt(0) <= 0x309F);
  const katakanaList = availableKana.filter(k => k.kana.codePointAt(0) > 0x309F);

  const renderScriptGrid = (list, title, color) => {
    if (list.length === 0) return null;
    const scriptRows = getRows(list);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className={`w-1 h-4 rounded-full ${color}`}></div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</h4>
        </div>
        <div className="space-y-4">
          {Object.keys(scriptRows).sort((a,b) => (scriptRows[a][0]?.rowRank ?? 999) - (scriptRows[b][0]?.rowRank ?? 999)).map(rk => (
            <div key={rk} className="flex items-center gap-4">
              <button
                onClick={() => toggleKanaLine(scriptRows[rk].map(i => i.kana))}
                className={`w-10 h-10 flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${scriptRows[rk].every(i => selectedSet.has(i.kana)) ? "bg-indigo-600 border-indigo-600 text-white" : "bg-slate-50 dark:bg-slate-800 border-slate-200/50 dark:border-slate-800/50 text-slate-400 hover:border-indigo-400"}`}
              >
                {getRowLabel(rk)}
              </button>
              <div className="flex-1 grid grid-cols-5 gap-2">
                {scriptRows[rk].map(item => (
                  <button
                    key={item.kana}
                    onClick={() => toggleKana(item.kana)}
                    className={`h-14 rounded-2xl flex flex-col items-center justify-center transition-all font-black text-xl border-2 ${selectedSet.has(item.kana) ? "bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700 hover:border-indigo-200"}`}
                  >
                    <span>{item.kana}</span>
                    <span className="text-[10px] opacity-40 uppercase tracking-tighter">{item.romaji}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full animate-fade-in text-left pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest border border-indigo-200/50 dark:border-indigo-800/50">
              Configuration de Session
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight">
            Prêt pour l'entraînement ?
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Personnalisez votre session de {tNode(`home.${mode}`)} pour une efficacité maximale.
          </p>
        </div>
        <button
          onClick={goHome}
          className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-black text-sm text-slate-500 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm"
        >
          ⬅ Annuler
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Kana Selection Grid (Bento Card) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-8 md:p-10 shadow-xl shadow-slate-500/5 overflow-x-auto no-scrollbar">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              Sélection des Éléments
            </h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={selectAllKana} className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 dark:border-indigo-800">Tout</button>
              <button onClick={selectContrastPairs} className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white transition-all border border-amber-100 dark:border-amber-800">Contrastes</button>
              <button onClick={clearKanaSelection} className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-rose-500 hover:text-white transition-all border border-slate-200 dark:border-slate-700">Vider</button>
            </div>
          </div>

          {/* Group Buttons */}
          <div className="flex flex-wrap gap-2 mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2 self-center">Groupes :</span>
            {kanaLineGroups.map(group => {
              const groupKana = group.rows.flatMap(rk => {
                const h = hiraganaList.filter(k => getKanaRowKey(k.romaji) === rk);
                const k = katakanaList.filter(k => getKanaRowKey(k.romaji) === rk);
                return [...h, ...k].map(i => i.kana);
              });
              return (
                <button
                  key={group.id}
                  onClick={() => toggleMultipleKanaLines([groupKana])}
                  className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border transition-all ${groupKana.every(k => selectedSet.has(k)) ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-400 hover:text-indigo-600"}`}
                >
                  {group.id.toUpperCase()}
                </button>
              );
            })}
          </div>

          <div className="space-y-12 min-w-[500px]">
            {renderScriptGrid(hiraganaList, "Hiragana", "bg-pink-500")}
            {renderScriptGrid(katakanaList, "Katakana", "bg-blue-500")}
          </div>
        </div>

        {/* Right: Options and Start (Bento Card) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-8">
          {/* Strategy Info */}
          <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-20 text-6xl">🎯</div>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Objectif Actuel</p>
             <h4 className="text-xl font-black mb-1">{strategyLabelMap[learningStrategy] || "Équilibré"}</h4>
             <p className="text-xs text-indigo-100 font-medium">Géré via votre profil d'apprentissage.</p>
          </div>

          {/* Intensity Selection */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl shadow-slate-500/5">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-6">Intensité</h3>
            <div className="space-y-3">
              {intensityOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSessionIntensity(opt.id)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${sessionIntensity === opt.id ? "bg-slate-50 dark:bg-slate-800 border-indigo-500" : "bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                >
                  <div className={`w-3 h-3 rounded-full shrink-0 ${opt.color}`}></div>
                  <div>
                    <p className="font-black text-slate-800 dark:text-white text-sm">{opt.label}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Extra Options */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl shadow-slate-500/5">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-6">Options</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="font-black text-sm text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 transition-colors">Activer le Chrono</span>
                <input type="checkbox" checked={useTimer} onChange={e => setUseTimer(e.target.checked)} className="w-5 h-5 rounded-lg border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="font-black text-sm text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 transition-colors">Audio Automatique</span>
                <input type="checkbox" checked={enableKanaAudio} onChange={e => setEnableKanaAudio(e.target.checked)} className="w-5 h-5 rounded-lg border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="font-black text-sm text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 transition-colors">Réponse Vocale (Beta)</span>
                <input type="checkbox" checked={requireVoiceAnswer} onChange={e => setRequireVoiceAnswer(e.target.checked)} className="w-5 h-5 rounded-lg border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              </label>
            </div>
          </div>

          {/* Action Button */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-black text-center animate-shake">
              ⚠️ {errorMsg}
            </div>
          )}
          <button
            onClick={startGame}
            className="w-full py-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 group"
          >
            <span>🚀</span>
            Lancer la Session
            <span className="opacity-50 group-hover:translate-x-2 transition-transform">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
