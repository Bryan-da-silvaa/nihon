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
  return (
    <div>
      <div className="flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-50 py-3 border-b-2 border-gray-200 dark:border-gray-700 mb-4 transition-colors duration-300">
        <button onClick={goHome} className="bg-gray-500 dark:bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-opacity-90 cursor-pointer">Retour à l'accueil</button>
        {useTimer && <div className="text-2xl font-bold text-red-500 dark:text-red-400">Temps restant : {timeLeft}s</div>}
      </div>
      
      <div className="flex flex-wrap justify-center gap-4 mt-8">
        {currentList.map((item, index) => {
          const itemStatus = status[index];
          const isAnswered = itemStatus !== undefined;
          
          let inputClasses = "w-full p-2 border-2 border-gray-300 dark:border-gray-600 rounded text-center text-lg outline-none transition-colors text-black dark:text-white dark:bg-gray-700 ";
          if (itemStatus === "correct") inputClasses += "bg-emerald-100 dark:bg-emerald-900 border-emerald-500 dark:border-emerald-400 text-emerald-800 dark:text-emerald-100";
          else if (itemStatus === "incorrect") inputClasses += "bg-red-100 dark:bg-red-900 border-red-500 dark:border-red-400 text-red-800 dark:text-red-100";
          else inputClasses += "focus:border-[#4F46E5] dark:focus:border-indigo-400";

          return (
            <div key={index} className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col items-center gap-2 w-[120px] transition-colors duration-300">
              <div className="text-5xl font-bold">{item.kana}</div>
              <input
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                placeholder="?"
                className={inputClasses}
                value={answers[index] || ""}
                onChange={(e) => { if (!isAnswered) setAnswers((prev) => ({ ...prev, [index]: e.target.value })); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !isAnswered) checkAnswer(index, answers[index] || ""); }}
                disabled={isAnswered || (useTimer && timeLeft <= 0)}
              />
              <div className="text-base font-bold min-h-[1.5rem]">
                {itemStatus === "correct" && <span className="text-emerald-500 dark:text-emerald-400">✓</span>}
                {itemStatus === "incorrect" && <span className="text-red-500 dark:text-red-400">{item.romaji}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}