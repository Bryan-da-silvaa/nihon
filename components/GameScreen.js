import { useLanguage } from "../context/LanguageContext";
import Ruby from "./Ruby";

export default function GameScreen({
  goHome,
  useTimer,
  timeLeft,
  currentList,
  status,
  answers,
  setAnswers,
  checkAnswer,
  inputsRef
}) {
  const { t, tNode, language } = useLanguage();

  return (
    <div className="relative w-full mx-auto py-4">
      {/* Premium Sticky Header */}
      <div className="sticky top-4 backdrop-blur-2xl bg-white/70 dark:bg-gray-900/70 z-50 py-4 px-6 md:px-8 border border-white/50 dark:border-gray-700/50 rounded-3xl shadow-lg mb-10 transition-all duration-300 flex justify-between items-center">
        <button 
          onClick={goHome} 
          className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 font-bold transition-colors shadow-sm"
        >
          <span>⬅</span> <span className="hidden sm:inline">{tNode('game.backToHome')}</span>
        </button>
        {useTimer && (
          <div className={`flex items-center gap-3 px-6 py-2 rounded-xl font-bold text-xl md:text-2xl shadow-inner ${timeLeft <= 5 ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 animate-pulse border border-red-300 dark:border-red-800' : 'bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-gray-200 dark:border-gray-700'}`}>
            ⏱ {tNode('game.timeLeft')} <span className="w-8 text-center">{timeLeft}</span>{language === 'fr' ? 's' : ''}
          </div>
        )}
      </div>
      
      {/* Grid of Flashcards */}
      <div className="flex flex-wrap justify-center gap-5 sm:gap-8 px-2 pb-12">
        {currentList.map((item, index) => {
          const itemStatus = status[index];
          const isAnswered = itemStatus !== undefined;
          
          let cardClasses = "relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-white/60 dark:border-gray-700/50 rounded-[2rem] p-6 flex flex-col items-center gap-5 w-[140px] sm:w-[160px] shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group ";
          let inputClasses = "w-full py-3 px-2 rounded-xl text-center text-xl font-bold transition-all duration-300 shadow-inner outline-none border-2 bg-white/50 dark:bg-gray-900/50 ";
          
          if (itemStatus === "correct") {
            cardClasses += "ring-4 ring-emerald-400 dark:ring-emerald-500/50 shadow-emerald-500/20 translate-y-1";
            inputClasses += "bg-emerald-100/80 dark:bg-emerald-900/80 border-emerald-500 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300";
          } else if (itemStatus === "incorrect") {
            cardClasses += "ring-4 ring-red-400 dark:ring-red-500/50 shadow-red-500/20 translate-y-1";
            inputClasses += "bg-red-100/80 dark:bg-red-900/80 border-red-500 dark:border-red-400 text-red-700 dark:text-red-300";
          } else {
            cardClasses += "hover:-translate-y-2 hover:shadow-indigo-500/10 cursor-text";
            inputClasses += "border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-gray-800 focus:shadow-indigo-500/20 text-gray-800 dark:text-white";
          }

          return (
            <div key={index} className={cardClasses} onClick={() => { if (!isAnswered && inputsRef.current[index]) inputsRef.current[index].focus(); }}>
              {/* Background abstract gradient for each card */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              
              <div className="text-5xl sm:text-6xl font-black text-gray-800 dark:text-white drop-shadow-sm z-10">
                {item.kanji && item.reading ? (
                  <Ruby base={item.kanji} reading={item.reading} />
                ) : (
                  item.kana
                )}
              </div>
              
              <div className="w-full relative z-10">
                <input
                  ref={(el) => (inputsRef.current[index] = el)}
                  type="text"
                  placeholder="?"
                  className={inputClasses}
                  value={answers[index] || ""}
                  onChange={(e) => { if (!isAnswered) setAnswers((prev) => ({ ...prev, [index]: e.target.value.toLowerCase() })); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !isAnswered) checkAnswer(index, answers[index] || ""); }}
                  disabled={isAnswered || (useTimer && timeLeft <= 0)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck="false"
                />
              </div>

              <div className="h-6 flex items-center justify-center w-full z-10">
                {itemStatus === "correct" && <span className="text-emerald-500 dark:text-emerald-400 font-black text-xl animate-bounce">✓</span>}
                {itemStatus === "incorrect" && (
                  <span className="bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 font-bold px-3 py-1 rounded-lg text-sm tracking-widest shadow-sm">
                    {item.romaji.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}