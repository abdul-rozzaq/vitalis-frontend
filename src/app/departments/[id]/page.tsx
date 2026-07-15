"use client";

import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { Appointment } from "@/features/appointments/types";
import { STATUS_STYLES } from "@/features/appointments/utils/status-colors";
import { DepartmentForm } from "@/features/departments/components/department-form";
import { Department } from "@/features/departments/types";
import { getDepartmentColor } from "@/features/departments/utils/department-colors";
import { api } from "@/shared/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, Building2, Calendar, DollarSign, Edit, ExternalLink, GitBranch, Loader2, Plus, Trash2, User } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ProcedureForm } from "@/features/procedures/components/procedure-form";
import { Procedure } from "@/features/procedures/types";

export default function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const t = useTranslations();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingSubDept, setEditingSubDept] = useState<Department | null>(null);
  const [isProcSheetOpen, setIsProcSheetOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: department, isLoading } = useQuery<Department>({
    queryKey: ["departments", id],
    queryFn: () => api.get(`/departments/${id}`).then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const { data: procedures = [], isLoading: loadingProcedures } = useQuery({
    queryKey: ["procedures", "department", id],
    queryFn: () => api.get("/procedures", { params: { departmentId: id } }).then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const allDeptIds = useMemo(() => {
    if (!department) return [id];
    const childIds = (department.children ?? []).map((c) => c.id);
    return [id, ...childIds];
  }, [department, id]);

  const appointmentQueries = useQuery<Appointment[]>({
    queryKey: ["appointments", "department", id, allDeptIds],
    queryFn: async () => {
      const results = await Promise.all(allDeptIds.map((deptId) => api.get("/appointments", { params: { departmentId: deptId } }).then((res) => res.data as Appointment[])));
      const merged = results.flat();
      const unique = Array.from(new Map(merged.map((a) => [a.id, a])).values());
      return unique.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    },
    enabled: allDeptIds.length > 0,
    refetchOnWindowFocus: false,
  });

  const appointments = appointmentQueries.data ?? [];
  const loadingAppts = appointmentQueries.isLoading;

  const [activeTab, setActiveTab] = useState<"subdepartments" | "appointments" | "procedures">("subdepartments");

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

  const { mutateAsync: addProcedure } = useMutation({
    mutationFn: (data: any) => api.post("/procedures", { ...data, departmentId: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["procedures", "department", id] }),
  });

  const { mutateAsync: updateProcedure } = useMutation({
    mutationFn: (data: any) => api.patch(`/procedures/${editingProcedure?.id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["procedures", "department", id] }),
  });

  const { mutateAsync: deleteProcedure, isPending: isDeletingProc } = useMutation({
    mutationFn: (procId: string) => api.delete(`/procedures/${procId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures", "department", id] });
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
    const payload = {
      ...data,
      price: data.price === "" || data.price === undefined || data.price === null || Number(data.price) === 0 ? null : Number(data.price),
    };

    if (editingSubDept) {
      updateSubDept(payload).then(() => {
        setIsSheetOpen(false);
        setEditingSubDept(null);
      });
    } else {
      addSubDept(payload).then(() => {
        setIsSheetOpen(false);
      });
    }
  };

  const handleAddProcedure = () => {
    setEditingProcedure(null);
    setIsProcSheetOpen(true);
  };

  const handleEditProcedure = (proc: any) => {
    setEditingProcedure(proc);
    setIsProcSheetOpen(true);
  };

  const handleDeleteProcedure = (procId: string) => {
    if (confirm("Are you sure you want to delete this procedure?")) {
      setDeletingId(procId);
      deleteProcedure(procId);
    }
  };

  const handleProcFormSubmit = (data: any) => {
    const payload = {
      ...data,
      price: data.price === "" || data.price === undefined || data.price === null || Number(data.price) === 0 ? null : Number(data.price),
    };

    if (editingProcedure) {
      updateProcedure(payload).then(() => {
        setIsProcSheetOpen(false);
        setEditingProcedure(null);
      });
    } else {
      addProcedure(payload).then(() => {
        setIsProcSheetOpen(false);
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
        header: t("departments.colSubDepartment"),
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
            <Link href={`/departments/${row.original.id}`} className="p-1 rounded-md hover:bg-surface-hover text-secondary hover:text-primary transition-colors" title={t("departments.viewDepartment")}>
              <ExternalLink className="w-4 h-4" />
            </Link>
            <Can roles={["ADMIN"]}>
              <button onClick={() => handleEditSubDept(row.original)} className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer">
                <Edit className="w-4 h-4" />
              </button>
            </Can>
            <Can roles={["ADMIN"]}>
              <button
                onClick={() => handleDeleteSubDept(row.original.id)}
                disabled={isDeleting && deletingId === row.original.id}
                className="p-1 rounded-md hover:bg-red-50 text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
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

  const procColumns = useMemo<ColumnDef<Procedure>[]>(
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
        header: "Protsedura nomi",
        cell: ({ row }) => (
          <div>
            <span className="font-medium text-text">{row.original.name}</span>
            {row.original.description && <p className="text-xs text-secondary truncate max-w-[200px]">{row.original.description}</p>}
          </div>
        ),
      },
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
              <button onClick={() => handleEditProcedure(row.original)} className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer">
                <Edit className="w-4 h-4" />
              </button>
            </Can>
            <Can roles={["ADMIN"]}>
              <button
                onClick={() => handleDeleteProcedure(row.original.id)}
                disabled={isDeletingProc && deletingId === row.original.id}
                className="p-1 rounded-md hover:bg-red-50 text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
              >
                {isDeletingProc && deletingId === row.original.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </Can>
          </div>
        ),
      },
    ],
    [isDeletingProc, deletingId, t],
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
  const hasChildren = (department.children ?? []).length > 0;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/departments" className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-text transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {t("departments.title")}
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="bg-surface border border-border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center gap-4">
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

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-text">{t("departments.subDepartments")}</h3>
            <p className="text-secondary text-sm mt-0.5">{t("departments.subDepartmentsDesc", { name: department.name })}</p>
          </div>
          <Can roles={["ADMIN"]}>
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

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }} className="space-y-4 mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-text">Protseduralar</h3>
            <p className="text-secondary text-sm mt-0.5">{department.name} bo'limida ko'rsatiladigan protseduralar</p>
          </div>
          <Can roles={["ADMIN"]}>
            <button
              onClick={handleAddProcedure}
              className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Protsedura qo'shish
            </button>
          </Can>
        </div>
        
        {loadingProcedures ? (
          <div className="bg-surface border border-border rounded-lg h-32 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
          </div>
        ) : procedures.length === 0 ? (
          <div className="bg-surface border border-border rounded-lg py-10 text-center">
            <p className="text-sm text-secondary">Protseduralar mavjud emas</p>
          </div>
        ) : (
          <DataTable columns={procColumns} data={procedures} />
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-text">{t("appointments.title")}</h3>
          <p className="text-secondary text-sm mt-0.5">{hasChildren ? t("departments.appointmentsDescWithChildren", { name: department.name }) : t("departments.appointmentsDesc", { name: department.name })}</p>
        </div>

        {loadingAppts ? (
          <div className="bg-surface border border-border rounded-lg h-32 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-surface border border-border rounded-lg py-10 text-center">
            <Calendar className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-secondary">{t("departments.noAppointments")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {appointments.map((appt) => {
              const s = STATUS_STYLES[appt.caseStep?.case?.status ?? "ACTIVE"] ?? STATUS_STYLES.ACTIVE;
              const StatusIcon = s.icon;
              const deptName = appt.assignment?.department?.name;
              const isFromChild = deptName && deptName !== department.name;

              return (
                <div key={appt.id} className={`flex items-center gap-4 rounded-lg border px-4 py-3 ${s.bg}`}>
                  <div className="shrink-0">
                    <StatusIcon className={`w-4 h-4 ${s.text}`} />
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                    <div className="flex items-center gap-1.5 text-sm text-text font-medium truncate">
                      <User className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <Link href={`/patients/${appt.patient.id}`} className="truncate hover:text-primary transition-colors">
                        {appt.patient.first_name} {appt.patient.last_name}
                      </Link>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-secondary truncate">
                      <User className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      Dr. {appt.assignment.user.first_name} {appt.assignment.user.last_name}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-secondary">
                      <Calendar className="w-3.5 h-3.5 text-text-muted shrink-0" />

                      {new Date(appt.dateTime).toLocaleString("uz-UZ", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {isFromChild && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface border border-border text-secondary">{deptName}</span>}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.text}`}>{appt.caseStep?.case?.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={editingSubDept ? t("departments.editSubTitle") : t("departments.addSubTitle", { name: department.name })}
        description={editingSubDept ? t("departments.editSubDesc") : t("departments.addSubDesc", { name: department.name })}
      >
        <DepartmentForm
          initialData={editingSubDept ? { name: editingSubDept.name, description: editingSubDept.description, price: editingSubDept.price ?? undefined } : undefined}
          hideParent
          onSubmit={handleFormSubmit}
          onCancel={() => setIsSheetOpen(false)}
        />
      </Sheet>

      <Sheet
        isOpen={isProcSheetOpen}
        onClose={() => setIsProcSheetOpen(false)}
        title={editingProcedure ? "Protsedurani tahrirlash" : "Yangi protsedura qo'shish"}
        description={editingProcedure ? "Protsedura ma'lumotlarini tahrirlang" : "Bo'lim uchun yangi protsedura qo'shing"}
      >
        <ProcedureForm
          initialData={editingProcedure ? { name: editingProcedure.name, description: editingProcedure.description, price: editingProcedure.price ?? undefined } : undefined}
          onSubmit={handleProcFormSubmit}
          onCancel={() => setIsProcSheetOpen(false)}
        />
      </Sheet>
    </div>
  );
}
