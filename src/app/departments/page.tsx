"use client";

import { DepartmentForm } from "@/components/departments/department-form";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Building2, Download, Edit, Filter, Loader2, Plus, Trash2, Users } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

interface Department {
  id: string;
  name: string;
  description?: string;
  head_name?: string;
  employee_count?: number;
  createdAt: string;
  updatedAt: string;
}

const DEPARTMENTS_MOCK_DATA: Department[] = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "Cardiology",
    description: "Heart and cardiovascular system treatment",
    head_name: "Dr. James Wilson",
    employee_count: 12,
    createdAt: "2026-01-10T08:00:00.000Z",
    updatedAt: "2026-01-10T08:00:00.000Z",
  },
  {
    id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    name: "Neurology",
    description: "Brain, spinal cord and nervous system",
    head_name: "Dr. Sarah Chen",
    employee_count: 9,
    createdAt: "2026-01-12T08:00:00.000Z",
    updatedAt: "2026-01-12T08:00:00.000Z",
  },
  {
    id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    name: "Pediatrics",
    description: "Medical care for infants, children and adolescents",
    head_name: "Dr. Emily Carter",
    employee_count: 15,
    createdAt: "2026-01-15T08:00:00.000Z",
    updatedAt: "2026-01-15T08:00:00.000Z",
  },
  {
    id: "d4e5f6a7-b8c9-0123-defa-234567890123",
    name: "Orthopedics",
    description: "Musculoskeletal system and bone injuries",
    head_name: "Dr. Michael Torres",
    employee_count: 8,
    createdAt: "2026-01-18T08:00:00.000Z",
    updatedAt: "2026-01-18T08:00:00.000Z",
  },
  {
    id: "e5f6a7b8-c9d0-1234-efab-345678901234",
    name: "Emergency",
    description: "Acute and urgent medical care",
    head_name: "Dr. Lisa Park",
    employee_count: 20,
    createdAt: "2026-01-20T08:00:00.000Z",
    updatedAt: "2026-01-20T08:00:00.000Z",
  },
  {
    id: "f6a7b8c9-d0e1-2345-fabc-456789012345",
    name: "Radiology",
    description: "Medical imaging and diagnostics",
    head_name: "Dr. Alan Grant",
    employee_count: 6,
    createdAt: "2026-01-22T08:00:00.000Z",
    updatedAt: "2026-01-22T08:00:00.000Z",
  },
];

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

export default function DepartmentsPage() {
  const queryClient = useQueryClient();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: departmentsData, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: addDepartment, isPending: isAdding } = useMutation({
    mutationFn: (data: any) => api.post("/departments", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });

  const { mutateAsync: updateDepartment, isPending: isUpdating } = useMutation({
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
    if (confirm("Are you sure you want to delete this department?")) {
      setDeletingId(id);
      deleteDepartment(id);
    }
  };

  const isSaving = isAdding || isUpdating;

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
          return <span className="font-medium text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded text-xs">{pageIndex * pageSize + row.index + 1}</span>;
        },
      },
      {
        accessorKey: "name",
        header: "Department",
        cell: ({ row }) => {
          const color = getDepartmentColor(row.original.id);
          return (
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${color.bg} flex items-center justify-center shrink-0`}>
                <Building2 className={`w-4 h-4 ${color.icon}`} />
              </div>
              <div>
                <p className="font-medium text-text-primary">{row.original.name}</p>
                {row.original.description && <p className="text-xs text-text-secondary truncate max-w-[200px]">{row.original.description}</p>}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "head_name",
        header: "Department Head",
        cell: (info: any) => {
          const value = info.getValue() as string | undefined;
          return value ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-semibold shrink-0">
                {value
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <span className="text-sm text-text-primary">{value}</span>
            </div>
          ) : (
            <span className="text-xs text-text-secondary italic">Not assigned</span>
          );
        },
      },
      {
        accessorKey: "employee_count",
        header: "Staff",
        cell: (info: any) => {
          const count = info.getValue() as number | undefined;
          return (
            <div className="flex items-center gap-1.5 text-text-secondary text-sm">
              <Users className="w-3.5 h-3.5" />
              <span>{count ?? 0}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: (info: any) => (
          <span className="text-text-secondary text-sm">
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
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleEditDepartment(row.original)}
              className="p-1 rounded-md hover:bg-surface-hover text-text-secondary transition-colors cursor-pointer"
              title="Edit Department"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteDepartment(row.original.id)}
              disabled={isDeleting && deletingId === row.original.id}
              className="p-1 rounded-md hover:bg-red-50 text-text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
              title="Delete Department"
            >
              {isDeleting && deletingId === row.original.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto w-full">
      {/* Header Area */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">Departments</h2>
          <p className="text-text-secondary text-sm mt-0.5">Manage hospital departments and their staff.</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="bg-surface border border-border text-text-secondary hover:bg-surface-hover px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
          <button className="bg-surface border border-border text-text-secondary hover:bg-surface-hover px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={handleAddDepartment}
            className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Department
          </button>
        </div>
      </motion.div>

      {/* Main Table Content */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        {isLoading ? (
          <div className="bg-surface border border-border rounded-lg h-48 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
          </div>
        ) : (
          <DataTable columns={columns} data={departmentsData ?? []} />
        )}
      </motion.div>

      {/* Slide-over Sheet */}
      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={editingDepartment ? "Edit Department" : "Add New Department"}
        description={editingDepartment ? "Modify details for this department." : "Create a new department in your organization."}
      >
        <DepartmentForm
          initialData={
            editingDepartment
              ? {
                  name: editingDepartment.name,
                  description: editingDepartment.description,
                  head_name: editingDepartment.head_name,
                }
              : undefined
          }
          onSubmit={handleFormSubmit}
          onCancel={() => setIsSheetOpen(false)}
        />
      </Sheet>
    </div>
  );
}
