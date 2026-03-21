"use client";

import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Download, Edit, Filter, Loader2, MoreVertical, Plus } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useMemo } from "react";

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
  const { t } = useI18n();

  const { data: patientsData = [], isLoading: isLoadingPatients } = useQuery({
    queryKey: ["patients"],
    queryFn: () => api.get("/patients").then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const columns = useMemo<ColumnDef<Patient>[]>(
    () => [
      {
        accessorKey: "id",
        header: t("patients.colId"),
        cell: ({ row, table }) => {
          const pageIndex = table.getState().pagination.pageIndex;
          const pageSize = table.getState().pagination.pageSize;

          return <span className="font-medium text-primary bg-primary-50 px-1.5 py-0.5 rounded text-xs">{pageIndex * pageSize + row.index + 1}</span>;
        },
      },
      {
        accessorFn: (row: Patient) => `${row.first_name} ${row.last_name}`,
        id: "name",
        header: t("patients.colName"),
        cell: ({ row }) => (
          <Link href={`/patients/${row.original.id}`} className="font-medium text-text hover:text-primary transition-colors">
            {row.original.first_name} {row.original.last_name}
          </Link>
        ),
      },
      {
        accessorKey: "gender",
        header: t("patients.colGender"),
        cell: (info: any) => <span className="capitalize">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "birth_date",
        header: t("patients.colBirthDate"),
        cell: (info: any) => <span className="text-secondary text-sm">{info.getValue() ? new Date(info.getValue()).toLocaleDateString() : t("common.na")}</span>,
      },
      {
        accessorKey: "phone_number",
        header: t("patients.colPhone"),
        cell: (info: any) => <span className="text-secondary font-mono text-xs">{info.getValue() as string}</span>,
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("common.actions")}</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Can method="PUT" path={`/api/patients/:id`}>
              <Link href={`/patients/${row.original.id}/edit`}>
                <button className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer" title={t("patients.editPatient")}>
                  <Edit className="w-4 h-4" />
                </button>
              </Link>
            </Can>
            <Can method="DELETE" path={`/api/patients/:id`}>
              <button className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer">
                <MoreVertical className="w-4 h-4" />
              </button>
            </Can>
          </div>
        ),
      },
    ],
    [t],
  );

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto w-full">
      {/* Header Area */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-text tracking-tight">{t("patients.title")}</h2>
          <p className="text-secondary text-sm mt-0.5">{t("patients.description")}</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="bg-surface border border-border text-secondary hover:bg-surface-hover px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
            <Filter className="w-3.5 h-3.5" />
            {t("common.filter")}
          </button>
          <button className="bg-surface border border-border text-secondary hover:bg-surface-hover px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            {t("common.export")}
          </button>
          <Can method="POST" path={`/api/patients`}>
            <Link href="/patients/new">
              <button className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20">
                <Plus className="w-3.5 h-3.5" />
                {t("patients.addPatient")}
              </button>
            </Link>
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

    </div>
  );
}
