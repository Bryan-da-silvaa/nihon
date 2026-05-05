import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useVocabulary } from "../hooks/useVocabulary";
import VocabularyPopup from "./VocabularyPopup";

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
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	if (h > 0) {
		return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
	}
	return `${m}:${s.toString().padStart(2, "0")}`;
}

const SubtitleItem = memo(({
	sub,
	idx,
	activeSubIndex,
	tokenizedSub,
	romajiSub,
	showRomaji,
	isOverlay,
	getWordStatus,
	onWordClick,
	onJump
}) => {
	const isActive = idx === activeSubIndex;

	return (
		<div
			className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group ${isActive ? "bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-500/20 translate-x-2" : (isOverlay ? "bg-white/5 border-white/10" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800")}`}
		>
			<div className={`font-black mb-1 text-sm leading-relaxed flex flex-wrap gap-x-1.5 ${isActive ? "text-white" : (isOverlay ? "text-white" : "text-slate-800 dark:text-white")}`}>
				{tokenizedSub ? (
					tokenizedSub.map((token, tIdx) => {
						const status = getWordStatus(token.b || token.w);
						return (
							<span
								key={tIdx}
								onClick={(e) => {
									e.stopPropagation();
									onWordClick(token, status, e);
								}}
								className={`cursor-pointer rounded px-0.5 transition-all hover:bg-white/20 ${status === 2 ? "text-emerald-400" : (status === 1 ? "text-amber-400" : "")
									}`}
							>
								{token.w}
							</span>
						);
					})
				) : (
					sub.text
				)}
			</div>
			{showRomaji && romajiSub && (
				<p className={`text-[10px] font-bold opacity-60 transition-colors ${isActive ? "text-indigo-200" : (isOverlay ? "text-slate-400" : "text-slate-400")}`}>
					{romajiSub.text}
				</p>
			)}
			<div className="mt-2 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className={`text-[9px] font-black ${isActive ? "text-indigo-300" : "text-slate-400"}`}>{formatTime(sub.start)}</span>
					<button onClick={() => onJump(sub)} className={`text-[10px] opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg ${isActive ? "bg-white/20 text-white" : "bg-indigo-500/10 text-indigo-500"}`}>
						RELIRE
					</button>
				</div>
			</div>
		</div>
	);
});

const TranscriptionList = memo(({
	subs,
	tokenizedSubs,
	romajiSubs,
	activeSubIndex,
	showRomaji,
	isOverlay,
	getWordStatus,
	onWordClick,
	onJump,
	containerRef
}) => {
	if (subs.length === 0) {
		return <p className="text-slate-400 text-center py-20 font-bold uppercase text-[10px] tracking-widest">Aucun sous-titre disponible</p>;
	}

	return (
		<div
			ref={containerRef}
			className="flex-1 overflow-y-auto space-y-3 pr-2 no-scrollbar scroll-smooth"
		>
			{subs.map((s, idx) => (
				<SubtitleItem
					key={idx}
					sub={s}
					idx={idx}
					activeSubIndex={activeSubIndex}
					tokenizedSub={tokenizedSubs[idx]}
					romajiSub={romajiSubs[idx]}
					showRomaji={showRomaji}
					isOverlay={isOverlay}
					getWordStatus={getWordStatus}
					onWordClick={onWordClick}
					onJump={onJump}
				/>
			))}
		</div>
	);
});

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const PlayerScreen = memo(({ sessionId, goLibrary, currentUser }) => {
	const { t } = useLanguage();

	// Data
	const [session, setSession] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [subs, setSubs] = useState([]);
	const [romajiSubs, setRomajiSubs] = useState([]);
	const [tokenizedSubs, setTokenizedSubs] = useState([]);

	// Vocabulary knowledge
	const { vocabulary, updateWordStatus, getWordStatus } = useVocabulary(currentUser?.id);
	const [selectedWord, setSelectedWord] = useState(null);
	const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

	// Audio/Media state
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
	const [showCC, setShowCC] = useState(true);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [loopA, setLoopA] = useState(null);
	const [loopB, setLoopB] = useState(null);
	const [showControls, setShowControls] = useState(true);
	const [isDragging, setIsDragging] = useState(false);
	const [hoverTime, setHoverTime] = useState(null);
	const [isCinemaMode, setIsCinemaMode] = useState(false);
	const [showFullscreenHub, setShowFullscreenHub] = useState(false);
	const controlsTimeoutRef = useRef(null);
	const subsContainerRef = useRef(null);
	const progressRef = useRef(null);
	const tooltipRef = useRef(null);
	const previewRef = useRef(null);
	const lastSeekTimeRef = useRef(0);
	const currentTimeLabelRef = useRef(null);
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
				if (data.tokenized_content) {
					try {
						const parsed = typeof data.tokenized_content === 'string'
							? JSON.parse(data.tokenized_content)
							: data.tokenized_content;
						setTokenizedSubs(parsed);
					} catch (e) {
						console.error("Failed to parse tokens:", e);
					}
				}

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

	// ── Sync Loop (requestAnimationFrame) ────────────────
	useEffect(() => {
		let rafId;
		const sync = () => {
			const audio = audioRef.current;
			if (audio && !audio.paused) {
				const ct = audio.currentTime;
				const dur = audio.duration;

				// 1. Mise à jour DOM directe (ultra rapide, 60fps)
				const progressPercent = (ct / (dur || 1)) * 100;
				const progressFill = progressRef.current?.querySelector('.progress-fill');
				const progressThumb = progressRef.current?.querySelector('.progress-thumb');
				if (progressFill) progressFill.style.width = `${progressPercent}%`;
				if (progressThumb) progressThumb.style.left = `calc(${progressPercent}% - 6px)`;
				if (currentTimeLabelRef.current) currentTimeLabelRef.current.textContent = formatTime(ct);

				// 2. On ne réveille React que si on change de phrase (activeSubIndex)
				const idx = subs.findIndex((s) => ct >= s.start && ct <= s.end);
				if (idx !== activeSubIndex) {
					setCurrentTime(ct);
					setActiveSubIndex(idx);
				}

				// 3. A-B Loop check
				if (loopA !== null && loopB !== null && ct >= loopB) {
					audio.currentTime = loopA;
				}
			}
			rafId = requestAnimationFrame(sync);
		};

		if (isPlaying) {
			rafId = requestAnimationFrame(sync);
		}
		return () => cancelAnimationFrame(rafId);
	}, [isPlaying, subs, activeSubIndex, loopA, loopB]);

	const handleTimeUpdate = useCallback(() => {
		const audio = audioRef.current;
		if (!audio) return;
		const ct = audio.currentTime;

		// Save progress (every 5 seconds)
		if (Math.floor(ct) % 5 === 0) {
			localStorage.setItem(`player_progress_${sessionId}`, ct.toString());
		}
	}, [sessionId]);

	const handleLoadedMetadata = () => {
		if (audioRef.current) {
			setDuration(audioRef.current.duration);
		}
	};

	// ── Controls ──────────────────────────────────────────
	const togglePlay = () => {
		const audio = audioRef.current;
		if (!audio) return;
		if (isPlaying) audio.pause();
		else audio.play();
		setIsPlaying(!isPlaying);
	};

	const seekRelative = (seconds) => {
		const audio = audioRef.current;
		if (!audio) return;
		audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, duration));
	};

	const seekAbsolute = (time) => {
		if (audioRef.current) {
			audioRef.current.currentTime = time;
			setCurrentTime(time);
		}
	};

	const handleProgressMouseMove = (e) => {
		if (!progressRef.current || duration === 0) return;
		const rect = progressRef.current.getBoundingClientRect();
		const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
		const percent = x / rect.width;
		const time = percent * duration;

		// 1. Priorité absolue au mouvement (GPU accelerated)
		if (tooltipRef.current) {
			tooltipRef.current.style.transform = `translateX(${x}px)`;
			const timeEl = tooltipRef.current.querySelector('.tooltip-time');
			if (timeEl) timeEl.textContent = formatTime(time);
		}

		if (hoverTime === null) setHoverTime(time);

		// 2. Mise à jour de l'image (Throttled)
		if (previewRef.current) {
			const now = Date.now();
			if (now - lastSeekTimeRef.current > 100) {
				previewRef.current.currentTime = time;
				lastSeekTimeRef.current = now;
			}
		}
	};

	const handleProgressMouseLeave = () => {
		setHoverTime(null);
	};

	const handleProgressScrub = useCallback((e) => {
		if (!progressRef.current || !duration) return;
		const rect = progressRef.current.getBoundingClientRect();
		const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
		const percent = (x / rect.width) * 100;
		const time = (x / rect.width) * duration;

		// 1. Mise à jour visuelle immédiate (DOM)
		const progressFill = progressRef.current.querySelector('.progress-fill');
		const progressThumb = progressRef.current.querySelector('.progress-thumb');
		if (progressFill) progressFill.style.width = `${percent}%`;
		if (progressThumb) progressThumb.style.left = `calc(${percent}% - 6px)`;

		// 1.5 Mise à jour du label de temps (DOM)
		if (currentTimeLabelRef.current) {
			currentTimeLabelRef.current.textContent = formatTime(time);
		}

		// 2. Mise à jour de la preview si elle existe
		handleProgressMouseMove(e);

		// 3. Throttle du seek principal pour ne pas ramer (uniquement la vidéo)
		const now = Date.now();
		if (now - lastSeekTimeRef.current > 100) {
			if (audioRef.current) audioRef.current.currentTime = time;
			lastSeekTimeRef.current = now;
		}
	}, [duration]);

	useEffect(() => {
		if (isDragging) {
			const onMouseMove = (e) => handleProgressScrub(e);
			const onMouseUp = (e) => {
				setIsDragging(false);
				if (progressRef.current && duration) {
					const rect = progressRef.current.getBoundingClientRect();
					const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
					const time = (x / rect.width) * duration;
					if (audioRef.current) audioRef.current.currentTime = time;
					setCurrentTime(time);
				}
			};
			window.addEventListener("mousemove", onMouseMove);
			window.addEventListener("mouseup", onMouseUp);
			return () => {
				window.removeEventListener("mousemove", onMouseMove);
				window.removeEventListener("mouseup", onMouseUp);
			};
		}
	}, [isDragging, handleProgressScrub, duration]);

	const handleProgressMouseDown = (e) => {
		setIsDragging(true);
		if (!progressRef.current || !duration) return;
		const rect = progressRef.current.getBoundingClientRect();
		const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
		const time = (x / rect.width) * duration;
		if (audioRef.current) audioRef.current.currentTime = time;
		setCurrentTime(time);
		handleProgressScrub(e);
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

	const jumpToSub = useCallback((sub) => {
		if (audioRef.current) {
			audioRef.current.currentTime = sub.start;
			if (!isPlaying) {
				audioRef.current.play();
				setIsPlaying(true);
			}
		}
	}, [isPlaying]);

	const handleWordClick = useCallback(async (token, status, e) => {
		setSelectedWord({ ...token, status });
		setPopupPos({ x: e.clientX, y: e.clientY });
	}, []);

	// ── A-B Loop ──────────────────────────────────────────
	const setLoopPoint = () => {
		if (loopA === null) setLoopA(currentTime);
		else if (loopB === null) setLoopB(currentTime);
		else { setLoopA(null); setLoopB(null); }
	};

	// ── Fullscreen ────────────────────────────────────────
	const toggleFullscreen = () => {
		if (!document.fullscreenElement) {
			if (playerWrapperRef.current?.requestFullscreen) playerWrapperRef.current.requestFullscreen();
		} else {
			if (document.exitFullscreen) document.exitFullscreen();
		}
	};

	useEffect(() => {
		const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
		document.addEventListener("fullscreenchange", handleFullscreenChange);
		return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
	}, []);

	// ── Auto-hide controls ──────────────────────────────
	const handleMouseMove = () => {
		setShowControls(true);
		if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

		// Only auto-hide if playing and hub is not open in fullscreen
		if (isPlaying && (!isFullscreen || !showFullscreenHub)) {
			controlsTimeoutRef.current = setTimeout(() => {
				setShowControls(false);
			}, 3000);
		}
	};

	useEffect(() => {
		if (!isPlaying) {
			setShowControls(true);
			if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
		} else {
			handleMouseMove();
		}
		return () => {
			if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
		};
	}, [isPlaying, isFullscreen, showFullscreenHub]);

	// ── Auto-scroll subs ─────────────────────────────────
	useEffect(() => {
		if (activeSubIndex >= 0 && subsContainerRef.current) {
			const container = subsContainerRef.current;
			const el = container.children[activeSubIndex];
			if (el) {
				const targetTop = el.offsetTop - (container.clientHeight / 2) + (el.clientHeight / 2);
				container.scrollTo({
					top: targetTop,
					behavior: isPlaying ? "smooth" : "auto"
				});
			}
		}
	}, [activeSubIndex, isPlaying]);

	// ── Keyboard shortcuts ────────────────────────────────
	useEffect(() => {
		const handleKey = (e) => {
			if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
			switch (e.code) {
				case "Space": e.preventDefault(); togglePlay(); break;
				case "ArrowLeft": e.preventDefault(); seekRelative(-10); break;
				case "ArrowRight": e.preventDefault(); seekRelative(10); break;
				case "ArrowUp": e.preventDefault(); changeVolume(Math.min(1, volume + 0.1)); break;
				case "ArrowDown": e.preventDefault(); changeVolume(Math.max(0, volume - 0.1)); break;
				case "KeyF": e.preventDefault(); toggleFullscreen(); break;
				case "Escape": if (isFullscreen) toggleFullscreen(); break;
				case "KeyT": e.preventDefault(); setIsCinemaMode(!isCinemaMode); break;
				case "KeyH": e.preventDefault(); setShowFullscreenHub(!showFullscreenHub); break;
			}
		};
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [isPlaying, volume, isFullscreen, isCinemaMode, showFullscreenHub]);

	const renderTranscriptionHub = (isOverlay = false) => (
		<div className={`${isOverlay ? "absolute top-0 right-0 h-full w-80 z-40 animate-slide-in-right" : "space-y-6"}`}>
			<div className={`bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-xl flex flex-col ${isOverlay ? "h-full border-none rounded-none bg-black/60 text-white" : (isCinemaMode ? "h-[400px]" : "h-[750px]")}`}>
				<div className="flex flex-col gap-4 mb-6">
					<h3 className={`text-xs font-black uppercase tracking-[0.2em] ${isOverlay ? "text-indigo-300" : "text-slate-400"}`}>Transcription</h3>
					<button onClick={() => setShowRomaji(!showRomaji)} className={`w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${showRomaji ? (isOverlay ? "bg-indigo-600/50 border-indigo-400 text-white" : "bg-indigo-100 border-indigo-200 text-indigo-600") : (isOverlay ? "bg-white/5 border-white/10 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-400")}`}>Romaji {showRomaji ? "ON" : "OFF"}</button>
				</div>

				<TranscriptionList
					subs={subs}
					tokenizedSubs={tokenizedSubs}
					romajiSubs={romajiSubs}
					activeSubIndex={activeSubIndex}
					showRomaji={showRomaji}
					isOverlay={isOverlay}
					getWordStatus={getWordStatus}
					onWordClick={handleWordClick}
					onJump={jumpToSub}
					containerRef={subsContainerRef}
				/>
			</div>
			{!isOverlay && (
				<div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 text-center">
					<p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Raccourcis Clavier</p>
					<p className="text-[10px] text-slate-500 mt-2">ESPACE: Play/Pause • GAUCHE/DROITE: +/- 10s • HAUT/BAS: Vol +/-</p>
				</div>
			)}
		</div>
	);

	if (isLoading) return (
		<div className="flex flex-col items-center justify-center py-20">
			<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
			<p className="text-gray-500 dark:text-gray-400 font-medium">Chargement...</p>
		</div>
	);

	if (!session) return null;

	const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

	return (
		<div className="flex flex-col w-full h-full animate-fade-in text-left">
			{/* Header */}
			<div className="flex items-center justify-between mb-8">
				<div className="flex items-center gap-4">
					<button onClick={goLibrary} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all hover:bg-indigo-600 hover:text-white group">
						<svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
						</svg>
					</button>
					<div>
						<h2 className="text-2xl font-black text-slate-800 dark:text-white line-clamp-1">{session?.title}</h2>
						<p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Immersion Japonais</p>
					</div>
				</div>
			</div>

			<div className={`grid grid-cols-1 ${isCinemaMode ? "" : "lg:grid-cols-12"} gap-10`}>

				{/* ═══ LEFT COLUMN ═══ */}
				<div className={`${isCinemaMode ? "col-span-1" : "lg:col-span-9"} flex flex-col gap-6`}>
					<div
						ref={playerWrapperRef}
						onMouseMove={handleMouseMove}
						className={`relative bg-black overflow-hidden shadow-2xl flex flex-col group ${isFullscreen ? "w-full h-full" : "rounded-[2.5rem] aspect-video border border-slate-200 dark:border-slate-800"
							} ${!showControls && isPlaying ? "cursor-none" : ""}`}
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
							/>
						) : (
							<>
								<audio
									ref={audioRef}
									src={session.audio_filename ? `/api/media/audio/${encodeURIComponent(session.audio_filename)}` : ""}
									onTimeUpdate={handleTimeUpdate}
									onLoadedMetadata={handleLoadedMetadata}
									onEnded={() => setIsPlaying(false)}
									className="hidden"
								/>
								<div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 cursor-pointer" onClick={togglePlay}>
									<div className="flex gap-1 items-end h-12">
										{[...Array(8)].map((_, i) => (
											<div key={i} className={`w-1.5 bg-indigo-500 rounded-full ${isPlaying ? 'animate-pulse' : 'h-2'}`} style={{ height: isPlaying ? `${30 + Math.random() * 70}%` : '6px', transition: 'height 0.2s' }}></div>
										))}
									</div>
								</div>
							</>
						)}

						{/* Fullscreen Hub Overlay */}
						{isFullscreen && showFullscreenHub && renderTranscriptionHub(true)}

						{/* Subtitles Overlay */}
						{showCC && activeSubIndex >= 0 && (
							<div className="absolute bottom-24 left-0 right-0 flex justify-center pointer-events-none px-6 z-40">
								<div className="text-center font-black text-xl md:text-4xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.9)] tracking-tight flex flex-wrap justify-center items-end gap-x-6 gap-y-4">
									{tokenizedSubs[activeSubIndex] ? (
										tokenizedSubs[activeSubIndex].map((token, tIdx) => {
											const status = getWordStatus(token.b || token.w);
											return (
												<div key={tIdx} className="flex flex-col items-center">
													{showRomaji && token.romaji && (
														<span className="text-sm md:text-xl text-indigo-300 mb-1 font-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)] opacity-90">
															{token.romaji}
														</span>
													)}
													<span
														onClick={(e) => {
															e.preventDefault();
															e.stopPropagation();
															setSelectedWord({ ...token, status });
															setPopupPos({ x: e.clientX, y: e.clientY });
														}}
														className={`cursor-pointer transition-all hover:scale-110 active:scale-95 pointer-events-auto ${status === 2 ? "text-emerald-400" : (status === 1 ? "text-amber-400" : "text-white")
															}`}
													>
														{token.w}
													</span>
												</div>
											);
										})
									) : (
										<div className="flex flex-col items-center">
											<span className="text-white">{subs[activeSubIndex]?.text}</span>
											{showRomaji && romajiSubs[activeSubIndex] && (
												<div className="text-lg md:text-2xl text-indigo-300 mt-2 font-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]">
													{romajiSubs[activeSubIndex]?.text}
												</div>
											)}
										</div>
									)}
								</div>
							</div>
						)}

						{/* Play/Pause Overlay */}
						{!isPlaying && (
							<div
								className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 cursor-pointer"
								onClick={togglePlay}
							>
								<button onClick={togglePlay} className="w-20 h-20 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 flex items-center justify-center text-white transition-all hover:scale-110">
									<svg className="w-10 h-10 fill-current" viewBox="0 0 24 24">
										<path d="M8 5v14l11-7z" />
									</svg>
								</button>
							</div>
						)}

						{/* Controls Overlay */}
						<div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pt-16 transition-opacity duration-500 z-30 ${!showControls && isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'
							}`}>

							{/* Progress */}
							<div className="flex items-center gap-3 mb-4">
								<span ref={currentTimeLabelRef} className="text-[10px] text-gray-300 font-black min-w-[40px] text-right leading-none">{formatTime(currentTime)}</span>
								<div
									ref={progressRef}
									onMouseDown={handleProgressMouseDown}
									onMouseMove={handleProgressMouseMove}
									onMouseLeave={handleProgressMouseLeave}
									className="relative h-1.5 flex-1 bg-white/20 rounded-full cursor-pointer group/progress"
								>
									{/* Tooltip Popup */}
									{hoverTime !== null && (
										<div
											ref={tooltipRef}
											className="absolute bottom-10 left-0 -translate-x-1/2 bg-slate-900 border border-white/20 text-white rounded-lg shadow-2xl pointer-events-none z-50 overflow-hidden flex flex-col items-center after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-900"
											style={{ willChange: 'transform' }}
										>
											{session?.video_filename && (
												<div className="relative w-40 aspect-video bg-black overflow-hidden">
													<video
														ref={previewRef}
														src={`/api/media/video/${encodeURIComponent(session.video_filename)}`}
														className="w-full h-full object-cover"
														muted
														preload="auto"
													/>
												</div>
											)}
											<div className="px-2 py-1 text-[10px] font-black tooltip-time bg-slate-900/90 w-full text-center">
												{formatTime(hoverTime)}
											</div>
										</div>
									)}

									<div className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full progress-fill" style={{ width: `${progress}%` }} />
									{loopA !== null && <div className="absolute top-[-3px] w-1 h-3 bg-emerald-400 rounded-full" style={{ left: `${(loopA / duration) * 100}%` }} />}
									{loopB !== null && <div className="absolute top-[-3px] w-1 h-3 bg-rose-400 rounded-full" style={{ left: `${(loopB / duration) * 100}%` }} />}
									<div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity progress-thumb" style={{ left: `calc(${progress}% - 6px)` }} />
								</div>
								<span className="text-[10px] text-gray-300 font-black min-w-[40px] leading-none">{formatTime(duration)}</span>
							</div>

							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									<button onClick={() => seekRelative(-10)} className="text-white/70 hover:text-white transition-colors" title="-10s">
										<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
										</svg>
									</button>
									<button onClick={togglePlay} className="text-white hover:text-indigo-400 transition-all hover:scale-110">
										{isPlaying ? (
											<svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
												<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
											</svg>
										) : (
											<svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
												<path d="M8 5v14l11-7z" />
											</svg>
										)}
									</button>
									<button onClick={() => seekRelative(10)} className="text-white/70 hover:text-white transition-colors" title="+10s">
										<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
										</svg>
									</button>

									<div className="flex items-center gap-2 group/volume ml-2">
										<button onClick={toggleMute} className="text-white/80 hover:text-white transition-colors">
											{isMuted || volume === 0 ? (
												<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
													<path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
													<path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
												</svg>
											) : (
												<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
													<path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M12 5v14l-4.707-4.707H5a1 1 0 01-1-1v-4a1 1 0 011-1h2.293L12 5z" />
												</svg>
											)}
										</button>
										<input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={(e) => changeVolume(e.target.value)} className="w-0 opacity-0 group-hover/volume:w-16 group-hover/volume:opacity-100 transition-all h-1 accent-indigo-500 cursor-pointer" />
									</div>
								</div>

								<div className="flex items-center gap-3">
									<button onClick={changeSpeed} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white font-black rounded-lg text-[10px] transition-all">{speed}x</button>
									<button onClick={setLoopPoint} className={`px-3 py-1 rounded-lg font-black text-[10px] transition-all ${loopA !== null ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "bg-white/10 text-white hover:bg-white/20"}`}>A-B</button>
									<button onClick={() => setShowCC(!showCC)} className={`px-3 py-1 rounded-lg font-black text-[10px] transition-all ${showCC ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-white/10 text-white hover:bg-white/20"}`}>CC</button>
									<button onClick={() => setShowRomaji(!showRomaji)} className={`px-3 py-1 rounded-lg font-black text-[10px] transition-all ${showRomaji ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-white/10 text-white hover:bg-white/20"}`}>RJ</button>
									<button onClick={() => setIsCinemaMode(!isCinemaMode)} className="text-white/80 hover:text-white transition-all hover:scale-110 p-1" title="Mode Cinéma (T)">
										<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2m14 4V5a2 2 0 00-2-2h-2m-10 14H5a2 2 0 01-2-2v-2m14 4h2a2 2 0 002-2v-2" />
										</svg>
									</button>
									<button onClick={toggleFullscreen} className="text-white/80 hover:text-white transition-all hover:scale-110 p-1" title="Plein écran (F)">
										<svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
											<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
										</svg>
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* ═══ RIGHT COLUMN: TRANSCRIPTION HUB ═══ */}
				{!isCinemaMode && !isFullscreen && (
					<div className="lg:col-span-3">
						{renderTranscriptionHub()}
					</div>
				)}
			</div>

			{isCinemaMode && !isFullscreen && (
				<div className="mt-10">
					{renderTranscriptionHub()}
				</div>
			)}

			{/* Vocabulary Popup */}
			{selectedWord && (
				<VocabularyPopup
					word={selectedWord.w}
					reading={selectedWord.r || selectedWord.reading}
					status={selectedWord.status}
					position={popupPos}
					onUpdate={(newStatus) => updateWordStatus(selectedWord.b || selectedWord.w, selectedWord.r || selectedWord.reading, newStatus)}
					onClose={() => setSelectedWord(null)}
				/>
			)}
		</div>
	);
});

export default PlayerScreen;
