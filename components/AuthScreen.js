import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function AuthScreen({ onLogin }) {
  const { t, tNode } = useLanguage();
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
    <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto bg-slate-50 dark:bg-slate-950">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-indigo-500/20 dark:bg-indigo-900/30 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-purple-500/10 dark:bg-purple-900/20 rounded-full blur-[120px] pointer-events-none animate-pulse delay-1000"></div>

      <div className="w-full max-w-[440px] relative z-10 py-8">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border border-white dark:border-slate-800 rounded-[3rem] p-8 md:p-10 shadow-2xl shadow-indigo-500/10 relative overflow-hidden group">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-700 text-white text-4xl font-black mb-6 shadow-xl shadow-indigo-500/30 transform transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500">
              N
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
              {isLogin ? t('auth.login') : t('auth.register')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {isLogin ? t('auth.welcomeBack') : t('auth.joinAdventure')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 px-1">
                {t('auth.username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-transparent focus:border-indigo-400 dark:focus:border-indigo-500 text-slate-800 dark:text-white focus:outline-none transition-all font-bold placeholder:text-slate-400"
                placeholder={t('auth.username')}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 px-1">
                {t('auth.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-transparent focus:border-indigo-400 dark:focus:border-indigo-500 text-slate-800 dark:text-white focus:outline-none transition-all font-bold placeholder:text-slate-400"
                placeholder="••••••••"
                required
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 px-1">
                  {t('auth.avatarLabel')}
                </label>
                <div className="relative group/avatar">
                  <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                      {avatar ? (
                        <img src={avatar} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-6 h-6 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      {avatar ? t('auth.changeAvatar') : tNode('auth.chooseAvatar') || "Choisir une image"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-sm font-bold animate-shake flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-3 mt-4"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t('auth.loading')}
                </>
              ) : (
                <>
                  {isLogin ? (
                    <svg className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 group-hover:scale-125 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                    </svg>
                  )}
                  {isLogin ? t('auth.submitLogin') : t('auth.submitRegister')}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-3">
              {isLogin ? t('auth.noAccount') : t('auth.alreadyHasAccount')}
            </p>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg("");
                setAvatar(null);
              }}
              className="text-indigo-600 dark:text-indigo-400 font-black hover:underline transition-all"
            >
              {isLogin ? t('auth.createAccount') : t('auth.login')}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-slate-400 dark:text-slate-600 text-xs font-black uppercase tracking-[0.2em] mt-8">
          Nihon All-In-One Platform • 2026
        </p>
      </div>
    </div>
  );
}
