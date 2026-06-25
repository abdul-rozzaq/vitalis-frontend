"use client";

import { Can } from "@/components/ui/can";
import { Combobox } from "@/components/ui/combobox";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { ROLE_STYLES, asArray, getTableRowIndex } from "@/features/assignments/utils";
import { api } from "@/shared/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, Edit, Loader2, Plus, Trash2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

interface UserOption {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface DiagnosticOption {
  id: string;
  name: string;
}

interface DiagnosticAssignment {
  id: string;
  userId: string;
  diagnosticsId: string;
  isActive: boolean;
  createdAt: string;
  user: UserOption;
  diagnostics: DiagnosticOption;
}

export default function DiagnosticAssignmentsPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();

  // ───────────────────────── STATE ─────────────────────────
  const [sheet, setSheet] = useState<{ open: boolean; editing: DiagnosticAssignment | null }>({
    open: false,
    editing: null,
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [userId, setUserId] = useState("");
  const [diagnosticsId, setDiagnosticsId] = useState("");
  const [isActive, setIsActive] = useState(true);

  // ───────────────────────── QUERIES ─────────────────────────
  const { data: assignmentsRaw, isLoading } = useQuery({
    queryKey: ["diagnostic-assignments"],
    queryFn: () => api.get("/diagnostic-assignments").then((r) => r.data),
  });

  const { data: usersRaw } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get("/users").then((r) => r.data),
  });

  const { data: diagnosticsRaw } = useQuery({
    queryKey: ["diagnostics"],
    queryFn: () => api.get("/diagnostics").then((r) => r.data),
  });

  const assignments = asArray<DiagnosticAssignment>(assignmentsRaw);
  const users = asArray<UserOption>(usersRaw);
  const diagnosticsList = asArray<DiagnosticOption>(diagnosticsRaw);

  // ───────────────────────── OPTIONS ─────────────────────────
  const diagnosticOptions = diagnosticsList.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  const userOptions = users.map((u) => ({
    value: u.id,
    label: `${u.first_name} ${u.last_name}`,
    sublabel: u.role,
  }));

  // ───────────────────────── MUTATIONS ─────────────────────────
  const { mutateAsync: createAssignment, isPending: isCreating } = useMutation({
    mutationFn: () =>
      api.post("/diagnostic-assignments", {
        userId,
        diagnosticsId,
        isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnostic-assignments"] });
      closeSheet();
    },
  });

  const { mutateAsync: updateAssignment, isPending: isUpdating } = useMutation({
    mutationFn: () =>
      api.patch(`/diagnostic-assignments/${sheet.editing?.id}`, {
        userId,
        diagnosticsId,
        isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnostic-assignments"] });
      closeSheet();
    },
  });

  const { mutateAsync: deleteAssignment } = useMutation({
    mutationFn: (id: string) => api.delete(`/diagnostic-assignments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnostic-assignments"] });
      setDeletingId(null);
    },
  });

  // ───────────────────────── ACTIONS ─────────────────────────
  const openCreate = () => {
    setUserId("");
    setDiagnosticsId("");
    setIsActive(true);
    setSheet({ open: true, editing: null });
  };

  const openEdit = (a: DiagnosticAssignment) => {
    setUserId(a.userId);
    setDiagnosticsId(a.diagnosticsId);
    setIsActive(a.isActive);
    setSheet({ open: true, editing: a });
  };

  const closeSheet = () => {
    setSheet({ open: false, editing: null });
    setUserId("");
    setDiagnosticsId("");
    setIsActive(true);
  };

  // ───────────────────────── COLUMNS ─────────────────────────
  const columns = useMemo<ColumnDef<DiagnosticAssignment>[]>(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: ({ row, table }) => (
          <span className="text-xs font-medium">
            {getTableRowIndex(
              table.getState().pagination.pageIndex,
              table.getState().pagination.pageSize,
              row.index
            )}
          </span>
        ),
      },
      {
        id: "employee",
        header: t("assignments.colEmployee"),
        cell: ({ row }) => {
          const user = row.original.user;
          const style = ROLE_STYLES[user.role] ?? { bg: "bg-gray-100", text: "text-gray-700" };
          return (
            <div className="flex items-center gap-2">
              <span>{user.first_name} {user.last_name}</span>
              <span className={`${style.bg} ${style.text} text-xs px-2 py-0.5 rounded`}>
                {user.role}
              </span>
            </div>
          );
        },
      },
      {
        id: "diagnostic",
        header: t("assignments.colDiagnostic"),
        cell: ({ row }) => <span>{row.original.diagnostics?.name}</span>,
      },
      {
        id: "status",
        header: t("assignments.colStatus"),
        cell: ({ row }) =>
          row.original.isActive ? (
            <span className="text-success flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {t("assignments.statusActive")}
            </span>
          ) : (
            <span className="text-gray-500 flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              {t("assignments.statusInactive")}
            </span>
          ),
      },
      {
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Can roles={["ADMIN"]}>
              <button
                onClick={() => openEdit(row.original)}
                className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer"
                title={t("common.edit")}
              >
                <Edit className="w-4 h-4" />
              </button>
            </Can>
            <Can roles={["ADMIN"]}>
              <button
                onClick={() => {
                  setDeletingId(row.original.id);
                  void deleteAssignment(row.original.id);
                }}
                disabled={deletingId === row.original.id}
                className="p-1 rounded-md hover:bg-red-50 text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                title={t("common.delete")}
              >
                {deletingId === row.original.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </Can>
          </div>
        ),
      },
    ],
    [t, deleteAssignment, deletingId]
  );

  // ───────────────────────── UI ─────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Can roles={["ADMIN"]}>
          <button
            onClick={openCreate}
            className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("assignments.newDiagnosticAssignment")}
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
        onClose={closeSheet}
        title={sheet.editing ? t("assignments.editDiagnosticAssignment") : t("assignments.newDiagnosticAssignment")}
      >
        <div className="space-y-4">
          <Combobox
            options={userOptions}
            value={userId}
            onChange={setUserId}
          />

          <Combobox
            options={diagnosticOptions}
            value={diagnosticsId}
            onChange={setDiagnosticsId}
          />

          {sheet.editing && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-primary-600"
              />
              {t("assignments.statusActive")}
            </label>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeSheet}
              className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              {t("forms.cancel")}
            </button>
            <button
              type="button"
              disabled={!userId || !diagnosticsId || isCreating || isUpdating}
              onClick={() => (sheet.editing ? updateAssignment() : createAssignment())}
              className="flex-1 bg-primary hover:bg-primary-700 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm cursor-pointer"
            >
              {isCreating || isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                t("common.save")
              )}
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}