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
    <div>
      <h1 className="text-3xl font-bold text-[#4F46E5] dark:text-indigo-400 mb-4">{tNode('home.title')}</h1>
      <p className="mb-6">{tNode('home.subtitle')}</p>
      <div className="flex justify-center gap-3 mb-6">
        <button onClick={() => startGame("hiragana")} className="bg-[#4F46E5] text-white px-5 py-2 rounded-md hover:bg-opacity-90 transition-opacity cursor-pointer">{tNode('home.hiragana')}</button>
        <button onClick={() => startGame("katakana")} className="bg-[#4F46E5] text-white px-5 py-2 rounded-md hover:bg-opacity-90 transition-opacity cursor-pointer">{tNode('home.katakana')}</button>
        <button onClick={() => startGame("both")} className="bg-[#4F46E5] text-white px-5 py-2 rounded-md hover:bg-opacity-90 transition-opacity cursor-pointer">{tNode('home.both')}</button>
      </div >

      <div className="mt-4">
        <label htmlFor="kana-count">{tNode('home.kanaCountLabel')}</label>
        <input 
          type="number" 
          id="kana-count" 
          value={kanaCount} 
          onChange={(e) => setKanaCount(parseInt(e.target.value) || 1)} 
          min="1" 
          max="500" 
          className="ml-2 w-16 p-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded text-center" 
        />
        {errorMsg && <div className="text-red-500 font-bold mt-2 text-sm">{tNode(errorMsg)}</div >}
      </div >

      <div className="mt-4">
        <label className="cursor-pointer">
          <input 
            type="checkbox" 
            checked={useTimer} 
            onChange={(e) => setUseTimer(e.target.checked)} 
            className="mr-2" 
          />
          {tNode('home.timerLabel')}
        </label>
        <input 
          type="number" 
          value={timeLimit} 
          onChange={(e) => setTimeLimit(parseInt(e.target.value) || 5)} 
          min="5" 
          max="3600" 
          className="ml-2 w-16 p-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded text-center" 
          disabled={!useTimer} 
        /> {tNode('home.seconds')}
      </div >
    </div>
  );
}