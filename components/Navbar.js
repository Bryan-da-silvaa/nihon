import useDarkMode from "../hooks/useDarkMode";

export default function Navbar() {
  const [isDarkMode, setIsDarkMode] = useDarkMode();

  return (
    <nav className="w-full max-w-[1800px] mx-auto px-4 flex justify-end mb-4">
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer font-bold"
      >
        {isDarkMode ? '☀️ Mode Clair' : '🌙 Mode Sombre'}
      </button>
    </nav>
  );
}
