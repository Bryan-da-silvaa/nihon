import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";

// ── SRT Parser ──────────────────────────────────────────
function parseSRT(srtText) {
  if (!srtText) return [];
  const blocks = srtText.trim().split(/\n\s*\n/);
  return blocks.map((block) => {
    const lines = block.split("\n");
    if (lines.length < 3) return null;
    const timeMatch = lines[1].match(
      /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
    );
    if (!timeMatch) return null;
    const start =
      parseInt(timeMatch[1]) * 3600 +
      parseInt(timeMatch[2]) * 60 +
      parseInt(timeMatch[3]) +
      parseInt(timeMatch[4]) / 1000;
    const end =
      parseInt(timeMatch[5]) * 3600 +
      parseInt(timeMatch[6]) * 60 +
      parseInt(timeMatch[7]) +
      parseInt(timeMatch[8]) / 1000;
    const text = lines.slice(2).join("\n");
    return { start, end, text };
  }).filter(Boolean);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── Speed options ───────────────────────────────────────
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function PlayerScreen({ sessionId, goLibrary, currentUser }) {
  const { t } = useLanguage();

  // Data
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subs, setSubs] = useState([]);
  const [romajiSubs, setRomajiSubs] = useState([]);

  // Audio state
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [activeSubIndex, setActiveSubIndex] = useState(-1);

  // UI state
  const [showRomaji, setShowRomaji] = useState(true);
  const [showCC, setShowCC] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loopA, setLoopA] = useState(null);
  const [loopB, setLoopB] = useState(null);
  const subsContainerRef = useRef(null);
  const romajiContainerRef = useRef(null);
  const progressRef = useRef(null);
  const playerWrapperRef = useRef(null);

  // ── Load session data ─────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/whisper/sessions/${sessionId}`);
        const data = await res.json();
        setSession(data);
        setSubs(parseSRT(data.subs_content));
        setRomajiSubs(parseSRT(data.romaji_content));

        // Restore progress
        const saved = localStorage.getItem(`player_progress_${sessionId}`);
        if (saved) {
          const parsed = parseFloat(saved);
          if (!isNaN(parsed) && audioRef.current) {
            audioRef.current.currentTime = parsed;
          }
        }
      } catch (err) {
        console.error("Failed to load session:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (sessionId) load();
  }, [sessionId]);

  // ── Audio event handlers ──────────────────────────────
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const ct = audio.currentTime;
    setCurrentTime(ct);

    // A-B Loop
    if (loopA !== null && loopB !== null && ct >= loopB) {
      audio.currentTime = loopA;
      return;
    }

    // Save progress every 5 seconds
    if (Math.floor(ct) % 5 === 0) {
      localStorage.setItem(`player_progress_${sessionId}`, ct.toString());
    }

    // Find active subtitle
    const idx = subs.findIndex((s) => ct >= s.start && ct <= s.end);
    if (idx !== activeSubIndex) {
      setActiveSubIndex(idx);
    }
  }, [subs, activeSubIndex, loopA, loopB, sessionId]);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      // Restore progress after metadata loaded
      const saved = localStorage.getItem(`player_progress_${sessionId}`);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed)) audioRef.current.currentTime = parsed;
      }
    }
  };

  // ── Controls ──────────────────────────────────────────
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (seconds) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, duration));
  };

  const handleProgressClick = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    if (audioRef.current) {
      audioRef.current.currentTime = percent * duration;
    }
  };

  const changeVolume = (val) => {
    const v = parseFloat(val);
    setVolume(v);
    setIsMuted(v === 0);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changeSpeed = () => {
    const currentIdx = SPEEDS.indexOf(speed);
    const nextIdx = (currentIdx + 1) % SPEEDS.length;
    const newSpeed = SPEEDS[nextIdx];
    setSpeed(newSpeed);
    if (audioRef.current) audioRef.current.playbackRate = newSpeed;
  };

  const jumpToSub = (sub) => {
    if (audioRef.current) {
      audioRef.current.currentTime = sub.start;
      if (!isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // ── A-B Loop ──────────────────────────────────────────
  const setLoopPoint = () => {
    if (loopA === null) {
      setLoopA(currentTime);
    } else if (loopB === null) {
      setLoopB(currentTime);
    } else {
      // Reset
      setLoopA(null);
      setLoopB(null);
    }
  };

  // ── Fullscreen ────────────────────────────────────────
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (playerWrapperRef.current?.requestFullscreen) {
        playerWrapperRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // ── Auto-scroll subs ─────────────────────────────────
  useEffect(() => {
    if (activeSubIndex >= 0) {
      const scrollContainer = (containerRef) => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const el = container.children[activeSubIndex];
        if (el) {
          const offsetTop = el.offsetTop;
          const containerHalfHeight = container.clientHeight / 2;
          const elHalfHeight = el.clientHeight / 2;
          container.scrollTo({
            top: offsetTop - containerHalfHeight + elHalfHeight,
            behavior: "smooth"
          });
        }
      };

      scrollContainer(subsContainerRef);
      if (showRomaji) scrollContainer(romajiContainerRef);
    }
  }, [activeSubIndex, showRomaji]);

  // ── Keyboard shortcuts ────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seek(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          seek(10);
          break;
        case "ArrowUp":
          e.preventDefault();
          changeVolume(Math.min(1, volume + 0.1));
          break;
        case "ArrowDown":
          e.preventDefault();
          changeVolume(Math.max(0, volume - 0.1));
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isPlaying, volume]);

  // ── Render ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">{t("common.loading")}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 font-bold text-xl">{t("player.notFound")}</p>
        <button onClick={goLibrary} className="mt-4 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl">
          {t("player.backToLibrary")}
        </button>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col w-full h-full py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goLibrary}
          className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 px-4 py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-bold transition-colors shadow-sm text-sm"
        >
          <span>⬅</span> {t("player.backToLibrary")}
        </button>
        <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white truncate max-w-[60%] text-right">
          {session.title}
        </h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* ═══ LEFT COLUMN: VIDEO + CONTROLS ═══ */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          
          {/* ═══ VIDEO PLAYER WRAPPER ═══ */}
          <div 
            ref={playerWrapperRef}
            className={`relative bg-black overflow-hidden shadow-2xl flex flex-col group ${
              isFullscreen ? "w-full h-full" : "rounded-2xl min-h-[300px] md:min-h-[400px] lg:min-h-[500px]"
            }`}
          >
            
            {/* Media Elements */}
            {session.video_filename ? (
              <video
                ref={audioRef}
                src={`/api/media/video/${encodeURIComponent(session.video_filename)}`}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                className="absolute inset-0 w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
                preload="metadata"
              />
            ) : (
              <>
                <audio
                  ref={audioRef}
                  src={session.audio_filename ? `/api/media/audio/${encodeURIComponent(session.audio_filename)}` : ""}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                  preload="metadata"
                  className="hidden"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-gray-900">
                  <svg className="w-24 h-24 mb-4 opacity-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                  <p className="font-medium tracking-widest uppercase text-sm opacity-50">Audio Only</p>
                </div>
              </>
            )}

            {/* Closed Captions Overlay */}
            {showCC && activeSubIndex >= 0 && (
              <div className="absolute bottom-24 left-0 right-0 flex justify-center pointer-events-none px-4 z-10 transition-transform duration-300 group-hover:-translate-y-6">
                <div className="bg-black/70 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-center shadow-[0_0_20px_rgba(0,0,0,0.5)] font-bold text-lg md:text-2xl border border-white/10" style={{ textShadow: "0px 2px 8px rgba(0,0,0,0.9)" }}>
                  {subs[activeSubIndex]?.text}
                  {showRomaji && romajiSubs[activeSubIndex] && (
                    <div className="text-sm md:text-lg text-indigo-300 mt-1 font-medium">
                      {romajiSubs[activeSubIndex]?.text}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Play/Pause Center Indicator (Optional subtle effect) */}
            <div className={`absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-500 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
              <div className="w-20 h-20 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white/80">
                <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>

            {/* ═══ CONTROLS OVERLAY ═══ */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 md:p-6 pt-20 transition-opacity duration-300 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
              
              {/* Progress Bar */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-gray-300 font-mono w-10 text-right select-none">{formatTime(currentTime)}</span>
                
                <div
                  ref={progressRef}
                  onClick={handleProgressClick}
                  className="relative h-1.5 md:h-2 flex-1 bg-white/20 rounded-full cursor-pointer group/progress"
                >
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                  {/* A-B Loop markers */}
                  {loopA !== null && duration > 0 && (
                    <div className="absolute top-[-3px] w-1 h-3 md:h-3.5 bg-emerald-400 rounded-full shadow-[0_0_5px_rgba(52,211,153,0.8)]" style={{ left: `${(loopA / duration) * 100}%` }} />
                  )}
                  {loopB !== null && duration > 0 && (
                    <div className="absolute top-[-3px] w-1 h-3 md:h-3.5 bg-red-400 rounded-full shadow-[0_0_5px_rgba(248,113,113,0.8)]" style={{ left: `${(loopB / duration) * 100}%` }} />
                  )}
                  {/* Thumb */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] opacity-0 group-hover/progress:opacity-100 transition-opacity"
                    style={{ left: `calc(${progress}% - 6px)` }}
                  />
                </div>
                
                <span className="text-xs text-gray-300 font-mono w-10 select-none">{formatTime(duration)}</span>
              </div>

              {/* Bottom Controls Row */}
              <div className="flex items-center justify-between">
                
                {/* Left: Play/Pause, Rewind, Forward, Volume */}
                <div className="flex items-center gap-2 md:gap-4">
                  <button onClick={() => seek(-10)} className="text-white/70 hover:text-white transition-colors" title="-10s">
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                    </svg>
                  </button>

                  <button onClick={togglePlay} className="text-white hover:text-indigo-400 transition-colors mx-1">
                    {isPlaying ? (
                      <svg className="w-7 h-7 md:w-9 md:h-9" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
                    ) : (
                      <svg className="w-7 h-7 md:w-9 md:h-9" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    )}
                  </button>

                  <button onClick={() => seek(10)} className="text-white/70 hover:text-white transition-colors" title="+10s">
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                    </svg>
                  </button>
                  
                  {/* Volume (Expandable on hover) */}
                  <div className="flex items-center gap-2 group/volume ml-2">
                    <button onClick={toggleMute} className="text-white/80 hover:text-white transition-colors text-lg md:text-xl">
                      {isMuted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => changeVolume(e.target.value)}
                      className="w-0 opacity-0 group-hover/volume:w-16 md:group-hover/volume:w-20 group-hover/volume:opacity-100 transition-all duration-300 h-1 accent-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Right: Tools (Speed, AB, CC, Romaji) */}
                <div className="flex items-center gap-1.5 md:gap-2">
                  <button
                    onClick={changeSpeed}
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white font-bold rounded transition-colors text-[10px] md:text-xs"
                    title="Vitesse de lecture"
                  >
                    {speed}x
                  </button>

                  <button
                    onClick={setLoopPoint}
                    className={`px-2 py-1 rounded font-bold text-[10px] md:text-xs transition-colors ${
                      loopA !== null
                        ? loopB !== null
                          ? "bg-emerald-500 text-white animate-pulse"
                          : "bg-amber-500 text-white"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                    title="Boucle A-B"
                  >
                    {loopA === null ? "A-B" : loopB === null ? `A:${formatTime(loopA)}` : `🔁`}
                  </button>

                  <button
                    onClick={() => setShowCC(!showCC)}
                    className={`px-2 py-1 rounded font-bold text-[10px] md:text-xs transition-colors ${
                      showCC ? "bg-blue-600 text-white" : "bg-white/10 hover:bg-white/20 text-white/80"
                    }`}
                    title="Sous-titres incrustés"
                  >
                    CC
                  </button>

                  <button
                    onClick={() => setShowRomaji(!showRomaji)}
                    className={`px-2 py-1 rounded font-bold text-[10px] md:text-xs transition-colors ${
                      showRomaji ? "bg-indigo-600 text-white" : "bg-white/10 hover:bg-white/20 text-white/80"
                    }`}
                    title="Afficher Romaji"
                  >
                    {t("player.romaji")}
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="text-white/80 hover:text-white transition-colors ml-1"
                    title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
                  >
                    {isFullscreen ? (
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN: SUBTITLES PANELS ═══ */}
        <div className="w-full lg:w-96 flex flex-col gap-4 h-[400px] lg:h-[650px] lg:max-h-[80vh]">
          {/* Original (Kanji/Kana) */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col overflow-hidden flex-1">
            <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 font-bold text-sm text-gray-600 dark:text-gray-300">
              📝 {t("player.originalSubs")}
            </div>
            <div ref={subsContainerRef} className="flex-1 overflow-y-auto p-4 space-y-1 h-0">
              {subs.length === 0 ? (
                <p className="text-gray-400 text-center py-8">{t("player.noSubs")}</p>
              ) : (
                subs.map((sub, i) => (
                  <button
                    key={i}
                    onClick={() => jumpToSub(sub)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl transition-all duration-300 text-sm leading-relaxed ${
                      i === activeSubIndex
                        ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 font-bold shadow-sm scale-[1.02]"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <span className="text-[10px] text-gray-400 mr-2 font-mono">{formatTime(sub.start)}</span>
                    {sub.text}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Romaji */}
          {showRomaji && (
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col overflow-hidden flex-1">
              <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 font-bold text-sm text-gray-600 dark:text-gray-300">
                🔤 {t("player.romajiSubs")}
              </div>
              <div ref={romajiContainerRef} className="flex-1 overflow-y-auto p-4 space-y-1 h-0">
                {romajiSubs.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">{t("player.noSubs")}</p>
                ) : (
                  romajiSubs.map((sub, i) => (
                    <button
                      key={i}
                      onClick={() => jumpToSub(sub)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl transition-all duration-300 text-sm leading-relaxed ${
                        i === activeSubIndex
                          ? "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 font-bold shadow-sm scale-[1.02]"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <span className="text-[10px] text-gray-400 mr-2 font-mono">{formatTime(sub.start)}</span>
                      {sub.text}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
        {t("player.shortcuts")}
      </div>
    </div>
  );
}
