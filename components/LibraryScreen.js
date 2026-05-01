import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function LibraryScreen({ goHome, goPlayer, currentUser }) {
  const { t, tNode } = useLanguage();
  const [view, setView] = useState("library"); // "library" | "catalog"
  const [library, setLibrary] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInputSession, setTagInputSession] = useState(null);
  const [newTagVal, setNewTagVal] = useState("");

  useEffect(() => {
    if (view === "library") loadLibrary();
    else loadCatalog();
  }, [view]);

  const loadLibrary = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/library?userId=${currentUser.id}`);
      const data = await res.json();
      setLibrary(data.library || []);
    } catch (err) {
      console.error("Failed to load library:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCatalog = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/library/catalog?userId=${currentUser.id}`);
      const data = await res.json();
      setCatalog(data.catalog || []);
    } catch (err) {
      console.error("Failed to load catalog:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const addToLibrary = async (sessionId) => {
    try {
      await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, sessionId }),
      });
      setCatalog(prev => prev.map(s => s.id === sessionId ? { ...s, inLibrary: 1 } : s));
    } catch (err) {
      console.error("Failed to add:", err);
    }
  };

  const removeFromLibrary = async (sessionId) => {
    try {
      await fetch("/api/library", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, sessionId }),
      });
      if (view === "library") {
        setLibrary(prev => prev.filter(s => s.id !== sessionId));
      } else {
        setCatalog(prev => prev.map(s => s.id === sessionId ? { ...s, inLibrary: 0 } : s));
      }
    } catch (err) {
      console.error("Failed to remove:", err);
    }
  };

  const addTag = async (sessionId, tagName) => {
    if (!tagName.trim()) {
      setTagInputSession(null);
      return;
    }
    try {
      const res = await fetch("/api/library/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, sessionId, tagName }),
      });
      const data = await res.json();
      if (data.success) {
        const updateState = (prev) => prev.map(s => {
          if (s.id === sessionId) {
            const existingTags = s.tags || [];
            if (!existingTags.includes(data.tag)) {
              return { ...s, tags: [...existingTags, data.tag], inLibrary: 1 };
            }
          }
          return s;
        });
        setLibrary(updateState);
        setCatalog(updateState);
      }
    } catch (err) {
      console.error("Failed to add tag:", err);
    }
    setTagInputSession(null);
    setNewTagVal("");
  };

  const removeTag = async (sessionId, tagName) => {
    try {
      const res = await fetch("/api/library/tags", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, sessionId, tagName }),
      });
      const data = await res.json();
      if (data.success) {
        const updateState = (prev) => prev.map(s => {
          if (s.id === sessionId) {
            return { ...s, tags: (s.tags || []).filter(t => t !== tagName) };
          }
          return s;
        });
        setLibrary(updateState);
        setCatalog(updateState);
        // Remove tag from selected filter if no longer exists in current items
        // (optional, but good practice)
      }
    } catch (err) {
      console.error("Failed to remove tag:", err);
    }
  };

  const items = view === "library" ? library : catalog;

  const getTagsForItem = (session) => {
    const tags = [];
    if (session.video_filename) tags.push({ type: 'system', name: 'Vidéo' });
    else tags.push({ type: 'system', name: 'Audio' });
    
    if (session.language && session.language !== "auto") {
       tags.push({ type: 'system', name: session.language.toUpperCase() });
    }
    
    if (session.tags && Array.isArray(session.tags)) {
      session.tags.forEach(t => {
        if (t) tags.push({ type: 'user', name: t });
      });
    }
    return tags;
  };

  const allTags = Array.from(new Set(items.flatMap(s => getTagsForItem(s).map(t => t.name)))).sort();

  const toggleTagFilter = (tagName) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const filtered = items.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;
    if (selectedTags.length === 0) return true;
    
    const itemTagNames = getTagsForItem(s).map(t => t.name);
    return selectedTags.every(tag => itemTagNames.includes(tag));
  });

  const getTagColorClass = (tag) => {
    if (tag.type === 'system') {
      if (tag.name === 'Vidéo') return 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400';
      if (tag.name === 'Audio') return 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400';
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400';
    }
    
    // User tags custom colors
    const name = tag.name.toLowerCase();
    switch (name) {
      case 'youtube': return 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400';
      case 'twitch': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400';
      case 'stream': return 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400';
      case 'n5':
      case 'n4':
      case 'n3':
      case 'n2':
      case 'n1': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400';
      case 'vlog': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400';
      case 'anime': return 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400';
      case 'podcast': return 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/40 dark:text-fuchsia-400';
      case 'grammaire':
      case 'vocabulaire': return 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-400';
      default: return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300';
    }
  };

  return (
    <div className="flex flex-col w-full h-full text-left py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-500 dark:from-white dark:to-gray-400 drop-shadow-sm mb-2">
            📚 {tNode("library.title")}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
            {t("library.subtitle")}
          </p>
        </div>
        <button
          onClick={goHome}
          className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 px-4 py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-bold transition-colors shadow-sm text-sm"
        >
          <span>⬅</span> {t("library.backToHome")}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 pb-px">
        <button
          onClick={() => setView("library")}
          className={`pb-3 px-2 font-bold text-lg transition-colors border-b-4 ${
            view === "library"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          🎧 {t("library.myLibrary")}
        </button>
        <button
          onClick={() => setView("catalog")}
          className={`pb-3 px-2 font-bold text-lg transition-colors border-b-4 ${
            view === "catalog"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          🗂️ {t("library.catalog")}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4">
        <input
          type="text"
          placeholder={t("library.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
        
        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-bold text-gray-500 dark:text-gray-400 py-1 mr-2">Filtres :</span>
            {allTags.map(tagName => {
              const isSelected = selectedTags.includes(tagName);
              // Pseudo-tag creation to reuse getTagColorClass if selected, else default gray
              const tagObj = { type: 'user', name: tagName }; 
              // check if it's a system tag
              if (['Vidéo', 'Audio'].includes(tagName) || ['JA','FR','EN'].includes(tagName.toUpperCase())) {
                tagObj.type = 'system';
              }
              const colorClass = isSelected ? getTagColorClass(tagObj) : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600";
              
              return (
                <button
                  key={tagName}
                  onClick={() => toggleTagFilter(tagName)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors shadow-sm ${colorClass}`}
                >
                  {tagName}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <div className="text-6xl mb-4 opacity-50">{view === "library" ? "📭" : "🗂️"}</div>
          <p className="font-semibold text-lg">
            {view === "library" ? t("library.emptyLibrary") : t("library.emptyCatalog")}
          </p>
          {view === "library" && (
            <button
              onClick={() => setView("catalog")}
              className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
            >
              {t("library.browseCatalog")}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((session) => (
            <div
              key={session.id}
              className={`group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-6 transition-all duration-300 flex flex-col ${
                tagInputSession === session.id 
                  ? 'z-50 shadow-2xl ring-2 ring-indigo-500 scale-[1.02]' 
                  : 'z-10 hover:z-20 hover:shadow-xl hover:-translate-y-1'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-500/20">
                  {session.video_filename ? "🎬" : "🎵"}
                </div>
              </div>

              {/* Title */}
              <h3 className="font-bold text-gray-800 dark:text-white mb-2 line-clamp-2 leading-snug">
                {session.title}
              </h3>

              {/* Tags Section */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {getTagsForItem(session).map((tag, idx) => (
                  <span 
                    key={idx} 
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getTagColorClass(tag)}`}
                  >
                    {tag.name}
                    {tag.type === 'user' && (
                      <button 
                        onClick={() => removeTag(session.id, tag.name)}
                        className="ml-1 hover:text-red-500 opacity-60 hover:opacity-100 focus:outline-none"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                ))}
                
                {/* Add Tag Button / Input */}
                {tagInputSession === session.id ? (
                  <div className="relative inline-flex items-center bg-gray-100 dark:bg-gray-700 rounded px-1">
                    <input
                      type="text"
                      autoFocus
                      className="bg-transparent text-[10px] font-bold w-16 px-1 outline-none text-gray-800 dark:text-white"
                      value={newTagVal}
                      onChange={e => setNewTagVal(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') addTag(session.id, newTagVal);
                        if (e.key === 'Escape') setTagInputSession(null);
                      }}
                      onBlur={() => setTimeout(() => setTagInputSession(null), 150)}
                      placeholder="tag..."
                    />
                    <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto py-1">
                      {["YouTube", "Twitch", "Stream", "Vlog", "Anime", "Podcast", "N5", "N4", "N3", "N2", "N1", "Grammaire", "Vocabulaire"]
                        .filter(t => t.toLowerCase().includes(newTagVal.toLowerCase()))
                        .map(tag => (
                        <button
                          key={tag}
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent input blur
                            addTag(session.id, tag);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setTagInputSession(session.id)}
                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    ➕ Tag
                  </button>
                )}
              </div>

              {/* Meta */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
                📅 {new Date(session.created_at).toLocaleDateString()}
              </p>

              {/* Actions */}
              <div className="mt-auto flex gap-2">
                {(view === "library" || !!session.inLibrary) && (
                  <button
                    onClick={() => goPlayer(session.id)}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-300 text-sm"
                  >
                    ▶ {t("library.playBtn")}
                  </button>
                )}
                {view === "catalog" && !session.inLibrary ? (
                  <button
                    onClick={() => addToLibrary(session.id)}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors text-sm"
                  >
                    ＋ {t("library.addBtn")}
                  </button>
                ) : (
                  <button
                    onClick={() => removeFromLibrary(session.id)}
                    className="py-3 px-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
