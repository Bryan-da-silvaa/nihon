import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Furigana({ text }) {
  const { kuro } = useLanguage();
  const [html, setHtml] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (!kuro || !text) return;
    (async () => {
      try {
        const converted = await kuro.convert(text, { mode: 'furigana', to: 'hiragana' });
        if (mounted) setHtml(converted);
      } catch (e) {
        if (mounted) setHtml(text);
      }
    })();
    return () => { mounted = false; };
  }, [kuro, text]);

  if (html === null) return <span>{text}</span>;
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
