import { useState } from "react";
import useDarkMode from "../hooks/useDarkMode";

export default function Navbar({ goProfile, goHome, screen, currentUser, logout }) {
  const [isDarkMode, setIsDarkMode] = useDarkMode();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="w-full max-w-[1800px] mx-auto px-4 flex justify-between mb-4 items-center">
      <button 
        onClick={goHome}
        className="text-2xl font-black tracking-widest text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity bg-transparent border-0 cursor-pointer"
      >
        Nihon
      </button>

      <div className="flex gap-4 items-center">
        {currentUser && (
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-10 h-10 rounded-full shadow-sm border-2 border-transparent hover:border-blue-500 transition-all cursor-pointer focus:outline-none"
              title="Menu utilisateur"
            >
              <img 
                src={currentUser.avatar || "https://ui-avatars.com/api/?name=" + currentUser.username + "&background=random"} 
                alt="Profil"
                className="w-full h-full rounded-full object-cover border border-gray-300 dark:border-gray-600"
              />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50 flex flex-col">
                {screen !== 'profile' && (
                  <button
                    onClick={() => {
                      goProfile();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold transition-colors border-b border-gray-100 dark:border-gray-700"
                  >
                    👤 Mon Profil
                  </button>
                )}
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold transition-colors"
                >
                  🚪 Déconnexion
                </button>
              </div>
            )}
          </div>
        )}

        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-800 text-black dark:text-white rounded-full shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer text-xl"
          title="Changer de thème"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
}
