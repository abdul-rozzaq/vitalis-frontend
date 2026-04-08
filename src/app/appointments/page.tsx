"use client";

import { AppointmentForm } from "@/components/appointments/appointment-form";
import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Building2, Calendar as CalendarIcon, Download, Edit, Filter, Loader2, Plus, Stethoscope, Trash2, User } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";

interface Assignment {
  id: string;
  user: { id: string; first_name: string; last_name: string };
  department: { id: string; name: string };
  room: { id: string; name: string } | null;
}

interface Appointment {
  id: string;
  dateTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  patient: { id: string; first_name: string; last_name: string };
  patientId: string;
  assignment: Assignment;
  assignmentId: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-warning-50 text-warning-600",
  CONFIRMED: "bg-primary-50 text-primary",
  CANCELLED: "bg-danger-50 text-danger-600",
  COMPLETED: "bg-info-50 text-info-600",
};

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const { data: appointmentsData, isLoading } = useQuery<Appointment[]>({
    queryKey: ["appointments"],
    queryFn: () => api.get("/appointments").then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const { data: patientsData = [] } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: () => api.get("/patients").then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const { data: assignmentsData = [] } = useQuery<Assignment[]>({
    queryKey: ["assignments"],
    queryFn: () => api.get("/assignments").then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: addAppointment, isPending: isAdding } = useMutation({
    mutationFn: (data: any) => api.post("/appointments", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  const { mutateAsync: updateAppointment, isPending: isUpdating } = useMutation({
    mutationFn: (data: any) => api.patch(`/appointments/${editingAppointment?.id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  const { mutateAsync: deleteAppointment, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => api.delete(`/appointments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setDeletingId(null);
    },
  });

  const handleAdd = () => {
    setEditingAppointment(null);
    setIsSheetOpen(true);
  };

  const handleEdit = useCallback((appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsSheetOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (confirm(t("appointments.deleteConfirm"))) {
      setDeletingId(id);
      deleteAppointment(id);
    }
  }, [deleteAppointment, t]);

  const handleFormSubmit = (data: any) => {
    if (editingAppointment) {
      updateAppointment(data).then(() => {
        setIsSheetOpen(false);
        setEditingAppointment(null);
      });
    } else {
      addAppointment(data).then(() => {
        setIsSheetOpen(false);
      });
    }
  };

  const filteredAppointments = useMemo(
    () =>
      filterText.trim()
        ? (appointmentsData ?? []).filter((a: Appointment) =>
            `${a.patient?.first_name ?? ""} ${a.patient?.last_name ?? ""}`.toLowerCase().includes(filterText.toLowerCase()),
          )
        : (appointmentsData ?? []),
    [appointmentsData, filterText],
  );

  const handleExport = () => {
    const appts = appointmentsData ?? [];
    const headers = [t("appointments.colPatient"), t("appointments.colAssignment"), t("appointments.colDateTime"), t("appointments.colStatus")];
    const rows = appts.map((a: Appointment) => [
      `${a.patient?.first_name ?? ""} ${a.patient?.last_name ?? ""}`.trim(),
      a.assignment ? `${a.assignment.user?.first_name} ${a.assignment.user?.last_name} — ${a.assignment.department?.name}` : "",
      a.dateTime ? new Date(a.dateTime).toLocaleString() : "",
      a.status,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url;
    el.download = `appointments-${new Date().toISOString().slice(0, 10)}.csv`;
    el.click();
    URL.revokeObjectURL(url);
  };

  const patients = patientsData.map((p) => ({ id: p.id, name: `${p.first_name} ${p.last_name}` }));
  const assignments = assignmentsData.map((a) => ({
    id: a.id,
    label: `Dr. ${a.user.first_name} ${a.user.last_name} — ${a.department.name}${a.room ? ` (${a.room.name})` : ""}`,
  }));

  const columns = useMemo<ColumnDef<Appointment>[]>(
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
        id: "patient",
        header: t("appointments.colPatient"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="font-medium text-text">{row.original.patient?.first_name} {row.original.patient?.last_name}</span>
          </div>
        ),
      },
      {
        id: "assignment",
        header: t("appointments.colAssignment"),
        cell: ({ row }) => {
          const a = row.original.assignment;
          if (!a) return null;
          return (
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span className="text-secondary text-sm">Dr. {a.user?.first_name} {a.user?.last_name}</span>
              </div>
              <div className="flex items-center gap-1.5 ml-5">
                <Building2 className="w-3 h-3 text-text-muted shrink-0" />
                <span className="text-xs bg-info-50 text-info-600 px-1.5 py-0.5 rounded font-medium">{a.department?.name}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "dateTime",
        header: t("appointments.colDateTime"),
        cell: ({ row }) => {
          const dt = new Date(row.original.dateTime);
          return (
            <div className="flex items-center gap-1.5 text-secondary text-xs">
              <CalendarIcon className="w-3 h-3 text-text-muted" />
              <span>{dt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
              <span className="font-mono">{dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: t("appointments.colStatus"),
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_STYLES[status] ?? "bg-surface-hover text-secondary"}`}>
              {status}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("common.actions")}</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Can method="PATCH" path="/api/appointments/:id">
              <button
                onClick={() => handleEdit(row.original)}
                className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
            </Can>
            <Can method="DELETE" path="/api/appointments/:id">
              <button
                onClick={() => handleDelete(row.original.id)}
                disabled={isDeleting && deletingId === row.original.id}
                className="p-1 rounded-md hover:bg-red-50 text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                title="Delete"
              >
                {isDeleting && deletingId === row.original.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </Can>
          </div>
        ),
      },
    ],
    [isDeleting, deletingId, t, handleEdit, handleDelete],
  );

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto w-full">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-text tracking-tight">{t("appointments.title")}</h2>
          <p className="text-secondary text-sm mt-0.5">{t("appointments.description")}</p>
        </div>

        <div className="flex items-center gap-2">
          {filterOpen && (
            <input
              autoFocus
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={t("common.filterPlaceholder")}
              className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent w-48"
            />
          )}
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="bg-surface border border-border text-secondary hover:bg-surface-hover px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            {t("common.filter")}
          </button>
          <button
            onClick={handleExport}
            className="bg-surface border border-border text-secondary hover:bg-surface-hover px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            {t("common.export")}
          </button>
          <Can method="POST" path="/api/appointments">
            <button
              onClick={handleAdd}
              className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("appointments.newAppointment")}
            </button>
          </Can>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        {isLoading ? (
          <div className="bg-surface border border-border rounded-lg h-48 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
          </div>
        ) : (
          <DataTable columns={columns} data={filteredAppointments} />
        )}
      </motion.div>

      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={editingAppointment ? t("appointments.editTitle") : t("appointments.newAppointment")}
        description={editingAppointment ? t("appointments.editDesc") : t("appointments.newDesc")}
      >
        <AppointmentForm
          initialData={
            editingAppointment
              ? {
                  patientId: editingAppointment.patientId,
                  assignmentId: editingAppointment.assignmentId,
                  dateTime: new Date(editingAppointment.dateTime).toISOString().slice(0, 16),
                  status: editingAppointment.status,
                }
              : undefined
          }
          patients={patients}
          assignments={assignments}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsSheetOpen(false)}
          isPending={isAdding || isUpdating}
        />
      </Sheet>
    </div>
  );
}
