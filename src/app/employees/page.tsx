"use client";

import { exportToExcel } from "@/lib/export-excel";
import formatPhone from "@/components/formatPhone";
import { Can } from "@/components/ui/can";
import { EnterpriseDataTable } from "@/components/ui/enterprise-data-table";
import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Download, Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  birthday?: string | null;
  photo?: string | null;
  role: string;
  createdAt: string;
}

const ROLE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  ADMIN: { bg: "bg-primary-50", text: "text-primary", label: "Admin" },
  KASSIR: { bg: "bg-primary-50", text: "text-primary", label: "Kassir" },
  DOCTOR: { bg: "bg-info-50", text: "text-info", label: "Doctor" },
  HAMSHIRA: { bg: "bg-success-50", text: "text-success", label: "Hamshira" },
  LABARANT: { bg: "bg-warning-50", text: "text-warning", label: "Labarant" },
  TEXNIK_HODIM: { bg: "bg-surface-hover", text: "text-text-muted", label: "Texnik Hodim" },
  DIREKTOR: { bg: "bg-danger-50", text: "text-danger", label: "Direktor" },
  HISOBCHI: { bg: "bg-primary-50", text: "text-primary", label: "Hisobchi" },
};

export default function EmployeesPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: employeesData = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () =>
      api
        .get("/users")
        .then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: deleteEmployee, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setDeletingId(null);
    },
  });

  const handleExport = () => {
    const headers = ["#", t("employees.colFullName"), t("employees.colPhone"), t("employees.colRole"), t("employees.colJoined")];
    const rows = employeesData.map((e: Employee, idx: number) => [idx + 1, `${e.first_name} ${e.last_name}`, e.phone ?? "", e.role ?? "", e.createdAt ? new Date(e.createdAt).toLocaleDateString() : ""]);
    exportToExcel("employees", headers, rows, t("employees.title"));
  };

  const handleDelete = (id: string) => {
    if (confirm(t("employees.deleteConfirm"))) {
      setDeletingId(id);
      deleteEmployee(id);
    }
  };

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: ({ row, table }) => {
          const pageIndex = table.getState().pagination.pageIndex;
          const pageSize = table.getState().pagination.pageSize;
          return <span className="font-medium text-primary bg-primary-50 px-1.5 py-0.5 rounded text-xs">{pageIndex * pageSize + row.index + 1}</span>;
        },
      },
      {
        accessorFn: (row: Employee) => `${row.first_name} ${row.last_name}`,
        id: "name",
        header: t("employees.colFullName"),
        cell: (info: any) => {
          const name = info.getValue() as string;
          const photo = info.row.original.photo as string | null | undefined;
          const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
          const photoUrl = photo ? `${apiBase}${photo}` : null;
          return (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-semibold shrink-0 overflow-hidden">
                {photoUrl ? (
                  <Image src={photoUrl} alt={name} width={28} height={28} className="object-cover w-full h-full" unoptimized />
                ) : (
                  name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                )}
              </div>
              {/* <Can roles={["ADMIN"]}> */}
              <Link href={`/employees/${info.row.original.id}/edit`} className="font-medium text-text hover:text-primary transition-colors">
                {name}
              </Link>
              {/* </Can> */}
            </div>
          );
        },
      },
      {
        accessorKey: "phone",
        header: t("employees.colPhone"),
        cell: (info: any) => <span className="text-secondary text-sm font-mono">{formatPhone(info.getValue() as string)}</span>,
      },
      {
        accessorKey: "role",
        header: t("employees.colRole"),
        cell: (info: any) => {
          const roleName = (info.getValue() as string) ?? "";
          const style = ROLE_STYLES[roleName] ?? { bg: "bg-gray-100", text: "text-gray-700", label: roleName };
          return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>{style.label}</span>;
        },
      },
      {
        accessorKey: "createdAt",
        header: t("employees.colJoined"),
        cell: (info: any) => <span className="text-secondary text-sm">{new Date(info.getValue()).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>,
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("common.actions")}</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Can roles={["ADMIN"]}>
              <button
                onClick={() => handleDelete(row.original.id)}
                disabled={isDeleting && deletingId === row.original.id}
                className="p-1 rounded-md hover:bg-red-50 text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                title={t("employees.deleteEmployee")}
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
      <PageHeader
        title={t("employees.title")}
        subtitle={t("employees.description")}
        actions={
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-hover transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <Can roles={["ADMIN"]}>
              <Link href="/employees/new">
                <button className="flex items-center gap-2 px-3 py-2 bg-primary text-white hover:bg-primary rounded-lg transition-colors text-sm font-medium">
                  <Plus className="w-4 h-4" />
                  <span>{t("employees.addEmployee")}</span>
                </button>
              </Link>
            </Can>
          </div>
        }
      />

      <PageContent>
        <EnterpriseDataTable
          columns={columns}
          data={employeesData}
          pageSize={20}
          searchKey="name"
          searchPlaceholder={t("common.filterPlaceholder")}
        />
      </PageContent>
    </div>
  );
}
