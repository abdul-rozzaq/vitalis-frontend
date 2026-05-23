"use client";

import { Can } from "@/components/ui/can";
import { Combobox } from "@/components/ui/combobox";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { ROLE_STYLES, asArray, getTableRowIndex } from "@/features/assignments/utils";
import type { LaboratoryAssignment } from "@/features/lab/types";
import { api } from "@/lib/api";
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

interface LaboratoryOption {
  id: string;
  name: string;
}

export default function LabAssignmentsPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();

  const [sheet, setSheet] = useState<{ open: boolean; editing: LaboratoryAssignment | null }>({
    open: false,
    editing: null,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [laboratoryId, setLaboratoryId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: assignmentsRaw, isLoading } = useQuery({
    queryKey: ["lab-assignments"],
    queryFn: () => api.get("/laboratory-assignments").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const { data: usersRaw } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get("/users").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const { data: laboratoriesRaw } = useQuery({
    queryKey: ["laboratories"],
    queryFn: () => api.get("/laboratories").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const assignments = asArray<LaboratoryAssignment>(assignmentsRaw);
  const users = asArray<UserOption>(usersRaw);
  const laboratories = asArray<LaboratoryOption>(laboratoriesRaw);

  const { mutateAsync: createAssignment, isPending: isCreating } = useMutation({
    mutationFn: () => api.post("/laboratory-assignments", { userId, laboratoryId, isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["laboratories"] });
      closeSheet();
    },
  });

  const { mutateAsync: updateAssignment, isPending: isUpdating } = useMutation({
    mutationFn: () => api.patch(`/laboratory-assignments/${sheet.editing?.id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["laboratories"] });
      closeSheet();
    },
  });

  const { mutateAsync: deleteAssignment, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => api.delete(`/laboratory-assignments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["laboratories"] });
      setDeletingId(null);
    },
  });

  const openCreate = () => {
    setUserId("");
    setLaboratoryId("");
    setIsActive(true);
    setSheet({ open: true, editing: null });
  };

  const openEdit = (a: LaboratoryAssignment) => {
    setUserId(a.userId);
    setLaboratoryId(a.laboratoryId);
    setIsActive(a.isActive);
    setSheet({ open: true, editing: a });
  };

  const closeSheet = () => {
    setSheet({ open: false, editing: null });
    setUserId("");
    setLaboratoryId("");
    setIsActive(true);
  };

  const labOptions = laboratories.map((l) => ({
    value: l.id,
    label: l.name,
    avatar: l.name[0],
  }));

  const userOptions = users.map((u) => ({
    value: u.id,
    label: `${u.first_name} ${u.last_name}`,
    sublabel: u.role,
    avatar: u.first_name[0],
  }));
  const isSaving = isCreating || isUpdating;

  const columns = useMemo<ColumnDef<LaboratoryAssignment>[]>(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: ({ row, table }) => (
          <span className="font-medium text-primary bg-primary-50 px-1.5 py-0.5 rounded text-xs">{getTableRowIndex(table.getState().pagination.pageIndex, table.getState().pagination.pageSize, row.index)}</span>
        ),
      },
      {
        id: "employee",
        header: t("assignments.colEmployee"),
        cell: ({ row }) => {
          const user = row.original.user;
          const style = ROLE_STYLES[user.role] ?? { bg: "bg-gray-100", text: "text-gray-700" };
          return (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-semibold shrink-0">
                {user.first_name[0]}
                {user.last_name[0]}
              </div>
              <div>
                <p className="font-medium text-text text-sm">
                  {user.first_name} {user.last_name}
                </p>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${style.bg} ${style.text}`}>{user.role}</span>
              </div>
            </div>
          );
        },
      },
      {
        id: "laboratory",
        header: t("assignments.colLaboratory"),
        cell: ({ row }) => <span className="text-sm text-text">{row.original.laboratory.name}</span>,
      },
      {
        id: "isActive",
        header: t("assignments.colStatus"),
        cell: ({ row }) =>
          row.original.isActive ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
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
            <Can roles={["ADMIN"]}>
              <button onClick={() => openEdit(row.original)} className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer" title={t("common.edit")}>
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
                disabled={isDeleting && deletingId === row.original.id}
                className="p-1 rounded-md hover:bg-red-50 text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                title={t("common.delete")}
              >
                {isDeleting && deletingId === row.original.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </Can>
          </div>
        ),
      },
    ],
    [isDeleting, deletingId, t, deleteAssignment],
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Can roles={["ADMIN"]}>
          <button
            onClick={openCreate}
            className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("assignments.newLabAssignment")}
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

      <Sheet isOpen={sheet.open} onClose={closeSheet} title={sheet.editing ? t("assignments.editLabAssignment") : t("assignments.newLabAssignment")}>
        <div className="space-y-5">
          {/* User select — disabled when editing */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">{t("assignments.colEmployee")}</label>

            <Combobox options={userOptions} value={userId} onChange={(val) => setUserId(val)} disabled={!!sheet.editing} placeholder={t("forms.select")} searchPlaceholder={t("common.search")} className="w-full" />
          </div>

          {/* Laboratory select — disabled when editing */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">{t("assignments.colLaboratory")}</label>

            <Combobox
              options={labOptions}
              value={laboratoryId}
              onChange={(val) => setLaboratoryId(val)}
              disabled={!!sheet.editing}
              placeholder={t("forms.select")}
              searchPlaceholder={t("common.search")}
              className="w-full"
              error={false}
            />
          </div>
          {/* isActive toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive((v) => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isActive ? "bg-primary" : "bg-border"}`}
            >
              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-4.5" : "translate-x-0.5"}`} />
            </button>
            <span className="text-sm font-medium text-text">{t("assignments.active")}</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeSheet} className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
              {t("forms.cancel")}
            </button>
            <button
              type="button"
              disabled={(!sheet.editing && (!userId || !laboratoryId)) || isSaving}
              onClick={() => (sheet.editing ? void updateAssignment() : void createAssignment())}
              className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm cursor-pointer"
            >
              {isSaving ? t("common.loading") : t("common.save")}
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
