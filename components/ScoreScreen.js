import { useLanguage } from "../context/LanguageContext";

export default function ScoreScreen({ score, currentListLength, goHome }) {
  const { t, tWithVars } = useLanguage();

  const percentage = Math.round((score / currentListLength) * 100) || 0;
  
  let scoreColor = "from-red-500 to-rose-600";
  let ringColor = "ring-red-400/50";
  let emoji = "😢";
  let message = "Il va falloir s'entraîner un peu plus !";
  
  if (percentage === 100) {
    scoreColor = "from-emerald-400 to-green-600";
    ringColor = "ring-emerald-400/50";
    emoji = "🏆";
    message = t("score.messagePerfect");
  } else if (percentage >= 80) {
    scoreColor = "from-blue-400 to-indigo-600";
    ringColor = "ring-blue-400/50";
    emoji = "✨";
    message = t("score.messageGreat");
  } else if (percentage >= 50) {
    scoreColor = "from-amber-400 to-orange-500";
    ringColor = "ring-amber-400/50";
    emoji = "👍";
    message = t("score.messageGood");
  } else if (percentage >= 25) {
    scoreColor = "from-orange-400 to-red-500";
    ringColor = "ring-orange-400/50";
    emoji = "💪";
    message = t("score.messageNotBad");
  } else {
    scoreColor = "from-red-500 to-rose-600";
    ringColor = "ring-red-400/50";
    emoji = "😢";
    message = t("score.messagePractice");
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto py-12 px-4 relative">
      {/* Background glow based on score */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[100px] opacity-20 pointer-events-none bg-gradient-to-r ${scoreColor}`}></div>
      
      <div className="w-full backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-white/10 rounded-[3rem] p-10 md:p-14 shadow-2xl flex flex-col items-center relative z-10 text-center overflow-hidden">
        {percentage === 100 && (
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-50 pointer-events-none"></div>
        )}

        <h2 className="text-3xl md:text-4xl font-extrabold mb-2 text-gray-800 dark:text-gray-100">
          {t('score.title')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-10 font-medium text-lg">{message}</p>

        {/* Big Glowing Score Badge */}
        <div className={`relative flex items-center justify-center w-48 h-48 rounded-full bg-white dark:bg-gray-900 mb-10 shadow-2xl ring-8 ${ringColor} animate-pulse-slow`}>
          <div className={`absolute inset-2 rounded-full bg-gradient-to-br ${scoreColor} opacity-20 blur-md`}></div>
          <div className={`absolute inset-4 rounded-full border-4 border-dashed border-gray-200 dark:border-gray-700 opacity-50 animate-spin-slow`}></div>
          <div className="flex flex-col items-center justify-center relative z-10">
            <span className="text-6xl mb-2">{emoji}</span>
            <span className={`text-5xl font-black bg-clip-text text-transparent bg-gradient-to-br ${scoreColor} drop-shadow-sm`}>
              {score} <span className="text-3xl text-gray-400 dark:text-gray-500">/ {currentListLength}</span>
            </span>
          </div>
        </div>

        <button 
          onClick={goHome} 
          className={`group px-8 py-4 rounded-2xl font-bold text-lg text-white bg-gradient-to-r ${scoreColor} shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative`}
        >
          <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full -translate-x-full skew-x-12 transition-transform duration-700 ease-out"></div>
          <span className="relative z-10 flex items-center gap-2">
            🏠 {t('score.backToHome')}
          </span>
        </button>
      </div>
    </div>
  );
}
