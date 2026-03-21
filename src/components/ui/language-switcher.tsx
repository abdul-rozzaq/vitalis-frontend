"use client";

import { type Locale, useI18n } from "@/i18n";

const LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: "uz", label: "UZ", flag: "🇺🇿" },
  { value: "ru", label: "RU", flag: "🇷🇺" },
  { value: "en", label: "EN", flag: "🇬🇧" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-0.5 bg-background rounded-md p-0.5 border border-border">
      {LOCALES.map(({ value, label, flag }) => (
        <button
          key={value}
          onClick={() => setLocale(value)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
            locale === value
              ? "bg-surface text-text shadow-sm"
              : "text-text-muted hover:text-text hover:bg-surface/60"
          }`}
        >
          <span>{flag}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
