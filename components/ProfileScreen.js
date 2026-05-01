import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";
import Ruby from "./Ruby";

export default function ProfileScreen({ goHome, currentUser, setCurrentUser }) {
  const { t, tNode } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newAvatar, setNewAvatar] = useState(null);
  const [newKanji, setNewKanji] = useState("");
  const [newReading, setNewReading] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      reader.onloadend = () => {
        setNewAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async () => {
    setErrorMsg("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, username: newUsername, avatar: newAvatar, kanji: newKanji, reading: newReading }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile({ ...profile, username: data.username, avatar: data.avatar, kanji: data.kanji, reading: data.reading });
        setCurrentUser({ ...currentUser, username: data.username, avatar: data.avatar });
        setEditing(false);
      } else {
        setErrorMsg(t(data.error));
      }
    } catch (err) {
      setErrorMsg(t("profile.errorSave"));
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-xl">{tNode("profile.loading")}</div>;
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">{tNode("profile.errorLoading")}</h2>
        <button onClick={goHome} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
          {tNode("profile.backToHome")}
        </button>
      </div>
    );
  }

  // Compute History Metrics
  let avgScore = 0;
  let avgTime = 0;
  let favMode = "-";
  let chartData = [];
  
  if (profile.all_recent_games && profile.all_recent_games.length > 0) {
    const games = profile.all_recent_games;
    const totalScorePct = games.reduce((acc, g) => acc + (g.score / g.total), 0);
    avgScore = Math.round((totalScorePct / games.length) * 100);
    const totalSeconds = games.reduce((acc, g) => acc + (g.duration_seconds || 0), 0);
    avgTime = Math.round(totalSeconds / games.length);
    const modeCounts = games.reduce((acc, g) => { acc[g.mode] = (acc[g.mode] || 0) + 1; return acc; }, {});
    favMode = Object.keys(modeCounts).reduce((a, b) => modeCounts[a] > modeCounts[b] ? a : b);
    
    // Prepare chart data (oldest to newest)
    chartData = games.slice().reverse().map(g => Math.round((g.score / g.total) * 100));
  }

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-6">
      <h2 className="text-4xl md:text-5xl font-extrabold mb-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 drop-shadow-sm">
        {tNode("profile.title")}
      </h2>

      <div className="w-full relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-3xl shadow-xl p-8 md:p-10 mb-10 overflow-hidden">
        {/* Decorative background shape */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-br from-indigo-400/20 to-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-8 border-b border-gray-200/50 dark:border-gray-700/50 pb-8">
            
            <div className="relative group">
              {editing ? (
                <div className="flex flex-col gap-2 relative">
                  <div className="relative w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-purple-500">
                    <img 
                      src={newAvatar || "https://ui-avatars.com/api/?name=" + newUsername + "&background=random"} 
                      alt={t("profile.avatarAlt")} 
                      className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-800"
                    />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    title={t("profile.changeAvatarTitle")}
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <span className="text-white text-xs font-bold px-2 py-1 bg-black/60 rounded-md">
                      {t("profile.changeButton")}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-purple-500 shadow-lg shadow-blue-500/30">
                  <img 
                    src={profile.avatar || "https://ui-avatars.com/api/?name=" + profile.username + "&background=random"} 
                    alt={t("profile.avatarAlt")} 
                    className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-800"
                  />
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left">
              {editing ? (
                <div className="flex flex-col gap-4 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 focus:ring-2 focus:ring-blue-500 focus:outline-none w-full"
                      placeholder={t('profile.usernamePlaceholder')}
                    />
                    <input
                      type="text"
                      value={newKanji}
                      onChange={(e) => setNewKanji(e.target.value)}
                      className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 focus:ring-2 focus:ring-blue-500 focus:outline-none w-full"
                      placeholder={t('profile.kanjiPlaceholder')}
                    />
                    <input
                      type="text"
                      value={newReading}
                      onChange={(e) => setNewReading(e.target.value)}
                      className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 focus:ring-2 focus:ring-blue-500 focus:outline-none w-full"
                      placeholder={t('profile.readingPlaceholder')}
                    />
                  </div>
                  <div className="flex justify-center sm:justify-start gap-3">
                    <button onClick={saveProfile} className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/30 hover:scale-105 active:scale-95 transition-all duration-300">
                      {t("profile.save")}
                    </button>
                    <button onClick={() => setEditing(false)} className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300">
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center sm:items-start gap-2">
                  <h3 className="text-3xl font-extrabold text-gray-800 dark:text-white">
                    {profile.kanji && profile.reading ? (
                      <Ruby base={profile.kanji} reading={profile.reading} />
                    ) : (
                      profile.username
                    )}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">{t("profile.memberSubtitle")}</p>
                  <button onClick={() => setEditing(true)} className="px-5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-full shadow-sm hover:shadow-md hover:border-blue-400 hover:text-blue-500 transition-all duration-300">
                    ✏️ {t("profile.edit")}
                  </button>
                </div>
              )}
            </div>

          </div>
          {errorMsg && <div className="bg-red-100 text-red-600 p-3 rounded-lg mt-4 font-medium text-sm animate-pulse">{errorMsg}</div>}

          {/* TABS NAVIGATION */}
          <div className="mt-10 flex flex-wrap gap-2 sm:gap-4 border-b border-gray-200 dark:border-gray-700 w-full">
            <button 
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-3 font-bold text-sm sm:text-base border-b-4 transition-all duration-300 ${activeTab === 'overview' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white'}`}
            >
              {tNode("profile.tabOverview")}
            </button>
            <button 
              onClick={() => setActiveTab("mastery")}
              className={`px-4 py-3 font-bold text-sm sm:text-base border-b-4 transition-all duration-300 ${activeTab === 'mastery' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white'}`}
            >
              {tNode("profile.tabMastery")}
            </button>
            <button 
              onClick={() => setActiveTab("history")}
              className={`px-4 py-3 font-bold text-sm sm:text-base border-b-4 transition-all duration-300 ${activeTab === 'history' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white'}`}
            >
              {tNode("profile.tabHistory")}
            </button>
          </div>

          <div className="mt-8 w-full">
            {activeTab === "overview" && (
              <div className="animate-fade-in">
                {/* Overview Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm flex flex-col relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 text-6xl opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">🎮</div>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">{tNode("profile.gamesPlayed")}</p>
                    <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{profile.games_played || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm flex flex-col relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 text-6xl opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">🎯</div>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">{tNode("profile.globalAccuracy")}</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-3xl font-black text-emerald-500 dark:text-emerald-400">{profile.global_accuracy || 0}</p>
                      <span className="text-xl font-bold text-emerald-500/60">%</span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm flex flex-col relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 text-6xl opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">✨</div>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">{tNode("profile.masteredKanas")}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-black text-amber-500 dark:text-amber-400">{profile.mastered_count || 0}</p>
                      <span className="text-xs font-bold text-amber-500/60">/142</span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm flex flex-col relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 text-6xl opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">⏱️</div>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">{tNode("profile.totalTime")}</p>
                    <p className="text-3xl font-black text-pink-500 dark:text-pink-400">
                      {profile.total_time ? (profile.total_time >= 3600 ? `${Math.floor(profile.total_time/3600)}h ${Math.floor((profile.total_time%3600)/60)}m` : `${Math.floor(profile.total_time/60)}m`) : "0m"}
                    </p>
                  </div>
                </div>

                <div className="w-full">
                  {/* Strongest / Weakest Kanas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 p-6 rounded-3xl shadow-sm flex flex-col">
                      <h5 className="font-bold text-emerald-700 dark:text-emerald-400 mb-4 flex items-center gap-2">{tNode("profile.mastered")}</h5>
                      {profile.strongest_kanas && profile.strongest_kanas.length > 0 ? (
                        <div className="flex flex-col gap-3 mt-auto">
                          {profile.strongest_kanas.map((k, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="w-8 text-center font-black text-xl text-gray-800 dark:text-gray-200">{k.kana}</div>
                              <div className="flex-1 h-2.5 bg-emerald-200 dark:bg-emerald-900/50 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${k.ratio}%` }}></div>
                              </div>
                              <div className="w-9 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">{Math.round(k.ratio)}%</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-emerald-600/50 italic my-auto text-center">{tNode("profile.playMoreMastered")}</div>
                      )}
                    </div>

                    <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 p-5 rounded-3xl shadow-sm flex flex-col">
                      <h5 className="font-bold text-rose-700 dark:text-rose-400 mb-4 flex items-center gap-2">{tNode("profile.toReview")}</h5>
                      {profile.weakest_kanas && profile.weakest_kanas.length > 0 ? (
                        <div className="flex flex-col gap-3 mt-auto">
                          {profile.weakest_kanas.map((k, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="w-8 text-center font-black text-xl text-gray-800 dark:text-gray-200">{k.kana}</div>
                              <div className="flex-1 h-2.5 bg-rose-200 dark:bg-rose-900/50 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${k.ratio}%` }}></div>
                              </div>
                              <div className="w-9 text-right text-xs font-bold text-rose-600 dark:text-rose-400">{Math.round(k.ratio)}%</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-rose-600/50 italic my-auto text-center">{tNode("profile.playMoreReview")}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "mastery" && (
              <div className="animate-fade-in bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 sm:p-8 rounded-3xl shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                  <div>
                    <h5 className="font-bold text-2xl text-gray-800 dark:text-white">{tNode("profile.masteryTitle")}</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{tNode("profile.masterySubtitle")}</p>
                  </div>
                  
                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 text-xs font-bold">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-emerald-500"></div> {tNode("profile.masteryLegendMastered")}</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-amber-400"></div> {tNode("profile.masteryLegendLearning")}</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-rose-500"></div> {tNode("profile.masteryLegendStruggling")}</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700"></div> {tNode("profile.masteryLegendUnseen")}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                  {/* Render the Heatmap from all_kana_stats */}
                  {/* Using Hiragana and Katakana lists from data (need to import them if not imported, or just map what we have in all_kana_stats) */}
                  {profile.all_kana_stats && profile.all_kana_stats.length > 0 ? (
                    profile.all_kana_stats.map((stat, i) => {
                      const r = stat.ratio;
                      let bgColor = "bg-gray-200 dark:bg-gray-700 text-gray-500";
                      if (stat.attempts >= 1) {
                        if (r >= 80) bgColor = "bg-emerald-500 text-white shadow-emerald-500/30";
                        else if (r >= 50) bgColor = "bg-amber-400 text-gray-900 shadow-amber-400/30";
                        else bgColor = "bg-rose-500 text-white shadow-rose-500/30";
                      }
                      
                      return (
                        <div 
                          key={i} 
                          className={`group relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-black text-xl sm:text-2xl shadow-sm transition-transform hover:scale-110 cursor-default ${bgColor}`}
                        >
                          {stat.kana}
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-xs font-bold py-1.5 px-3 rounded-lg pointer-events-none transition-opacity whitespace-nowrap z-20 shadow-xl border border-gray-700">
                            <div className="text-center text-lg mb-1">{stat.kana}</div>
                            {stat.attempts > 0 ? (
                              <>
                                <div className="text-gray-300">{stat.correct} / {stat.attempts} justes</div>
                                <div className="text-center text-indigo-300 mt-1">{Math.round(r)}%</div>
                              </>
                            ) : (
                              <div className="text-gray-400 italic">Non testé</div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-10 text-gray-500 italic text-center w-full">{tNode("profile.playMoreMastered")}</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="animate-fade-in space-y-6">
                
                {/* Analytics Header */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-2xl">📈</div>
                    <div>
                      <div className="text-sm font-bold text-gray-500 uppercase">Moyenne Récente</div>
                      <div className="text-2xl font-black text-gray-800 dark:text-white">{avgScore}%</div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-2xl">⏱️</div>
                    <div>
                      <div className="text-sm font-bold text-gray-500 uppercase">Temps Moyen</div>
                      <div className="text-2xl font-black text-gray-800 dark:text-white">{Math.floor(avgTime/60)}m {avgTime%60}s</div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-2xl">🎮</div>
                    <div>
                      <div className="text-sm font-bold text-gray-500 uppercase">Mode Favori</div>
                      <div className="text-2xl font-black text-gray-800 dark:text-white capitalize">{favMode === 'both' ? 'Mixte' : favMode}</div>
                    </div>
                  </div>
                </div>

                {/* Trend Chart */}
                {chartData.length > 1 && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-3xl shadow-sm">
                    <h5 className="font-bold text-gray-800 dark:text-white mb-6">Évolution du Score (50 dernières parties)</h5>
                    <div className="relative w-full h-32 flex items-end">
                      <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        {/* Area */}
                        <polygon 
                          points={`0,128 ${chartData.map((val, i) => `${(i / (chartData.length - 1)) * 100}%,${128 - (val * 1.28)}`).join(' ')} 100%,128`}
                          className="fill-indigo-500/10 dark:fill-indigo-400/10"
                        />
                        {/* Line */}
                        <polyline 
                          points={chartData.map((val, i) => `${(i / (chartData.length - 1)) * 100}%,${128 - (val * 1.28)}`).join(' ')}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-indigo-500 dark:text-indigo-400 drop-shadow-md"
                        />
                        {/* Points */}
                        {chartData.map((val, i) => (
                          <circle 
                            key={i}
                            cx={`${(i / (chartData.length - 1)) * 100}%`}
                            cy={`${128 - (val * 1.28)}`}
                            r="4"
                            className="fill-white dark:fill-gray-800 stroke-indigo-500 dark:stroke-indigo-400"
                            strokeWidth="2"
                          />
                        ))}
                      </svg>
                    </div>
                  </div>
                )}

                {/* Timeline / Cards */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 sm:p-8 rounded-3xl shadow-sm">
                  <div className="mb-6 flex justify-between items-end">
                    <div>
                      <h5 className="font-bold text-2xl text-gray-800 dark:text-white">{tNode("profile.historyTitle")}</h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{tNode("profile.historySubtitle")}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    {profile.all_recent_games && profile.all_recent_games.length > 0 ? (
                      profile.all_recent_games.map((game, i) => {
                        const dateObj = new Date(game.created_at);
                        const dateStr = dateObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
                        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const percent = Math.round((game.score / game.total) * 100);
                        const duration = game.duration_seconds ? `${Math.floor(game.duration_seconds/60)}m ${game.duration_seconds%60}s` : '-';
                        
                        let modeColor = "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
                        let modeIcon = "📝";
                        if (game.mode === 'hiragana') { modeColor = "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400"; modeIcon = "あ"; }
                        if (game.mode === 'katakana') { modeColor = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"; modeIcon = "ア"; }
                        if (game.mode === 'both') { modeColor = "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"; modeIcon = "両"; }

                        // Color logic for score
                        let scoreColor = "text-rose-500";
                        let ringColor = "stroke-rose-500";
                        if (percent === 100) { scoreColor = "text-emerald-500"; ringColor = "stroke-emerald-500"; }
                        else if (percent > 60) { scoreColor = "text-indigo-500"; ringColor = "stroke-indigo-500"; }

                        return (
                          <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all duration-300 group">
                            
                            <div className="flex items-center gap-4 sm:gap-6">
                              {/* Date Badge */}
                              <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-white dark:group-hover:bg-gray-700 shadow-sm transition-colors">
                                <span className="text-xs font-bold uppercase">{dateStr.split(' ')[1] || dateStr}</span>
                                <span className="text-lg font-black text-gray-800 dark:text-white leading-tight">{dateStr.split(' ')[0]}</span>
                              </div>

                              {/* Info */}
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-2 py-0.5 rounded flex items-center gap-1 text-xs font-bold uppercase ${modeColor}`}>
                                    <span>{modeIcon}</span> {game.mode === 'both' ? 'Mixte' : game.mode}
                                  </span>
                                </div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <span>{timeStr}</span>
                                  <span className="opacity-50">•</span>
                                  <span>⏱️ {duration}</span>
                                </div>
                              </div>
                            </div>

                            {/* Score Ring */}
                            <div className="flex items-center gap-4">
                              <div className="text-right hidden sm:block">
                                <div className={`text-xl font-black ${scoreColor}`}>{percent}%</div>
                                <div className="text-xs font-bold text-gray-400">{game.score} / {game.total} justes</div>
                              </div>
                              <div className="relative w-14 h-14 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                  <circle cx="28" cy="28" r="24" className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="4" fill="none" />
                                  <circle cx="28" cy="28" r="24" className={ringColor} strokeWidth="4" fill="none" strokeDasharray="150.8" strokeDashoffset={150.8 - (150.8 * percent) / 100} strokeLinecap="round" />
                                </svg>
                                <span className="absolute text-sm font-bold text-gray-800 dark:text-white sm:hidden">{percent}%</span>
                              </div>
                            </div>
                            
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-10 text-center text-gray-500 italic bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                        {tNode("profile.noRecentGames")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={goHome}
        className="px-8 py-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-2xl shadow-sm font-bold text-lg hover:shadow-md hover:bg-gray-200 dark:hover:bg-gray-700 hover:-translate-y-1 transition-all duration-300"
      >
        ⬅ {tNode("profile.backToHome")}
      </button>
    </div>
  );
}
