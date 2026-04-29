import { useEffect, useRef } from "react";

export default function useGameTimer(screen, useTimer, timeLeft, setTimeLeft, finishGame) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (screen === "game" && useTimer && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft <= 0 && screen === "game") {
      finishGame();
    }
    return () => clearInterval(timerRef.current);
  }, [screen, useTimer, timeLeft, setTimeLeft, finishGame]);

  return timerRef;
}
