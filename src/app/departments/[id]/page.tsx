"use client";

import { DepartmentForm } from "@/components/departments/department-form";
import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, Building2, DollarSign, Edit, GitBranch, Loader2, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

interface Department {
  id: string;
  name: string;
  description?: string;
  price?: number | null;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  children?: Department[];
}

const DEPARTMENT_COLORS: { bg: string; icon: string }[] = [
  { bg: "bg-blue-100", icon: "text-blue-600" },
  { bg: "bg-purple-100", icon: "text-purple-600" },
  { bg: "bg-green-100", icon: "text-green-600" },
  { bg: "bg-amber-100", icon: "text-amber-600" },
  { bg: "bg-rose-100", icon: "text-rose-600" },
  { bg: "bg-cyan-100", icon: "text-cyan-600" },
];

function getDepartmentColor(id: string) {
  const index = id.charCodeAt(0) % DEPARTMENT_COLORS.length;
  return DEPARTMENT_COLORS[index];
}

export default function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingSubDept, setEditingSubDept] = useState<Department | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: department, isLoading } = useQuery<Department>({
    queryKey: ["departments", id],
    queryFn: () => api.get(`/departments/${id}`).then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: addSubDept } = useMutation({
    mutationFn: (data: any) => api.post("/departments", { ...data, parentId: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments", id] }),
  });

  const { mutateAsync: updateSubDept } = useMutation({
    mutationFn: (data: any) => api.patch(`/departments/${editingSubDept?.id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments", id] }),
  });

  const { mutateAsync: deleteSubDept, isPending: isDeleting } = useMutation({
    mutationFn: (subId: string) => api.delete(`/departments/${subId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments", id] });
      setDeletingId(null);
    },
  });

  const handleAddSubDept = () => {
    setEditingSubDept(null);
    setIsSheetOpen(true);
  };

  const handleEditSubDept = (dept: Department) => {
    setEditingSubDept(dept);
    setIsSheetOpen(true);
  };

  const handleDeleteSubDept = (subId: string) => {
    if (confirm("Are you sure you want to delete this sub-department?")) {
      setDeletingId(subId);
      deleteSubDept(subId);
    }
  };

  const handleFormSubmit = (data: any) => {
    if (editingSubDept) {
      updateSubDept(data).then(() => {
        setIsSheetOpen(false);
        setEditingSubDept(null);
      });
    } else {
      addSubDept(data).then(() => {
        setIsSheetOpen(false);
      });
    }
  };

  const columns = useMemo<ColumnDef<Department>[]>(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: ({ row, table }) => {
          const pageIndex = table.getState().pagination.pageIndex;
          const pageSize = table.getState().pagination.pageSize;
          return (
            <span className="font-medium text-primary bg-primary-50 px-1.5 py-0.5 rounded text-xs">
              {pageIndex * pageSize + row.index + 1}
            </span>
          );
        },
      },
      {
        accessorKey: "name",
        header: t("departments.colSubDepartment"),
        cell: ({ row }) => {
          const color = getDepartmentColor(row.original.id);
          return (
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${color.bg} flex items-center justify-center shrink-0`}>
                <Building2 className={`w-4 h-4 ${color.icon}`} />
              </div>
              <div>
                <p className="font-medium text-text">{row.original.name}</p>
                {row.original.description && (
                  <p className="text-xs text-secondary truncate max-w-[200px]">{row.original.description}</p>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "price",
        header: t("departments.colPrice"),
        cell: ({ row }) => {
          const price = row.original.price;
          return price != null ? (
            <span className="text-sm text-text font-medium">
              {Number(price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          ) : (
            <span className="text-xs text-secondary italic">—</span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("common.actions")}</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Can method="PATCH" path="/api/departments/:id">
              <button
                onClick={() => handleEditSubDept(row.original)}
                className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
            </Can>
            <Can method="DELETE" path="/api/departments/:id">
              <button
                onClick={() => handleDeleteSubDept(row.original.id)}
                disabled={isDeleting && deletingId === row.original.id}
                className="p-1 rounded-md hover:bg-red-50 text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                title="Delete"
              >
                {isDeleting && deletingId === row.original.id ? (
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
    [isDeleting, deletingId, t],
  );

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
      </div>
    );
  }

  if (!department) {
    return (
      <div className="p-6">
        <p className="text-secondary text-sm">{t("departments.notFound")}</p>
      </div>
    );
  }

  const color = getDepartmentColor(department.id);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
      {/* Back */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href="/departments"
          className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("departments.title")}
        </Link>
      </motion.div>

      {/* Department Info */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="bg-surface border border-border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <div className={`w-12 h-12 rounded-xl ${color.bg} flex items-center justify-center shrink-0`}>
          <Building2 className={`w-6 h-6 ${color.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-text">{department.name}</h2>
          {department.description && <p className="text-sm text-secondary mt-0.5">{department.description}</p>}
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {department.parent && (
              <span className="flex items-center gap-1.5 text-xs text-secondary">
                <GitBranch className="w-3.5 h-3.5" />
                {department.parent.name}
              </span>
            )}
            {department.price != null && (
              <span className="flex items-center gap-1.5 text-xs text-secondary">
                <DollarSign className="w-3.5 h-3.5" />
                {Number(department.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Sub-departments */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-text">{t("departments.subDepartments")}</h3>
            <p className="text-secondary text-sm mt-0.5">{t("departments.subDepartmentsDesc", { name: department.name })}</p>
          </div>
          <Can method="POST" path="/api/departments">
            <button
              onClick={handleAddSubDept}
              className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("departments.addSubDepartment")}
            </button>
          </Can>
        </div>

        <DataTable columns={columns} data={department.children ?? []} />
      </motion.div>

      {/* Sheet */}
      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={editingSubDept ? t("departments.editSubTitle") : t("departments.addSubTitle")}
        description={
          editingSubDept
            ? t("departments.editSubDesc")
            : t("departments.addSubDesc", { name: department.name })
        }
      >
        <DepartmentForm
          initialData={
            editingSubDept
              ? {
                  name: editingSubDept.name,
                  description: editingSubDept.description,
                  price: editingSubDept.price ?? undefined,
                }
              : undefined
          }
          hideParent
          onSubmit={handleFormSubmit}
          onCancel={() => setIsSheetOpen(false)}
        />
      </Sheet>
    </div>
  );
}
