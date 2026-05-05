import { useLanguage } from "../context/LanguageContext";

export default function ScoreScreen({ score, currentListLength, goHome }) {
  const { t } = useLanguage();

  const percentage = Math.round((score / currentListLength) * 100) || 0;
  
  let scoreColor = "";
  let gradientStart = "#f43f5e"; // rose-500
  let gradientEnd = "#dc2626";   // red-600
  let icon = null;
  let message = "";
  
  if (percentage >= 75) {
    gradientStart = "#10b981"; // emerald-500
    gradientEnd = "#059669";   // emerald-600
    scoreColor = "from-emerald-400 to-green-600";
    icon = (
      <svg className="w-12 h-12 mx-auto mb-4 text-emerald-500 animate-bounce-slow" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 2.82c-.84.58-1.84.18-2 0V7h2v1z" />
      </svg>
    );
    message = percentage === 100 ? t("score.messagePerfect") : t("score.messageGreat");
  } else if (percentage >= 50) {
    gradientStart = "#facc15"; // yellow-400
    gradientEnd = "#f59e0b";   // amber-500
    scoreColor = "from-yellow-400 to-amber-500";
    icon = (
      <svg className="w-12 h-12 mx-auto mb-4 text-yellow-500 animate-bounce-slow" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.5 2l2.286 6.857L21.5 11l-7.714 2.143L11.5 20l-2.286-6.857L1.5 11l7.714-2.143L11.5 2z" />
      </svg>
    );
    message = t("score.messageGood");
  } else if (percentage >= 25) {
    gradientStart = "#fb923c"; // orange-400
    gradientEnd = "#ea580c";   // orange-600
    scoreColor = "from-orange-400 to-orange-600";
    icon = (
      <svg className="w-12 h-12 mx-auto mb-4 text-orange-500 animate-bounce-slow" fill="currentColor" viewBox="0 0 24 24">
        <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
      </svg>
    );
    message = t("score.messageNotBad");
  } else {
    scoreColor = "from-rose-500 to-red-600";
    icon = (
      <svg className="w-12 h-12 mx-auto mb-4 text-rose-500 animate-bounce-slow" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5s.67 1.5 1.5 1.5zm3.5 3c-2.33 0-4.31 1.46-5.11 3.5h10.22c-.8-2.04-2.78-3.5-5.11-3.5z" />
      </svg>
    );
    message = t("score.messagePractice");
  }

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-2xl mx-auto py-8 px-4 animate-fade-in">
      {/* Background Glow */}
      <div className={`absolute inset-0 m-auto w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none bg-gradient-to-br ${scoreColor}`}></div>

      <div className="relative z-10 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl text-center">
        <div className="mb-6">
          {icon}
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
            {t('score.title')}
          </h2>
          <p className="text-base text-slate-500 dark:text-slate-400 font-medium">
            {message}
          </p>
        </div>

        {/* Circular Progress Display */}
        <div className="relative inline-flex items-center justify-center mb-10">
          <svg className="w-40 h-40 transform -rotate-90">
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={gradientStart} />
                <stop offset="100%" stopColor={gradientEnd} />
              </linearGradient>
            </defs>
            <circle cx="50%" cy="50%" r="45%" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="10" fill="none" />
            <circle 
              cx="50%" cy="50%" r="45%" 
              stroke="url(#scoreGradient)"
              strokeWidth="10" 
              fill="none" 
              strokeDasharray="100" 
              strokeDashoffset={100 - percentage} 
              pathLength="100"
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 2s ease-out' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className={`text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br ${scoreColor}`}>
              {percentage}%
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">
              {score} / {currentListLength}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={goHome}
            className={`px-8 py-3 rounded-xl font-black text-base text-white bg-gradient-to-r ${scoreColor} shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group`}
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {t('score.backToHome')}
          </button>
        </div>
      </div>

      {/* Decorative details */}
      <div className="mt-8 flex gap-8 opacity-30">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Précision</span>
          <span className="text-xl font-black text-slate-800 dark:text-white">{percentage}%</span>
        </div>
        <div className="w-px h-8 bg-slate-300 dark:bg-slate-700"></div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Réussis</span>
          <span className="text-xl font-black text-slate-800 dark:text-white">{score}</span>
        </div>
        <div className="w-px h-8 bg-slate-300 dark:bg-slate-700"></div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</span>
          <span className="text-xl font-black text-slate-800 dark:text-white">{currentListLength}</span>
        </div>
      </div>
    </div>
  );
}
