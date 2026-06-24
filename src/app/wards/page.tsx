"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { WardCheckInModal } from "@/features/wards/components/ward-checkin-modal";
import { WardEditModal } from "@/features/wards/components/ward-edit-modal";
import { api } from "@/lib/api";
import { formatDateUz } from "@/lib/formatters";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { BedDouble, Calendar, CalendarCheck, ChevronDown, Clock, Edit, Filter, Loader2, Plus, RotateCcw, Trash2, Users, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";

interface Ward {
  id: string;
  checkIn: string;
  expectedOut: string | null;
  actualOut: string | null;
  daysStayed: number | null;
  status: "OCCUPIED" | "VACATED";
  note: string | null;
  companionsCount: number;
  patient: { id: string; first_name: string; last_name: string };
  room: {
    id: string;
    name: string;
    roomType: string;
    capacity?: number | null;
    department?: { id: string; name: string } | null;
  };
}

interface Room {
  id: string;
  name: string;
  roomType: string;
  occupiedCount?: number;
  freeSlots?: number;
  isFull?: boolean;
  capacity?: number | null;
  department?: { id: string; name: string } | null;
}

interface Filters {
  search: string;
  status: "" | "OCCUPIED" | "VACATED";
  roomId: string;
  departmentId: string;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTERS: Filters = {
  search: "",
  status: "",
  roomId: "",
  departmentId: "",
  dateFrom: "",
  dateTo: "",
};

export default function WardsPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editingWard, setEditingWard] = useState<Ward | null>(null);

  const set = <K extends keyof Filters>(key: K, val: Filters[K]) => setFilters((f) => ({ ...f, [key]: val }));

  const hasFilters = Object.values(filters).some((v) => v !== "");

  const { data: wardsRaw = [], isLoading } = useQuery<Ward[]>({
    queryKey: ["wards"],
    queryFn: () =>
      api.get("/wards").then((res) => {
        const d = res.data;
        return Array.isArray(d) ? d : (d?.data ?? []);
      }),
    refetchOnWindowFocus: false,
  });

  const { data: roomsAll = [] } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: () => api.get("/rooms").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const wardRooms = roomsAll.filter((r) => r.roomType === "WARD");

  const { data: wardDetail, isLoading: isDetailLoading } = useQuery<Ward>({
    queryKey: ["ward", detailId],
    queryFn: () => api.get(`/wards/${detailId}`).then((r) => r.data),
    enabled: !!detailId,
  });

  const { mutate: checkOut, isPending: isCheckingOut } = useMutation({
    mutationFn: (id: string) => api.patch(`/wards/${id}/check-out`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wards"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      if (detailId) queryClient.invalidateQueries({ queryKey: ["ward", detailId] });
      setCheckingOutId(null);
      setDetailId(null);
    },
  });

  const handleCheckOut = (id: string) => {
    if (confirm(t("wards.checkOutConfirm"))) {
      setCheckingOutId(id);
      checkOut(id);
    }
  };

  const stats = useMemo(() => {
    const occupied = wardsRaw.filter((w) => w.status === "OCCUPIED").length;
    const vacated = wardsRaw.filter((w) => w.status === "VACATED").length;
    return { occupied, vacated, total: wardsRaw.length };
  }, [wardsRaw]);

  const filtered = useMemo(() => {
    return wardsRaw.filter((w) => {
      if (filters.status && w.status !== filters.status) return false;
      if (filters.roomId && w.room.id !== filters.roomId) return false;
      if (filters.departmentId && w.room.department?.id !== filters.departmentId) return false;
      if (filters.dateFrom && new Date(w.checkIn) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo) {
        const end = new Date(filters.dateTo);
        end.setHours(23, 59, 59);
        if (new Date(w.checkIn) > end) return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const name = `${w.patient.first_name} ${w.patient.last_name}`.toLowerCase();
        const deptName = w.room.department?.name?.toLowerCase() ?? "";
        if (!name.includes(q) && !w.room.name.toLowerCase().includes(q) && !deptName.includes(q)) return false;
      }
      return true;
    });
  }, [wardsRaw, filters]);

  const columns = useMemo<ColumnDef<Ward>[]>(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: ({ row, table }) => {
          const pi = table.getState().pagination.pageIndex;
          const ps = table.getState().pagination.pageSize;
          return <span className="font-medium text-primary bg-primary-50 px-1.5 py-0.5 rounded text-xs">{pi * ps + row.index + 1}</span>;
        },
      },
      {
        id: "patient",
        header: t("wards.colPatient"),
        cell: ({ row }) => (
          <button onClick={() => setDetailId(row.original.id)} className="font-medium text-text hover:text-primary transition-colors text-left">
            {row.original.patient.first_name} {row.original.patient.last_name}
          </button>
        ),
      },
      {
        id: "room",
        header: t("wards.colRoom"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <BedDouble className="w-3.5 h-3.5 text-secondary shrink-0" />
            <span className="text-sm text-secondary">{row.original.room.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "checkIn",
        header: t("wards.colCheckIn"),
        cell: (info: any) => <span className="text-sm text-secondary">{formatDateUz(info.getValue())}</span>,
      },
      {
        accessorKey: "expectedOut",
        header: t("wards.colExpectedOut"),
        cell: (info: any) => {
          const val = info.getValue() as string | null;
          if (!val) return <span className="text-secondary text-sm">—</span>;
          const isOverdue = info.row.original.status === "OCCUPIED" && new Date(val) < new Date();
          return (
            <span className={`text-sm ${isOverdue ? "text-red-500 font-medium" : "text-secondary"}`}>
              {formatDateUz(val)}
              {isOverdue && " ⚠️"}
            </span>
          );
        },
      },
      {
        accessorKey: "actualOut",
        header: t("wards.actualOut"),
        cell: (info: any) => {
          const val = info.getValue() as string | null;
          return <span className="text-sm text-secondary">{val ? formatDateUz(val) : "—"}</span>;
        },
      },
      {
        accessorKey: "daysStayed",
        header: t("wards.colDays"),
        cell: ({ row }) => {
          const w = row.original;
          const days = w.status === "OCCUPIED" ? Math.max(1, Math.ceil((Date.now() - new Date(w.checkIn).getTime()) / 86400000)) : (w.daysStayed ?? "—");
          return (
            <span className={`text-sm font-medium ${w.status === "OCCUPIED" ? "text-primary" : "text-secondary"}`}>
              {days} {w.status === "OCCUPIED" ? t("wards.currentDay") : ""}
            </span>
          );
        },
      },
      {
        accessorKey: "companionsCount",
        header: t("wards.companionsCount"),
        cell: ({ row }) => {
          const count = row.original.companionsCount;
          if (!count) return <span className="text-secondary text-sm">—</span>;
          return (
            <span className="inline-flex items-center gap-1 text-sm text-secondary">
              <Users className="w-3.5 h-3.5" />
              {count}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: t("wards.colStatus"),
        cell: (info: any) => {
          const val = info.getValue() as string;
          return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${val === "OCCUPIED" ? "bg-success-100 text-success" : "bg-gray-100 text-gray-500"}`}>
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
            <Can roles={["ADMIN", "KASSIR", "HAMSHIRA", "DOCTOR"]}>
              <button onClick={() => setEditingWard(row.original)} className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer" title={t("common.edit")}>
                <Edit className="w-4 h-4" />
              </button>
            </Can>
            <Can roles={["ADMIN", "KASSIR", "HAMSHIRA", "DOCTOR"]}>
              {row.original.status === "OCCUPIED" && (
                <button
                  onClick={() => handleCheckOut(row.original.id)}
                  disabled={isCheckingOut && checkingOutId === row.original.id}
                  className="p-1 rounded-md hover:bg-red-50 text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                  title={t("wards.checkOut")}
                >
                  {isCheckingOut && checkingOutId === row.original.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={t("wards.title")}
        subtitle={t("wards.description")}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                hasFilters ? "bg-primary-50 border-primary-200 text-primary" : "border-border text-text-muted hover:text-text hover:bg-surface-hover"
              }`}
            >
              <Filter className="w-4 h-4" />
              {t("common.filter")}
              {hasFilters && <span className="ml-0.5 bg-primary text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center">{Object.values(filters).filter(Boolean).length}</span>}
              <ChevronDown className={`w-3 h-3 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
            </button>
            <Can roles={["ADMIN", "KASSIR", "HAMSHIRA"]}>
              <button onClick={() => setCheckInOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-primary text-white hover:opacity-90 rounded-lg transition-opacity text-sm font-medium">
                <Plus className="w-4 h-4" />
                {t("wards.checkIn")}
              </button>
            </Can>
          </div>
        }
      />

      <PageContent>
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: t("wards.statusOccupied"), value: stats.occupied, color: "text-success" },
            { label: t("wards.statusVacated"), value: stats.vacated, color: "text-text-muted" },
            { label: t("wards.total"), value: stats.total, color: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="bg-surface border border-border rounded-lg p-4">
              <p className="text-sm text-text-muted mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter panel */}
        {filterOpen && (
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => set("search", e.target.value)}
                placeholder={t("common.filterPlaceholder")}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <select
                value={filters.status}
                onChange={(e) => set("status", e.target.value as Filters["status"])}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">{t("wards.allStatuses")}</option>
                <option value="OCCUPIED">{t("wards.statusOccupied")}</option>
                <option value="VACATED">{t("wards.statusVacated")}</option>
              </select>
              <select
                value={filters.departmentId}
                onChange={(e) => set("departmentId", e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">
                  {t("forms.department")}: {t("common.all") ?? "All"}
                </option>
                {Array.from(new Map(wardRooms.filter((r) => r.department).map((r) => [r.department!.id, r.department!])).values()).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                value={filters.roomId}
                onChange={(e) => set("roomId", e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">{t("wards.allRooms")}</option>
                {wardRooms
                  .filter((r) => !filters.departmentId || r.department?.id === filters.departmentId)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </select>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => set("dateFrom", e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => set("dateTo", e.target.value)}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                {hasFilters && (
                  <button
                    onClick={() => setFilters(EMPTY_FILTERS)}
                    className="px-2 py-2 rounded-lg border border-border bg-background text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
                    title={t("common.reset")}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-text-muted mt-2">
              {filtered.length} / {wardsRaw.length} {t("wards.records")}
            </p>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-text-muted animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface border border-border rounded-lg h-48 flex flex-col items-center justify-center gap-2">
            <BedDouble className="w-8 h-8 text-text-muted" />
            <p className="text-text-muted text-sm">{t("wards.noWards")}</p>
            {hasFilters && (
              <button onClick={() => setFilters(EMPTY_FILTERS)} className="text-xs text-primary hover:underline flex items-center gap-1">
                <X className="w-3 h-3" /> {t("common.reset")}
              </button>
            )}
          </div>
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </PageContent>

      {/* Detail Sheet */}
      <Sheet isOpen={!!detailId} onClose={() => setDetailId(null)} title={t("wards.detailTitle")} description={t("wards.detailDescription")} className="max-w-md">
        {isDetailLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
          </div>
        ) : wardDetail ? (
          <div className="space-y-4">
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${wardDetail.status === "OCCUPIED" ? "bg-success-100 text-success" : "bg-gray-100 text-gray-500"}`}>
              {wardDetail.status === "OCCUPIED" ? t("wards.statusOccupied") : t("wards.statusVacated")}
            </span>

            <div className="bg-surface-hover rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{t("wards.colPatient")}</p>
              <Link href={`/patients/${wardDetail.patient.id}`} className="text-text font-semibold text-base hover:text-primary transition-colors">
                {wardDetail.patient.first_name} {wardDetail.patient.last_name}
              </Link>
            </div>

            <div className="bg-surface-hover rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{t("wards.colRoom")}</p>
              <div className="flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-primary" />
                <span className="text-text font-medium">{wardDetail.room.name}</span>
              </div>
              {wardDetail.room.department && <p className="text-xs text-secondary mt-0.5">{wardDetail.room.department.name}</p>}
            </div>

            {wardDetail.companionsCount > 0 && (
              <div className="bg-surface-hover rounded-xl p-4 space-y-1">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{t("wards.companionsCount")}</p>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-text font-medium">
                    {wardDetail.companionsCount} {t("wards.person")}
                  </span>
                </div>
              </div>
            )}

            <div className="bg-surface-hover rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{t("wards.dates")}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-secondary">
                    <Calendar className="w-3.5 h-3.5" /> {t("wards.colCheckIn")}
                  </span>
                  <span className="text-text font-medium">{formatDateUz(wardDetail.checkIn)}</span>
                </div>

                {wardDetail.expectedOut && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-secondary">
                      <CalendarCheck className="w-3.5 h-3.5" /> {t("wards.colExpectedOut")}
                    </span>
                    <span className={`font-medium ${wardDetail.status === "OCCUPIED" && new Date(wardDetail.expectedOut) < new Date() ? "text-red-500" : "text-text"}`}>
                      {formatDateUz(wardDetail.expectedOut)}
                    </span>
                  </div>
                )}

                {wardDetail.actualOut && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-secondary">
                      <CalendarCheck className="w-3.5 h-3.5" /> {t("wards.actualOut")}
                    </span>
                    <span className="text-text font-medium">{formatDateUz(wardDetail.actualOut)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-secondary">
                    <Clock className="w-3.5 h-3.5" /> {t("wards.colDays")}
                  </span>
                  <span className="text-primary font-bold text-base">
                    {wardDetail.status === "OCCUPIED" ? Math.max(1, Math.ceil((Date.now() - new Date(wardDetail.checkIn).getTime()) / 86400000)) : (wardDetail.daysStayed ?? "—")}
                    {wardDetail.status === "OCCUPIED" && <span className="text-xs font-normal text-secondary ml-1">{t("wards.currentDay")}</span>}
                  </span>
                </div>
              </div>
            </div>

            {wardDetail.note && (
              <div className="bg-surface-hover rounded-xl p-4 space-y-1">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{t("wards.note")}</p>
                <p className="text-sm text-secondary">{wardDetail.note}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Can roles={["ADMIN", "KASSIR", "HAMSHIRA", "DOCTOR"]}>
                <button
                  onClick={() => {
                    setEditingWard(wardDetail);
                    setDetailId(null);
                  }}
                  className="flex-1 bg-surface border border-border text-text-muted hover:bg-surface-hover px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  {t("common.edit")}
                </button>
              </Can>
              {wardDetail.status === "OCCUPIED" && (
                <Can roles={["ADMIN", "KASSIR", "HAMSHIRA", "DOCTOR"]}>
                  <button
                    onClick={() => {
                      setDetailId(null);
                      handleCheckOut(wardDetail.id);
                    }}
                    disabled={isCheckingOut}
                    className="flex-1 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {isCheckingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    {t("wards.checkOut")}
                  </button>
                </Can>
              )}
            </div>
          </div>
        ) : null}
      </Sheet>

      <WardCheckInModal open={checkInOpen} onClose={() => setCheckInOpen(false)} />
      <WardEditModal ward={editingWard} onClose={() => setEditingWard(null)} />
    </div>
  );
}
