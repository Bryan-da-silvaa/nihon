import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function KanjiScreen({ currentUser, kanjiPerPage = 100 }) {
	const { t, tNode } = useLanguage();
	const [kanjis, setKanjis] = useState([]);
	const [counts, setCounts] = useState({});
	const [level, setLevel] = useState(1);
	const [loading, setLoading] = useState(true);
	
	// Pagination state
	const [page, setPage] = useState(1);
	const [total, setTotal] = useState(0);

	useEffect(() => {
		fetchCounts();
	}, []);

	useEffect(() => {
		setPage(1); // Reset page when level changes or kanjiPerPage changes
		fetchKanjis(1);
	}, [level, kanjiPerPage]);

	const fetchCounts = async () => {
		try {
			const res = await fetch(`/api/kanji/counts`);
			const data = await res.json();
			if (!data.error) {
				const map = {};
				data.forEach(item => {
					map[item.jlpt] = item.count;
				});
				setCounts(map);
				if (!map[5] && map[1]) setLevel(1);
				else if (map[5]) setLevel(5);
			}
		} catch (error) {
			console.error("Error fetching counts:", error);
		}
	};

	const fetchKanjis = async (p = page) => {
		setLoading(true);
		const offset = (p - 1) * kanjiPerPage;
		try {
			const res = await fetch(`/api/kanji?level=${level}&limit=${kanjiPerPage}&offset=${offset}`);
			const data = await res.json();
			if (!data.error) {
				setKanjis(data.kanjis);
				setTotal(data.total);
			}
		} catch (error) {
			console.error("Error fetching kanjis:", error);
		} finally {
			setLoading(false);
		}
	};

	const totalPages = Math.ceil(total / kanjiPerPage);

	const handlePageChange = (newPage) => {
		if (newPage >= 1 && newPage <= totalPages) {
			setPage(newPage);
			fetchKanjis(newPage);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	};

	return (
		<div className="w-full space-y-8 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
			{/* Header Section */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
				<div className="text-left space-y-2">
					<h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
						{tNode('kanji.title') || "Maîtrise des Kanji"}
					</h1>
					<p className="text-slate-500 dark:text-slate-400 font-medium">
						{tNode('kanji.subtitle') || "Explorez et apprenez les caractères essentiels du japonais."}
					</p>
				</div>
				
				{total > 0 && (
					<div className="bg-slate-100 dark:bg-slate-800/50 px-4 py-2 rounded-2xl text-xs font-bold text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
						{total} Kanjis trouvés
					</div>
				)}
			</div>

			{/* Level Selection Tabs */}
			<div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-fit">
				{[5, 4, 3, 2, 1].map((lv) => (
					<button
						key={lv}
						onClick={() => setLevel(lv)}
						className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
							level === lv 
								? "bg-white dark:bg-slate-700 shadow-md text-indigo-600 dark:text-white" 
								: "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
						}`}
					>
						<span>JLPT N{lv}</span>
						{counts[lv] > 0 && (
							<span className={`text-[10px] px-1.5 py-0.5 rounded-md ${level === lv ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>
								{counts[lv]}
							</span>
						)}
					</button>
				))}
				
				<button
					onClick={() => setLevel('null')}
					className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
						level === 'null' 
							? "bg-white dark:bg-slate-700 shadow-md text-indigo-600 dark:text-white" 
							: "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
					}`}
				>
					<span>Autres</span>
					{counts[null] > 0 && (
						<span className={`text-[10px] px-1.5 py-0.5 rounded-md ${level === 'null' ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>
							{counts[null]}
						</span>
					)}
				</button>
			</div>

			{/* Kanji Grid */}
			{loading ? (
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-4">
					{[...Array(16)].map((_, i) => (
						<div key={i} className="aspect-square bg-white dark:bg-slate-800/40 rounded-3xl animate-pulse border border-slate-100 dark:border-slate-800"></div>
					))}
				</div>
			) : (
				<>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-4">
						{kanjis.map((kanji) => (
							<div 
								key={kanji.id}
								className="group relative aspect-square bg-white dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-4 overflow-hidden"
							>
								<div className="text-4xl font-black mb-1 text-slate-800 dark:text-white group-hover:scale-110 transition-transform duration-300">
									{kanji.literal}
								</div>
								<div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 truncate w-full text-center">
									{JSON.parse(kanji.meanings_fr || kanji.meanings_en || "[]")[0]}
								</div>
								
								<div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 group-hover:bg-indigo-500 transition-colors"></div>
							</div>
						))}
					</div>

					{/* Pagination Controls */}
					{totalPages > 1 && (
						<div className="flex items-center justify-center gap-4 py-8">
							<button 
								onClick={() => handlePageChange(page - 1)}
								disabled={page === 1}
								className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
							>
								<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
								</svg>
							</button>
							
							<div className="flex items-center gap-2">
								<span className="text-sm font-bold text-slate-400">Page</span>
								<span className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-black text-indigo-600 dark:text-indigo-400 shadow-sm">
									{page} / {totalPages}
								</span>
							</div>

							<button 
								onClick={() => handlePageChange(page + 1)}
								disabled={page === totalPages}
								className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
							>
								<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
								</svg>
							</button>
						</div>
					)}
				</>
			)}

			{kanjis.length === 0 && !loading && (
				<div className="py-20 text-center space-y-4 bg-white/50 dark:bg-slate-800/30 rounded-[3rem] border border-dashed border-slate-300 dark:border-slate-700">
					<div className="text-5xl">🏮</div>
					<p className="text-slate-500 dark:text-slate-400 font-bold">
						{tNode('kanji.noKanjis') || "Aucun Kanji trouvé pour ce niveau."}
					</p>
					<p className="text-xs text-slate-400">L'importation est peut-être encore en cours...</p>
				</div>
			)}

			{/* Review Floating Action Button */}
			<div className="fixed bottom-6 right-8 z-50">
				<button className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl shadow-2xl shadow-indigo-500/40 font-black text-lg transition-all hover:scale-105 active:scale-95 group">
					<svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
					</svg>
					{tNode('kanji.startReview') || "Réviser mes Kanji"}
				</button>
			</div>
		</div>
	);
}
