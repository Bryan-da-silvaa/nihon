import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function AdminScreen({ goHome, goWhisper, currentUser }) {
  const { t, refreshFurigana } = useLanguage();
  const [activeTab, setActiveTab] = useState("tools");
  
  // Settings State
  const [settings, setSettings] = useState({
    whisperCommand: "whisper",
    whisperPath: "",
    whisperModel: "base",
    ytdlpCommand: "yt-dlp",
    ffmpegCommand: "ffmpeg"
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [dbMessage, setDbMessage] = useState({ text: "", type: "" });
  const [isGeneratingFurigana, setIsGeneratingFurigana] = useState(false);
  const [furiganaMessage, setFuriganaMessage] = useState({ text: "", type: "" });
  
  // Media State
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [mediaMessage, setMediaMessage] = useState({ text: "", type: "" });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (activeTab === "settings") {
      setIsLoadingSettings(true);
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          setSettings({
            whisperCommand: data.whisperCommand || "whisper",
            whisperPath: data.whisperPath || "",
            whisperModel: data.whisperModel || "base",
            ytdlpCommand: data.ytdlpCommand || "yt-dlp",
            ffmpegCommand: data.ffmpegCommand || "ffmpeg"
          });
          setIsLoadingSettings(false);
        })
        .catch(err => {
          console.error("Error loading settings:", err);
          setIsLoadingSettings(false);
        });
    }
    if (activeTab === "media") {
      loadSessions();
    }
  }, [activeTab]);

  const saveSettings = async () => {
    setIsSavingSettings(true);
    setSaveMessage("");
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSaveMessage(t("admin.settings.saveSuccess"));
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage(t("admin.settings.saveError"));
      }
    } catch (e) {
      setSaveMessage(t("admin.settings.saveError"));
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleExportDB = () => {
    window.open('/api/db/export', '_blank');
  };

  const handleImportDB = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm(t("admin.settings.importWarning"))) {
      e.target.value = null;
      return;
    }

    setIsImporting(true);
    setDbMessage({ text: t("admin.settings.importing"), type: "info" });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/db/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (res.ok) {
        setDbMessage({ text: t("admin.settings.importSuccess"), type: "success" });
      } else {
        setDbMessage({ text: `Erreur: ${data.error}`, type: "error" });
      }
    } catch (err) {
      setDbMessage({ text: t("admin.settings.importError"), type: "error" });
    } finally {
      setIsImporting(false);
      e.target.value = null;
      setTimeout(() => setDbMessage({ text: "", type: "" }), 5000);
    }
  };

  // Media functions
  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const res = await fetch('/api/whisper/sessions');
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleSyncMedia = async () => {
    setIsSyncing(true);
    setMediaMessage({ text: "", type: "" });
    try {
      const res = await fetch('/api/whisper/sessions/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMediaMessage({ text: t("admin.media.syncSuccess").replace("{count}", data.imported), type: "success" });
        await loadSessions();
      } else {
        setMediaMessage({ text: data.error, type: "error" });
      }
    } catch (err) {
      setMediaMessage({ text: t("admin.media.syncError"), type: "error" });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setMediaMessage({ text: "", type: "" }), 5000);
    }
  };

  const handleExportSession = async (id) => {
    try {
      const res = await fetch(`/api/whisper/sessions/${id}`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.title || 'session'}_export.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleDeleteSession = async (id) => {
    if (!confirm(t("admin.media.deleteConfirm"))) return;
    try {
      await fetch('/api/whisper/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await loadSessions();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleGenerateFurigana = async () => {
    setIsGeneratingFurigana(true);
    setFuriganaMessage({ text: t("admin.settings.furiganaGenerating"), type: "info" });

    try {
      const res = await fetch('/api/furigana/generate', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        const msg = t("admin.settings.furiganaSuccess").replace("{count}", data.count);
        // Save to localStorage because the file change triggers a hot-reload in dev
        localStorage.setItem("furigana_msg", JSON.stringify({ text: msg, type: "success", ts: Date.now() }));
        setFuriganaMessage({ text: msg, type: "success" });
        // Refresh furigana data in the app context
        await refreshFurigana();
      } else {
        setFuriganaMessage({ text: `Erreur: ${data.error}`, type: "error" });
      }
    } catch (err) {
      setFuriganaMessage({ text: t("admin.settings.furiganaError"), type: "error" });
    } finally {
      setIsGeneratingFurigana(false);
    }
  };

  // Recover furigana success message after hot-reload
  useEffect(() => {
    const saved = localStorage.getItem("furigana_msg");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only show if less than 10 seconds old
        if (Date.now() - parsed.ts < 10000) {
          setFuriganaMessage({ text: parsed.text, type: parsed.type });
          setTimeout(() => {
            setFuriganaMessage({ text: "", type: "" });
            localStorage.removeItem("furigana_msg");
          }, 5000);
        } else {
          localStorage.removeItem("furigana_msg");
        }
      } catch (_) {
        localStorage.removeItem("furigana_msg");
      }
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-full text-left py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <h2 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-500 dark:from-white dark:to-gray-400 drop-shadow-sm mb-2">
            {t("admin.title")}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
            {t("admin.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm font-semibold">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
          </span>
          {t("admin.loggedInAs").replace("{username}", currentUser?.username || "Admin")}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-700 pb-px">
        <button 
          onClick={() => setActiveTab("tools")}
          className={`pb-4 px-2 font-bold text-lg transition-colors border-b-4 ${activeTab === "tools" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          {t("admin.tabs.tools")}
        </button>
        <button 
          onClick={() => setActiveTab("users")}
          className={`pb-4 px-2 font-bold text-lg transition-colors border-b-4 ${activeTab === "users" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          {t("admin.tabs.users")}
        </button>
        <button 
          onClick={() => setActiveTab("settings")}
          className={`pb-4 px-2 font-bold text-lg transition-colors border-b-4 ${activeTab === "settings" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          {t("admin.tabs.settings")}
        </button>
        <button 
          onClick={() => setActiveTab("media")}
          className={`pb-4 px-2 font-bold text-lg transition-colors border-b-4 ${activeTab === "media" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          {t("admin.tabs.media")}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full relative">
        {activeTab === "tools" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tool Card: Whisper */}
            <div className="relative group rounded-[2.5rem] overflow-hidden border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              
              <div className="p-8 sm:p-10 flex flex-col flex-1 relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                    🎙️
                  </div>
                  <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                    {t("admin.tools.beta")}
                  </span>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">{t("admin.tools.whisperTitle")}</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8 flex-1 leading-relaxed">
                  {t("admin.tools.whisperDesc")}
                </p>
                
                <button 
                  onClick={goWhisper}
                  className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-300"
                >
                  {t("admin.tools.openTool")}
                </button>
              </div>
            </div>

            {/* Placeholder Tool Card */}
            <div className="relative group rounded-[2.5rem] overflow-hidden border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col opacity-75 grayscale hover:grayscale-0">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              
              <div className="p-8 sm:p-10 flex flex-col flex-1 relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                    🗂️
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">{t("admin.tools.decksTitle")}</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8 flex-1 leading-relaxed">
                  {t("admin.tools.decksDesc")}
                </p>
                
                <button className="w-full py-4 bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  {t("admin.tools.configure")}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="w-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-sm min-h-[300px]">
             <div className="text-6xl mb-4 opacity-50">👥</div>
             <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t("admin.tools.usersTitle")}</h3>
             <p className="text-gray-500 dark:text-gray-400 max-w-md">{t("admin.tools.usersDesc")}</p>
          </div>
        )}

        {activeTab === "media" && (
          <div className="w-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-3xl p-8 flex flex-col shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl">🎵</div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{t("admin.media.title")}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{t("admin.media.desc")}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSyncMedia}
                disabled={isSyncing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSyncing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <span>🔄</span>
                )}
                {isSyncing ? t("admin.media.syncing") : t("admin.media.syncBtn")}
              </button>
            </div>

            {mediaMessage.text && (
              <div className={`mb-6 p-4 rounded-xl font-medium text-sm ${
                mediaMessage.type === 'success' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {mediaMessage.text}
              </div>
            )}

            {isLoadingSessions ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="text-5xl mb-4 opacity-50">📭</div>
                <p className="font-semibold">{t("admin.media.empty")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map(session => (
                  <div key={session.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gray-50/80 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl hover:shadow-md transition-shadow">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-800 dark:text-white truncate">{session.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>🎵 {session.audio_filename}</span>
                        <span>📅 {new Date(session.created_at).toLocaleDateString()}</span>
                        {session.language && session.language !== 'auto' && <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">{session.language}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleExportSession(session.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-1"
                      >
                        <span>📥</span> {t("admin.media.exportBtn")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSession(session.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-1"
                      >
                        <span>🗑️</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="w-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-3xl p-8 flex flex-col shadow-sm">
            <div className="flex items-center gap-4 mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
              <div className="text-4xl">⚙️</div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{t("admin.settings.title")}</h3>
                <p className="text-gray-500 dark:text-gray-400">{t("admin.settings.description")}</p>
              </div>
            </div>
            
            {isLoadingSettings ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="space-y-8 max-w-3xl">
                
                <div className="bg-gray-50/50 dark:bg-gray-900/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><span>✨</span> {t("admin.settings.iaConfig")}</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t("admin.settings.cmdLabel")}</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t("admin.settings.cmdDesc")}</p>
                      <input 
                        type="text" 
                        value={settings.whisperCommand} 
                        onChange={(e) => setSettings({...settings, whisperCommand: e.target.value})}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t("admin.settings.pathLabel")}</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t("admin.settings.pathDesc")}</p>
                      <input 
                        type="text" 
                        value={settings.whisperPath} 
                        onChange={(e) => setSettings({...settings, whisperPath: e.target.value})}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t("admin.settings.modelLabel")}</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t("admin.settings.modelDesc")}</p>
                      <input 
                        type="text" 
                        value={settings.whisperModel} 
                        onChange={(e) => setSettings({...settings, whisperModel: e.target.value})}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder={t("admin.settings.modelPlaceholder")}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50/50 dark:bg-gray-900/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 mt-8">
                  <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><span>💾</span> {t("admin.settings.dbTitle")}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t("admin.settings.dbDesc")}</p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handleExportDB}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span>📥</span> {t("admin.settings.exportBtn")}
                    </button>
                    
                    <div className="flex-1 relative">
                      <input 
                        type="file" 
                        accept=".sql" 
                        ref={fileInputRef}
                        onChange={handleImportDB}
                        className="hidden" 
                        id="db-import"
                      />
                      <label 
                        htmlFor="db-import"
                        className={`w-full cursor-pointer bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        {isImporting ? (
                           <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                          <span>📤</span>
                        )}
                        <span>{isImporting ? t("admin.settings.importing") : t("admin.settings.importBtn")}</span>
                      </label>
                    </div>
                  </div>
                  
                  {dbMessage.text && (
                    <div className={`mt-4 p-4 rounded-xl font-medium text-sm ${
                      dbMessage.type === 'success' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      dbMessage.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {dbMessage.text}
                    </div>
                  )}
                </div>

                <div className="bg-gray-50/50 dark:bg-gray-900/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 mt-8">
                  <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><span>🔤</span> {t("admin.settings.furiganaTitle")}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t("admin.settings.furiganaDesc")}</p>
                  
                  <button
                    type="button"
                    onClick={handleGenerateFurigana}
                    disabled={isGeneratingFurigana}
                    className={`bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${isGeneratingFurigana ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {isGeneratingFurigana ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <span>⚡</span>
                    )}
                    <span>{isGeneratingFurigana ? t("admin.settings.furiganaGenerating") : t("admin.settings.furiganaBtn")}</span>
                  </button>
                  
                  {furiganaMessage.text && (
                    <div className={`mt-4 p-4 rounded-xl font-medium text-sm ${
                      furiganaMessage.type === 'success' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      furiganaMessage.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {furiganaMessage.text}
                    </div>
                  )}
                </div>

                <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  {saveMessage && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-100 dark:bg-emerald-900/30 px-4 py-2 rounded-lg">
                      {saveMessage}
                    </span>
                  )}
                  {!saveMessage && <div></div>}
                  <button 
                    onClick={saveSettings}
                    disabled={isSavingSettings}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSavingSettings ? t("admin.settings.saving") : `💾 ${t("admin.settings.saveButton")}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
    </div>
  );
}
