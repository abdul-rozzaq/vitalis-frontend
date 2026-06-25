"use client";

import { RoomForm } from "@/features/assignments/components/room-form";
import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { Room, RoomPayload } from "@/features/assignments/types";
import { asArray, getTableRowIndex } from "@/features/assignments/utils";
import { formatDateShort as formatShortDate } from "@/shared/lib/formatters";
import { api } from "@/shared/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
  BedDouble,
  Building2,
  ChevronDown,
  Clock,
  Edit,
  Filter,
  Loader2,
  Plus,
  Trash2,
  User,
  Users,
  X
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";

interface RoomWithOccupancy extends Room {
  occupiedCount: number;
  freeSlots: number;
  freeCount: number;
  isFull: boolean;
}

interface WardPatient {
  id: string;
  checkIn: string;
  expectedOut: string | null;
  daysStayed: number | null;
  companionsCount: number;
  status: "OCCUPIED" | "VACATED";
  note: string | null;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    birth_date: string;
    blood_type: string;
  };
  room: {
    id: string;
    name: string;
    roomType: string;
    capacity: number | null;
    department: { id: string; name: string } | null;
  };
}

type FilterStatus = "" | "OCCUPIED" | "VACATED";

export default function AssignmentsRoomsPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();

  const [sheet, setSheet] = useState<{ open: boolean; editing: Room | null }>({
    open: false,
    editing: null,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Ward bemorlar filter
  const [wardFilter, setWardFilter] = useState<FilterStatus>("");
  const [wardFilterOpen, setWardFilterOpen] = useState(false);

  const { data: roomsRaw, isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => api.get("/rooms").then((r) => r.data as unknown),
    refetchOnWindowFocus: false,
  });

  const rooms = asArray<RoomWithOccupancy>(roomsRaw);

  const { data: roomDetail, isLoading: isDetailLoading } = useQuery<RoomWithOccupancy>({
    queryKey: ["room", detailId],
    queryFn: () => api.get(`/rooms/${detailId}`).then((r) => r.data),
    enabled: !!detailId,
  });

  // Xonadagi bemorlar — faqat WARD tipli xona tanlanganda
  const { data: roomWards = [], isLoading: isWardsLoading } = useQuery<WardPatient[]>({
    queryKey: ["room-wards", detailId],
    queryFn: () =>
      api.get(`/wards/room/${detailId}`).then((r) => {
        const d = r.data;
        return Array.isArray(d) ? d : (d?.data ?? []);
      }),
    enabled: !!detailId && roomDetail?.roomType === "WARD",
  });

  const filteredWards = useMemo(() => {
    if (!wardFilter) return roomWards;
    return roomWards.filter((w) => w.status === wardFilter);
  }, [roomWards, wardFilter]);

  const { mutateAsync: createRoom, isPending: creatingRoom } = useMutation({
    mutationFn: (data: RoomPayload) => api.post("/rooms", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });

  const { mutateAsync: updateRoom, isPending: updatingRoom } = useMutation({
    mutationFn: (data: RoomPayload) => api.patch(`/rooms/${sheet.editing?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      if (sheet.editing) queryClient.invalidateQueries({ queryKey: ["room", sheet.editing.id] });
    },
  });

  const { mutateAsync: deleteRoom, isPending: deletingRoom } = useMutation({
    mutationFn: (id: string) => api.delete(`/rooms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setDeletingId(null);
    },
  });

  const handleOpenDetail = (id: string) => {
    setDetailId(id);
    setWardFilter("");
    setWardFilterOpen(false);
  };

  const columns = useMemo<ColumnDef<RoomWithOccupancy>[]>(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: ({ row, table }) => (
          <span className="font-medium text-primary bg-primary-50 px-1.5 py-0.5 rounded text-xs">
            {getTableRowIndex(
              table.getState().pagination.pageIndex,
              table.getState().pagination.pageSize,
              row.index,
            )}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: t("assignments.colRoom"),
        cell: ({ row }) => (
          <button
            onClick={() => handleOpenDetail(row.original.id)}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 text-sm font-medium hover:bg-primary-100 transition-colors"
          >
            <BedDouble className="w-3.5 h-3.5" />
            {row.original.name}
          </button>
        ),
      },
      {
        accessorKey: "roomType",
        header: t("forms.roomType"),
        cell: ({ row }) => {
          const labels: Record<string, string> = {
            WARD: t("forms.roomTypeWard"),
            EXAMINATION: t("forms.roomTypeExamination"),
            OPERATION: t("forms.roomTypeOperation"),
          };
          return (
            <span className="text-secondary text-sm">
              {labels[row.original.roomType] ?? row.original.roomType}
            </span>
          );
        },
      },
      {
        accessorKey: "capacity",
        header: t("forms.capacity"),
        cell: ({ row }) => (
          <span className="text-secondary text-sm">{row.original.capacity ?? "—"}</span>
        ),
      },
      {
        id: "occupancy",
        header: t("assignments.colOccupancy"),
        cell: ({ row }) => {
          const r = row.original;
          if (r.roomType !== "WARD" || !r.capacity)
            return <span className="text-secondary text-sm">—</span>;
          const pct = Math.min(100, (r.occupiedCount / r.capacity) * 100);
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-border rounded-full h-1.5 max-w-20">
                <div
                  className={`h-1.5 rounded-full transition-all ${r.isFull ? "bg-red-500" : "bg-success"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span
                className={`text-xs font-medium ${r.isFull ? "text-red-600" : "text-secondary"}`}
              >
                {r.occupiedCount}/{r.capacity}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "description",
        header: t("common.description"),
        cell: ({ row }) => (
          <span className="text-secondary text-sm">{row.original.description || "—"}</span>
        ),
      },
      {
        id: "department",
        header: t("forms.department"),
        cell: ({ row }) => {
          const r = row.original;
          if (r.roomType !== "WARD" || !r.department)
            return <span className="text-secondary text-sm">—</span>;
          return (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
              <Building2 className="w-3 h-3" />
              {r.department.name}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: t("common.created"),
        cell: ({ row }) => (
          <span className="text-text-muted text-xs">{formatShortDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("common.actions")}</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Can roles={["ADMIN"]}>
              <button
                onClick={() => setSheet({ open: true, editing: row.original })}
                className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer"
                title={t("common.edit")}
              >
                <Edit className="w-4 h-4" />
              </button>
            </Can>
            <Can roles={["ADMIN"]}>
              <button
                onClick={() => {
                  if (confirm(t("department.confirmDeleteRoom"))) {
                    setDeletingId(row.original.id);
                    void deleteRoom(row.original.id);
                  }
                }}
                disabled={deletingRoom && deletingId === row.original.id}
                className="p-1 rounded-md hover:bg-red-50 text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                title={t("common.delete")}
              >
                {deletingRoom && deletingId === row.original.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </Can>
          </div>
        ),
      },
    ],
    [deletingId, deletingRoom, deleteRoom, t],
  );

  const isSheetLoading = creatingRoom || updatingRoom;

  const bloodTypeLabel = (bt: string) =>
    bt?.replace("_POSITIVE", "+").replace("_NEGATIVE", "-") ?? "—";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Can roles={["ADMIN"]}>
          <button
            onClick={() => setSheet({ open: true, editing: null })}
            className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("assignments.newRoom")}
          </button>
        </Can>
      </div>

      {isLoading ? (
        <div className="bg-surface border border-border rounded-lg h-48 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
        </div>
      ) : (
        <DataTable columns={columns} data={rooms} />
      )}

      {/* Room Detail Sheet */}
      <Sheet
        isOpen={!!detailId}
        onClose={() => setDetailId(null)}
        title={t("assignments.roomDetail")}
        description={t("assignments.roomDetailDesc")}
        className="max-w-lg"
      >
        {isDetailLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
          </div>
        ) : roomDetail ? (
          <div className="space-y-4">
            {/* Xona nomi va tur */}
            <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BedDouble className="w-4 h-4 text-primary" />
                  <h4 className="text-base font-semibold text-text">{roomDetail.name}</h4>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-medium">
                  {roomDetail.roomType}
                </span>
              </div>
              {roomDetail.description && (
                <p className="text-sm text-secondary">{roomDetail.description}</p>
              )}
            </div>

            {/* Sig'im statistikasi — faqat WARD */}
            {roomDetail.roomType === "WARD" && roomDetail.capacity && (
              <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                  {t("assignments.colOccupancy")}
                </h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-surface-hover rounded-lg p-2">
                    <p className="text-xl font-bold text-text">{roomDetail.capacity}</p>
                    <p className="text-xs text-secondary mt-0.5">{t("forms.capacity")}</p>
                  </div>
                  <div className="bg-surface-hover rounded-lg p-2">
                    <p className="text-xl font-bold text-red-500">{roomDetail.occupiedCount}</p>
                    <p className="text-xs text-secondary mt-0.5">{t("assignments.occupied")}</p>
                  </div>
                  <div className="bg-surface-hover rounded-lg p-2">
                    <p className="text-xl font-bold text-success">{roomDetail.freeSlots ?? roomDetail.freeCount}</p>
                    <p className="text-xs text-secondary mt-0.5">{t("assignments.free")}</p>
                  </div>
                </div>
                <div className="bg-border rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${roomDetail.isFull ? "bg-red-500" : "bg-success"}`}
                    style={{
                      width: `${Math.min(100, (roomDetail.occupiedCount / roomDetail.capacity) * 100)}%`,
                    }}
                  />
                </div>
                {roomDetail.isFull && (
                  <p className="text-xs text-red-600 font-medium text-center">
                    {t("wards.roomFull")}
                  </p>
                )}
              </div>
            )}

            {/* Bemorlar ro'yxati — faqat WARD */}
            {roomDetail.roomType === "WARD" && (
              <div className="bg-surface border border-border rounded-lg overflow-hidden">
                {/* Header + filter */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                    {t("wards.colPatient")}
                    {roomWards.length > 0 && (
                      <span className="ml-1.5 bg-primary-50 text-primary-700 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                        {filteredWards.length}
                      </span>
                    )}
                  </h4>
                  {/* Status filter */}
                  <div className="relative">
                    <button
                      onClick={() => setWardFilterOpen((v) => !v)}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-colors ${wardFilter
                          ? "bg-primary-50 border-primary-200 text-primary"
                          : "bg-background border-border text-secondary hover:bg-surface-hover"
                        }`}
                    >
                      <Filter className="w-3 h-3" />
                      {wardFilter
                        ? wardFilter === "OCCUPIED"
                          ? t("wards.statusOccupied")
                          : t("wards.statusVacated")
                        : t("wards.allStatuses")}
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${wardFilterOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {wardFilterOpen && (
                      <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg z-10 w-36 overflow-hidden">
                        {(["", "OCCUPIED", "VACATED"] as FilterStatus[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              setWardFilter(s);
                              setWardFilterOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-surface-hover ${wardFilter === s ? "text-primary font-medium" : "text-secondary"
                              }`}
                          >
                            {s === ""
                              ? t("wards.allStatuses")
                              : s === "OCCUPIED"
                                ? t("wards.statusOccupied")
                                : t("wards.statusVacated")}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bemorlar */}
                {isWardsLoading ? (
                  <div className="flex items-center justify-center h-20">
                    <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
                  </div>
                ) : filteredWards.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-20 gap-1">
                    <BedDouble className="w-5 h-5 text-secondary" />
                    <p className="text-xs text-secondary">{t("wards.noWards")}</p>
                    {wardFilter && (
                      <button
                        onClick={() => setWardFilter("")}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> {t("common.reset")}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredWards.map((ward) => {
                      const days =
                        ward.status === "OCCUPIED"
                          ? Math.max(
                            1,
                            Math.ceil(
                              (Date.now() - new Date(ward.checkIn).getTime()) / 86400000,
                            ),
                          )
                          : (ward.daysStayed ?? 1);

                      return (
                        <div key={ward.id} className="px-4 py-3 hover:bg-surface-hover transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            {/* Bemor ismi — bosganda patient sahifasiga o'tadi */}
                            <Link
                              href={`/patients/${ward.patient.id}`}
                              className="flex items-center gap-2 group flex-1 min-w-0"
                            >
                              <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
                                <User className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-text group-hover:text-primary transition-colors truncate">
                                  {ward.patient.first_name} {ward.patient.last_name}
                                </p>
                                <p className="text-xs text-secondary truncate">
                                  {ward.patient.phone_number} · {bloodTypeLabel(ward.patient.blood_type)}
                                </p>
                              </div>
                            </Link>

                            {/* Status badge */}
                            <span
                              className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${ward.status === "OCCUPIED"
                                  ? "bg-success-100 text-success"
                                  : "bg-gray-100 text-gray-500"
                                }`}
                            >
                              {ward.status === "OCCUPIED"
                                ? t("wards.statusOccupied")
                                : t("wards.statusVacated")}
                            </span>
                          </div>

                          {/* Meta: kun + qarovchilar */}
                          <div className="flex items-center gap-3 mt-1.5 ml-9">
                            <span className="flex items-center gap-1 text-xs text-secondary">
                              <Clock className="w-3 h-3" />
                              {days} {t("wards.currentDay")}
                            </span>
                            {ward.companionsCount > 0 && (
                              <span className="flex items-center gap-1 text-xs text-secondary">
                                <Users className="w-3 h-3" />
                                {ward.companionsCount} {t("wards.person")}
                              </span>
                            )}
                            {ward.expectedOut && ward.status === "OCCUPIED" && (
                              <span
                                className={`text-xs ${new Date(ward.expectedOut) < new Date()
                                    ? "text-red-500 font-medium"
                                    : "text-secondary"
                                  }`}
                              >
                                → {new Date(ward.expectedOut).toLocaleDateString("uz-UZ")}
                                {new Date(ward.expectedOut) < new Date() && " ⚠️"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Meta info */}
            <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                {t("common.info")}
              </h4>
              <div className="flex justify-between text-sm">
                <span className="text-secondary">{t("forms.capacity")}</span>
                <span className="text-text">{roomDetail.capacity ?? "—"}</span>
              </div>
              {roomDetail.roomType === "WARD" && roomDetail.department && (
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">{t("forms.department")}</span>
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                    <Building2 className="w-3 h-3" />
                    {roomDetail.department.name}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-secondary">{t("common.created")}</span>
                <span className="text-text">{formatShortDate(roomDetail.createdAt)}</span>
              </div>
            </div>

            {/* Tugmalar */}
            <Can roles={["ADMIN"]}>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setSheet({ open: true, editing: roomDetail });
                    setDetailId(null);
                  }}
                  className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  {t("common.edit")}
                </button>
                <button
                  onClick={() => {
                    if (confirm(t("department.confirmDeleteRoom"))) {
                      setDetailId(null);
                      setDeletingId(roomDetail.id);
                      void deleteRoom(roomDetail.id);
                    }
                  }}
                  className="flex-1 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t("common.delete")}
                </button>
              </div>
            </Can>
          </div>
        ) : null}
      </Sheet>

      {/* Create/Edit Room Sheet */}
      <Sheet
        isOpen={sheet.open}
        onClose={() => setSheet({ open: false, editing: null })}
        title={sheet.editing ? t("assignments.editRoom") : t("assignments.newRoom")}
        description={
          sheet.editing ? t("assignments.editRoomDesc") : t("assignments.newRoomDesc")
        }
        className="max-w-lg"
      >
        <RoomForm
          key={sheet.editing?.id ?? "new-room"}
          initialData={
            sheet.editing
              ? {
                  name: sheet.editing.name,
                  roomType: sheet.editing.roomType,
                  capacity: sheet.editing.capacity ?? undefined,
                  floor: sheet.editing.floor ?? undefined,
                  description: sheet.editing.description ?? "",
                  departmentId: sheet.editing.department?.id ?? "",
                }
              : undefined
          }
          onSubmit={(data) => {
            const action = sheet.editing ? updateRoom(data) : createRoom(data);
            void action.then(() => setSheet({ open: false, editing: null }));
          }}
          onCancel={() => setSheet({ open: false, editing: null })}
          isLoading={isSheetLoading}
        />
      </Sheet>
    </div>
  );
}