import { useLanguage } from "../context/LanguageContext";
import { getKanaDeck, getKanaRowKey } from "../lib/kana";

export default function HomeScreen({
	openSetup,
	startDirectSrsSession,
	startGuidedLearning,
	currentUser,
	userSummary,
	isLoadingSummary,
	goLibrary,
	fetchUserSummary,
	errorMsg
}) {
	const { t, tNode, tWithVars } = useLanguage();

	const scriptOptions = [
		{ id: "hiragana", label: tNode('home.hiragana'), icon: <span className="text-2xl">あ</span> },
		{ id: "katakana", label: tNode('home.katakana'), icon: <span className="text-2xl">ア</span> },
		{
			id: "both", label: tNode('home.both'), icon: (
				<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
					<path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
				</svg>
			)
		},
	];

	const jlptLevels = ['n5', 'n4', 'n3', 'n2', 'n1'];
	const dueCount = userSummary?.due_count || 0;
	const isAllKanaLearned = (userSummary?.all_kana_stats?.length || 0) >= 142;

	return (
		<div className="flex flex-col w-full py-2 animate-fade-in lg:py-6">
			{/* Dashboard Header */}
			<div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-12 text-left">
				<div className="max-w-2xl">
					<h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 dark:text-white mb-3 tracking-tight leading-tight">
						{tWithVars('home.welcomeBack', { username: currentUser?.username || 'Guerrier' })}
					</h1>
					<p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium opacity-80">
						{tNode('home.summaryTitle')}
					</p>
				</div>

				{/* Quick Stats Grid */}
				<div className="flex justify-end w-full xl:w-auto">
					<div className="px-6 py-5 lg:px-8 lg:py-6 rounded-[2rem] bg-white/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group min-w-[160px]">
						<div className="absolute -right-2 -bottom-2 text-rose-500 opacity-5 group-hover:opacity-10 transition-opacity">
							<svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
								<path d="M11.76 3.912a.75.75 0 01.78 0c4.143 2.503 6.96 7.012 6.96 12.088A7.5 7.5 0 0112 23.5a7.5 7.5 0 01-7.5-7.5c0-5.076 2.817-9.585 6.96-12.088zM12 8.4a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 0112 8.4z" />
							</svg>
						</div>
						<div className="text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-2">{tNode('home.streakLabel')}</div>
						<div className="text-3xl lg:text-4xl font-black text-rose-500">{userSummary?.streak || 0} {t('home.streakUnit')}</div>
					</div>
				</div>
			</div>

			{/* Main Action Area */}
			<div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16">
				{/* PRIMARY: GUIDED LEARNING */}
				<div className="lg:col-span-2 xl:col-span-3 relative">
					<div className={`h-full min-h-[340px] rounded-[3rem] p-8 md:p-12 border transition-all duration-700 overflow-hidden group ${isAllKanaLearned ? "bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 border-emerald-200/50 dark:border-emerald-800/30 text-white shadow-2xl shadow-emerald-500/20" : "bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 border-indigo-200/50 dark:border-indigo-800/30 text-white shadow-2xl shadow-indigo-500/20"}`}>
						<div className="absolute top-0 right-0 p-12 opacity-20 group-hover:scale-110 transition-transform duration-700 pointer-events-none transform rotate-12">
							<span className="text-[12rem] md:text-[14rem] leading-none select-none">{isAllKanaLearned ? "🎓" : "⛩️"}</span>
						</div>

						<div className="relative z-10 flex flex-col h-full justify-between gap-10 text-left">
							<div>
								<span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-widest mb-6 inline-block">
									{isAllKanaLearned ? "MAÎTRISE COMPLÈTE" : tNode('home.nextBatchReady')}
								</span>
								<h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight max-w-2xl">
									{isAllKanaLearned ? "Tous les Kana appris !" : tNode('home.guidedPathTitle')}
								</h2>
								<p className="text-lg md:text-xl font-medium opacity-90 max-w-xl">
									{isAllKanaLearned ? "Félicitations, vous avez débloqué tous les éléments ! Continuez vos révisions pour ancrer ces connaissances." : tNode('home.guidedPathDesc')}
								</p>
								{errorMsg && !isAllKanaLearned && (
									<div className="mt-6 px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold flex items-center gap-3 animate-shake">
										<svg className="w-5 h-5 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
										</svg>
										{errorMsg}
									</div>
								)}
							</div>

							{!isAllKanaLearned ? (
								<button
									type="button"
									onClick={() => startGuidedLearning()}
									className="self-start px-10 py-5 bg-white text-indigo-600 font-black text-xl rounded-2xl shadow-2xl hover:scale-105 hover:shadow-white/20 active:scale-95 transition-all duration-300 flex items-center gap-4 group/btn"
								>
									<svg className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
									</svg>
									{t('home.startGuidedLearning')}
								</button>
							) : (
								<div className="flex items-center gap-4 text-white/80 font-black text-xl uppercase tracking-widest bg-white/10 backdrop-blur-sm self-start px-8 py-4 rounded-2xl border border-white/20">
									<svg className="w-6 h-6 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									Aucun élément à apprendre
								</div>
							)}
						</div>
					</div>
				</div>

				{/* SECONDARY: SRS REVIEWS */}
				<div className="relative">
					<div className={`h-full rounded-[3rem] p-8 border transition-all duration-300 ${dueCount > 0 ? "bg-white dark:bg-slate-800 border-indigo-100 dark:border-slate-700 shadow-xl" : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60"}`}>
						<div className="flex flex-col h-full justify-between gap-6 text-left">
							<div>
								<div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${dueCount > 0 ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "bg-slate-200 dark:bg-slate-700 text-slate-400"}`}>
									<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
									{dueCount > 0 ? tWithVars('home.reviewTask', { count: dueCount }) : t('home.allCaughtUp')}
								</h3>
								<p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
									{dueCount > 0 ? "Consolidez votre mémoire sur les éléments déjà appris." : "Toutes vos révisions sont terminées pour le moment."}
								</p>
							</div>

							{dueCount > 0 && (
								<button
									onClick={() => startDirectSrsSession()}
									className="w-full py-4 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-600 dark:text-slate-300 font-black text-sm rounded-xl transition-all active:scale-95"
								>
									{t('home.startReview')}
								</button>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Learning Modules Grid */}
			<div className="flex flex-col gap-12 text-left">
				<div className="flex items-center justify-between px-4">
					<h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-3">
						<span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
						{tNode('home.learningHub')}
					</h2>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{/* Foundations Module */}
					<div className="flex flex-col gap-6">
						<div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-xl inline-block self-start text-[10px] font-black uppercase tracking-widest text-slate-500">
							{tNode('home.foundations')}
						</div>
						<div className="grid grid-cols-1 gap-4">
							{scriptOptions.map((option) => (
								<button
									key={option.id}
									type="button"
									onClick={() => openSetup(option.id)}
									className="group relative flex items-center gap-6 p-6 bg-white/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl hover:shadow-xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 text-left overflow-hidden"
								>
									<div className="absolute -right-4 -bottom-4 text-6xl opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500 pointer-events-none">
										{option.icon}
									</div>
									<div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-3xl group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300 shadow-inner font-black">
										{option.icon}
									</div>
									<div className="flex-1">
										<h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
											{option.label}
										</h3>
										<p className="text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-1 opacity-80">
											{tNode(`home.script${option.id.charAt(0).toUpperCase() + option.id.slice(1)}Desc`)}
										</p>
									</div>
								</button>
							))}
						</div>
					</div>

					{/* Kanji & Vocabulary Module */}
					<div className="flex flex-col gap-6">
						<div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-xl inline-block self-start text-[10px] font-black uppercase tracking-widest text-slate-500">
							{tNode('home.kanjiVocab')}
						</div>
						<div className="grid grid-cols-1 gap-3">
							{jlptLevels.map((level) => (
								<button
									key={level}
									type="button"
									onClick={() => openSetup(level)}
									className="group flex items-center justify-between p-4 bg-white/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all text-left"
								>
									<div className="flex items-center gap-4">
										<div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
											{level.toUpperCase()}
										</div>
										<div>
											<h4 className="font-bold text-slate-800 dark:text-slate-100">JLPT {level.toUpperCase()}</h4>
											<p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
												{tNode(`home.jlpt${level.toUpperCase()}Desc`)}
											</p>
										</div>
									</div>
									<div className="text-slate-300 group-hover:text-indigo-500 transition-all transform group-hover:translate-x-1">
										<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
										</svg>
									</div>
								</button>
							))}
						</div>
					</div>

					{/* Immersion & Challenges */}
					<div className="flex flex-col gap-6">
						<div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-xl inline-block self-start text-[10px] font-black uppercase tracking-widest text-slate-500">
							{tNode('home.immersion')}
						</div>
						<div className="space-y-4">
							<button
								onClick={() => openSetup('marathon')}
								className="w-full p-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2rem] text-white text-left relative overflow-hidden group shadow-lg shadow-amber-500/20"
							>

								<h4 className="text-lg font-black mb-1">{tNode('home.marathonTitle')}</h4>
								<p className="text-xs font-bold opacity-90 leading-relaxed max-w-[80%]">{tNode('home.marathonDesc')}</p>
							</button>
							<button
								onClick={() => openSetup('contrast')}
								className="w-full p-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-[2rem] text-white text-left relative overflow-hidden group shadow-lg shadow-cyan-500/20"
							>

								<h4 className="text-lg font-black mb-1">{tNode('home.contrastTitle')}</h4>
								<p className="text-xs font-bold opacity-90 leading-relaxed max-w-[80%]">{tNode('home.contrastDesc')}</p>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}