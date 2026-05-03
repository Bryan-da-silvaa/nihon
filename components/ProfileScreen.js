import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";
import Ruby from "./Ruby";
import { getKanaDeck, getKanaColumnIndex, getKanaRowKey } from "../lib/kana";

export default function ProfileScreen({ goHome, currentUser, setCurrentUser, initialTab = "overview", startDirectSrsSession }) {
	const { t, tNode, tWithVars } = useLanguage();
	const [profile, setProfile] = useState(null);
	const [loading, setLoading] = useState(true);
	const [editing, setEditing] = useState(false);
	const [newUsername, setNewUsername] = useState("");
	const [newAvatar, setNewAvatar] = useState(null);
	const [newKanji, setNewKanji] = useState("");
	const [newReading, setNewReading] = useState("");
	const [newBanner, setNewBanner] = useState(null);
	const [learningStrategy, setLearningStrategy] = useState("balanced");
	const [sessionIntensity, setSessionIntensity] = useState("standard");
	const [errorMsg, setErrorMsg] = useState("");
	const [successMsg, setSuccessMsg] = useState("");
	const [isClearingData, setIsClearingData] = useState(false);
	const [showClearDataModal, setShowClearDataModal] = useState(false);
	const [activeTab, setActiveTab] = useState(initialTab);
	const [masteryScript, setMasteryScript] = useState("hiragana");

	const strategyOptions = [
		{ id: "balanced", label: t("home.focusBalanced"), desc: t("home.focusBalancedDesc") },
		{ id: "review", label: t("home.focusReview"), desc: t("home.focusReviewDesc") },
		{ id: "foundation", label: t("home.focusFoundation"), desc: t("home.focusFoundationDesc") },
		{ id: "weak", label: t("home.focusWeak"), desc: t("home.focusWeakDesc") },
	];

	const fetchProfile = useCallback(async () => {
		try {
			const res = await fetch(`/api/profile?userId=${currentUser.id}`);
			const data = await res.json();
			if (!data.error) {
				setProfile(data);
				setNewUsername(data.username);
				setNewAvatar(data.avatar);
				setNewKanji(data.kanji || "");
				setNewReading(data.reading || "");
				setNewBanner(data.banner || null);
				setLearningStrategy(data.learning_strategy || "balanced");
				setSessionIntensity(data.session_intensity || "standard");
			}
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}, [currentUser]);

	useEffect(() => {
		if (currentUser) fetchProfile();
	}, [currentUser, fetchProfile]);

	const handleAvatarChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			if (file.size > 2 * 1024 * 1024) {
				setErrorMsg(t("profile.errorImageSize"));
				return;
			}
			const reader = new FileReader();
			reader.onloadend = () => setNewAvatar(reader.result);
			reader.readAsDataURL(file);
		}
	};

	const handleBannerChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			if (file.size > 2 * 1024 * 1024) {
				setErrorMsg(t("profile.errorImageSize"));
				return;
			}
			const reader = new FileReader();
			reader.onloadend = () => setNewBanner(reader.result);
			reader.readAsDataURL(file);
		}
	};

	const saveProfile = async () => {
		setErrorMsg("");
		setSuccessMsg("");
		try {
			const res = await fetch("/api/profile", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: currentUser.id,
					username: newUsername,
					avatar: newAvatar,
					banner: newBanner,
					kanji: newKanji,
					reading: newReading,
					learningStrategy,
					sessionIntensity,
				}),
			});
			const data = await res.json();
			if (res.ok) {
				setProfile({ ...profile, ...data });
				setCurrentUser({ ...currentUser, ...data });
				setEditing(false);
				setSuccessMsg(t("profile.preferencesSaved"));
			} else {
				setErrorMsg(t(data.error));
			}
		} catch (err) {
			setErrorMsg(t("profile.errorSave"));
		}
	};

	const clearUserData = async () => {
		setIsClearingData(true);
		try {
			const res = await fetch("/api/profile/data", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId: currentUser.id }),
			});
			if (res.ok) {
				setSuccessMsg(t("profile.clearDataSuccess"));
				await fetchProfile();
				setShowClearDataModal(false);
			} else {
				setErrorMsg(t("profile.clearDataError"));
			}
		} catch (error) {
			setErrorMsg(t("profile.clearDataError"));
		} finally {
			setIsClearingData(false);
		}
	};

	if (loading) return (
		<div className="flex flex-col items-center justify-center py-20 gap-4">
			<div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
			<p className="text-sm font-black uppercase tracking-widest text-slate-400">{t("auth.loading")}</p>
		</div>
	);

	if (!profile) return (
		<div className="flex flex-col items-center py-20">
			<h2 className="text-2xl font-black text-rose-500 mb-6">{t("profile.errorLoading")}</h2>
			<button onClick={goHome} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg">Retour à l'Accueil</button>
		</div>
	);

	const statsMap = new Map((profile.all_kana_stats || []).map((item) => [item.kana, item]));
	const getMasteryRowLabel = (rowKey) => (rowKey === "vowel" ? "A" : rowKey.toUpperCase());

	return (
		<div className="flex flex-col w-full pb-8 animate-fade-in text-left">
			{/* Profile Hero Section */}
			<div className="relative -mx-8 md:-mx-12 -mt-8 md:-mt-12 mb-12 rounded-t-[3rem] overflow-hidden">
				{/* Banner Image */}
				<div className="absolute inset-0 z-0">
					{(editing ? newBanner : profile.banner) ? (
						<>
							<img
								src={editing ? newBanner : profile.banner}
								alt="Banner"
								className="w-full h-full object-cover"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
						</>
					) : (
						<div className="w-full h-full bg-gradient-to-br from-indigo-600/10 to-purple-600/10 dark:from-indigo-500/5 dark:to-purple-500/5"></div>
					)}
				</div>

				{/* Banner Change Button */}
				{editing && (
					<label className="absolute top-6 right-6 z-30 cursor-pointer px-4 py-2 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white text-xs font-black uppercase tracking-widest rounded-full transition-all flex items-center gap-2">
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
							<path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						Modifier la bannière
						<input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
					</label>
				)}

				<div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none z-10">
					<span className="text-[10rem]">🌸</span>
				</div>

				<div className="relative z-20 flex flex-col md:flex-row items-center gap-10 w-full p-8 md:p-12 pt-16 md:pt-24">
					{/* Avatar */}
					<div className="relative group shrink-0">
						<div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1.5 bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/20">
							<div className="w-full h-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900">
								<img
									src={editing ? (newAvatar || profile.avatar || "https://ui-avatars.com/api/?name=" + profile.username) : (profile.avatar || "https://ui-avatars.com/api/?name=" + profile.username)}
									alt="Profile"
									className="w-full h-full object-cover"
								/>
							</div>
							{editing && (
								<label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
									<span className="text-white text-xs font-black uppercase tracking-widest">Changer</span>
									<input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
								</label>
							)}
						</div>
					</div>

					{/* User Info */}
					<div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
						{editing ? (
							<div className="w-full space-y-4">
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
									<input
										type="text"
										value={newUsername}
										onChange={(e) => setNewUsername(e.target.value)}
										className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500 font-bold focus:outline-none"
										placeholder="Pseudo"
									/>
									<input
										type="text"
										value={newKanji}
										onChange={(e) => setNewKanji(e.target.value)}
										className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500 font-bold focus:outline-none"
										placeholder="Nom en Kanji"
									/>
									<input
										type="text"
										value={newReading}
										onChange={(e) => setNewReading(e.target.value)}
										className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500 font-bold focus:outline-none"
										placeholder="Lecture"
									/>
								</div>
								<div className="flex gap-3">
									<button onClick={saveProfile} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg">Enregistrer</button>
									<button onClick={() => setEditing(false)} className="px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-black">Annuler</button>
								</div>
							</div>
						) : (
							<>
								<div className="flex items-center gap-4 mb-2">
									<h2 className={`text-4xl md:text-5xl font-black tracking-tight ${(editing ? newBanner : profile.banner) ? "text-white" : "text-slate-800 dark:text-white"}`}>
										{profile.kanji ? <Ruby base={profile.kanji} reading={profile.reading} /> : profile.username}
									</h2>
									<span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${(editing ? newBanner : profile.banner) ? "bg-white/20 text-white border-white/30 backdrop-blur-md" : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/50"}`}>
										{profile.is_admin ? "Admin" : "Explorateur"}
									</span>
								</div>
								<p className={`font-medium mb-6 ${(editing ? newBanner : profile.banner) ? "text-slate-200" : "text-slate-500 dark:text-slate-400"}`}>
									{profile.created_at && !isNaN(new Date(profile.created_at).getTime())
										? `Membre passionné depuis le ${new Date(profile.created_at).toLocaleDateString()}`
										: "Membre passionné de Nihon"}
								</p>
								<button onClick={() => setEditing(true)} className={`px-6 py-2 rounded-full text-sm font-black transition-all ${(editing ? newBanner : profile.banner) ? "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md" : "bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white"}`}>✏️ Modifier le profil</button>
							</>
						)}
					</div>
				</div>
			</div>

			{/* Tab Navigation - Moved Below Banner */}
			<div className="flex gap-8 mb-8 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar">
				{["overview", "mastery", "history", "preferences"].map(tab => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab)}
						className={`pb-4 px-1 font-black text-xs uppercase tracking-[0.2em] transition-all border-b-4 ${activeTab === tab ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}
					>
						{tNode(`profile.tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`)}
					</button>
				))}
			</div>

			{/* Stats Grid - Always Visible */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
				{[
					{ icon: "🎮", label: tNode("profile.gamesPlayed"), value: profile.games_played || 0, color: "text-indigo-600" },
					{ icon: "🎯", label: tNode("profile.globalAccuracy"), value: (profile.global_accuracy || 0) + "%", color: "text-emerald-500" },
					{ icon: "✨", label: tNode("profile.masteredItems"), value: profile.mastered_count || 0, color: "text-amber-500", sub: "/142" },
					{ icon: "⏱️", label: tNode("profile.totalTime"), value: profile.total_time ? (profile.total_time >= 3600 ? Math.floor(profile.total_time / 3600) + "h" : Math.floor(profile.total_time / 60) + "m") : "0m", color: "text-rose-500" }
				].map((stat, idx) => (
					<div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-500/5 relative overflow-hidden group">
						<div className="absolute -right-4 -bottom-4 text-6xl opacity-5 group-hover:opacity-10 transition-opacity">{stat.icon}</div>
						<p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{stat.label}</p>
						<div className="flex items-baseline gap-1">
							<span className={`text-4xl font-black ${stat.color}`}>{stat.value}</span>
							{stat.sub && <span className="text-xs font-bold text-slate-400">{stat.sub}</span>}
						</div>
					</div>
				))}
			</div>

			{/* Main Tab Content */}
			<div className="space-y-12 mb-20 animate-fade-in">
				{activeTab === "overview" && (
					<div className="space-y-10">
						{/* Direct Action Card */}
						<div className="p-10 rounded-[3rem] bg-gradient-to-br from-indigo-600 to-purple-800 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
							<div className="absolute top-0 right-0 p-12 opacity-10 text-[10rem] group-hover:scale-110 transition-transform duration-700">🎯</div>
							<div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
								<div className="max-w-xl">
									<div className="inline-block px-4 py-1 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-widest mb-4">Statut de Révision</div>
									<h3 className="text-3xl font-black mb-4">
										{profile.due_count > 0 ? "Vos révisions quotidiennes sont prêtes !" : "Tout est à jour ! Félicitations."}
									</h3>
									<p className="text-lg text-indigo-100 font-medium leading-relaxed">
										{profile.due_count > 0 ? `Vous avez ${profile.due_count} éléments en attente. Ne laissez pas votre mémoire s'effacer !` : "Vous avez parfaitement maîtrisé vos éléments pour aujourd'hui. Profitez-en pour explorer du nouveau contenu !"}
									</p>
								</div>
								<button
									onClick={() => startDirectSrsSession && startDirectSrsSession()}
									disabled={!profile.due_count}
									className={`px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-2xl ${profile.due_count > 0 ? "bg-white text-indigo-600 hover:scale-105 active:scale-95" : "bg-indigo-400/30 text-indigo-200 cursor-not-allowed"}`}
								>
									{profile.due_count > 0 ? "🚀 Lancer la session" : "✨ Tout est parfait"}
								</button>
							</div>
						</div>
					</div>
				)}

				{activeTab === "mastery" && (
					<div className="space-y-8 animate-fade-in">
						<div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
							<div>
								<h3 className="text-3xl font-black text-slate-800 dark:text-white mb-2">{tNode("profile.masteryTitle")}</h3>
								<p className="text-slate-500 dark:text-slate-400 font-medium">{tNode("profile.masterySubtitle")}</p>
							</div>
							<div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
								<button onClick={() => setMasteryScript("hiragana")} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${masteryScript === "hiragana" ? "bg-white dark:bg-slate-900 shadow-md text-pink-600" : "text-slate-400 hover:text-slate-600"}`}>Hiragana</button>
								<button onClick={() => setMasteryScript("katakana")} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${masteryScript === "katakana" ? "bg-white dark:bg-slate-900 shadow-md text-blue-600" : "text-slate-400 hover:text-slate-600"}`}>Katakana</button>
							</div>
						</div>

						{/* Grid Container */}
						<div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-x-auto no-scrollbar">
							{(() => {
								const deck = getKanaDeck(masteryScript);
								const rows = deck.reduce((acc, item) => {
									const rk = getKanaRowKey(item.romaji);
									if (!acc[rk]) acc[rk] = [];
									acc[rk].push(item);
									return acc;
								}, {});

								const orderedRowKeys = Object.keys(rows).sort((a, b) => (rows[a][0]?.rowRank ?? 999) - (rows[b][0]?.rowRank ?? 999));

								return (
									<div className="space-y-4 min-w-[500px]">
										{orderedRowKeys.map(rowKey => (
											<div key={rowKey} className="flex items-center gap-6">
												<div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 border border-slate-200/50 dark:border-slate-800/50">
													{getMasteryRowLabel(rowKey)}
												</div>
												<div className="flex-1 grid grid-cols-5 gap-3">
													{rows[rowKey].sort((a, b) => getKanaColumnIndex(a.romaji) - getKanaColumnIndex(b.romaji)).map(item => {
														const stat = statsMap.get(item.kana);
														const attempts = Number(stat?.attempts) || 0;
														const ratio = Number(stat?.ratio) || 0;
														let statusColor = "bg-slate-100 dark:bg-slate-800 text-slate-300";
														if (attempts > 0) {
															if (ratio >= 80) statusColor = "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20";
															else if (ratio >= 50) statusColor = "bg-amber-400 text-amber-950";
															else statusColor = "bg-rose-500 text-white shadow-lg shadow-rose-500/20";
														}
														return (
															<div key={item.kana} className={`h-16 rounded-2xl flex flex-col items-center justify-center transition-all group relative cursor-default ${statusColor}`}>
																<span className="text-2xl font-black">{item.kana}</span>
																<span className="text-[10px] font-black uppercase tracking-tighter opacity-60 group-hover:hidden">{item.romaji}</span>
																{attempts > 0 && (
																	<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 dark:bg-white/10 rounded-2xl">
																		<span className="text-xs font-black">{Math.round(ratio)}%</span>
																	</div>
																)}
															</div>
														);
													})}
												</div>
											</div>
										))}
									</div>
								);
							})()}
						</div>
					</div>
				)}

				{activeTab === "history" && (
					<div className="space-y-8 animate-fade-in">
						<h3 className="text-3xl font-black text-slate-800 dark:text-white">{tNode("profile.historyTitle")}</h3>
						<div className="grid grid-cols-1 gap-4">
							{profile.all_recent_games?.length > 0 ? (
								profile.all_recent_games.map((game, i) => {
									const percent = Math.round((Number(game.score) / (Number(game.total) || 1)) * 100);
									const durationSec = Number(game.duration_seconds) || 0;
									return (
										<div key={i} className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-500/5 hover:border-indigo-400 transition-all flex flex-col sm:flex-row items-center justify-between gap-6">
											<div className="flex items-center gap-6">
												<div className="w-16 h-16 rounded-[1.5rem] bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-500 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
													<span className="text-xs font-black uppercase tracking-widest leading-none">{new Date(game.created_at).toLocaleDateString(undefined, { month: 'short' })}</span>
													<span className="text-2xl font-black leading-none mt-1">{new Date(game.created_at).getDate()}</span>
												</div>
												<div>
													<div className="flex items-center gap-3 mb-1">
														<h4 className="font-black text-lg text-slate-800 dark:text-white capitalize">{game.mode === 'both' ? "Mixte (H+K)" : game.mode}</h4>
														<span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(game.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
													</div>
													<p className="text-sm font-medium text-slate-500 dark:text-slate-400">⏱️ {Math.floor(durationSec / 60)}m {durationSec % 60}s • 🎯 {game.score}/{game.total} élém. corrects</p>
												</div>
											</div>
											<div className="flex items-center gap-6 shrink-0">
												<div className="text-right">
													<p className={`text-3xl font-black ${percent >= 80 ? "text-emerald-500" : percent >= 50 ? "text-amber-500" : "text-rose-500"}`}>{percent}%</p>
													<div className="w-32 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
														<div className={`h-full ${percent >= 80 ? "bg-emerald-500" : percent >= 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${percent}%` }}></div>
													</div>
												</div>
											</div>
										</div>
									);
								})
							) : (
								<div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">Aucune partie enregistrée</div>
							)}
						</div>
					</div>
				)}

				{activeTab === "preferences" && (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-fade-in">
						{/* Learning Strategy */}
						<div className="space-y-6">
							<h4 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
								<span className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600">🎯</span>
								Objectifs d'Apprentissage
							</h4>
							<div className="space-y-3">
								{strategyOptions.map(option => (
									<button
										key={option.id}
										onClick={() => { setLearningStrategy(option.id); }}
										className={`w-full p-6 rounded-2xl border text-left transition-all ${learningStrategy === option.id ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 ring-2 ring-indigo-500/20" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300"}`}
									>
										<p className="font-black text-slate-800 dark:text-white mb-1">{option.label}</p>
										<p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{option.desc}</p>
									</button>
								))}
							</div>
							<button onClick={saveProfile} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all">Sauvegarder les préférences</button>
						</div>

						{/* Data Management */}
						<div className="space-y-6">
							<h4 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
								<span className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600">⚠️</span>
								Zone de Danger
							</h4>
							<div className="p-8 rounded-[2rem] border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20">
								<h5 className="font-black text-rose-600 dark:text-rose-400 mb-2">{tNode("profile.clearDataTitle")}</h5>
								<p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">{tNode("profile.clearDataDesc")}</p>
								<button
									onClick={() => setShowClearDataModal(true)}
									className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-all"
								>
									Effacer mes données d'apprentissage
								</button>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Modals */}
			{showClearDataModal && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-900/40 animate-fade-in">
					<div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
						<div className="absolute top-0 left-0 right-0 h-2 bg-rose-500"></div>
						<h3 className="text-2xl font-black text-slate-800 dark:text-white mb-4">Confirmation Requise</h3>
						<p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">Cette action réinitialisera votre progression, vos statistiques et votre historique. Votre compte utilisateur sera conservé.</p>
						<div className="flex gap-4">
							<button onClick={() => setShowClearDataModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black text-slate-500">Annuler</button>
							<button onClick={clearUserData} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-500/20">Confirmer</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
