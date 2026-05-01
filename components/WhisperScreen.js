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
      alert(t("whisper.uploadError"));
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
        // Error
        sse.close();
        setIsProcessing(false);
        setProgressStep(-1);
        alert(t("whisper.processError") + " " + data.data.error);
        return;
      }

      setProgressStep(data.step);
      setProgressPercent(data.percent);

      if (data.step === 3) {
        // Done
        sse.close();
        setIsProcessing(false);
        setTranscription(data.data.text);
        setVideoTitle(data.data.title);
        setGeneratedFiles({
          audio: data.data.audioFile,
          subs: data.data.transcriptFile,
          romaji: data.data.romajiFile
        });
      }
    };

    sse.onerror = () => {
      sse.close();
      setIsProcessing(false);
      setProgressStep(-1);
      alert(t("whisper.connectionLost"));
    };
  };

  return (
    <div className="flex flex-col w-full h-full text-left py-6">
      {/* Premium Sticky Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md px-4 py-3 rounded-2xl shadow-sm">
        <button 
          onClick={goAdmin} 
          className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 px-4 py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-bold transition-colors shadow-sm text-sm"
        >
          <span>⬅</span> <span>{t("whisper.backToAdmin")}</span>
        </button>
        <div className="flex items-center gap-2">
           <span className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-red-200 dark:border-red-800/50">
             YouTube
           </span>
           <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/50">
             Whisper IA
           </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full flex flex-col items-center">
        {/* Title Section */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-red-500/30 mb-6 animate-pulse-slow">
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <h2 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-500 dark:from-white dark:to-gray-400 drop-shadow-sm mb-4">
            {t("whisper.title")}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg max-w-2xl mx-auto">
            {t("whisper.subtitle")}
          </p>
        </div>

        {/* Input Zone */}
        <div className={`w-full max-w-2xl relative group rounded-[2.5rem] overflow-hidden border-2 transition-all duration-300 flex flex-col p-8 sm:p-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md shadow-sm
            ${isValidUrl ? 'border-emerald-500 shadow-xl' : 'border-gray-200 dark:border-gray-700'}
            ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <label htmlFor="youtube-url" className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2 uppercase tracking-wide">
            {t("whisper.youtubeLabel")}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-2xl">
              🔗
            </div>
            <input 
              id="youtube-url"
              type="text" 
              placeholder={t("whisper.youtubePlaceholder")}
              value={youtubeUrl}
              onChange={handleUrlChange}
              disabled={isProcessing}
              className={`w-full pl-12 pr-4 py-5 rounded-2xl text-lg font-medium transition-all duration-300 outline-none border-2
                ${isValidUrl 
                  ? 'border-emerald-400 dark:border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-900/10 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 text-emerald-800 dark:text-emerald-100' 
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900/50 focus:border-red-400 focus:ring-4 focus:ring-red-500/20 text-gray-800 dark:text-white'}
              `}
            />
            {isValidUrl && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </span>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex items-center justify-center">
             <div className="h-[1px] w-full bg-gray-200 dark:bg-gray-700"></div>
             <span className="px-4 text-xs font-bold text-gray-400 uppercase">{t("whisper.or")}</span>
             <div className="h-[1px] w-full bg-gray-200 dark:bg-gray-700"></div>
          </div>
          
          <div className="mt-4">
            <input 
              type="file" 
              accept="audio/*,video/*" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden" 
              id="media-upload"
              disabled={isProcessing || isUploading}
            />
            <label 
              htmlFor="media-upload"
              className={`w-full cursor-pointer flex flex-col items-center justify-center py-6 px-4 rounded-2xl border-2 border-dashed transition-all
                ${fileId 
                  ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400'}
                ${isUploading ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
              ) : (
                <div className="text-3xl mb-2">📁</div>
              )}
              <span className="font-medium text-center">
                {isUploading ? t("whisper.uploading") : 
                 fileId ? t("whisper.fileReady").replace("{filename}", originalName) : 
                 t("whisper.uploadLabel")}
              </span>
            </label>
          </div>
        </div>

        {/* Action Bar (Only shows when ready and NOT processing/done) */}
        {(isValidUrl || fileId) && progressStep === -1 && (
          <div className="w-full max-w-2xl mt-8 transition-all duration-500 opacity-100 translate-y-0 animate-in slide-in-from-bottom-4">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-3xl p-6 shadow-lg flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col w-full sm:w-auto">
                <label className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">{t("whisper.langLabel")}</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 font-medium text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="auto">{t("whisper.langAuto")}</option>
                  <option value="ja">{t("whisper.langJa")}</option>
                  <option value="fr">{t("whisper.langFr")}</option>
                  <option value="en">{t("whisper.langEn")}</option>
                </select>
              </div>
              
              <button 
                onClick={handleProcess}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 via-purple-500 to-indigo-600 hover:shadow-purple-500/30 hover:scale-105 active:scale-95"
              >
                🚀 {t("whisper.startButton")}
              </button>
            </div>
          </div>
        )}

        {/* Progress UI */}
        {(progressStep >= 0) && (
          <div className="w-full max-w-2xl mt-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-xl flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
            
            <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-3">
              {progressStep === 3 ? t("whisper.stepDone") : t("whisper.stepProcessing")}
            </h3>
            
            {/* Steps list */}
            <div className="space-y-6 relative z-10">
              {[
                { name: t("whisper.step1"), emoji: "📥" },
                { name: t("whisper.step2"), emoji: "🎵" },
                { name: t("whisper.step3"), emoji: "✨" }
              ].map((step, idx) => {
                const isActive = progressStep === idx;
                const isPast = progressStep > idx;
                const isPending = progressStep < idx;
                
                let percentToDisplay = 0;
                if (isActive) percentToDisplay = progressPercent;
                else if (isPast) percentToDisplay = 100;

                return (
                  <div key={idx} className={`flex flex-col gap-2 transition-all duration-500 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className={`${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        {step.emoji} {step.name}
                      </span>
                      <span className={isActive ? 'text-indigo-600 dark:text-indigo-400' : isPast ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-500'}>
                        {percentToDisplay}%
                      </span>
                    </div>
                    {/* Progress Bar Track */}
                    <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                      {/* Progress Bar Fill */}
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${isPast ? 'bg-emerald-500' : isActive ? 'bg-indigo-500 relative' : 'bg-transparent'}`}
                        style={{ width: `${percentToDisplay}%` }}
                      >
                        {isActive && (
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {progressStep === 3 && (
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 flex flex-col items-center animate-in fade-in zoom-in duration-500">
                <div className="w-full text-center mb-6">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    {videoTitle || t("whisper.doneDefaultTitle")}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t("whisper.doneSubtitle")}</p>
                </div>
                
                {generatedFiles && (
                  <div className="w-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 mb-6 flex flex-col gap-2 text-sm text-emerald-800 dark:text-emerald-400">
                    <p className="font-bold">{t("whisper.filesTitle")} :</p>
                    <ul className="list-disc list-inside opacity-90 pl-2">
                      <li>🎵 {t("whisper.audioFile")} : {generatedFiles.audio}</li>
                      <li>🇯🇵 {t("whisper.subsFile")} : {generatedFiles.subs}</li>
                      {generatedFiles.romaji && <li>🔤 {t("whisper.romajiFile")} : {generatedFiles.romaji}</li>}
                    </ul>
                  </div>
                )}
                
                <div className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-6 shadow-inner relative group">
                  <div className="absolute top-4 right-4 text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 px-3 py-1 rounded-full">
                    {t("whisper.resultTitle")}
                  </div>
                  <textarea 
                    readOnly 
                    className="w-full h-64 bg-transparent outline-none text-gray-700 dark:text-gray-300 resize-none font-medium text-lg leading-relaxed"
                    value={transcription || t("whisper.emptyTranscription")}
                  />
                </div>
                
                <button 
                  onClick={() => { setProgressStep(-1); setYoutubeUrl(""); setIsValidUrl(false); setTranscription(""); setVideoTitle(""); setGeneratedFiles(null); }}
                  className="px-8 py-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold rounded-xl transition-colors flex items-center gap-2"
                >
                  <span>🔄</span> {t("whisper.restartBtn")}
                </button>
              </div>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
}
