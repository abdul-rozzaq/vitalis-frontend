"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { APPOINTMENTS_MOCK_DATA } from "@/lib/mock-data";
import { Plus, Download, Filter, Calendar as CalendarIcon } from "lucide-react";
import { motion } from "motion/react";

type Appointment = (typeof APPOINTMENTS_MOCK_DATA)[0];

export default function AppointmentsPage() {
  const columns = useMemo<ColumnDef<Appointment>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Apt. ID",
        cell: (info) => (
          <span className="font-mono text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded text-xs font-medium">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: "patientName",
        header: "Patient",
        cell: (info) => <span className="font-medium text-text-primary">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "doctorName",
        header: "Doctor",
        cell: (info) => <span className="text-text-secondary">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "department",
        header: "Department",
        cell: (info) => <span className="text-xs bg-info-50 text-info-600 px-1.5 py-0.5 rounded font-medium">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: (info) => (
          <div className="flex items-center gap-1.5 text-text-secondary text-xs">
            <CalendarIcon className="w-3 h-3 text-text-muted" />
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: "time",
        header: "Time",
        cell: (info) => <span className="font-mono text-xs text-text-secondary">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: (info) => <span className="text-xs text-text-secondary">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                status === "Confirmed"
                  ? "bg-primary-50 text-primary-600"
                  : status === "Pending"
                    ? "bg-warning-50 text-warning-600"
                    : status === "Cancelled"
                      ? "bg-danger-50 text-danger-600"
                      : "bg-info-50 text-info-600"
              }`}
            >
              {status}
            </span>
          );
        },
      },
    ],
    [],
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
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">Appointments</h2>
          <p className="text-text-secondary text-sm mt-0.5">Schedule and manage patient bookings.</p>
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
          <button className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
            New Appointment
          </button>
        </div>
      </motion.div>

      {/* Main Table Content */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <DataTable columns={columns} data={APPOINTMENTS_MOCK_DATA} />
      </motion.div>
    </div>
  );
}
