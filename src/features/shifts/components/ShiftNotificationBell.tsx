"use client";
import { useTranslations } from "next-intl";

import { shiftsApi, ShiftNotification } from "@/shared/lib/shifts-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import { useState } from "react";

function timeAgo(iso: string, t: (key: string, opts?: Record<string, number>) => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return t("shifts.justNow");
  if (m < 60) return t("shifts.minutesAgo", { m });
  const h = Math.floor(m / 60);
  if (h < 24) return t("shifts.hoursAgo", { h });
  return t("shifts.daysAgo", { d: Math.floor(h / 24) });
}

export function ShiftNotificationBell() {
  const t = useTranslations();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery<ShiftNotification[]>({
    queryKey: ["shift-notifications"],
    queryFn: shiftsApi.myNotifications,
    refetchInterval: 30000,
  });

  const unread = notifications.filter((n) => !n.readAt).length;

  const markRead = useMutation({
    mutationFn: (id: string) => shiftsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shift-notifications"] }),
  });

  const markAll = useMutation({
    mutationFn: () => shiftsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shift-notifications"] }),
  });

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-text-muted hover:text-text hover:bg-surface-hover rounded-lg transition-colors"
        aria-label={t("shifts.notificationTitle")}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-12 right-0 w-96 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="font-semibold text-text text-sm">{t("shifts.notificationTitle")}</p>
              {unread > 0 && (
                <button
                  onClick={() => markAll.mutate()}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> {t("shifts.markAllRead")}
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-10 flex flex-col items-center justify-center gap-2">
                  <Bell className="w-8 h-8 text-text-muted opacity-40" />
                  <p className="text-secondary text-sm">{t("shifts.noNotification")}</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => !n.readAt && markRead.mutate(n.id)}
                    className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-surface-hover transition-colors ${
                      n.readAt ? "opacity-60" : "bg-primary-50/40"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.readAt && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-text">{n.payload?.message ?? t("shifts.shiftUpdate")}</p>
                        {n.payload?.shiftName && (
                          <p className="text-xs text-text-muted mt-0.5">{String(n.payload.shiftName)}</p>
                        )}
                        <p className="text-xs text-text-muted mt-1">{timeAgo(n.createdAt, t)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
