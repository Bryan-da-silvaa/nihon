import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function AuthScreen({ onLogin }) {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg(t('auth.errorImageSize'));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, avatar }),
      });
      const data = await res.json();
      
      if (res.ok) {
        onLogin(data.user);
      } else {
        setErrorMsg(data.error ? t(data.error) : t('auth.errorGeneric'));
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(t('auth.errorNetwork'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto py-12 relative min-h-[600px]">
      {/* Decorative abstract shapes behind the form */}
      <div className="absolute top-0 -left-10 w-72 h-72 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob pointer-events-none dark:opacity-20"></div>
      <div className="absolute top-0 -right-10 w-72 h-72 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 pointer-events-none dark:opacity-20"></div>
      <div className="absolute -bottom-10 left-20 w-72 h-72 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 pointer-events-none dark:opacity-20"></div>

      <div className="w-full backdrop-blur-2xl bg-white/60 dark:bg-gray-900/60 border border-white/60 dark:border-white/10 p-10 sm:p-12 rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden">
        {/* Subtle inner top highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent"></div>
        
        <div className="text-center mb-10">
          <h2 className="text-4xl sm:text-5xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 drop-shadow-sm">
            {t('auth.welcome')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {isLogin ? t('auth.welcomeBack') : t('auth.joinAdventure')}
          </p>
        </div>
        
        <h3 className="text-2xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100">
          {isLogin ? t('auth.login') : t('auth.register')}
        </h3>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col relative group">
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="peer w-full px-5 py-4 rounded-2xl border-2 border-transparent bg-white/50 dark:bg-gray-800/50 text-black dark:text-white focus:bg-white/80 dark:focus:bg-gray-800/80 focus:outline-none focus:border-indigo-400/50 dark:focus:border-indigo-500/50 transition-all duration-300 shadow-inner"
              placeholder=" "
              required
            />
            <label 
              htmlFor="username"
              className="absolute left-5 top-4 text-gray-500 dark:text-gray-400 transition-all duration-300 pointer-events-none
                         peer-focus:-translate-y-7 peer-focus:scale-85 peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
                         peer-valid:-translate-y-7 peer-valid:scale-85 peer-valid:text-indigo-600 dark:peer-valid:text-indigo-400 bg-transparent px-1 font-semibold"
            >
              {t('auth.username')}
            </label>
          </div>
          
          <div className="flex flex-col relative group">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="peer w-full px-5 py-4 rounded-2xl border-2 border-transparent bg-white/50 dark:bg-gray-800/50 text-black dark:text-white focus:bg-white/80 dark:focus:bg-gray-800/80 focus:outline-none focus:border-indigo-400/50 dark:focus:border-indigo-500/50 transition-all duration-300 shadow-inner"
              placeholder=" "
              required
            />
            <label 
              htmlFor="password"
              className="absolute left-5 top-4 text-gray-500 dark:text-gray-400 transition-all duration-300 pointer-events-none
                         peer-focus:-translate-y-7 peer-focus:scale-85 peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
                         peer-valid:-translate-y-7 peer-valid:scale-85 peer-valid:text-indigo-600 dark:peer-valid:text-indigo-400 bg-transparent px-1 font-semibold"
            >
              {t('auth.password')}
            </label>
          </div>

          {!isLogin && (
            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl bg-white/30 dark:bg-gray-800/30 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors duration-300 relative">
              {avatar ? (
                <img src={avatar} alt={t('auth.avatarPreview')} className="w-20 h-20 rounded-full object-cover border-4 border-indigo-500 shadow-lg" />
              ) : (
                <div className="text-4xl mb-2 text-indigo-400">📸</div>
              )}
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 mt-2">
                {avatar ? t('auth.changeAvatar') : t('auth.avatarLabel')}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Upload Avatar"
              />
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-100/80 dark:bg-rose-900/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 p-3 rounded-xl text-sm font-semibold text-center animate-pulse">
              {errorMsg}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl font-extrabold text-lg shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {t('auth.loading')}
              </span>
            ) : isLogin ? t('auth.submitLogin') : t('auth.submitRegister')}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-200/50 dark:border-gray-700/50 pt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {isLogin ? t('auth.noAccount') : t('auth.alreadyHasAccount')}
          </p>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg("");
              setAvatar(null);
            }}
            className="text-indigo-600 dark:text-indigo-400 hover:text-purple-600 dark:hover:text-purple-400 hover:underline text-base font-bold mt-2 transition-colors"
          >
            {isLogin ? t('auth.createAccount') : t('auth.login')}
          </button>
        </div>
      </div>
    </div>
  );
}

