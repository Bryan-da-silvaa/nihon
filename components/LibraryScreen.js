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
		const matchSearch = s.title.toLowerCase().startsWith(searchQuery.toLowerCase());
		if (!matchSearch) return false;
		if (selectedTags.length === 0) return true;

		const itemTagNames = getTagsForItem(s).map(t => t.name);
		return selectedTags.every(tag => itemTagNames.includes(tag));
	});

	const getTagColorClass = (tag) => {
		if (tag.type === 'system') {
			if (tag.name === 'Vidéo') return 'bg-rose-500 text-white';
			if (tag.name === 'Audio') return 'bg-amber-500 text-white';
			return 'bg-indigo-500 text-white';
		}
		return 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
	};

	return (
		<div className="flex flex-col w-full animate-fade-in text-left">
			{/* Header with Background Gradient */}
			<div className="relative mb-12 p-8 md:p-12 rounded-[3rem] bg-gradient-to-br from-slate-900 to-indigo-950 text-white overflow-hidden shadow-2xl shadow-indigo-500/10">
				<div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none transform rotate-12">
					<span className="text-[12rem]">📚</span>
				</div>

				<div className="relative z-10">
					<div className="flex items-center gap-4 mb-6">
						<button
							onClick={goHome}
							className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all group"
						>
							<svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
							</svg>
						</button>
						<span className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Centre d'Immersion</span>
					</div>
					<h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
						{tNode("library.title")}
					</h2>
					<p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl">
						{t("library.subtitle")}
					</p>
				</div>
			</div>

			{/* Navigation and Search Hub */}
			<div className="mb-10 py-6">
				<div className="flex flex-col lg:flex-row items-center gap-6">
					{/* View Toggles */}
					<div className="flex p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 w-full lg:w-auto">
						<button
							onClick={() => setView("library")}
							className={`flex-1 lg:flex-none px-8 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${view === "library" ? "bg-white dark:bg-slate-800 shadow-md text-indigo-600 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
						>
							<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20M4 14.5A2.5 2.5 0 016.5 12H20M4 9.5A2.5 2.5 0 016.5 7H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
							</svg>
							{t("library.myLibrary")}
						</button>
						<button
							onClick={() => setView("catalog")}
							className={`flex-1 lg:flex-none px-8 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${view === "catalog" ? "bg-white dark:bg-slate-800 shadow-md text-indigo-600 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
						>
							<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
							</svg>
							{t("library.catalog")}
						</button>
					</div>

					{/* Search Bar */}
					<div className="flex-1 w-full relative">
						<svg className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
						<input
							type="text"
							placeholder={t("library.searchPlaceholder")}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-white font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
						/>
					</div>
				</div>

				{/* Tags Row */}
				{allTags.length > 0 && (
					<div className="mt-6 flex items-center gap-4 overflow-x-auto no-scrollbar">
						<span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 shrink-0">Filtrer par :</span>
						<div className="flex gap-2">
							{allTags.map(tagName => (
								<button
									key={tagName}
									onClick={() => toggleTagFilter(tagName)}
									className={`px-4 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap border-2 ${selectedTags.includes(tagName) ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-400"}`}
								>
									{tagName}
								</button>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Grid of Media Cards */}
			{isLoading ? (
				<div className="flex flex-col items-center justify-center py-20 gap-4">
					<div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
					<p className="text-sm font-black uppercase tracking-widest text-slate-400 animate-pulse">{t("auth.loading")}</p>
				</div>
			) : filtered.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-300 mb-6">
						<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
						</svg>
					</div>
					<h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{t("library.emptyLibrary")}</h3>
					<p className="text-slate-500 dark:text-slate-400 font-medium mb-8">Essayez de parcourir le catalogue pour ajouter du contenu.</p>
					{view === "library" && (
						<button onClick={() => setView("catalog")} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg">Parcourir le Catalogue</button>
					)}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-20">
					{filtered.map((session) => (
						<div
							key={session.id}
							className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 flex flex-col"
						>
							{/* Card Media Preview */}
							<div className="relative h-48 bg-slate-200 dark:bg-slate-800 overflow-hidden">
								{session.thumbnail_filename ? (
									<img
										src={`/api/media/thumbnails/${encodeURIComponent(session.thumbnail_filename)}`}
										alt={session.title}
										className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
									/>
								) : (
									<div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-slate-400/30 group-hover:scale-125 group-hover:rotate-6 transition-transform duration-700">
										{session.video_filename ? (
											<svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
												<path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4zM5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
											</svg>
										) : (
											<svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
												<path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
											</svg>
										)}
									</div>
								)}
								<div className="absolute top-6 left-6 flex gap-2">
									{getTagsForItem(session).slice(0, 2).map((tag, idx) => (
										<span key={idx} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg ${getTagColorClass(tag)}`}>
											{tag.name}
										</span>
									))}
								</div>
							</div>

							{/* Content */}
							<div className="p-8 flex flex-col flex-1">
								<h3 className="text-xl font-black text-slate-800 dark:text-white mb-4 line-clamp-2 leading-tight min-h-[3.5rem]">
									{session.title}
								</h3>

								{/* Tags Row */}
								<div className="flex flex-wrap gap-2 mb-8">
									{session.tags?.map((t, idx) => (
										<span key={idx} className="group/tag flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest border border-transparent hover:border-red-400/30">
											{t}
											<button onClick={() => removeTag(session.id, t)} className="hover:text-red-500 transition-colors">
												<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
													<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
												</svg>
											</button>
										</span>
									))}
									<button onClick={() => setTagInputSession(session.id)} className="px-3 py-1 bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-dashed border-indigo-400/50 hover:bg-indigo-500 hover:text-white transition-all">
										＋ Tag
									</button>
								</div>

								{/* Footer Actions */}
								<div className="mt-auto flex items-center justify-between gap-4">
									<div className="text-xs font-black text-slate-400 uppercase tracking-widest">
										{new Date(session.created_at).toLocaleDateString()}
									</div>

									<div className="flex gap-2">
										{view === "catalog" && !session.inLibrary ? (
											<button onClick={() => addToLibrary(session.id)} className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:scale-110 active:scale-95 transition-all">
												<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
													<path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
												</svg>
											</button>
										) : (
											<button onClick={() => removeFromLibrary(session.id)} className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center hover:bg-rose-100 hover:text-rose-500 transition-all">
												<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
													<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
												</svg>
											</button>
										)}
										<button onClick={() => goPlayer(session.id)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20 hover:scale-110 active:scale-95 transition-all flex items-center gap-2">
											<svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
												<path d="M8 5v14l11-7z" />
											</svg>
											Jouer
										</button>
									</div>
								</div>
							</div>

							{/* Tag Input Overlay */}
							{tagInputSession === session.id && (
								<div className="absolute inset-0 z-20 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-fade-in">
									<h4 className="text-white font-black uppercase tracking-widest mb-4">Ajouter un Tag</h4>
									<input
										type="text"
										autoFocus
										value={newTagVal}
										onChange={e => setNewTagVal(e.target.value)}
										onKeyDown={e => {
											if (e.key === 'Enter') addTag(session.id, newTagVal);
											if (e.key === 'Escape') setTagInputSession(null);
										}}
										className="w-full bg-white dark:bg-slate-800 p-4 rounded-2xl font-black text-center focus:outline-none focus:ring-4 focus:ring-indigo-500/30 mb-4"
										placeholder="Entrez un tag..."
									/>
									<div className="flex gap-2">
										<button onClick={() => setTagInputSession(null)} className="px-6 py-2 text-white/60 font-bold hover:text-white">Annuler</button>
										<button onClick={() => addTag(session.id, newTagVal)} className="px-6 py-2 bg-indigo-500 text-white rounded-xl font-black">Valider</button>
									</div>
								</div>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
