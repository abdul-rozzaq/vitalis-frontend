"use client";

import formatPhone from "@/components/ui/format-phone";
import { Can } from "@/components/ui/can";
import { EnterpriseDataTable } from "@/components/ui/enterprise-data-table";
import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { api } from "@/lib/api";
import { exportToExcel } from "@/lib/export-excel";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Download, Edit, Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  gender: "male" | "female";
  birth_date: string | null;
}

export default function PatientsPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedPatients, setSelectedPatients] = useState<Patient[]>([]);

  const { data: patientsData = [], isLoading: isLoadingPatients } = useQuery({
    queryKey: ["patients"],
    queryFn: () => api.get("/patients").then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: deletePatient, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => api.delete(`/patients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setDeletingId(null);
    },
  });

  const handleExport = () => {
    const headers = [t("patients.colId"), t("patients.colName"), t("patients.colGender"), t("patients.colBirthDate"), t("patients.colPhone")];
    const rows = patientsData.map((p: Patient) => [p.id, `${p.first_name} ${p.last_name}`, p.gender ?? "", p.birth_date ? new Date(p.birth_date).toLocaleDateString() : "", p.phone_number ?? ""]);
    exportToExcel("patients", headers, rows, t("patients.title"));
  };

  const handleDelete = (id: string) => {
    if (confirm(t("patients.deleteConfirm"))) {
      setDeletingId(id);
      deletePatient(id);
    }
  };

  const columns = useMemo<ColumnDef<Patient>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => {
          // const pageIndex = table.getState().pagination.pageIndex;
          // const pageSize = table.getState().pagination.pageSize;
          return (
            <span className="font-mono text-xs text-text-muted">
              {/* {String(pageIndex * pageSize + row.index + 1).padStart(4, "0")} */}
              {String(row.original.id).slice(0, 6).toUpperCase()}
            </span>
          );
        },
      },
      {
        accessorFn: (row: Patient) => `${row.first_name} ${row.last_name}`,
        id: "name",
        header: t("patients.colName"),
        cell: ({ row }) => (
          <Link href={`/patients/${row.original.id}`} className="font-medium text-text hover:text-primary transition-colors">
            {row.original.first_name} {row.original.last_name}
          </Link>
        ),
      },
      {
        accessorKey: "gender",
        header: t("patients.colGender"),
        cell: (info: any) => <span className="capitalize px-2 py-1 rounded-full bg-surface-hover text-xs text-text-muted">{t(`patients.${(info.getValue() as string)?.toLowerCase()}`)}</span>,
      },
      {
        accessorKey: "birth_date",
        header: t("patients.colBirthDate"),
        cell: (info: any) => <span className="text-text-muted text-sm">{info.getValue() ? new Date(info.getValue()).toLocaleDateString() : t("common.na")}</span>,
      },
      {
        accessorKey: "phone_number",
        header: t("patients.colPhone"),
        cell: (info: any) => <span className="text-text-muted font-mono text-xs">{formatPhone(info.getValue() as string)}</span>,
      },
      {
        id: "actions",
        header: () => <span className="text-right">{t("common.actions")}</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Can roles={["ADMIN", "KASSIR"]}>
              <Link href={`/patients/${row.original.id}/edit`}>
                <button className="p-1 rounded-lg hover:bg-surface text-text-muted hover:text-text transition-colors cursor-pointer" title={t("patients.editPatient")}>
                  <Edit className="w-4 h-4" />
                </button>
              </Link>
            </Can>
            <Can roles={["ADMIN"]}>
              <button
                onClick={() => handleDelete(row.original.id)}
                disabled={isDeleting && deletingId === row.original.id}
                className="p-1 rounded-lg hover:bg-danger-50 text-text-muted hover:text-danger-500 transition-colors cursor-pointer disabled:opacity-40"
                title={t("patients.deletePatient")}
              >
                {isDeleting && deletingId === row.original.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </Can>
          </div>
        ),
      },
    ],
    [t, isDeleting, deletingId],
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page Header */}
      <PageHeader
        title={t("patients.title")}
        subtitle={t("patients.description")}
        actions={
          <div className="flex gap-2">
            <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-hover transition-colors text-sm font-medium">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <Can roles={["ADMIN", "KASSIR"]}>
              <Link href="/patients/new">
                <button className="flex items-center gap-2 px-3 py-2 bg-primary text-white hover:bg-primary rounded-lg transition-colors text-sm font-medium">
                  <Plus className="w-4 h-4" />
                  <span>{t("patients.addPatient")}</span>
                </button>
              </Link>
            </Can>
          </div>
        }
      />

      {/* Page Content */}
      <PageContent>
        {isLoadingPatients ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-text-muted animate-spin" />
          </div>
        ) : (
          <EnterpriseDataTable columns={columns} data={patientsData} onRowSelect={setSelectedPatients} pageSize={20} searchKey="name" searchPlaceholder={t("common.filterPlaceholder")} />
        )}
      </PageContent>
    </div>
  );
}
