"use client";

import type { Staffing } from "@/shared/lib/shifts-api";
import { Stethoscope, Users } from "lucide-react";

/** Required-vs-assigned xodim hisobini rang-kodlangan badge sifatida ko'rsatadi. */
export function StaffingBadge({ staffing, size = "sm" }: { staffing: Staffing; size?: "sm" | "md" }) {
  const docOk = staffing.assignedDoctors >= staffing.requiredDoctors;
  const nurseOk = staffing.assignedNurses >= staffing.requiredNurses;
  const pad = size === "md" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs";
  const okCls = "bg-success-50 text-success border-success-100";
  const lowCls = "bg-red-50 text-red-700 border-red-200";

  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${pad} ${docOk ? okCls : lowCls}`} title="Shifokorlar">
        <Stethoscope className="w-3.5 h-3.5" /> {staffing.assignedDoctors}/{staffing.requiredDoctors}
      </span>
      <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${pad} ${nurseOk ? okCls : lowCls}`} title="Hamshiralar">
        <Users className="w-3.5 h-3.5" /> {staffing.assignedNurses}/{staffing.requiredNurses}
      </span>
    </div>
  );
}
