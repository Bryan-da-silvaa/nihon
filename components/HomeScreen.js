import { useLanguage } from "../context/LanguageContext";

export default function HomeScreen({ 
  openSetup,
}) {
  const { t, tNode } = useLanguage();

  const scriptOptions = [
    { id: "hiragana", label: tNode('home.hiragana'), desc: tNode('home.scriptHiraganaDesc') },
    { id: "katakana", label: tNode('home.katakana'), desc: tNode('home.scriptKatakanaDesc') },
    { id: "both", label: tNode('home.both'), desc: tNode('home.scriptBothDesc') },
  ];

  return (
    <div className="flex flex-col items-center justify-center w-full py-8">
      <h1 className="text-5xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 dark:from-cyan-300 dark:via-sky-300 dark:to-emerald-300 mb-4 drop-shadow-sm pb-2">
        {tNode('home.title')}
      </h1>
      <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl text-center leading-relaxed">
        {tNode('home.subtitle')}
      </p>

      <div className="mb-10 px-5 py-3 rounded-2xl border border-cyan-200/80 dark:border-cyan-800/60 bg-cyan-50/80 dark:bg-cyan-900/20 text-cyan-900 dark:text-cyan-200 text-sm md:text-base font-medium text-center max-w-4xl">
        {tNode('home.smartSystemNote')}
      </div>

      <div className="w-full max-w-5xl mb-8 grid grid-cols-1 gap-6">
        <section className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/40 p-6 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-4">
            {tNode('home.sectionScript')}
          </h2>
          <div className="space-y-3">
            {scriptOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => openSetup(option.id)}
                className="w-full text-left px-4 py-3 rounded-2xl border transition-all border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-700 bg-white/80 dark:bg-slate-800/40 hover:bg-cyan-50/50 dark:hover:bg-cyan-900/20"
              >
                <div className="font-bold text-slate-900 dark:text-slate-100">{option.label}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{option.desc}</div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
        {tNode('home.chooseScriptHint')}
      </p>
    </div>
  );
}