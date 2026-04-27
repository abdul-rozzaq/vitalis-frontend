"use client";

import { exportToExcel } from "@/lib/export-excel";

import formatPhone from "@/components/formatPhone";
import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Download, Edit, Filter, Loader2, Plus, Trash2, X } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

interface Role {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  birthday?: string | null;
  photo?: string | null;
  role: Role;
  createdAt: string;
}

const ROLE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  ADMIN: { bg: "bg-purple-100", text: "text-purple-700", label: "Admin" },
  DOCTOR: { bg: "bg-blue-100", text: "text-blue-700", label: "Doctor" },
  NURSE: { bg: "bg-green-100", text: "text-green-700", label: "Nurse" },
  RECEPTIONIST: { bg: "bg-amber-100", text: "text-amber-700", label: "Receptionist" },
};

export default function EmployeesPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");

  // ✅ O'ZGARMADI
  const { data: rolesData = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.get("/roles").then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  // ✅ O'ZGARTIRILDI: filterText va selectedRole ni backendga yuboradi
  // selectedRole bu role.name (masalan "DOCTOR"), backendga roleId kerak
  // Shuning uchun rolesData dan roleId ni topamiz
  const selectedRoleId = useMemo(
    () => rolesData.find((r: Role) => r.name === selectedRole)?.id ?? "",
    [rolesData, selectedRole]
  );

  const { data: employeesData = [] } = useQuery({
    // queryKey ichida filterText va selectedRoleId bo'lsa,
    // ular o'zgarganda avtomatik qayta so'rov yuboriladi
    queryKey: ["employees", { search: filterText, roleId: selectedRoleId }],
    queryFn: () =>
      api
        .get("/users", {
          params: {
            ...(filterText && { search: filterText }),
            ...(selectedRoleId && { roleId: selectedRoleId }),
          },
        })
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

  // ✅ O'CHIRILDI: filteredEmployees useMemo kerak emas endi
  // Backend filter qilib qaytaradi, to'g'ridan-to'g'ri employeesData ishlatiladi

  const handleExport = () => {
    const headers = ["#", t("employees.colFullName"), t("employees.colPhone"), t("employees.colRole"), t("employees.colJoined")];
    const rows = employeesData.map((e: Employee, idx: number) => [
      idx + 1,
      `${e.first_name} ${e.last_name}`,
      e.phone ?? "",
      e.role?.name ?? "",
      e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "",
    ]);
    exportToExcel("employees", headers, rows, t("employees.title"));
  };

  const handleDelete = (id: string) => {
    if (confirm(t("employees.deleteConfirm"))) {
      setDeletingId(id);
      deleteEmployee(id);
    }
  };

  const handleToggleFilter = () => {
    if (filterOpen) {
      setSelectedRole("");
    }
    setFilterOpen((v) => !v);
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
                  name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                )}
              </div>
              <span className="font-medium text-text">{name}</span>
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
          const role = info.getValue() as Role;
          const roleName = role?.name ?? "";
          const style = ROLE_STYLES[roleName] ?? { bg: "bg-gray-100", text: "text-gray-700", label: roleName };
          return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>{style.label}</span>;
        },
      },
      {
        accessorKey: "createdAt",
        header: t("employees.colJoined"),
        cell: (info: any) => (
          <span className="text-secondary text-sm">
            {new Date(info.getValue()).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("common.actions")}</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Can method="PATCH" path="/api/users/:id">
              <Link href={`/employees/${row.original.id}/edit`}>
                <button className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer" title={t("employees.editTitle")}>
                  <Edit className="w-4 h-4" />
                </button>
              </Link>
            </Can>
            <Can method="DELETE" path="/api/users/:id">
              <button
                onClick={() => handleDelete(row.original.id)}
                disabled={isDeleting && deletingId === row.original.id}
                className="p-1 rounded-md hover:bg-red-50 text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                title={t("employees.deleteEmployee")}
              >
                {isDeleting && deletingId === row.original.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Trash2 className="w-4 h-4" />}
              </button>
            </Can>
          </div>
        ),
      },
    ],
    [t, isDeleting, deletingId],
  );

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto w-full">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-text tracking-tight">{t("employees.title")}</h2>
          <p className="text-secondary text-sm mt-0.5">{t("employees.description")}</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            autoFocus
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder={t("common.filterPlaceholder")}
            className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent w-48"
          />

          {filterOpen && (
            <div className="flex items-center gap-1">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent cursor-pointer"
              >
                <option value="">all</option>
                {rolesData.map((role: Role) => (
                  <option key={role.id} value={role.name}>
                    {ROLE_STYLES[role.name]?.label ?? role.name}
                  </option>
                ))}
              </select>
              {selectedRole && (
                <button
                  onClick={() => setSelectedRole("")}
                  className="p-1.5 rounded-md hover:bg-surface-hover text-secondary hover:text-text transition-colors cursor-pointer"
                  title="clear"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <button
            onClick={handleToggleFilter}
            className={`border px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${filterOpen || selectedRole
              ? "bg-primary-50 border-primary text-primary hover:bg-primary-100"
              : "bg-surface border-border text-secondary hover:bg-surface-hover"
              }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {t("common.filter")}
            {selectedRole && (
              <span className="ml-0.5 font-semibold">
                · {ROLE_STYLES[selectedRole]?.label ?? selectedRole}
              </span>
            )}
          </button>

          <button
            onClick={handleExport}
            className="bg-surface border border-border text-secondary hover:bg-surface-hover px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            {t("common.export")}
          </button>
          <Can method="POST" path="/api/users">
            <Link href="/employees/new">
              <button className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20">
                <Plus className="w-3.5 h-3.5" />
                {t("employees.addEmployee")}
              </button>
            </Link>
          </Can>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <DataTable columns={columns} data={employeesData} />
      </motion.div>
    </div>
  );
}