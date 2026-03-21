"use client";

import { setLocale } from "@/i18n/actions";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

const LOCALES = [
  { code: "uz", label: "UZ", flag: "🇺🇿" },
  { code: "ru", label: "RU", flag: "🇷🇺" },
  { code: "en", label: "EN", flag: "🇬🇧" },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (newLocale: string) => {
    startTransition(async () => {
      await setLocale(newLocale);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-0.5 bg-background rounded-md p-0.5 border border-border">
      {LOCALES.map(({ code, label, flag }) => (
        <button
          key={code}
          onClick={() => handleChange(code)}
          disabled={isPending}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
            locale === code
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
