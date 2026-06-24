"use client";

import { AssignmentForm, type AssignmentFormValues } from "@/features/assignments/components/assignment-form";
import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { Assignment, DepartmentOption, UserOption } from "@/features/assignments/types";
import { ROLE_STYLES, asArray, getTableRowIndex } from "@/features/assignments/utils";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Building2, CheckCircle2, DoorOpen, Edit, ExternalLink, Loader2, Plus, Trash2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function AssignmentsPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();

  const [sheet, setSheet] = useState<{ open: boolean; editing: Assignment | null }>({ open: false, editing: null });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: assignmentsRaw, isLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => api.get("/assignments").then((r) => r.data as unknown),
    refetchOnWindowFocus: false,
  });

  const { data: usersRaw } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get("/users").then((r) => r.data as unknown),
    refetchOnWindowFocus: false,
  });

  const { data: departmentsRaw } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((r) => r.data as unknown),
    refetchOnWindowFocus: false,
  });

  const { data: roomsRaw } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => api.get("/rooms").then((r) => r.data as unknown),
    refetchOnWindowFocus: false,
  });

  const assignments = asArray<Assignment>(assignmentsRaw);
  const users = asArray<UserOption>(usersRaw);
  const departments = asArray<DepartmentOption>(departmentsRaw);
  const rooms = asArray<{ id: string; name: string }>(roomsRaw);

  const { mutateAsync: createAssignment, isPending: creatingAssignment } = useMutation({
    mutationFn: (data: AssignmentFormValues) => api.post("/assignments", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assignments"] }),
  });

  const { mutateAsync: updateAssignment, isPending: updatingAssignment } = useMutation({
    mutationFn: (data: AssignmentFormValues) => api.patch(`/assignments/${sheet.editing?.id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assignments"] }),
  });

  const { mutateAsync: deleteAssignment, isPending: deletingAssignment } = useMutation({
    mutationFn: (id: string) => api.delete(`/assignments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      setDeletingId(null);
    },
  });

  const columns = useMemo<ColumnDef<Assignment>[]>(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: ({ row, table }) => (
          <span className="font-medium text-primary bg-primary-50 px-1.5 py-0.5 rounded text-xs">
            {getTableRowIndex(table.getState().pagination.pageIndex, table.getState().pagination.pageSize, row.index)}
          </span>
        ),
      },
      {
        id: "employee",
        header: t("assignments.colEmployee"),
        cell: ({ row }) => {
          const user = row.original.user;
          if (!user) return <span className="text-text-muted text-sm">—</span>;
          const style = ROLE_STYLES[user.role] ?? { bg: "bg-gray-100", text: "text-gray-700" };
          return (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-semibold shrink-0">
                {user.first_name[0]}
                {user.last_name[0]}
              </div>
              <div>
                <p className="font-medium text-text text-sm">{user.first_name} {user.last_name}</p>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${style.bg} ${style.text}`}>{user.role}</span>
              </div>
            </div>
          );
        },
      },
      {
        id: "department",
        header: t("assignments.colDepartment"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-secondary text-sm">
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            {row.original.department?.name ?? "—"}
          </div>
        ),
      },
      {
        id: "room",
        header: t("assignments.colRoom"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-secondary text-sm">
            <DoorOpen className="w-3.5 h-3.5 shrink-0" />
            {row.original.room?.name ?? <span className="text-text-muted italic">{t("assignments.notAssigned")}</span>}
          </div>
        ),
      },
      {
        id: "schedule",
        header: t("assignments.colSchedule"),
        cell: ({ row }) => {
          const schedules = row.original.schedules ?? [];
          if (schedules.length === 0) return <span className="text-text-muted text-xs italic">{t("assignments.noSchedule")}</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {schedules.map((schedule) => (
                <span key={schedule.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary-50 text-primary-700 rounded text-[10px] font-medium">
                  {schedule.startTime}–{schedule.endTime}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        id: "isActive",
        header: t("assignments.colStatus"),
        cell: ({ row }) =>
          row.original.isActive ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success">
              <CheckCircle2 className="w-3 h-3" /> {t("assignments.active")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
              <XCircle className="w-3 h-3" /> {t("assignments.inactive")}
            </span>
          ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("common.actions")}</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Link href={`/assignments/${row.original.id}`} className="p-1 rounded-md hover:bg-surface-hover text-secondary hover:text-primary transition-colors" title={t("assignments.viewAssignment")}>
              <ExternalLink className="w-4 h-4" />
            </Link>
            <Can roles={["ADMIN"]}>
              <button onClick={() => setSheet({ open: true, editing: row.original })} className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer" title={t("common.edit")}>
                <Edit className="w-4 h-4" />
              </button>
            </Can>
            <Can roles={["ADMIN"]}>
              <button
                onClick={() => {
                  if (confirm(t("assignments.confirmDelete"))) {
                    setDeletingId(row.original.id);
                    void deleteAssignment(row.original.id);
                  }
                }}
                disabled={deletingAssignment && deletingId === row.original.id}
                className="p-1 rounded-md hover:bg-red-50 text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                title={t("common.delete")}
              >
                {deletingAssignment && deletingId === row.original.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </Can>
          </div>
        ),
      },
    ],
    [deletingAssignment, deletingId, t, deleteAssignment],
  );

  const isSheetLoading = creatingAssignment || updatingAssignment;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Can roles={["ADMIN"]}>
          <button
            onClick={() => setSheet({ open: true, editing: null })}
            className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("assignments.newAssignment")}
          </button>
        </Can>
      </div>

      {isLoading ? (
        <div className="bg-surface border border-border rounded-lg h-48 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
        </div>
      ) : (
        <DataTable columns={columns} data={assignments} />
      )}

      <Sheet
        isOpen={sheet.open}
        onClose={() => setSheet({ open: false, editing: null })}
        title={sheet.editing ? t("assignments.editAssignmentTitle") : t("assignments.newAssignment")}
        description={sheet.editing ? t("assignments.editAssignmentDesc") : t("assignments.newAssignmentDesc")}
        className="max-w-lg"
      >
        <AssignmentForm
          key={sheet.editing?.id ?? "new-assign"}
          users={users}
          departments={departments}
          rooms={rooms}
          initialData={
            sheet.editing
              ? {
                userId: sheet.editing.userId,
                departmentId: sheet.editing.departmentId,
                roomId: sheet.editing.roomId,
                isActive: sheet.editing.isActive,
                schedules: sheet.editing.schedules?.map((schedule) => ({
                  dayOfWeek: schedule.dayOfWeek,
                  startTime: schedule.startTime,
                  endTime: schedule.endTime,
                })),
              }
              : undefined
          }
          onSubmit={(data) => {
            const action = sheet.editing ? updateAssignment(data) : createAssignment(data);
            void action.then(() => setSheet({ open: false, editing: null }));
          }}
          onCancel={() => setSheet({ open: false, editing: null })}
          isLoading={isSheetLoading}
        />
      </Sheet>
    </div>
  );
}
