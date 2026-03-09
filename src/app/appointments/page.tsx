"use client";

import { AppointmentForm } from "@/components/appointments/appointment-form";
import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Building2, Calendar as CalendarIcon, Download, Edit, Filter, Loader2, Plus, Stethoscope, Trash2, User } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

interface Appointment {
  id: string;
  dateTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  patient: { id: string; first_name: string; last_name: string };
  patientId: string;
  doctor: { id: string; first_name: string; last_name: string };
  doctorId: string;
  department: { id: string; name: string };
  departmentId: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
}

interface Department {
  id: string;
  name: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-warning-50 text-warning-600",
  CONFIRMED: "bg-primary-50 text-primary",
  CANCELLED: "bg-danger-50 text-danger-600",
  COMPLETED: "bg-info-50 text-info-600",
};

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const { data: employeesData = [] } = useQuery<Doctor[]>({
    queryKey: ["users"],
    queryFn: () => api.get("/users").then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const { data: departmentsData = [] } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((res) => res.data),
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

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsSheetOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this appointment?")) {
      setDeletingId(id);
      deleteAppointment(id);
    }
  };

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

  const patients = patientsData.map((p) => ({ id: p.id, name: `${p.first_name} ${p.last_name}` }));
  const doctors = employeesData.map((e) => ({ id: e.id, name: `${e.first_name} ${e.last_name}` }));

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
        header: "Patient",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="font-medium text-text">{row.original.patient?.first_name} {row.original.patient?.last_name}</span>
          </div>
        ),
      },
      {
        id: "doctor",
        header: "Doctor",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Stethoscope className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="text-secondary">{row.original.doctor?.first_name} {row.original.doctor?.last_name}</span>
          </div>
        ),
      },
      {
        id: "department",
        header: "Department",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="text-xs bg-info-50 text-info-600 px-1.5 py-0.5 rounded font-medium">{row.original.department?.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "dateTime",
        header: "Date & Time",
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
        header: "Status",
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
        header: () => <div className="text-right">Actions</div>,
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
    [isDeleting, deletingId],
  );

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto w-full">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-text tracking-tight">Appointments</h2>
          <p className="text-secondary text-sm mt-0.5">Schedule and manage patient bookings.</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="bg-surface border border-border text-secondary hover:bg-surface-hover px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
          <button className="bg-surface border border-border text-secondary hover:bg-surface-hover px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <Can method="POST" path="/api/appointments">
            <button
              onClick={handleAdd}
              className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              New Appointment
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
          <DataTable columns={columns} data={appointmentsData ?? []} />
        )}
      </motion.div>

      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={editingAppointment ? "Edit Appointment" : "New Appointment"}
        description={editingAppointment ? "Update the appointment details." : "Book a new appointment for a patient."}
      >
        <AppointmentForm
          initialData={
            editingAppointment
              ? {
                  patientId: editingAppointment.patientId,
                  doctorId: editingAppointment.doctorId,
                  departmentId: editingAppointment.departmentId,
                  dateTime: new Date(editingAppointment.dateTime).toISOString().slice(0, 16),
                  status: editingAppointment.status,
                }
              : undefined
          }
          patients={patients}
          doctors={doctors}
          departments={departmentsData}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsSheetOpen(false)}
          isPending={isAdding || isUpdating}
        />
      </Sheet>
    </div>
  );
}
