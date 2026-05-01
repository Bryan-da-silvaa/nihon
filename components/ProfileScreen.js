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

          <div className="mt-8">
            <h4 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
              📊 {tNode("profile.statsTitle")}
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40 border border-blue-100 dark:border-blue-700/50 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-center sm:items-start">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl mb-3 shadow-md shadow-blue-500/30">🎮</div>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-300 mb-1">{tNode("profile.gamesPlayed")}</p>
                <p className="text-3xl font-black text-gray-800 dark:text-white">{profile.games_played}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/40 dark:to-emerald-800/40 border border-green-100 dark:border-green-700/50 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-center sm:items-start">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xl mb-3 shadow-md shadow-emerald-500/30">🎯</div>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-300 mb-1">{tNode("profile.correctAnswers")}</p>
                <p className="text-3xl font-black text-gray-800 dark:text-white">{profile.total_correct}</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-fuchsia-100 dark:from-purple-900/40 dark:to-fuchsia-800/40 border border-purple-100 dark:border-purple-700/50 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-center sm:items-start">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white text-xl mb-3 shadow-md shadow-purple-500/30">✨</div>
                <p className="text-sm font-semibold text-purple-600 dark:text-purple-300 mb-1">{tNode("profile.bestHiragana")}</p>
                <p className="text-3xl font-black text-gray-800 dark:text-white">{profile.best_score_hiragana}</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/40 dark:to-amber-800/40 border border-orange-100 dark:border-orange-700/50 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-center sm:items-start">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl mb-3 shadow-md shadow-orange-500/30">🏆</div>
                <p className="text-sm font-semibold text-orange-600 dark:text-orange-300 mb-1">{tNode("profile.bestKatakana")}</p>
                <p className="text-3xl font-black text-gray-800 dark:text-white">{profile.best_score_katakana}</p>
              </div>

            </div>
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
