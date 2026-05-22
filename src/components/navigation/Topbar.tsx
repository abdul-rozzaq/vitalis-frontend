"use client";

import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { PatientSearch } from "@/components/ui/patient-search";
import { Bell, Command, Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState } from "react";

export function Topbar() {
  const t = useTranslations();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <>
      <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 sticky top-0 z-20">
        {/* Left: Search & Breadcrumb */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-80 max-w-full">
            <PatientSearch />
          </div>
        </div>

        {/* Right: Actions & Settings */}
        <div className="flex items-center gap-2">
          {/* Quick Create Button */}
          <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>

          {/* Command Palette */}
          <button
            onClick={() => setCommandOpen(!commandOpen)}
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-secondary hover:text-text hover:border-text-muted transition-colors text-sm"
          >
            <Command className="w-4 h-4" />
            <span>⌘K</span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 text-text-muted hover:text-text hover:bg-surface-hover rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full"></span>
            </button>

            {notificationsOpen && (
              <div className="absolute top-12 right-0 w-96 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="font-semibold text-text text-sm">
                    {t("notifications.title")}
                  </p>
                </div>
                <div className="px-4 py-8 flex flex-col items-center justify-center gap-2">
                  <Bell className="w-8 h-8 text-text-muted opacity-40" />
                  <p className="text-secondary text-sm text-center">
                    {t("notifications.empty")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <LanguageSwitcher />
        </div>
      </header>

      {/* Command Palette Modal (simplified) */}
      {commandOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setCommandOpen(false)}
        >
          <div className="pt-20 px-4">
            <div
              className="bg-surface rounded-xl border border-border max-w-2xl mx-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search className="w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search or jump to..."
                  className="flex-1 bg-transparent outline-none text-text placeholder:text-text-muted"
                  autoFocus
                />
              </div>
              <div className="p-2 max-h-96 overflow-y-auto">
                <p className="px-3 py-2 text-xs font-medium text-text-muted">
                  No recent searches
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
