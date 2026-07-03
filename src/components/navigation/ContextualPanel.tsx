"use client";

import { Can } from "@/components/ui/can";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeWorkspace, isItemActive } from "./workspaces";

export function ContextualPanel() {
  const pathname = usePathname();
  const t = useTranslations();
  const ws = activeWorkspace(pathname);

  return (
    <aside className="flex h-screen w-56 flex-shrink-0 flex-col border-r border-border bg-surface sticky top-0">
      {/* Workspace header */}
      <div className="px-4 pb-3 pt-[18px]">
        <h2 className="text-base font-extrabold tracking-[-0.015em] text-text">
          {t(ws.labelKey)}
        </h2>
      </div>

      {/* Items */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5">
        {ws.items.map((item) => {
          const active = isItemActive(pathname, item);
          return (
            <Can key={item.href} roles={item.roles}>
              <Link
                href={item.href}
                className={`flex items-center justify-between rounded-lg px-[11px] py-[9px] text-[13.5px] transition-colors ${
                  active
                    ? "bg-primary-50 font-bold text-primary"
                    : "font-medium text-text-muted hover:bg-surface-hover hover:text-text"
                }`}
              >
                <span className="truncate">{t(item.labelKey)}</span>
                {item.badge != null && (
                  <span className="ml-2 rounded-full bg-primary-50 px-[7px] py-px text-[11px] font-bold text-primary">
                    {item.badge}
                  </span>
                )}
              </Link>
            </Can>
          );
        })}
      </nav>

      {/* Footer create action */}
      {ws.create && (
        <div className="border-t border-border p-2.5">
          <Can roles={ws.create.roles || ws.items[0].roles}>
            <Link
              href={ws.create.href}
              className="flex w-full items-center justify-center gap-1.5 rounded-[9px] bg-primary py-2.5 text-[13px] font-semibold text-white transition-colors hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              {t(ws.create.labelKey)}
            </Link>
          </Can>
        </div>
      )}
    </aside>
  );
}
