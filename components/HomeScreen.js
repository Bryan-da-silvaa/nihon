import { useLanguage } from "../context/LanguageContext";

export default function HomeScreen({ 
  startGame, 
  kanaCount, 
  setKanaCount, 
  errorMsg, 
  useTimer, 
  setUseTimer, 
  timeLimit, 
  setTimeLimit 
}) {
  const { t, tNode } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center w-full py-8">
      <h1 className="text-5xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-6 drop-shadow-sm pb-2">
        {tNode('home.title')}
      </h1>
      <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl text-center">
        {tNode('home.subtitle')}
      </p>

      <div className="flex flex-col md:flex-row justify-center gap-6 mb-12 w-full max-w-4xl">
        <button 
          onClick={() => startGame("hiragana")} 
          className="flex-1 bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white px-8 py-6 rounded-3xl shadow-lg hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer font-bold text-xl border border-indigo-400/30"
        >
          {tNode('home.hiragana')}
        </button>
        <button 
          onClick={() => startGame("katakana")} 
          className="flex-1 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white px-8 py-6 rounded-3xl shadow-lg hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer font-bold text-xl border border-purple-400/30"
        >
          {tNode('home.katakana')}
        </button>
        <button 
          onClick={() => startGame("both")} 
          className="flex-1 bg-gradient-to-br from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white px-8 py-6 rounded-3xl shadow-lg hover:shadow-xl hover:shadow-pink-500/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer font-bold text-xl border border-pink-400/30"
        >
          {tNode('home.both')}
        </button>
      </div>

      <div className="w-full max-w-2xl backdrop-blur-md bg-white/40 dark:bg-black/20 border border-white/50 dark:border-white/10 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col items-center md:items-start w-full">
          <label htmlFor="kana-count" className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {tNode('home.kanaCountLabel')}
          </label>
          <input 
            type="number" 
            id="kana-count" 
            value={kanaCount} 
            onChange={(e) => setKanaCount(parseInt(e.target.value) || 1)} 
            min="1" 
            max="500" 
            className="w-24 px-4 py-2 rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-center font-bold text-lg" 
          />
          {errorMsg && <div className="text-rose-500 font-bold mt-3 text-sm animate-pulse">{tNode(errorMsg)}</div>}
        </div>

        <div className="h-px w-full md:h-16 md:w-px bg-gray-300/50 dark:bg-gray-700/50 hidden md:block"></div>

        <div className="flex flex-col items-center md:items-start w-full">
          <label className="cursor-pointer font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center group">
            <div className="relative inline-block w-12 mr-3 align-middle select-none transition duration-200 ease-in">
              <input 
                type="checkbox" 
                checked={useTimer} 
                onChange={(e) => setUseTimer(e.target.checked)} 
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-300 dark:border-gray-600 appearance-none cursor-pointer transition-all duration-300 checked:bg-indigo-500 checked:border-indigo-500 checked:right-0 right-6 z-10"
                style={{ top: '0' }}
              />
              <div className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${useTimer ? 'bg-indigo-400' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
            </div>
            {tNode('home.timerLabel')}
          </label>
          
          <div className={`flex items-center transition-opacity duration-300 ${useTimer ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <input 
              type="number" 
              value={timeLimit} 
              onChange={(e) => setTimeLimit(parseInt(e.target.value) || 5)} 
              min="5" 
              max="3600" 
              className="w-24 px-4 py-2 rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-center font-bold text-lg" 
              disabled={!useTimer} 
            /> 
            <span className="ml-3 text-gray-600 dark:text-gray-400 font-medium">{tNode('home.seconds')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}