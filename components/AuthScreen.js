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
    <div className="flex flex-col items-center max-w-md mx-auto py-10">
      <h2 className="text-3xl font-bold mb-6 text-blue-600 dark:text-blue-400">
        {t('auth.welcome')}
      </h2>
      
      <div className="bg-gray-50 dark:bg-gray-700 w-full p-8 rounded-xl shadow-inner mb-6">
        <h3 className="text-xl font-bold mb-6 text-center">
          {isLogin ? t('auth.login') : t('auth.register')}
        </h3>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-left">{t('auth.username')}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-left">{t('auth.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-1 text-left">{t('auth.avatarLabel')}</label>
              <div className="flex items-center gap-4">
                {avatar && (
                  <img src={avatar} alt={t('auth.avatarPreview')} className="w-12 h-12 rounded-full object-cover border border-gray-300" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="w-full text-sm text-gray-500 dark:text-gray-300
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
            </div>
          )}

          {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition disabled:opacity-50"
          >
            {loading ? t('auth.loading') : isLogin ? t('auth.submitLogin') : t('auth.submitRegister')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {isLogin ? t('auth.noAccount') : t('auth.alreadyHasAccount')}
          </p>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg("");
            }}
            className="text-blue-500 hover:underline text-sm font-bold mt-1"
          >
            {isLogin ? t('auth.createAccount') : t('auth.login')}
          </button>
        </div>
      </div>
    </div>
  );
}

