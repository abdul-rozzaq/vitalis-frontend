"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { Can } from "@/components/ui/can";
import { EnterpriseDataTable } from "@/components/ui/enterprise-data-table";
import { Sheet } from "@/components/ui/sheet";
import { DepartmentForm } from "@/features/departments/components/department-form";
import { Department } from "@/features/departments/types";
import { getDepartmentColor } from "@/features/departments/utils/department-colors";
import { api } from "@/shared/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Building2, Download, Edit, Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const t = useTranslations();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: departmentsData, isLoading } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments?filter=parents").then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: addDepartment } = useMutation({
    mutationFn: (data: any) => api.post("/departments", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });

  const { mutateAsync: updateDepartment } = useMutation({
    mutationFn: (data: any) => api.patch(`/departments/${editingDepartment?.id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });

  const { mutateAsync: deleteDepartment, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => api.delete(`/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setDeletingId(null);
    },
  });

  const handleAddDepartment = () => {
    setEditingDepartment(null);
    setIsSheetOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setIsSheetOpen(true);
  };

  const handleDeleteDepartment = (id: string) => {
    if (confirm(t("departments.deleteConfirm"))) {
      setDeletingId(id);
      deleteDepartment(id);
    }
  };

  const handleFormSubmit = (data: any) => {
    if (editingDepartment) {
      updateDepartment(data).then(() => {
        setIsSheetOpen(false);
        setEditingDepartment(null);
      });
    } else {
      addDepartment(data).then(() => {
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
          return <span className="font-medium text-primary bg-primary-50 px-1.5 py-0.5 rounded text-xs">{pageIndex * pageSize + row.index + 1}</span>;
        },
      },
      {
        accessorKey: "name",
        header: t("departments.colDepartment"),
        cell: ({ row }) => {
          const color = getDepartmentColor(row.original.id);
          return (
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${color.bg} flex items-center justify-center shrink-0`}>
                <Building2 className={`w-4 h-4 ${color.icon}`} />
              </div>
              <div>
                <Link href={`/departments/${row.original.id}`} className="font-medium text-text hover:text-primary transition-colors">
                  {row.original.name}
                </Link>
                {row.original.description && <p className="text-xs text-secondary truncate max-w-[200px]">{row.original.description}</p>}
              </div>
            </div>
          );
        },
      },
      // {
      //   accessorKey: "parent",
      //   header: t("departments.colParent"),
      //   cell: ({ row }) => {
      //     const parent = row.original.parent;
      //     return parent ? (
      //       <div className="flex items-center gap-1.5 text-secondary text-sm">
      //         <GitBranch className="w-3.5 h-3.5 shrink-0" />
      //         <Link href={`/departments/${parent.id}`} className="hover:text-primary transition-colors">
      //           {parent.name}
      //         </Link>
      //       </div>
      //     ) : (
      //       <span className="text-xs text-secondary italic">—</span>
      //     );
      //   },
      // },
      {
        accessorKey: "price",
        header: t("departments.colPrice"),
        cell: ({ row }) => {
          const price = row.original.price;
          return price != null ? <span className="text-sm text-text font-medium">{Number(price).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span> : <span className="text-xs text-secondary italic">—</span>;
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("common.actions")}</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Can roles={["ADMIN"]}>
              <button onClick={() => handleEditDepartment(row.original)} className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer" title={t("departments.editDepartment")}>
                <Edit className="w-4 h-4" />
              </button>
            </Can>
            <Can roles={["ADMIN"]}>
              <button
                onClick={() => handleDeleteDepartment(row.original.id)}
                disabled={isDeleting && deletingId === row.original.id}
                className="p-1 rounded-md hover:bg-red-50 text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                title={t("departments.deleteDepartment")}
              >
                {isDeleting && deletingId === row.original.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </Can>
          </div>
        ),
      },
    ],
    [isDeleting, deletingId, t],
  );

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={t("departments.title")}
        subtitle={t("departments.description")}
        actions={
          <div className="flex gap-2">
            <button onClick={() => {}} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-hover transition-colors text-sm font-medium">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <Can roles={["ADMIN"]}>
              <button onClick={handleAddDepartment} className="flex items-center gap-2 px-3 py-2 bg-primary text-white hover:bg-primary rounded-lg transition-colors text-sm font-medium">
                <Plus className="w-4 h-4" />
                <span>{t("departments.addDepartment")}</span>
              </button>
            </Can>
          </div>
        }
      />

      <PageContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-text-muted animate-spin" />
          </div>
        ) : (
          <EnterpriseDataTable columns={columns} data={departmentsData ?? []} pageSize={20} searchKey="name" searchPlaceholder={t("common.filterPlaceholder")} />
        )}
      </PageContent>

      {/* Slide-over Sheet */}
      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={editingDepartment ? t("departments.editTitle") : t("departments.addNewTitle")}
        description={editingDepartment ? t("departments.editDesc") : t("departments.addNewDesc")}
      >
        <DepartmentForm
          initialData={
            editingDepartment
              ? {
                  name: editingDepartment.name,
                  description: editingDepartment.description,
                  price: editingDepartment.price ?? undefined,
                  parentId: editingDepartment.parentId ?? undefined,
                }
              : undefined
          }
          departments={departmentsData ?? []}
          currentId={editingDepartment?.id}
          hideParent
          onSubmit={handleFormSubmit}
          onCancel={() => setIsSheetOpen(false)}
        />
      </Sheet>
    </div>
  );
}
