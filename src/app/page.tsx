"use client";

import { Can } from "@/components/ui/can";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-permissions";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ChevronRight, Clock, CreditCard, DoorOpen, Plus, UserPen, Users } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";

const ROLE_STYLES: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: "bg-purple-100", text: "text-purple-700" },
  DOCTOR: { bg: "bg-blue-100", text: "text-blue-700" },
  NURSE: { bg: "bg-success-100", text: "text-success" },
  RECEPTIONIST: { bg: "bg-amber-100", text: "text-amber-700" },
};

const APPT_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: "bg-primary-50", text: "text-primary", label: "Active" },
  COMPLETED: { bg: "bg-info-50", text: "text-info-600", label: "Completed" },
  CANCELLED: { bg: "bg-danger-50", text: "text-danger-600", label: "Cancelled" },
};

interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Assignment {
  id: string;
  isActive: boolean;
  user?: { first_name: string; last_name: string; role: { name: string } };
  room?: { name: string };
  schedules?: Schedule[];
}

interface StatsData {
  patientsTotal: number;
  appointmentsToday: number;
  employeesTotal: number;
  invoicesUnpaid: number;
  recentPatients: { id: string; first_name: string; last_name: string; phone: string; createdAt: string }[];
  recentAppointments: {
    id: string;
    dateTime: string;
    patient: { id: string; first_name: string; last_name: string };
    assignment: { department: { name: string }; user: { first_name: string; last_name: string } };
    caseStep?: { case?: { status: string } | null } | null;
  }[];
}

