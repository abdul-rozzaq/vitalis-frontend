"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { Can } from "@/components/ui/can";
import { EnterpriseDataTable } from "@/components/ui/enterprise-data-table";
import { Sheet } from "@/components/ui/sheet";
import { AppointmentForm } from "@/features/appointments/components/appointment-form";
import { Appointment, AppointmentFormPayload, Assignment, Patient } from "@/features/appointments/types";
import { CASE_STATUS_STYLES, filterAppointmentsByPatientName, getAppointmentStatus, toAssignmentOptions, toPatientOptions } from "@/features/appointments/utils";
import { api } from "@/shared/lib/api";
import { exportToExcel } from "@/shared/lib/export-excel";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Building2, Calendar as CalendarIcon, Download, Edit, ExternalLink, Loader2, Plus, Stethoscope, Trash2, User } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

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
    mutationFn: (data: AppointmentFormPayload) => api.post("/appointments", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  const { mutateAsync: updateAppointment, isPending: isUpdating } = useMutation({
    mutationFn: (data: AppointmentFormPayload) => api.patch(`/appointments/${editingAppointment?.id}`, data),
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

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm(t("appointments.deleteConfirm"))) {
        setDeletingId(id);
        deleteAppointment(id);
      }
    },
    [deleteAppointment, t],
  );

  const handleFormSubmit = (data: AppointmentFormPayload) => {
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

  const filteredAppointments = useMemo(() => filterAppointmentsByPatientName(appointmentsData ?? [], filterText), [appointmentsData, filterText]);

  const handleExport = () => {
    const appts = appointmentsData ?? [];
    const headers = [t("appointments.colPatient"), t("appointments.colAssignment"), t("appointments.colDateTime"), t("appointments.colStatus")];
    const rows = appts.map((a: Appointment) => [
      `${a.patient?.first_name ?? ""} ${a.patient?.last_name ?? ""}`.trim(),
      a.assignment ? `${a.assignment.user?.first_name} ${a.assignment.user?.last_name} — ${a.assignment.department?.name}` : "",
      a.dateTime ? new Date(a.dateTime).toLocaleString() : "",
      a.caseStep?.case?.status ?? "",
    ]);
    exportToExcel("appointments", headers, rows, t("appointments.title"));
  };

  const patients = useMemo(() => toPatientOptions(patientsData), [patientsData]);
  const assignments = useMemo(() => toAssignmentOptions(assignmentsData), [assignmentsData]);

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
            <span className="font-medium text-text">
              {row.original.patient?.first_name} {row.original.patient?.last_name}
            </span>
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
                <span className="text-secondary text-sm">
                  Dr. {a.user?.first_name} {a.user?.last_name}
                </span>
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
        id: "caseStatus",
        header: t("appointments.colStatus"),
        cell: ({ row }) => {
          const status = getAppointmentStatus(row.original);
          if (!status) return <span className="text-[10px] text-secondary">—</span>;
          let displayStatus = status;
          try {
            displayStatus = t(`appointments.status.${status.toLowerCase()}`);
          } catch (e) {
            displayStatus = status;
          }
          return <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${CASE_STATUS_STYLES[status] ?? "bg-surface-hover text-secondary"}`}>{displayStatus}</span>;
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("common.actions")}</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Link href={`/appointments/${row.original.id}`} className="p-1 rounded-md hover:bg-surface-hover text-secondary hover:text-primary transition-colors" title={t("appointments.viewDetails")}>
              <ExternalLink className="w-4 h-4" />
            </Link>
            <Can roles={["ADMIN", "KASSIR"]}>
              <button onClick={() => handleEdit(row.original)} className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer" title="Edit">
                <Edit className="w-4 h-4" />
              </button>
            </Can>
            <Can roles={["ADMIN"]}>
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
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={t("appointments.title")}
        subtitle={t("appointments.description")}
        actions={
          <div className="flex gap-2">
            <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-hover transition-colors text-sm font-medium">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <Can roles={["ADMIN", "KASSIR"]}>
              <button onClick={handleAdd} className="flex items-center gap-2 px-3 py-2 bg-primary text-white hover:bg-primary rounded-lg transition-colors text-sm font-medium">
                <Plus className="w-4 h-4" />
                <span>{t("appointments.newAppointment")}</span>
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
          <EnterpriseDataTable columns={columns} data={filteredAppointments} pageSize={20} searchKey="patient" searchPlaceholder={t("common.filterPlaceholder")} />
        )}
      </PageContent>

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
                  // status: editingAppointment.status,
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
