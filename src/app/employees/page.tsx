"use client";

import { EmployeeForm, EmployeeSubmitData } from "@/components/employees/employee-form";
import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Download, Edit, Filter, MoreVertical, Plus } from "lucide-react";
import Image from "next/image";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

interface Role {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  birthday?: string | null;
  phone?: string | null;
  photo?: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

const ROLE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  ADMIN: { bg: "bg-purple-100", text: "text-purple-700", label: "Admin" },
  DOCTOR: { bg: "bg-blue-100", text: "text-blue-700", label: "Doctor" },
  NURSE: { bg: "bg-green-100", text: "text-green-700", label: "Nurse" },
  RECEPTIONIST: { bg: "bg-amber-100", text: "text-amber-700", label: "Receptionist" },
};

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const t = useTranslations();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // ----- Queries ----- //

  const { data: employeesData } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get("/users").then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.get("/roles").then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  // ----- Mutations ----- //

  const { mutateAsync: addEmployee } = useMutation({
    mutationFn: (data: any) => api.post("/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const { mutateAsync: updateEmployee } = useMutation({
    mutationFn: (data: any) => api.patch(`/users/${editingEmployee?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  // ----- Handlers ----- //

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setIsSheetOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsSheetOpen(true);
  };

  const handleFormSubmit = async (data: EmployeeSubmitData) => {
    const { photoFile, ...rest } = data;

    let photo = rest.photo;
    if (photoFile) {
      const formData = new FormData();
      formData.append("photo", photoFile);
      const res = await api.post("/uploads/photo", formData);
      photo = res.data.url;
    }

    const payload = { ...rest, photo };

    if (editingEmployee) {
      await updateEmployee(payload);
      setIsSheetOpen(false);
      setEditingEmployee(null);
    } else {
      await addEmployee(payload);
      setIsSheetOpen(false);
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
          const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "";
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
        accessorKey: "email",
        header: t("employees.colEmail"),
        cell: (info: any) => <span className="text-secondary text-sm font-mono">{info.getValue() as string}</span>,
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
            {new Date(info.getValue()).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("common.actions")}</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Can method="PATCH" path="/api/users/:id">
              <button
                onClick={() => handleEditEmployee(row.original)}
                className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer"
                title={t("employees.editTitle")}
              >
                <Edit className="w-4 h-4" />
              </button>
            </Can>
            <button className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [t],
  );

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto w-full">
      {/* Header Area */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-text tracking-tight">{t("employees.title")}</h2>
          <p className="text-secondary text-sm mt-0.5">{t("employees.description")}</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="bg-surface border border-border text-secondary hover:bg-surface-hover px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
            <Filter className="w-3.5 h-3.5" />
            {t("common.filter")}
          </button>
          <button className="bg-surface border border-border text-secondary hover:bg-surface-hover px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            {t("common.export")}
          </button>
          <Can method="POST" path="/api/users">
            <button
              onClick={handleAddEmployee}
              className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("employees.addEmployee")}
            </button>
          </Can>
        </div>
      </motion.div>

      {/* Main Table Content */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <DataTable columns={columns} data={employeesData || []} />
      </motion.div>

      {/* Slide-over Sheet */}
      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={editingEmployee ? t("employees.editTitle") : t("employees.addNewTitle")}
        description={editingEmployee ? t("employees.editDesc") : t("employees.addNewDesc")}
      >
        <EmployeeForm
          initialData={
            editingEmployee
              ? {
                  first_name: editingEmployee.first_name,
                  last_name: editingEmployee.last_name,
                  email: editingEmployee.email,
                  roleId: editingEmployee.role?.id,
                  birthday: editingEmployee.birthday ?? undefined,
                  phone: editingEmployee.phone ?? undefined,
                  photo: editingEmployee.photo ?? undefined,
                }
              : undefined
          }
          roles={rolesData || []}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsSheetOpen(false)}
        />
      </Sheet>
    </div>
  );
}
