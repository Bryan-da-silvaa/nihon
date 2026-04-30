import { useState, useEffect } from "react";

export default function ProfileScreen({ goHome, currentUser, setCurrentUser }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newAvatar, setNewAvatar] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (currentUser) fetchProfile();
  }, [currentUser]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profile?userId=${currentUser.id}`);
      const data = await res.json();
      if (!data.error) {
        setProfile(data);
        setNewUsername(data.username);
        setNewAvatar(data.avatar);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg("L'image est trop volumineuse (max 2 Mo)");
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
        body: JSON.stringify({ userId: currentUser.id, username: newUsername, avatar: newAvatar }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile({ ...profile, username: data.username, avatar: data.avatar });
        setCurrentUser({ ...currentUser, username: data.username, avatar: data.avatar });
        setEditing(false);
      } else {
        setErrorMsg(data.error);
      }
    } catch (err) {
      setErrorMsg("Erreur lors de la sauvegarde");
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-xl">Chargement du profil...</div>;
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Erreur de chargement</h2>
        <button onClick={goHome} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-blue-600 dark:text-blue-400">Mon Profil</h2>

      <div className="bg-gray-50 dark:bg-gray-700 w-full p-6 rounded-xl shadow-inner mb-8">
        <div className="flex flex-col mb-6 border-b border-gray-200 dark:border-gray-600 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4">
            
            <div className="flex items-center gap-4">
              {editing ? (
                <div className="flex flex-col gap-2 relative">
                  <img 
                    src={newAvatar || "https://ui-avatars.com/api/?name=" + newUsername + "&background=random"} 
                    alt="Current Avatar" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Changer d'avatar"
                  />
                  <span className="text-xs text-center text-blue-500">Changer</span>
                </div>
              ) : (
                <img 
                  src={profile.avatar || "https://ui-avatars.com/api/?name=" + profile.username + "&background=random"} 
                  alt="Avatar" 
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-sm"
                />
              )}
            </div>

            <div className="flex-1 flex justify-end items-center">
              {editing ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="px-3 py-1 rounded border dark:bg-gray-800 dark:border-gray-600 max-w-[200px]"
                  />
                  <button onClick={saveProfile} className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg shadow hover:bg-green-600 transition">
                    Enregistrer
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold">{profile.username}</span>
                  <button onClick={() => setEditing(true)} className="text-sm bg-gray-200 dark:bg-gray-600 px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition">
                    Modifier
                  </button>
                </div>
              )}
            </div>

          </div>
          {errorMsg && <p className="text-red-500 text-sm mt-2 text-right">{errorMsg}</p>}
        </div>

        <h3 className="text-xl font-bold mb-4 text-left">Statistiques Globales</h3>
        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Parties jouées</p>
            <p className="text-2xl font-bold text-blue-500">{profile.games_played}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Bonnes réponses</p>
            <p className="text-2xl font-bold text-green-500">{profile.total_correct}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Record Hiragana</p>
            <p className="text-2xl font-bold text-purple-500">{profile.best_score_hiragana}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Record Katakana</p>
            <p className="text-2xl font-bold text-orange-500">{profile.best_score_katakana}</p>
          </div>
        </div>
      </div>

      <button
        onClick={goHome}
        className="px-8 py-3 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded-lg shadow-md font-bold text-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        Retour à l'accueil
      </button>
    </div>
  );
}
