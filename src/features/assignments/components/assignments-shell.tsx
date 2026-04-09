"use client";

import { TabId } from "@/features/assignments/types";
import {
  TAB_ACTIVE,
  TAB_BASE,
  TAB_IDLE,
  getAssignmentTabs,
  getAssignmentsTabHref,
} from "@/features/assignments/utils";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo } from "react";

function getActiveTab(pathname: string): TabId {
  if (pathname.endsWith("/rooms")) return "rooms";
  if (pathname.endsWith("/roles")) return "roles";
  if (pathname.endsWith("/permissions")) return "permissions";
  return "assignments";
}

export function AssignmentsShell({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const tabs = useMemo(() => getAssignmentTabs(t), [t]);
  const activeTab = getActiveTab(pathname);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-3"
      >
        <div>
          <h2 className="text-xl font-semibold text-text tracking-tight">{t("assignments.title")}</h2>
          <p className="text-secondary text-sm mt-0.5">{t("assignments.description")}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="flex items-center gap-1 bg-surface border border-border p-1 rounded-xl w-fit"
      >
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
      </motion.div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
        {children}
      </motion.div>
    </div>
  );
}
