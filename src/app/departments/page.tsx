"use client";

import { DepartmentForm } from "@/components/departments/department-form";
import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Building2, Download, Edit, GitBranch, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
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

/**
 * Recursively flattens departments tree into a flat list.
 * Each child keeps a reference to its parent for display.
 */
function flattenDepartments(departments: Department[]): Department[] {
  const result: Department[] = [];

  function traverse(dept: Department) {
    result.push(dept);
    if (dept.children && dept.children.length > 0) {
      dept.children.forEach((child) => {
        // Ensure child has parent reference for display
        const childWithParent: Department = {
          ...child,
          parent: child.parent ?? { id: dept.id, name: dept.name },
        };
        traverse(childWithParent);
      });
    }
  }

  departments.forEach(traverse);
  return result;
}

/**
 * Filters departments by search query.
 * Searches through: name, description, parent name.
 * Also returns parent departments if any child matches.
 */
function filterDepartments(departments: Department[], query: string): Department[] {
  if (!query.trim()) return departments;

  const q = query.toLowerCase().trim();

  // Use flattened list for searching — find all matching entries
  const flat = flattenDepartments(departments);
  const matched = flat.filter((dept) => {
    return (
      dept.name.toLowerCase().includes(q) ||
      dept.description?.toLowerCase().includes(q) ||
      dept.parent?.name.toLowerCase().includes(q)
    );
  });

  return matched;
}

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const t = useTranslations();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: departmentsData, isLoading } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((res) => res.data),
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

  // Filtered data: when search is active, show flat list with matched departments
  const filteredData = useMemo(() => {
    const source = departmentsData ?? [];
    if (!searchQuery.trim()) return source;
    return filterDepartments(source, searchQuery);
  }, [departmentsData, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

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
        header: t("departments.colDepartment"),
        cell: ({ row }) => {
          const color = getDepartmentColor(row.original.id);
          return (
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${color.bg} flex items-center justify-center shrink-0`}>
                <Building2 className={`w-4 h-4 ${color.icon}`} />
              </div>
              <div>
                <Link
                  href={`/departments/${row.original.id}`}
                  className="font-medium text-text hover:text-primary transition-colors"
                >
                  {row.original.name}
                </Link>
                {row.original.description && (
                  <p className="text-xs text-secondary truncate max-w-[200px]">{row.original.description}</p>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "parent",
        header: t("departments.colParent"),
        cell: ({ row }) => {
          const parent = row.original.parent;
          return parent ? (
            <div className="flex items-center gap-1.5 text-secondary text-sm">
              <GitBranch className="w-3.5 h-3.5 shrink-0" />
              <Link
                href={`/departments/${parent.id}`}
                className="hover:text-primary transition-colors"
              >
                {parent.name}
              </Link>
            </div>
          ) : (
            <span className="text-xs text-secondary italic">—</span>
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
            <Can roles={["ADMIN"]}>
              <button
                onClick={() => handleEditDepartment(row.original)}
                className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer"
                title={t("departments.editDepartment")}
              >
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

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto w-full">
      {/* Header Area */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        <div>
          <h2 className="text-xl font-semibold text-text tracking-tight">{t("departments.title")}</h2>
          <p className="text-secondary text-sm mt-0.5">{t("departments.description")}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("common.search")}
              className="bg-surface border border-border text-sm text-text placeholder:text-text-muted rounded-md pl-8 pr-7 py-1.5 w-48 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:w-64 transition-all duration-200"
            />
            {isSearching && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button className="bg-surface border border-border text-secondary hover:bg-surface-hover px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            {t("common.export")}
          </button>
          <Can roles={["ADMIN"]}>
            <button
              onClick={handleAddDepartment}
              className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("departments.addDepartment")}
            </button>
          </Can>
        </div>
      </motion.div>

      {/* Main Table Content */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        {isLoading ? (
          <div className="bg-surface border border-border rounded-lg h-48 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
          </div>
        ) : (
          <DataTable columns={columns} data={filteredData} />
        )}
      </motion.div>

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