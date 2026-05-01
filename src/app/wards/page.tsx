"use client";

import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { WardCheckInModal } from "@/components/wards/ward-checkin-modal";
import { WardEditModal } from "@/components/wards/ward-edit-modal";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { BedDouble, Calendar, CalendarCheck, Clock, Edit, Filter, Loader2, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

interface Ward {
  id: string;
  wardNumber: string | null;
  checkIn: string;
  expectedOut: string | null;
  actualOut: string | null;
  daysStayed: number | null;
  status: "OCCUPIED" | "VACATED";
  note: string | null;
  patient: { id: string; first_name: string; last_name: string };
  room: { id: string; name: string };
}

export default function WardsPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [filterText, setFilterText] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editingWard, setEditingWard] = useState<Ward | null>(null);

  const { data: wardsData = [], isLoading } = useQuery<Ward[]>({
    queryKey: ["wards"],
    queryFn: () => api.get("/wards").then((res) => res.data.data ?? res.data),
    refetchOnWindowFocus: false,
  });

  // Detail for single ward
  const { data: wardDetail, isLoading: isDetailLoading } = useQuery<Ward>({
    queryKey: ["ward", detailId],
    queryFn: () => api.get(`/wards/${detailId}`).then((res) => res.data),
    enabled: !!detailId,
  });

  const { mutate: checkOut, isPending: isCheckingOut } = useMutation({
    mutationFn: (id: string) => api.patch(`/wards/${id}/check-out`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wards"] });
      setCheckingOutId(null);
      if (detailId) queryClient.invalidateQueries({ queryKey: ["ward", detailId] });
    },
  });

  const filtered = useMemo(
    () =>
      filterText.trim()
        ? wardsData.filter((w) =>
          `${w.patient.first_name} ${w.patient.last_name}`
            .toLowerCase()
            .includes(filterText.toLowerCase()),
        )
        : wardsData,
    [wardsData, filterText],
  );

  const handleCheckOut = (id: string) => {
    if (confirm(t("wards.checkOutConfirm"))) {
      setCheckingOutId(id);
      checkOut(id);
    }
  };

  const columns = useMemo<ColumnDef<Ward>[]>(
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
        id: "patient",
        header: t("wards.colPatient"),
        cell: ({ row }) => (
          <button
            onClick={() => setDetailId(row.original.id)}
            className="font-medium text-text hover:text-primary transition-colors text-left"
          >
            {row.original.patient.first_name} {row.original.patient.last_name}
          </button>
        ),
      },
      {
        id: "room",
        header: t("wards.colRoom"),
        cell: ({ row }) => (
          <span className="text-secondary text-sm">{row.original.room.name}</span>
        ),
      },
      {
        accessorKey: "wardNumber",
        header: t("wards.colWardNumber"),
        cell: (info: any) => (
          <span className="text-sm">{info.getValue() ?? "—"}</span>
        ),
      },
      {
        accessorKey: "checkIn",
        header: t("wards.colCheckIn"),
        cell: (info: any) => (
          <span className="text-sm text-secondary">
            {new Date(info.getValue()).toLocaleDateString()}
          </span>
        ),
      },
      {
        accessorKey: "expectedOut",
        header: t("wards.colExpectedOut"),
        cell: (info: any) => (
          <span className="text-sm text-secondary">
            {info.getValue() ? new Date(info.getValue()).toLocaleDateString() : "—"}
          </span>
        ),
      },
      {
        accessorKey: "daysStayed",
        header: t("wards.colDays"),
        cell: (info: any) => (
          <span className="text-sm">{info.getValue() ?? "—"}</span>
        ),
      },
      {
        accessorKey: "status",
        header: t("wards.colStatus"),
        cell: (info: any) => {
          const val = info.getValue() as string;
          return (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${val === "OCCUPIED"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
                }`}
            >
              {val === "OCCUPIED" ? t("wards.statusOccupied") : t("wards.statusVacated")}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("common.actions")}</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Can roles={["ADMIN", "DOCTOR", "HAMSHIRA", "KASSIR"]}>
              <button
                onClick={() => setEditingWard(row.original)}
                className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer"
                title={t("common.edit")}
              >
                <Edit className="w-4 h-4" />
              </button>
            </Can>
            <Can roles={["ADMIN", "DOCTOR", "HAMSHIRA"]}>
              {row.original.status === "OCCUPIED" && (
                <button
                  onClick={() => handleCheckOut(row.original.id)}
                  disabled={isCheckingOut && checkingOutId === row.original.id}
                  className="p-1 rounded-md hover:bg-red-50 text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                  title={t("wards.checkOut")}
                >
                  {isCheckingOut && checkingOutId === row.original.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </Can>
          </div>
        ),
      },
    ],
    [t, isCheckingOut, checkingOutId],
  );

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        <div>
          <h2 className="text-xl font-semibold text-text tracking-tight">
            {t("wards.title")}
          </h2>
          <p className="text-secondary text-sm mt-0.5">{t("wards.description")}</p>
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
          <Can roles={["ADMIN", "DOCTOR", "HAMSHIRA"]}>
            <button
              onClick={() => setCheckInOpen(true)}
              className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("wards.checkIn")}
            </button>
          </Can>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        {isLoading ? (
          <div className="bg-surface border border-border rounded-lg h-48 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
          </div>
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </motion.div>

      {/* Ward Detail Sheet */}
      <Sheet
        isOpen={!!detailId}
        onClose={() => setDetailId(null)}
        title={t("wards.detailTitle")}
        description={t("wards.detailDescription")}
        className="max-w-md"
      >
        {isDetailLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
          </div>
        ) : wardDetail ? (
          <div className="space-y-5">
            {/* Status badge */}
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${wardDetail.status === "OCCUPIED"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
                  }`}
              >
                {wardDetail.status === "OCCUPIED"
                  ? t("wards.statusOccupied")
                  : t("wards.statusVacated")}
              </span>
            </div>

            {/* Patient info */}
            <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                {t("wards.colPatient")}
              </h4>
              <p className="text-text font-medium">
                {wardDetail.patient.first_name} {wardDetail.patient.last_name}
              </p>
            </div>

            {/* Room & ward number */}
            <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                {t("wards.colRoom")}
              </h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BedDouble className="w-4 h-4 text-primary" />
                  <span className="text-text font-medium">{wardDetail.room.name}</span>
                </div>
                {wardDetail.wardNumber && (
                  <span className="text-sm text-secondary">
                    #{wardDetail.wardNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                {t("wards.dates")}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-secondary">
                    <Calendar className="w-3.5 h-3.5" />
                    {t("wards.colCheckIn")}
                  </div>
                  <span className="text-text">
                    {new Date(wardDetail.checkIn).toLocaleDateString()}
                  </span>
                </div>
                {wardDetail.expectedOut && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-secondary">
                      <CalendarCheck className="w-3.5 h-3.5" />
                      {t("wards.colExpectedOut")}
                    </div>
                    <span className="text-text">
                      {new Date(wardDetail.expectedOut).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {wardDetail.actualOut && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-secondary">
                      <CalendarCheck className="w-3.5 h-3.5" />
                      {t("wards.actualOut")}
                    </div>
                    <span className="text-text">
                      {new Date(wardDetail.actualOut).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {wardDetail.daysStayed !== null && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-secondary">
                      <Clock className="w-3.5 h-3.5" />
                      {t("wards.colDays")}
                    </div>
                    <span className="text-text font-medium">{wardDetail.daysStayed}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Note */}
            {wardDetail.note && (
              <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                  {t("wards.note")}
                </h4>
                <p className="text-sm text-secondary">{wardDetail.note}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Can roles={["ADMIN", "DOCTOR", "HAMSHIRA", "KASSIR"]}>
                <button
                  onClick={() => {
                    setEditingWard(wardDetail);
                    setDetailId(null);
                  }}
                  className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  {t("common.edit")}
                </button>
              </Can>
              <Can roles={["ADMIN", "DOCTOR", "HAMSHIRA"]}>
                {wardDetail.status === "OCCUPIED" && (
                  <button
                    onClick={() => {
                      setDetailId(null);
                      handleCheckOut(wardDetail.id);
                    }}
                    className="flex-1 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t("wards.checkOut")}
                  </button>
                )}
              </Can>
            </div>
          </div>
        ) : null}
      </Sheet>

      <WardCheckInModal
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
      />

      <WardEditModal
        ward={editingWard}
        onClose={() => setEditingWard(null)}
      />
    </div>
  );
}