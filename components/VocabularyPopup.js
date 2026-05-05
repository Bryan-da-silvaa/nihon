import React, { useState, useEffect } from 'react';

export default function VocabularyPopup({ word, reading, status, onUpdate, onClose, position }) {
	const [translations, setTranslations] = useState([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!word && !reading) return;
		
		const fetchTranslations = async () => {
			setIsLoading(true);
			try {
				// Cherche d'abord avec le kanji, sinon le kana
				const searchQuery = word || reading;
				const res = await fetch(`/api/dictionary/search?q=${encodeURIComponent(searchQuery)}`);
				const data = await res.json();
				if (data.results) {
					setTranslations(data.results);
				}
			} catch (err) {
				console.error(err);
			} finally {
				setIsLoading(false);
			}
		};

		fetchTranslations();
	}, [word, reading]);

	if (!word) return null;

	const statuses = [
		{ id: 0, label: "Inconnu", color: "bg-rose-500", icon: "×" },
		{ id: 1, label: "À apprendre", color: "bg-amber-500", icon: "!" },
		{ id: 2, label: "Connu", color: "bg-emerald-500", icon: "✓" }
	];

	return (
		<div
			className="fixed z-[100] animate-in fade-in zoom-in duration-200"
			style={{
				left: position.x,
				top: position.y,
				transform: 'translate(-50%, -100%) translateY(-12px)'
			}}
		>
			<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 min-w-[240px] max-w-[320px] backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
				<div className="text-center mb-4">
					<p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{reading}</p>
					<h4 className="text-3xl font-black text-slate-800 dark:text-white leading-tight mb-0">{word}</h4>
				</div>

				{/* Affichage des Traductions depuis le Dictionnaire */}
				<div className="mb-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 max-h-40 overflow-y-auto custom-scrollbar">
					<h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Traductions Dictionary</h5>
					{isLoading ? (
						<p className="text-xs text-slate-500 animate-pulse">Recherche...</p>
					) : translations.length > 0 ? (
						<div className="space-y-3">
							{translations.slice(0, 3).map((item, idx) => (
								<div key={idx}>
									<div className="flex flex-wrap gap-1 mb-1">
										{item.partOfSpeech && item.partOfSpeech.slice(0, 2).map((pos, pIdx) => (
											<span key={pIdx} className="text-[8px] bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-1 py-0.5 rounded uppercase">{pos}</span>
										))}
									</div>
									<p className="text-xs text-slate-700 dark:text-slate-200 leading-snug">
										{item.meanings.slice(0, 3).join(', ')}
									</p>
								</div>
							))}
						</div>
					) : (
						<p className="text-xs text-slate-500 italic">Aucune traduction exacte trouvée.</p>
					)}
				</div>

				<div className="flex flex-col gap-2">
					{statuses.map(s => (
						<button
							key={s.id}
							onClick={() => {
								onUpdate(s.id);
								onClose();
							}}
							className={`flex items-center justify-between p-3 rounded-2xl transition-all hover:scale-105 active:scale-95 ${status === s.id
									? `${s.color} text-white shadow-lg`
									: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
								}`}
						>
							<span className="text-xs font-black uppercase tracking-widest">{s.label}</span>
							<span className="text-lg font-bold">{s.icon}</span>
						</button>
					))}
				</div>

				<div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
					<button
						onClick={onClose}
						className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500"
					>
						Fermer
					</button>
				</div>

				{/* Arrow */}
				<div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-900 rotate-45 border-r border-b border-slate-200 dark:border-slate-800"></div>
			</div>
		</div>
	);
}
