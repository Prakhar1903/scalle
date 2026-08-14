import { useEffect } from "react";
import { useThemeStore } from "./themeStore";

export function useKeyboardShortcuts() {
  const { toggleTheme } = useThemeStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (e.key) {
        case "n":
        case "N":
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("scalle:new"));
          break;
        case "r":
        case "R":
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("scalle:refresh"));
          break;
        case "?":
          if (e.shiftKey) {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("scalle:help"));
          }
          break;
        case "/":
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("scalle:search"));
          break;
        case "d":
        case "D":
          e.preventDefault();
          toggleTheme();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleTheme]);
}
