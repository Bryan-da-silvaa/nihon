import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function AdminScreen({ goHome, goWhisper, currentUser }) {
  const { t, refreshFurigana } = useLanguage();
  const [activeTab, setActiveTab] = useState("users"); // "users" | "media" | "tools" | "settings"
  
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
  const [dbMessage, setDbMessage] = useState({ text: "", type: "" });
  const [isGeneratingFurigana, setIsGeneratingFurigana] = useState(false);
  const [furiganaMessage, setFuriganaMessage] = useState({ text: "", type: "" });
  const [isExporting, setIsExporting] = useState(false);
  const [isImportingDb, setIsImportingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState({ text: "", type: "" });
  const dbFileInputRef = useRef(null);

  // Vocabulary Migration State
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [tokenizeMessage, setTokenizeMessage] = useState({ text: "", type: "" });
  
  // Users State
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState({ text: "", type: "" });
  
  // Media State
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [mediaMessage, setMediaMessage] = useState({ text: "", type: "" });
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const fileInputRef = useRef(null);

  const loadSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings({
        whisperCommand: data.whisperCommand || "whisper",
        whisperPath: data.whisperPath || "",
        whisperModel: data.whisperModel || "base",
        ytdlpCommand: data.ytdlpCommand || "yt-dlp",
        ffmpegCommand: data.ffmpegCommand || "ffmpeg"
      });
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setIsLoadingSettings(false);
    }
  };

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

  const deleteSession = async (id) => {
    try {
      const res = await fetch(`/api/whisper/sessions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== id));
        setSessionToDelete(null);
      } else {
        alert("Erreur lors de la suppression.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateSession = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/whisper/sessions/${editingSession.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingSession.title,
          language: editingSession.language
        })
      });
      if (res.ok) {
        setSessions(prev => prev.map(s => s.id === editingSession.id ? { ...s, title: editingSession.title, language: editingSession.language } : s));
        setEditingSession(null);
      } else {
        alert("Erreur lors de la mise à jour.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startTokenization = async () => {
    setIsTokenizing(true);
    setTokenizeMessage({ text: "Analyse des sessions en cours...", type: "info" });
    try {
      const res = await fetch('/api/whisper/sessions/tokenize', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTokenizeMessage({ text: data.message, type: "success" });
        loadSessions(); // Refresh list to show transcript status
      } else {
        setTokenizeMessage({ text: data.message || "Aucune session à traiter.", type: "warning" });
      }
    } catch (err) {
      setTokenizeMessage({ text: "Erreur lors de la migration.", type: "error" });
    } finally {
      setIsTokenizing(false);
    }
  };

  const startFuriganaGeneration = async () => {
    setIsGeneratingFurigana(true);
    setFuriganaMessage({ text: "", type: "" });
    try {
      const res = await fetch('/api/admin/furigana-gen', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setFuriganaMessage({ text: `Génération terminée : ${data.count || 0} entrées.`, type: "success" });
        refreshFurigana();
      } else {
        setFuriganaMessage({ text: "Erreur lors de la génération.", type: "error" });
      }
    } catch (err) {
      setFuriganaMessage({ text: "Erreur réseau.", type: "error" });
    } finally {
      setIsGeneratingFurigana(false);
    }
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === "settings") loadSettings();
    if (activeTab === "media") loadSessions();
    if (activeTab === "users") loadUsers();
  }, [activeTab]);

  const sidebarItems = [
    { id: "users", label: "Utilisateurs", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )},
    { id: "media", label: "Bibliothèque", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20M4 14.5A2.5 2.5 0 016.5 12H20M4 9.5A2.5 2.5 0 016.5 7H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    )},
    { id: "tools", label: "Outils Système", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
    { id: "settings", label: "Configuration", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    )},
  ];

  return (
    <div className="flex w-full h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-left">
      {/* Admin Sidebar */}
      <div className="w-80 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col p-8 shrink-0">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-black">N</div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-white leading-none mb-1">Administration</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nihon Platform</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${activeTab === item.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            >
              <span className="shrink-0">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button 
          onClick={goHome}
          className="mt-8 flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 transition-all border border-transparent hover:border-rose-200 group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Quitter
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto p-12 lg:p-16">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <header className="mb-12">
            <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
              {sidebarItems.find(i => i.id === activeTab)?.label}
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
              Gestion centralisée de la plateforme Nihon.
            </p>
          </header>

          {/* Content Cards */}
          <div className="animate-fade-in">
            {activeTab === "users" && (
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Utilisateur</th>
                      <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Inscrit le</th>
                      <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Rôle</th>
                      <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {isLoadingUsers ? (
                      <tr><td colSpan="4" className="p-12 text-center text-slate-400 font-bold animate-pulse">Chargement...</td></tr>
                    ) : users.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center font-black">
                              {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.username[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-black text-slate-800 dark:text-white">{user.username}</div>
                              <div className="text-xs font-bold text-slate-400">ID: {user.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm font-bold text-slate-500">{new Date(user.created_at).toLocaleDateString()}</td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.is_admin ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40" : "bg-slate-100 text-slate-600 dark:bg-slate-800"}`}>
                            {user.is_admin ? "Administrateur" : "Membre"}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-4 py-2 rounded-xl font-bold transition-all text-sm">Supprimer</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "media" && (
              <div className="space-y-8">
                <div className="flex justify-between items-center bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-500/20">
                  <div>
                    <h3 className="text-2xl font-black mb-1">Indexation Média</h3>
                    <p className="text-indigo-100 font-medium">Synchronisez les fichiers locaux ou importez via URL.</p>
                  </div>
                  <button 
                    onClick={goWhisper}
                    className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    Nouvel Import
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                   <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                     <h3 className="font-black text-slate-800 dark:text-white">Sessions Récentes</h3>
                   </div>
                   <div className="divide-y divide-slate-100 dark:divide-slate-800">
                     {sessions.map(session => (
                       <div key={session.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex items-center justify-between">
                         <div className="flex items-center gap-6">
                           <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                             {session.video_filename ? (
                               <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                 <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4zM5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                               </svg>
                             ) : (
                               <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                 <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                               </svg>
                             )}
                           </div>
                           <div>
                             <h4 className="font-black text-slate-800 dark:text-white mb-1">{session.title}</h4>
                             <div className="flex gap-4">
                               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{session.language}</span>
                               <span className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1 ${session.has_transcript ? "text-emerald-500" : "text-rose-500"}`}>
                                 {session.has_transcript ? (
                                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                     <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                   </svg>
                                 ) : (
                                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                     <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                   </svg>
                                 )}
                                 {session.has_transcript ? "Transcrit" : "Sans transcript"}
                               </span>
                             </div>
                           </div>
                         </div>
                         <div className="flex gap-2">
                           <button 
                             onClick={() => setEditingSession(session)}
                             className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                           >
                             Éditer
                           </button>
                           <button 
                             onClick={() => setSessionToDelete(session)}
                             className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-100 transition-all"
                           >
                             Supprimer
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            )}

            {activeTab === "tools" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Furigana Generator Card */}
                  <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col group">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5c-1.043 2.56-2.446 4.946-4.177 7.132" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-black mb-2 tracking-tight">Générateur Furigana</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-8 flex-grow">Recherche et génère les lectures furigana pour tous les transcripts de la base de données.</p>
                    <button 
                      disabled={isGeneratingFurigana}
                      onClick={startFuriganaGeneration}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isGeneratingFurigana ? "Traitement..." : "Lancer la Génération"}
                    </button>
                    {furiganaMessage.text && (
                      <p className={`mt-4 text-center font-bold text-[10px] uppercase tracking-widest ${furiganaMessage.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {furiganaMessage.text}
                      </p>
                    )}
                  </div>

                  {/* Vocabulary Migration Card */}
                  <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col group">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-black mb-2 tracking-tight">Migration Vocabulaire</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-8 flex-grow">Analyse les anciennes sessions pour rendre les mots cliquables dans le lecteur.</p>
                    <button
                      onClick={startTokenization}
                      disabled={isTokenizing}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isTokenizing ? "Migration..." : "Lancer la Migration"}
                    </button>
                    {tokenizeMessage.text && (
                      <p className={`mt-4 text-center font-bold text-[10px] uppercase tracking-widest ${tokenizeMessage.type === 'success' ? 'text-emerald-500' : tokenizeMessage.type === 'info' ? 'text-indigo-500' : 'text-rose-500'}`}>
                        {tokenizeMessage.text}
                      </p>
                    )}
                  </div>
                </div>

                {/* Database Maintenance Card */}
                <div className="p-10 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/50 shadow-sm overflow-hidden relative">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-black tracking-tight">Maintenance de la Base</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Sauvegarde & Restauration SQL</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={async () => {
                          setIsExporting(true);
                          try {
                            const res = await fetch('/api/admin/db/export');
                            if (res.ok) {
                              const sqlText = await res.text();
                              const url = window.URL.createObjectURL(new Blob([sqlText], { type: 'application/sql' }));
                              const link = document.createElement('a');
                              link.href = url;
                              link.setAttribute('download', `nihon_dump_${new Date().toISOString().split('T')[0]}.sql`);
                              document.body.appendChild(link);
                              link.click();
                              link.remove();
                              setDbStatus({ text: "Exportation réussie !", type: "success" });
                            }
                          } catch (err) {} finally { setIsExporting(false); }
                        }}
                        className="px-8 py-4 bg-slate-800 dark:bg-slate-700 text-white rounded-2xl font-black text-sm shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                        disabled={isExporting || isImportingDb}
                      >
                        {isExporting ? "Exportation..." : "Exporter (SQL)"}
                      </button>

                      <button 
                        onClick={() => dbFileInputRef.current?.click()}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all disabled:opacity-50"
                        disabled={isExporting || isImportingDb}
                      >
                        {isImportingDb ? "Importation..." : "Importer (SQL)"}
                      </button>
                      <input 
                        type="file" 
                        ref={dbFileInputRef} 
                        className="hidden" 
                        accept=".sql"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          
                          if (!confirm("Attention : l'importation SQL écrasera TOUTES les données actuelles. Continuer ?")) {
                            e.target.value = null;
                            return;
                          }

                          setIsImportingDb(true);
                          setDbStatus({ text: "Importation SQL en cours...", type: "info" });
                          
                          try {
                            const reader = new FileReader();
                            reader.onload = async (event) => {
                              try {
                                const sqlContent = event.target.result;
                                const res = await fetch('/api/admin/db/import', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ sql: sqlContent })
                                });
                                if (res.ok) {
                                  setDbStatus({ text: "Restauration SQL terminée avec succès !", type: "success" });
                                } else {
                                  setDbStatus({ text: "Erreur lors de la restauration SQL.", type: "error" });
                                }
                              } catch (err) {
                                setDbStatus({ text: "Fichier SQL invalide.", type: "error" });
                              } finally {
                                setIsImportingDb(false);
                                e.target.value = null;
                              }
                            };
                            reader.readAsText(file);
                          } catch (err) {
                            setDbStatus({ text: "Erreur de lecture du fichier.", type: "error" });
                            setIsImportingDb(false);
                            e.target.value = null;
                          }
                        }}
                      />
                    </div>
                  </div>

                  {dbStatus.text && (
                    <p className={`mt-6 text-center font-black text-[10px] uppercase tracking-widest ${dbStatus.type === 'success' ? 'text-emerald-500' : 'text-indigo-500'}`}>
                      {dbStatus.text}
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl p-10">
                <div className="space-y-6">
                   {Object.keys(settings).map(key => (
                     <div key={key} className="space-y-2">
                       <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{key}</label>
                       <input
                         type="text"
                         value={settings[key]}
                         onChange={e => setSettings({...settings, [key]: e.target.value})}
                         className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-2xl font-bold focus:outline-none transition-all"
                       />
                     </div>
                   ))}
                   <button 
                     onClick={async () => {
                       setIsSavingSettings(true);
                       await fetch('/api/settings', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify(settings)
                       });
                       setIsSavingSettings(false);
                       setSaveMessage("Configuration sauvegardée !");
                       setTimeout(() => setSaveMessage(""), 3000);
                     }}
                     className="w-full py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-black text-lg mt-6 shadow-xl"
                   >
                     {isSavingSettings ? "Sauvegarde..." : "Enregistrer la Configuration"}
                   </button>
                   {saveMessage && <p className="text-center font-bold text-emerald-500 animate-fade-in">{saveMessage}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Session Modal */}
      {editingSession && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in text-left">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 w-full max-w-xl shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-2xl font-black mb-8">Éditer la Session</h3>
            <form onSubmit={updateSession} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Titre</label>
                <input
                  type="text"
                  value={editingSession.title}
                  onChange={e => setEditingSession({...editingSession, title: e.target.value})}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-2xl font-bold focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Langue (Code)</label>
                <input
                  type="text"
                  value={editingSession.language}
                  onChange={e => setEditingSession({...editingSession, language: e.target.value})}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-2xl font-bold focus:outline-none transition-all"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-fade-in text-center">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 scale-in-center">
            <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-4">Confirmation</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-10">
              Voulez-vous vraiment supprimer <span className="text-rose-500 font-black">"{sessionToDelete.title}"</span> ? Cette action est irréversible.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => deleteSession(sessionToDelete.id)}
                className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-all"
              >
                Oui, supprimer définitivement
              </button>
              <button 
                onClick={() => setSessionToDelete(null)}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
