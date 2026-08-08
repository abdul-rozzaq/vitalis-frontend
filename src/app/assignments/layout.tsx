"use client";

import { TabId } from "@/features/assignments/types";
import { TAB_ACTIVE, TAB_BASE, TAB_IDLE, getAssignmentTabs, getAssignmentsTabHref } from "@/features/assignments/utils";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

function getActiveTab(pathname: string): TabId {
  if (pathname.includes("/rooms")) return "rooms";
  if (pathname.includes("/roles")) return "roles";
  if (pathname.includes("/permissions")) return "permissions";
  if (pathname.includes("/lab-assignments")) return "lab-assignments";
  if (pathname.includes("/laboratories")) return "laboratories";
  if (pathname.includes("/diagnostics-assignments")) return "diagnostics-assignments";
  if (pathname.includes("/diagnostics")) return "diagnostics";
  if (pathname.includes("/operation-types")) return "operation-types";
  return "assignments";
}

// Sub-pages that have their own full-page layout (no tabs needed)
function isSubPage(pathname: string): boolean {
  return /\/operation-types\/.+/.test(pathname) || /\/operation-types\/create/.test(pathname);
}

export default function AssignmentsLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const tabs = useMemo(() => getAssignmentTabs(t), [t]);
  const activeTab = getActiveTab(pathname);
  const hideHeader = isSubPage(pathname);

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto w-full">
      {!hideHeader && (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-text tracking-tight">{t("assignments.title")}</h2>
              <p className="text-secondary text-sm mt-0.5">{t("assignments.description")}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-surface border border-border p-1 rounded-xl w-fit">
            {tabs.map(({ id, label, icon: Icon }) => (
              <Link
                key={id}
                href={getAssignmentsTabHref(id)}
                className={`${TAB_BASE} flex items-center gap-2 ${activeTab === id ? TAB_ACTIVE : TAB_IDLE}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        </>
      )}

      <div key={activeTab}>{children}</div>
    </div>
  );
}