function WeeklySchedule({ assignments }: { assignments: Assignment[] }) {
  const t = useTranslations();
  const days = [1, 2, 3, 4, 5, 6, 7];

  const FULL_DAY_LABELS: Record<number, string> = {
    1: t("dashboard.monday"),
    2: t("dashboard.tuesday"),
    3: t("dashboard.wednesday"),
    4: t("dashboard.thursday"),
    5: t("dashboard.friday"),
    6: t("dashboard.saturday"),
    7: t("dashboard.sunday"),
  };

  const byDay: Record<number, { assignment: Assignment; schedule: Schedule }[]> = {};
  days.forEach((d) => (byDay[d] = []));

  assignments.forEach((a) => {
    (a.schedules ?? []).forEach((s) => {
      byDay[s.dayOfWeek]?.push({ assignment: a, schedule: s });
    });
  });

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {days.map((d) => (
          <div key={d} className={`px-3 py-2.5 text-xs font-semibold text-center border-r last:border-r-0 border-border ${d >= 6 ? "text-danger-600 bg-danger-50/30" : "text-secondary bg-background"}`}>
            {FULL_DAY_LABELS[d]}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 divide-x divide-border min-h-[280px]">
        {days.map((d) => (
          <div key={d} className={`p-2 space-y-1.5 ${d >= 6 ? "bg-background/40" : ""}`}>
            {byDay[d].length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <span className="text-xs text-text-muted">—</span>
              </div>
            ) : (
              byDay[d].map(({ assignment, schedule }) => {
                const roleStyle = ROLE_STYLES[assignment.user?.role.name ?? ""] ?? { bg: "bg-gray-100", text: "text-gray-700" };
                return (
                  <div key={schedule.id} className={`rounded-md p-2 ${roleStyle.bg} space-y-1`}>
                    <p className={`text-[11px] font-semibold leading-tight ${roleStyle.text} truncate`}>
                      {assignment.user?.first_name} {assignment.user?.last_name}
                    </p>
                    <div className="flex items-center gap-1">
                      <Clock className={`w-2.5 h-2.5 ${roleStyle.text} shrink-0`} />
                      <p className={`text-[10px] ${roleStyle.text} opacity-80`}>
                        {schedule.startTime}–{schedule.endTime}
                      </p>
                    </div>
                    {assignment.room && (
                      <div className="flex items-center gap-1">
                        <DoorOpen className={`w-2.5 h-2.5 ${roleStyle.text} shrink-0`} />
                        <p className={`text-[10px] ${roleStyle.text} opacity-80 truncate`}>{assignment.room.name}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const { hasRole } = useRole();
  const t = useTranslations();
  const canReadAssignments = hasRole("ADMIN", "KASSIR", "DOCTOR", "HAMSHIRA", "LABARANT", "DIREKTOR");

  const { data: stats, isLoading: statsLoading } = useQuery<StatsData>({
    queryKey: ["stats"],
    queryFn: () => api.get("/stats").then((r) => r.data),
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });

  const { data: assignmentsRaw = [] } = useQuery<Assignment[]>({
    queryKey: ["assignments"],
    queryFn: () => api.get("/assignments").then((r) => r.data),
    enabled: canReadAssignments,
    refetchOnWindowFocus: false,
  });

  const activeAssignments = assignmentsRaw.filter((a) => a.isActive);

  if (!user) return null;

  const statCards = [
    {
      label: t("dashboard.totalPatients"),
      value: stats?.patientsTotal ?? "—",
      icon: Users,
      color: "text-info-600",
      bg: "bg-info-50",
    },
    {
      label: t("dashboard.appointmentsToday"),
      value: stats?.appointmentsToday ?? "—",
      icon: Calendar,
      color: "text-primary",
      bg: "bg-primary-50",
    },
    {
      label: t("dashboard.totalEmployees"),
      value: stats?.employeesTotal ?? "—",
      icon: UserPen,
      color: "text-success",
      bg: "bg-success-50",
    },
    {
      label: t("dashboard.unpaidInvoices"),
      value: stats?.invoicesUnpaid ?? "—",
      icon: CreditCard,
      color: "text-warning-600",
      bg: "bg-warning-50",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-extrabold text-text tracking-[-0.015em]">{t("dashboard.title")}</h2>
          <p className="text-text-muted text-[13.5px] mt-0.5">{t("dashboard.welcome", { name: user.first_name })}</p>
        </div>
        <Can roles={["ADMIN", "KASSIR"]}>
          <Link href="/patients/new">
            <button className="bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
              <Plus className="w-4 h-4" />
              {t("dashboard.newPatient")}
            </button>
          </Link>
        </Can>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="bg-surface p-4 rounded-[13px] border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-text-muted text-[12.5px] font-medium">{stat.label}</p>
            <h3 className="text-[27px] font-extrabold text-text mt-0.5 leading-tight">{statsLoading ? <span className="inline-block w-10 h-7 bg-border animate-pulse rounded" /> : stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Patients */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text">{t("dashboard.recentPatients")}</h3>
            <Link href="/patients" className="text-primary text-xs font-medium hover:underline cursor-pointer">
              {t("dashboard.viewAll")}
            </Link>
          </div>
          <div className="divide-y divide-border">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-border animate-pulse shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 bg-border animate-pulse rounded w-32" />
                    <div className="h-2.5 bg-border animate-pulse rounded w-20" />
                  </div>
                </div>
              ))
            ) : !stats?.recentPatients.length ? (
              <div className="px-4 py-8 text-center text-sm text-text-muted">{t("dashboard.noRecentPatients")}</div>
            ) : (
              stats.recentPatients.map((patient) => {
                const initials = `${patient.first_name[0]}${patient.last_name[0]}`.toUpperCase();
                return (
                  <Link key={patient.id} href={`/patients/${patient.id}`}>
                    <div className="px-4 py-3 flex items-center justify-between hover:bg-surface-hover transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-50 rounded-md flex items-center justify-center text-primary text-xs font-semibold shrink-0">{initials}</div>
                        <div>
                          <p className="text-sm font-medium text-text">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <p className="text-[11px] text-text-muted font-mono">{patient.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] text-text-muted">
                            {t("dashboard.joined")} {new Date(patient.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text transition-colors" />
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Recent Appointments */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text">{t("dashboard.recentAppointments")}</h3>
            <Link href="/appointments" className="text-primary text-xs font-medium hover:underline cursor-pointer">
              {t("dashboard.viewAll")}
            </Link>
          </div>
          <div className="divide-y divide-border">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-border animate-pulse shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 bg-border animate-pulse rounded w-36" />
                    <div className="h-2.5 bg-border animate-pulse rounded w-24" />
                  </div>
                </div>
              ))
            ) : !stats?.recentAppointments.length ? (
              <div className="px-4 py-8 text-center text-sm text-text-muted">{t("dashboard.noRecentAppointments")}</div>
            ) : (
              stats.recentAppointments.map((appt) => {
                const statusStyle = APPT_STATUS_STYLES[appt.caseStep?.case?.status ?? ""] ?? { bg: "bg-gray-100", text: "text-gray-600", label: appt.caseStep?.case?.status ?? "" };
                const initials = `${appt.patient.first_name[0]}${appt.patient.last_name[0]}`.toUpperCase();
                return (
                  <Link key={appt.id} href={`/patients/${appt.patient.id}`}>
                    <div className="px-4 py-3 flex items-center justify-between hover:bg-surface-hover transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-50 rounded-md flex items-center justify-center text-primary text-xs font-semibold shrink-0">{initials}</div>
                        <div>
                          <p className="text-sm font-medium text-text">
                            {appt.patient.first_name} {appt.patient.last_name}
                          </p>
                          <p className="text-[11px] text-text-muted truncate max-w-[160px]">
                            {appt.assignment.department.name} · Dr. {appt.assignment.user.last_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="text-right hidden sm:block">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${statusStyle.bg} ${statusStyle.text}`}>{statusStyle.label}</span>
                          <div className="flex items-center gap-1 text-text-muted text-[10px] mt-0.5 justify-end">
                            <Clock className="w-3 h-3" />
                            {new Date(appt.dateTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text transition-colors" />
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Weekly Schedule */}
      <Can roles={["ADMIN", "KASSIR", "DOCTOR", "HAMSHIRA", "LABARANT", "DIREKTOR"]}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-text">{t("dashboard.weeklySchedule")}</h3>
              <p className="text-xs text-secondary mt-0.5">{t("dashboard.activeAssignmentsWeek")}</p>
            </div>
            <div className="flex items-center gap-2">
              {Object.entries(ROLE_STYLES).map(([role, s]) => (
                <span key={role} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${s.bg} ${s.text}`}>
                  {role}
                </span>
              ))}
              <span className="text-xs text-text-muted ml-1">{t("dashboard.activeCount", { count: activeAssignments.length })}</span>
            </div>
          </div>
          <WeeklySchedule assignments={activeAssignments} />
        </motion.div>
      </Can>
    </div>
  );
}
