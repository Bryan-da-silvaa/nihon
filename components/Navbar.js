import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function Navbar({ goProfile, goAdmin, goLibrary, goHome, screen, currentUser, logout, isDarkMode, setIsDarkMode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, tNode, changeLanguage, language } = useLanguage();

  return (
    <nav className="w-full max-w-[1800px] mx-auto px-4 py-4 flex justify-between items-center relative z-50">
      <div className="flex items-center gap-8">
        <button 
          onClick={goHome}
          className="text-3xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400 hover:opacity-80 transition-opacity bg-transparent border-0 cursor-pointer flex items-center gap-2"
        >
          <span className="bg-indigo-600 text-white w-10 h-10 flex items-center justify-center rounded-xl text-xl">N</span>
          <span className="hidden sm:inline">{t('navbar.brand')}</span>
        </button>

        {/* Desktop Main Navigation */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
          <button
            onClick={goHome}
            className={`px-5 py-2 rounded-xl font-bold transition-all ${screen === 'home' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            {tNode('navbar.dashboard') || "Tableau de bord"}
          </button>
          <button
            onClick={goLibrary}
            className={`px-5 py-2 rounded-xl font-bold transition-all ${screen === 'library' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            {tNode('navbar.library')}
          </button>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        {/* Language & Theme Controls */}
        <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-900/40 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <button 
            onClick={() => changeLanguage(language === 'fr' ? 'ja' : 'fr')}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer font-bold text-sm"
          >
            {language === 'fr' ? (
              <><span className="text-lg">🇯🇵</span><span className="hidden lg:inline text-slate-600 dark:text-slate-400">JA</span></>
            ) : (
              <><span className="text-lg">🇫🇷</span><span className="hidden lg:inline text-slate-600 dark:text-slate-400">FR</span></>
            )}
          </button>
          
          <div className="w-px h-4 bg-slate-200 dark:border-slate-700 mx-1"></div>

          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex items-center justify-center w-9 h-9 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-slate-600 dark:text-slate-400"
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        {currentUser && (
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="group flex items-center gap-2 pl-1 pr-3 py-1 bg-white/50 dark:bg-slate-900/40 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer"
            >
              <img 
                src={currentUser.avatar || "https://ui-avatars.com/api/?name=" + currentUser.username + "&background=random"} 
                alt={t('navbar.profileAlt')}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="hidden sm:inline font-bold text-sm text-slate-700 dark:text-slate-200">{currentUser.username}</span>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-[60] flex flex-col gap-1">
                <button
                  onClick={() => { goProfile("overview"); setIsMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-800 dark:text-slate-200 font-bold transition-colors flex items-center gap-3"
                >
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {t('navbar.myProfile')}
                </button>
                <button
                  onClick={() => { goProfile("preferences"); setIsMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-bold transition-colors flex items-center gap-3"
                >
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {tNode('navbar.learningPreferences')}
                </button>
                
                <button
                  onClick={() => { goLibrary(); setIsMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-bold transition-colors flex items-center gap-3"
                >
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {tNode('navbar.library')}
                </button>

                <button
                  onClick={() => { goHome(); setIsMenuOpen(false); }}
                  className="md:hidden w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-bold transition-colors flex items-center gap-3"
                >
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  {tNode('navbar.dashboard') || "Tableau de bord"}
                </button>
                
                <button
                  onClick={() => { if (goAdmin) goAdmin(); setIsMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400 font-bold transition-colors flex items-center gap-3"
                >
                  <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  {tNode('navbar.admin')}
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2"></div>

                <button
                  onClick={() => { logout(); setIsMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl font-bold transition-colors flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t('navbar.logout')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
