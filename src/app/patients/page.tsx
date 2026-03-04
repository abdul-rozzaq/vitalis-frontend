"use client";

import { PatientForm } from "@/components/patients/patient-form";
import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Download, Edit, Eye, Filter, Loader2, MoreVertical, Plus } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  gender: "male" | "female";
  birth_date: string | null;
  // address?: string;
}

export default function PatientsPage() {
  const queryClient = useQueryClient();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const { data: patientsData = [], isLoading: isLoadingPatients } = useQuery({
    queryKey: ["patients"],
    queryFn: () => api.get("/patients").then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: addPatient } = useMutation({
    mutationFn: (data: any) => api.post("/patients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  const { mutateAsync: updatePatient } = useMutation({
    mutationFn: (data: any) => api.patch(`/patients/${editingPatient?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  const handleAddPatient = () => {
    setEditingPatient(null);
    setIsSheetOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setIsSheetOpen(true);
  };

  const handleFormSubmit = (data: any) => {
    console.log("Form submitted:", data);

    if (editingPatient) {
      updatePatient(data).then(() => {
        setIsSheetOpen(false);
        setEditingPatient(null);
      });
    } else {
      addPatient(data).then(() => {
        setIsSheetOpen(false);
      });
    }
  };

  const columns = useMemo<ColumnDef<Patient>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Patient ID",
        cell: ({ row, table }) => {
          const pageIndex = table.getState().pagination.pageIndex;
          const pageSize = table.getState().pagination.pageSize;

          return <span className="font-medium text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded text-xs">{pageIndex * pageSize + row.index + 1}</span>;
        },
      },
      {
        accessorFn: (row: Patient) => `${row.first_name} ${row.last_name}`,
        id: "name",
        header: "Name",
        cell: (info: any) => <span className="font-medium text-text-primary">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "gender",
        header: "Gender",
        cell: (info: any) => <span className="capitalize">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "birth_date",
        header: "Birth Date",
        cell: (info: any) => <span className="text-text-secondary text-sm">{info.getValue() ? new Date(info.getValue()).toLocaleDateString() : "N/A"}</span>,
      },
      {
        accessorKey: "phone_number",
        header: "Phone Number",
        cell: (info: any) => <span className="text-text-secondary font-mono text-xs">{info.getValue() as string}</span>,
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Can method="GET" path={`/api/patients/:id`}>
              <Link href={`/patients/${row.original.id}`}>
                <button className="p-1 rounded-md hover:bg-surface-hover text-text-secondary transition-colors cursor-pointer" title="View Patient">
                  <Eye className="w-4 h-4" />
                </button>
              </Link>
            </Can>
            <Can method="PUT" path={`/api/patients/:id`}>
              <button
                onClick={() => handleEditPatient(row.original)}
                className="p-1 rounded-md hover:bg-surface-hover text-text-secondary transition-colors cursor-pointer"
                title="Edit Patient"
              >
                <Edit className="w-4 h-4" />
              </button>
            </Can>
            <Can method="DELETE" path={`/api/patients/:id`}>
              <button className="p-1 rounded-md hover:bg-surface-hover text-text-secondary transition-colors cursor-pointer">
                <MoreVertical className="w-4 h-4" />
              </button>
            </Can>
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
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">Patients</h2>
          <p className="text-text-secondary text-sm mt-0.5">Manage and view your patient directory.</p>
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
          <Can method="POST" path={`/api/patients`}>
            <button
              onClick={handleAddPatient}
              className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Patient
            </button>
          </Can>
        </div>
      </motion.div>

      {/* Main Table Content */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        {isLoadingPatients ? (
          <div className="bg-surface border border-border rounded-lg h-48 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
          </div>
        ) : (
          <DataTable columns={columns} data={patientsData} />
        )}
      </motion.div>

      {/* Slide-over Sheet */}
      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={editingPatient ? "Edit Patient" : "Add New Patient"}
        description={editingPatient ? "Modify details for an existing patient entry." : "Create a new entry in your patient directory."}
      >
        <PatientForm
          initialData={
            editingPatient
              ? {
                ...editingPatient,
                birth_date: editingPatient.birth_date ?? undefined,
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
