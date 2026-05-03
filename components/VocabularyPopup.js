import React from 'react';

export default function VocabularyPopup({ word, reading, status, onUpdate, onClose, position }) {
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
			<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-4 min-w-[200px] backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
				<div className="text-center mb-4">
					<p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{reading}</p>
					<h4 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{word}</h4>
				</div>

				<div className="flex flex-col gap-2">
					{statuses.map(s => (
						<button
							key={s.id}
							onClick={() => {
								onUpdate(s.id);
								onClose();
							}}
							className={`flex items-center justify-between p-3 rounded-2xl transition-all hover:scale-105 active:scale-95 ${
								status === s.id 
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
