import { useState, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function WhisperScreen({ goAdmin }) {
  const { t } = useLanguage();
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(-1); // -1: inactive, 0: yt-dlp, 1: ffmpeg, 2: whisper, 3: done
  const [progressPercent, setProgressPercent] = useState(0);
  
  const [fileId, setFileId] = useState(null);
  const [originalName, setOriginalName] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setYoutubeUrl(url);
    if (url) {
      setFileId(null);
      setOriginalName(null);
    }
    const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    setIsValidUrl(ytRegex.test(url));
    if (progressStep === 3) setProgressStep(-1);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setYoutubeUrl("");
    setIsValidUrl(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setFileId(data.fileId);
        setOriginalName(data.originalName);
      } else {
        alert("Erreur upload: " + data.error);
      }
    } catch (err) {
      alert("Erreur réseau lors de l'upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const [transcription, setTranscription] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [language, setLanguage] = useState("ja");
  const [generatedFiles, setGeneratedFiles] = useState(null);

  const handleProcess = () => {
    if (!isValidUrl && !fileId) return;
    setIsProcessing(true);
    setProgressStep(0);
    setProgressPercent(0);
    setTranscription("");
    setVideoTitle("");
    setGeneratedFiles(null);

    const params = new URLSearchParams();
    if (fileId) {
      params.append('fileId', fileId);
      params.append('filename', originalName);
    } else {
      params.append('url', youtubeUrl);
    }
    params.append('lang', language);

    const sse = new EventSource(`/api/whisper?${params.toString()}`);
    sse.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.step === -1) {
        sse.close();
        setIsProcessing(false);
        setProgressStep(-1);
        alert("Erreur de traitement: " + data.data.error);
        return;
      }

      setProgressStep(data.step);
      setProgressPercent(data.percent);

      if (data.step === 3) {
        sse.close();
        setIsProcessing(false);
        setTranscription(data.data.transcription);
        setVideoTitle(data.data.title);
        setGeneratedFiles(data.data.files);
      }
    };
  };

  const steps = [
    { label: "Extraction Audio", icon: "🎵" },
    { label: "Traitement FFmpeg", icon: "⚙️" },
    { label: "Transcription Whisper", icon: "🧠" },
    { label: "Finalisation", icon: "✨" }
  ];

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50 dark:bg-slate-950 animate-fade-in pb-20">
      {/* Top Navbar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={goAdmin} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-indigo-600 hover:text-white transition-all group">
             <span className="group-hover:-translate-x-1 transition-transform">⬅</span>
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white">Whisper Studio</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outil de Transcription Automatique</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none font-bold text-sm text-slate-700 dark:text-slate-200"
          >
            <option value="ja">Japonais (JP)</option>
            <option value="en">Anglais (EN)</option>
            <option value="fr">Français (FR)</option>
          </select>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full p-8 space-y-8">
        {/* Input Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-500/5">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-3xl mb-4">🛰️</div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Importer une Source</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Collez une URL YouTube ou téléchargez un fichier audio local.</p>
          </div>

          <div className="space-y-6">
            {/* YouTube Input */}
            <div className="relative group">
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={handleUrlChange}
                disabled={isProcessing || isUploading}
                className="w-full px-8 py-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 transition-all font-bold text-slate-700 dark:text-white outline-none"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {isValidUrl && <span className="text-emerald-500">✅</span>}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ou</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
            </div>

            {/* File Upload */}
            <div 
              onClick={() => !isProcessing && !isUploading && fileInputRef.current.click()}
              className={`p-10 border-4 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all ${fileId ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400'}`}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="audio/*,video/*" />
              {isUploading ? (
                <div className="flex flex-col items-center animate-pulse">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <span className="font-black text-sm text-indigo-500 uppercase">Téléchargement...</span>
                </div>
              ) : fileId ? (
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-4">📄</span>
                  <span className="font-black text-slate-800 dark:text-white">{originalName}</span>
                  <span className="text-xs text-emerald-500 font-bold mt-1">Fichier prêt pour traitement</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <span className="text-4xl mb-4">📁</span>
                  <span className="font-black text-sm uppercase tracking-widest">Cliquer pour parcourir</span>
                </div>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={handleProcess}
              disabled={(!isValidUrl && !fileId) || isProcessing || isUploading}
              className={`w-full py-6 rounded-[2rem] font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-4 group ${(!isValidUrl && !fileId) || isProcessing || isUploading ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:scale-[1.02] active:scale-95 shadow-indigo-500/30'}`}
            >
              {isProcessing ? "Traitement en cours..." : "🚀 Lancer la Transcription"}
            </button>
          </div>
        </div>

        {/* Processing State */}
        {isProcessing && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-xl space-y-8 animate-in slide-in-from-bottom-4">
            <div className="grid grid-cols-4 gap-4">
              {steps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-3 transition-all ${progressStep >= idx ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    {progressStep > idx ? "✅" : step.icon}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${progressStep >= idx ? 'text-indigo-600' : 'text-slate-400'}`}>{step.label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                <span>{steps[progressStep]?.label || "Initialisation"}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1">
                <div className="h-full bg-indigo-600 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(79,70,229,0.5)]" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {progressStep === 3 && transcription && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-xl space-y-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 dark:text-white">Transcription Terminée ✨</h3>
              <div className="px-4 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest">Succès</div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 max-h-[300px] overflow-y-auto no-scrollbar font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">
              "{transcription}"
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3">Titre Détecté</h4>
                <p className="font-bold text-slate-800 dark:text-white line-clamp-1">{videoTitle || "Sans Titre"}</p>
              </div>
              <div className="p-6 rounded-[2rem] bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-3">Fichiers Générés</h4>
                <p className="font-bold text-slate-800 dark:text-white">SRT, Romaji SRT, MP3</p>
              </div>
            </div>

            <button 
              onClick={goAdmin}
              className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all"
            >
              Terminer et Retourner au Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
