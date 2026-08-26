"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { Can } from "@/components/ui/can";
import formatPhone from "@/components/ui/format-phone";
import { AttendanceTable } from "@/features/attendance/components/attendance-table";
import { attendanceApi, AttendanceRecord } from "@/features/attendance/lib/attendance-api";
import { Assignment, Schedule } from "@/features/assignments/types";
import { api } from "@/shared/lib/api";
import { ROLE_STYLES } from "@/shared/lib/status-styles";
import { User } from "@/shared/types/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DoorOpen,
  Edit,
  Fingerprint,
  Loader2,
  Phone,
  Trash2,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";

// ─── Constants ─────────────────────────────────────────────────────────────────

const DAY_COLS: Record<number, string> = {
  0: "bg-surface border-border border-l-4 border-l-primary-400",
  1: "bg-surface border-border border-l-4 border-l-blue-400",
  2: "bg-surface border-border border-l-4 border-l-emerald-400",
  3: "bg-surface border-border border-l-4 border-l-violet-400",
  4: "bg-surface border-border border-l-4 border-l-amber-400",
  5: "bg-surface border-border border-l-4 border-l-rose-400",
  6: "bg-surface border-border border-l-4 border-l-cyan-400",
  7: "bg-surface border-border border-l-4 border-l-slate-400",
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();

  const DAY_LABELS: Record<number, string> = {
    0: t("assignments.everyDay"),
    1: t("dashboard.monday"),
    2: t("dashboard.tuesday"),
    3: t("dashboard.wednesday"),
    4: t("dashboard.thursday"),
    5: t("dashboard.friday"),
    6: t("dashboard.saturday"),
    7: t("dashboard.sunday"),
  };

  // ── Employee profile ──
  const {
    data: employee,
    isLoading: isEmployeeLoading,
    isError,
  } = useQuery<User>({
    queryKey: ["employee", id],
    queryFn: () => api.get(`/users/${id}`).then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  // ── Department / room assignments + weekly schedule ──
  const { data: assignments = [], isLoading: isAssignmentsLoading } = useQuery<Assignment[]>({
    queryKey: ["employee-assignments", id],
    queryFn: () => api.get("/assignments", { params: { userId: id } }).then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  // ── Attendance / shift history ──
  const { data: attendanceRecords = [], isLoading: isAttendanceLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["employee-attendance", id],
    queryFn: () => attendanceApi.getRecords({ userId: id }),
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: deleteEmployee, isPending: isDeleting } = useMutation({
    mutationFn: () => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      router.push("/employees");
    },
  });

  const handleDelete = () => {
    if (confirm(t("employees.deleteConfirm"))) {
      deleteEmployee();
    }
  };

  // ── Derived state ──
  const allSchedules = useMemo(
    () =>
      assignments.flatMap((a) =>
        (a.schedules ?? []).map((s: Schedule) => ({
          ...s,
          departmentName: a.department?.name,
          roomName: a.room?.name,
        })),
      ),
    [assignments],
  );
  const scheduledDays = useMemo(() => [...new Set(allSchedules.map((s) => s.dayOfWeek))].sort(), [allSchedules]);

  const sortedAttendance = useMemo(
    () => [...attendanceRecords].sort((a, b) => new Date(b.shift.startAt).getTime() - new Date(a.shift.startAt).getTime()),
    [attendanceRecords],
  );

  if (isEmployeeLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-secondary">{t("employees.notFound")}</p>
        <Link href="/employees" className="text-sm text-primary hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          {t("employees.backToEmployees")}
        </Link>
      </div>
    );
  }

  const fullName = `${employee.first_name} ${employee.last_name}`;
  const initials = `${employee.first_name[0] ?? ""}${employee.last_name[0] ?? ""}`.toUpperCase();
  const roleStyle = ROLE_STYLES[employee.role] ?? { bg: "bg-gray-100", text: "text-gray-700", label: employee.role };
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
  const photoUrl = employee.photo ? `${apiBase}${employee.photo}` : null;
  const needsFaceId = employee.role === "DOCTOR" || employee.role === "HAMSHIRA";

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={fullName}
        breadcrumbs={[{ label: t("employees.title"), href: "/employees" }, { label: fullName }]}
        actions={
          <Can roles={["ADMIN"]}>
            <div className="flex gap-2">
              <Link
                href={`/employees/${id}/edit`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-hover transition-colors text-sm font-medium"
              >
                <Edit className="w-4 h-4" />
                {t("common.edit")}
              </Link>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-40"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {t("employees.deleteEmployee")}
              </button>
            </div>
          </Can>
        }
      />

      <PageContent>
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* ── LEFT SIDEBAR ── */}
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 }} className="w-full lg:w-72 shrink-0 space-y-4">
            <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold overflow-hidden">
                  {photoUrl ? <Image src={photoUrl} alt={fullName} width={64} height={64} className="object-cover w-full h-full" unoptimized /> : initials}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-text leading-tight">{fullName}</h1>
                  <span className={`inline-flex items-center px-2 py-0.5 mt-1.5 rounded-full text-xs font-medium ${roleStyle.bg} ${roleStyle.text}`}>{roleStyle.label}</span>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm text-secondary">
                  <Phone className="w-4 h-4 text-text-muted shrink-0" />
                  <span className="font-mono">{employee.phone ? formatPhone(employee.phone) : "—"}</span>
                </div>
                {employee.birthday && (
                  <div className="flex items-center gap-2.5 text-sm text-secondary">
                    <Calendar className="w-4 h-4 text-text-muted shrink-0" />
                    {new Date(employee.birthday).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-sm text-secondary">
                  <Fingerprint className="w-4 h-4 text-text-muted shrink-0" />
                  {employee.employeeNo ? (
                    <span className="font-mono">{employee.employeeNo}</span>
                  ) : needsFaceId ? (
                    <span className="text-warning" title="Face ID bog'lanmagan — bu xodimning skanlari hisobga olinmaydi">
                      Face ID bog&apos;lanmagan
                    </span>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </div>
                <div className="flex items-center gap-2.5 text-sm text-secondary">
                  <Calendar className="w-4 h-4 text-text-muted shrink-0" />
                  <span>
                    {t("employees.colJoined")}: {new Date(employee.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT PANEL ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="flex-1 min-w-0 space-y-4">
            {/* Assignments */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-primary-500" />
                <h2 className="font-semibold text-text">{t("employees.assignments")}</h2>
              </div>

              {isAssignmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
                </div>
              ) : assignments.length === 0 ? (
                <p className="text-sm text-secondary py-6 text-center">{t("assignments.notAssigned")}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {assignments.map((a) => (
                    <div key={a.id} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm text-text font-medium">
                          <Building2 className="w-4 h-4 text-text-muted shrink-0" />
                          {a.department?.name ?? t("assignments.notAssigned")}
                        </div>
                        {a.isActive ? (
                          <span className="flex items-center gap-1 text-xs text-success font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t("common.active")}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-rose-500 font-medium">
                            <XCircle className="w-3.5 h-3.5" />
                            {t("common.inactive")}
                          </span>
                        )}
                      </div>
                      {a.room?.name && (
                        <div className="flex items-center gap-2 text-sm text-secondary">
                          <DoorOpen className="w-4 h-4 text-text-muted shrink-0" />
                          {a.room.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weekly work schedule */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary-500" />
                <h2 className="font-semibold text-text">{t("assignments.weeklySchedule")}</h2>
              </div>

              {isAssignmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
                </div>
              ) : allSchedules.length === 0 ? (
                <p className="text-sm text-secondary py-6 text-center">{t("assignments.noSchedule")}</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {scheduledDays.map((day) => {
                    const daySchedules = allSchedules.filter((s) => s.dayOfWeek === day);
                    return (
                      <div key={day} className={`rounded-lg border p-3 space-y-1.5 ${DAY_COLS[day] ?? "bg-gray-50 border-gray-200"}`}>
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{DAY_LABELS[day]}</p>
                        {daySchedules.map((s, idx) => (
                          <div key={`${s.id}-${idx}`} className="text-sm text-text">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-text-muted shrink-0" />
                              {s.startTime} – {s.endTime}
                            </div>
                            {s.departmentName && <div className="text-xs text-text-muted pl-4">{s.departmentName}</div>}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Attendance history */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-500" />
                <h2 className="font-semibold text-text">{t("employees.attendanceHistory")}</h2>
              </div>

              {isAttendanceLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
                </div>
              ) : (
                <AttendanceTable records={sortedAttendance} />
              )}
            </div>
          </motion.div>
        </div>
      </PageContent>
    </div>
  );
}
