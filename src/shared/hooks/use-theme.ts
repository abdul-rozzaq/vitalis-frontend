"use client";

import { useEffect, useState } from "react";
import { storageService, STORAGE_KEYS } from "@/shared/lib/services/storage";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const savedTheme = storageService.getItem<string>(STORAGE_KEYS.THEME);
    let initialTheme: Theme;

    if (savedTheme === "dark" || savedTheme === "light") {
      initialTheme = savedTheme;
    } else if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      initialTheme = "dark";
    } else {
      initialTheme = "light";
    }

    setTheme(initialTheme);
    applyTheme(initialTheme);
    setIsLoaded(true);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    if (typeof document !== "undefined") {
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === "dark" ? "light" : "dark";
      applyTheme(newTheme);
      storageService.setItem(STORAGE_KEYS.THEME, newTheme);
      return newTheme;
    });
  };

  return {
    theme,
    toggleTheme,
    isLoaded,
  };
}
