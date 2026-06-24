"use client";

import { AssignmentForm, type AssignmentFormValues } from "@/features/assignments/components/assignment-form";
import { Can } from "@/components/ui/can";
import { Sheet } from "@/components/ui/sheet";
import { UserOption } from "@/features/assignments/types";
import { api } from "@/lib/api";
import { UserRole } from "@/types/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ROLE_STYLES } from "@/lib/status-styles";
import { ArrowLeft, BedDouble, Building2, Calendar, CheckCircle2, Clock, DoorOpen, Edit, Loader2, User, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────


interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  assignmentId: string;
}

interface Assignment {
  id: string;
  userId: string;
  departmentId: string;
  roomId?: string | null;
  isActive: boolean;
  createdAt: string;
  user?: { id: string; first_name: string; last_name: string; role: UserRole };
  department?: { id: string; name: string };
  room?: { id: string; name: string; roomType: string } | null;
  schedules?: Schedule[];
}

interface DeptOption { id: string; name: string }
interface RoomOption { id: string; name: string }

// ─── Constants ─────────────────────────────────────────────────────────────────


const DAY_COLS: Record<number, string> = {
  1: "bg-surface border-border border-l-4 border-l-blue-400",
  2: "bg-surface border-border border-l-4 border-l-emerald-400",
  3: "bg-surface border-border border-l-4 border-l-violet-400",
  4: "bg-surface border-border border-l-4 border-l-amber-400",
  5: "bg-surface border-border border-l-4 border-l-rose-400",
  6: "bg-surface border-border border-l-4 border-l-cyan-400",
  7: "bg-surface border-border border-l-4 border-l-slate-400",
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AssignmentDetailPage() {
  const t = useTranslations();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const DAY_LABELS: Record<number, string> = {
    1: t("dashboard.monday"),
    2: t("dashboard.tuesday"),
    3: t("dashboard.wednesday"),
    4: t("dashboard.thursday"),
    5: t("dashboard.friday"),
    6: t("dashboard.saturday"),
    7: t("dashboard.sunday"),
  };

  // ── Fetch assignment ──
  const { data: assignment, isLoading, isError } = useQuery<Assignment>({
    queryKey: ["assignment", id],
    queryFn: () => api.get(`/assignments/${id}`).then((r) => r.data),
  });

  // ── Fetch options for edit form ──
  const { data: users = [] } = useQuery<UserOption[]>({
    queryKey: ["users-list"],
    queryFn: () => api.get("/employees").then((r) => r.data),
    enabled: editOpen,
  });
  const { data: departments = [] } = useQuery<DeptOption[]>({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((r) => r.data),
    enabled: editOpen,
  });
  const { data: rooms = [] } = useQuery<RoomOption[]>({
    queryKey: ["rooms"],
    queryFn: () => api.get("/assignments/rooms").then((r) => r.data),
    enabled: editOpen,
  });

  // ── Update mutation ──
  const updateMutation = useMutation({
    mutationFn: (data: Partial<AssignmentFormValues>) =>
      api.patch(`/assignments/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignment", id] });
      qc.invalidateQueries({ queryKey: ["assignments"] });
      setEditOpen(false);
    },
  });

  // ── Loading / error states ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (isError || !assignment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-secondary">{t("assignments.notFound")}</p>
        <Link href="/assignments" className="text-sm text-primary hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          {t("assignments.backToAssignments")}
        </Link>
      </div>
    );
  }

  const fullName = assignment.user
    ? `${assignment.user.first_name} ${assignment.user.last_name}`
    : "—";
  const roleName = assignment.user?.role;
  const roleStyle = (roleName ? ROLE_STYLES[roleName] : undefined) ?? { bg: "bg-gray-100", text: "text-gray-700" };
  const schedules = assignment.schedules ?? [];
  const scheduledDays = [...new Set(schedules.map((s) => s.dayOfWeek))].sort();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/assignments"
          className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("assignments.backToAssignments")}
        </Link>
        <Can roles={["ADMIN"]}>
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-surface border border-border hover:bg-surface-hover transition-colors text-text cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            {t("common.edit")}
          </button>
        </Can>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* ── Left card ── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Employee card */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-text">{fullName}</p>
                {roleName && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleStyle.bg} ${roleStyle.text}`}>
                    {roleName}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-2.5 text-sm text-secondary">
                <Building2 className="w-4 h-4 text-text-muted shrink-0" />
                <span>{assignment.department?.name ?? t("assignments.notAssigned")}</span>
              </div>

              <div className="flex items-center gap-2.5 text-sm text-secondary">
                <DoorOpen className="w-4 h-4 text-text-muted shrink-0" />
                <span>{assignment.room?.name ?? t("assignments.notAssigned")}</span>
              </div>

              <div className="flex items-center gap-2.5 text-sm text-secondary">
                <Calendar className="w-4 h-4 text-text-muted shrink-0" />
                <span>
                  {t("assignments.createdAt")}:{" "}
                  {new Date(assignment.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="pt-1 border-t border-border">
              {assignment.isActive ? (
                <span className="flex items-center gap-1.5 text-sm text-success font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  {t("common.active")}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm text-rose-500 font-medium">
                  <XCircle className="w-4 h-4" />
                  {t("common.inactive")}
                </span>
              )}
            </div>
          </div>

          {/* Room info card */}
          {assignment.room && (
            <div className="bg-surface border border-border rounded-xl p-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                {t("assignments.colRoom")}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                  <BedDouble className="w-4 h-4 text-cyan-600" />
                </div>
                <div>
                  <p className="font-medium text-text">{assignment.room.name}</p>
                  <p className="text-xs text-secondary">
                    {assignment.room.roomType === "WARD" ? "Ward" : "Examination"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Weekly schedule ── */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary-500" />
            <h2 className="font-semibold text-text">{t("assignments.weeklySchedule")}</h2>
          </div>

          {schedules.length === 0 ? (
            <p className="text-sm text-secondary py-6 text-center">{t("assignments.noSchedule")}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {scheduledDays.map((day) => {
                const daySchedules = schedules.filter((s) => s.dayOfWeek === day);
                return (
                  <div
                    key={day}
                    className={`rounded-lg border p-3 space-y-1.5 ${DAY_COLS[day] ?? "bg-gray-50 border-gray-200"}`}
                  >
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                      {DAY_LABELS[day]}
                    </p>
                    {daySchedules.map((s) => (
                      <div key={s.id} className="flex items-center gap-1 text-sm text-text">
                        <Clock className="w-3 h-3 text-text-muted shrink-0" />
                        {s.startTime} – {s.endTime}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Edit sheet */}
      <Sheet
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title={t("assignments.editAssignmentTitle")}
        description={t("assignments.editAssignmentDesc")}
      >
        <AssignmentForm
          initialData={{
            userId: assignment.userId,
            departmentId: assignment.departmentId,
            roomId: assignment.roomId ?? "",
            isActive: assignment.isActive,
            schedules: schedules.map((s) => ({
              startTime: s.startTime,
              endTime: s.endTime,
            })),
          }}
          users={users}
          departments={departments}
          rooms={rooms}
          onSubmit={(data) => updateMutation.mutate(data)}
          onCancel={() => setEditOpen(false)}
          isLoading={updateMutation.isPending}
        />
      </Sheet>
    </div>
  );
}
