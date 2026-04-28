"use client";

import { RoleForm } from "@/components/assignments/role-form";
import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { Role, RolePayload } from "@/features/assignments/types";
import { asArray, formatShortDate, getTableRowIndex } from "@/features/assignments/utils";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Loader2, Plus, Shield, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

export default function AssignmentsRolesPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();

  const [sheet, setSheet] = useState<{ open: boolean; editing: Role | null }>({ open: false, editing: null });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: rolesRaw, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.get("/roles").then((r) => r.data as unknown),
    refetchOnWindowFocus: false,
  });

  const roles = asArray<Role>(rolesRaw);

  const { mutateAsync: createRole, isPending: creatingRole } = useMutation({
    mutationFn: (data: RolePayload) => api.post("/roles", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });

  const { mutateAsync: updateRole, isPending: updatingRole } = useMutation({
    mutationFn: (data: RolePayload) => api.patch(`/roles/${sheet.editing?.id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });

  const { mutateAsync: deleteRole, isPending: deletingRole } = useMutation({
    mutationFn: (id: string) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setDeletingId(null);
    },
  });

  const columns = useMemo<ColumnDef<Role>[]>(
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
        accessorKey: "name",
        header: t("assignments.colRole"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-text text-sm font-medium">
            <Shield className="w-3.5 h-3.5 text-primary" />
            {row.original.name}
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: t("common.description"),
        cell: ({ row }) => <span className="text-secondary text-sm">{row.original.description || "—"}</span>,
      },
      {
        accessorKey: "createdAt",
        header: t("common.created"),
        cell: ({ row }) => <span className="text-text-muted text-xs">{formatShortDate(row.original.createdAt)}</span>,
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("common.actions")}</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Can roles={["ADMIN"]}>
              <button onClick={() => setSheet({ open: true, editing: row.original })} className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer" title={t("common.edit")}>
                <Edit className="w-4 h-4" />
              </button>
            </Can>
            <Can roles={["ADMIN"]}>
              <button
                onClick={() => {
                  if (confirm(t("assignments.confirmDeleteRole"))) {
                    setDeletingId(row.original.id);
                    void deleteRole(row.original.id);
                  }
                }}
                disabled={deletingRole && deletingId === row.original.id}
                className="p-1 rounded-md hover:bg-red-50 text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                title={t("common.delete")}
              >
                {deletingRole && deletingId === row.original.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </Can>
          </div>
        ),
      },
    ],
    [deletingId, deletingRole, deleteRole, t],
  );

  const isSheetLoading = creatingRole || updatingRole;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Can roles={["ADMIN"]}>
          <button
            onClick={() => setSheet({ open: true, editing: null })}
            className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("assignments.newRole")}
          </button>
        </Can>
      </div>

      {isLoading ? (
        <div className="bg-surface border border-border rounded-lg h-48 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
        </div>
      ) : (
        <DataTable columns={columns} data={roles} />
      )}

      <Sheet
        isOpen={sheet.open}
        onClose={() => setSheet({ open: false, editing: null })}
        title={sheet.editing ? t("assignments.editRole") : t("assignments.newRole")}
        description={sheet.editing ? t("assignments.editRoleDesc") : t("assignments.newRoleDesc")}
        className="max-w-lg"
      >
        <RoleForm
          key={sheet.editing?.id ?? "new-role"}
          initialData={sheet.editing ? { name: sheet.editing.name, description: sheet.editing.description ?? "" } : undefined}
          onSubmit={(data) => {
            const action = sheet.editing ? updateRole(data) : createRole(data);
            void action.then(() => setSheet({ open: false, editing: null }));
          }}
          onCancel={() => setSheet({ open: false, editing: null })}
          isLoading={isSheetLoading}
        />
      </Sheet>
    </div>
  );
}
