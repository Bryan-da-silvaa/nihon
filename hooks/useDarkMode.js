import { useState, useEffect } from "react";

export default function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return [isDarkMode, setIsDarkMode];
}
