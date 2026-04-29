import { useEffect } from "react";

export default function useGameCompletion(screen, currentList, status, finishGame) {
  useEffect(() => {
    if (screen === "game" && currentList.length > 0) {
      const answeredCount = Object.keys(status).length;
      if (answeredCount === currentList.length) {
        setTimeout(finishGame, 500);
      }
    }
  }, [status, screen, currentList, finishGame]);
}
