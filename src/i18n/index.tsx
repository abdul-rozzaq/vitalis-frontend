"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import en from "./en";
import ru from "./ru";
import uz from "./uz";

export type Locale = "uz" | "ru" | "en";

const messages = { uz, ru, en } as const;

type Messages = typeof uz;

function getNestedValue(obj: any, path: string): string | undefined {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

function interpolate(str: string, params: Record<string, string | number>): string {
  return Object.entries(params).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    str,
  );
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "uz",
  setLocale: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("uz");

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved && saved in messages) setLocaleState(saved);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const value = getNestedValue(messages[locale], key) ?? getNestedValue(messages.en, key) ?? key;
      return params ? interpolate(value, params) : value;
    },
    [locale],
  );

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
