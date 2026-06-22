"use client";

import { Can } from "@/components/ui/can";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-permissions";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  WORKSPACES,
  activeWorkspace,
  workspaceRoles,
  type Workspace,
} from "./workspaces";

export function IconRail() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const { hasRole } = useRole();
  const { user } = useAuth();

  const active = activeWorkspace(pathname);

  function firstVisibleHref(ws: Workspace): string {
    const item = ws.items.find((i) => hasRole(...i.roles)) ?? ws.items[0];
    return item.href;
  }

  const primaryHubs = WORKSPACES.filter((ws) => ws.id !== "settings");
  const settingsHub = WORKSPACES.find((ws) => ws.id === "settings");

  const initials = `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase();

  const renderHub = (ws: Workspace) => {
    const Icon = ws.icon;
    const isActive = active.id === ws.id;
    return (
      <Can key={ws.id} roles={workspaceRoles(ws)}>
        <button
          type="button"
          title={t(ws.labelKey)}
          onClick={() => router.push(firstVisibleHref(ws))}
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors cursor-pointer ${
            isActive
              ? "bg-primary-50 text-primary"
              : "text-text-muted hover:bg-surface-hover"
          }`}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </button>
      </Can>
    );
  };

  return (
    <aside className="flex h-screen w-[66px] flex-shrink-0 flex-col items-center gap-1.5 border-r border-border bg-rail py-3.5 sticky top-0">
      {/* Logo */}
      <Link
        href="/"
        className="mb-3.5 flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-primary text-base font-extrabold text-white"
        title="Vitalis"
      >
        V
      </Link>

      {primaryHubs.map((ws) => renderHub(ws))}

      {/* Bottom: settings + avatar */}
      <div className="mt-auto flex flex-col items-center gap-2">
        {settingsHub && renderHub(settingsHub)}
        <Link
          href="/settings"
          title={`${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()}
          className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-700 text-[11px] font-bold text-white"
        >
          {initials || "?"}
        </Link>
      </div>
    </aside>
  );
}
