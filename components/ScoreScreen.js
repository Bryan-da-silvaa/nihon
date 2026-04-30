import { useLanguage } from "../context/LanguageContext";

export default function ScoreScreen({ score, currentListLength, goHome }) {
  const { t, tWithVars } = useLanguage();

  return (
    <div className="py-8">
      <h2 className="text-3xl font-bold">{t('score.title')}</h2>
      <p className={`text-2xl font-bold my-8 ${score === currentListLength ? "text-emerald-500 dark:text-emerald-400" : score >= currentListLength / 2 ? "text-amber-500 dark:text-amber-400" : "text-red-500 dark:text-red-400"}`}>
        {tWithVars('score.resultText', { score, currentListLength })}
      </p>
      <button onClick={goHome} className="bg-gray-500 dark:bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-opacity-90 cursor-pointer">
        {t('score.backToHome')}
      </button>
    </div>
  );
}
