"use client";

import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { PatientSearch } from "@/components/ui/patient-search";
import { useTheme } from "@/shared/hooks/use-theme";
import { ChevronRight, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { activeWorkspace, isItemActive } from "./workspaces";

export function Topbar() {
  const pathname = usePathname();
  const t = useTranslations();
  const { theme, toggleTheme } = useTheme();

  const ws = activeWorkspace(pathname);
  const activeItem = ws.items.find((item) => isItemActive(pathname, item));

  return (
    <header className="flex h-14 items-center gap-3.5 border-b border-border bg-surface px-[18px] sticky top-0 z-20">
      {/* Breadcrumb */}
      <div className="flex min-w-0 items-center gap-1.5 text-[13px]">
        <span className="text-text-muted">{t(ws.labelKey)}</span>
        {activeItem && (
          <>
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-text-muted" />
            <span className="truncate font-semibold text-text">{t(activeItem.labelKey)}</span>
          </>
        )}
      </div>

      {/* Search (centered) */}
      <div className="mx-auto w-full max-w-[380px]">
        <PatientSearch />
      </div>

      {/* Controls */}
      <div className="flex flex-shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === "dark" ? t("theme.switchToLight") : t("theme.switchToDark")}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-hover hover:text-text cursor-pointer"
        >
          {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>

        <LanguageSwitcher />
      </div>
    </header>
  );
}
