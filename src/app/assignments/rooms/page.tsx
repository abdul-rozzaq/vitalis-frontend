"use client";

import { RoomForm } from "@/components/assignments/room-form";
import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { Room, RoomPayload } from "@/features/assignments/types";
import { asArray, formatShortDate, getTableRowIndex } from "@/features/assignments/utils";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { BedDouble, Edit, Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

interface RoomWithOccupancy extends Room {
  occupiedCount: number;
  freeCount: number;
  isFull: boolean;
}

export default function AssignmentsRoomsPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();

  const [sheet, setSheet] = useState<{ open: boolean; editing: Room | null }>({ open: false, editing: null });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: roomsRaw, isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => api.get("/rooms").then((r) => r.data as unknown),
    refetchOnWindowFocus: false,
  });

  const rooms = asArray<RoomWithOccupancy>(roomsRaw);

  // Room detail — GET /api/rooms/:id
  const { data: roomDetail, isLoading: isDetailLoading } = useQuery<RoomWithOccupancy>({
    queryKey: ["room", detailId],
    queryFn: () => api.get(`/rooms/${detailId}`).then((r) => r.data),
    enabled: !!detailId,
  });

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

  const columns = useMemo<ColumnDef<RoomWithOccupancy>[]>(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: ({ row, table }) => (
          <span className="font-medium text-primary bg-primary-50 px-1.5 py-0.5 rounded text-xs">
            {getTableRowIndex(table.getState().pagination.pageIndex, table.getState().pagination.pageSize, row.index)}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: t("assignments.colRoom"),
        cell: ({ row }) => (
          <button
            onClick={() => setDetailId(row.original.id)}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 text-sm font-medium hover:bg-primary-100 transition-colors"
          >
            {row.original.name}
          </button>
        ),
      },
      {
        accessorKey: "roomType",
        header: t("forms.roomType"),
        cell: ({ row }) => <span className="text-secondary text-sm">{row.original.roomType}</span>,
      },
      {
        accessorKey: "capacity",
        header: t("forms.capacity"),
        cell: ({ row }) => <span className="text-secondary text-sm">{row.original.capacity ?? "—"}</span>,
      },
      {
        id: "occupancy",
        header: t("assignments.colOccupancy"),
        cell: ({ row }) => {
          const r = row.original;
          if (r.roomType !== "WARD" || !r.capacity) return <span className="text-secondary text-sm">—</span>;
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-border rounded-full h-1.5 max-w-20">
                <div
                  className={`h-1.5 rounded-full transition-all ${r.isFull ? "bg-red-500" : "bg-green-500"}`}
                  style={{ width: `${Math.min(100, (r.occupiedCount / r.capacity) * 100)}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${r.isFull ? "text-red-600" : "text-secondary"}`}>
                {r.occupiedCount}/{r.capacity}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "description",
        header: t("common.description"),
        cell: ({ row }) => <span className="text-secondary text-sm">{row.original.description || "—"}</span>,
      },
      {
        accessorKey: "createdAt",
        header: t("common.created"),
        cell: ({ row }) => <span className="text-text-muted text-xs">{formatShortDate(row.original.createdAt)}</span>,
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
        className="max-w-md"
      >
        {isDetailLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
          </div>
        ) : roomDetail ? (
          <div className="space-y-5">
            {/* Room name & type */}
            <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-semibold text-text">{roomDetail.name}</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-medium">
                  {roomDetail.roomType}
                </span>
              </div>
              {roomDetail.description && (
                <p className="text-sm text-secondary">{roomDetail.description}</p>
              )}
            </div>

            {/* Occupancy — only for WARD type */}
            {roomDetail.roomType === "WARD" && roomDetail.capacity && (
              <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                  {t("assignments.colOccupancy")}
                </h4>
                <div className="flex items-center gap-3">
                  <BedDouble className="w-4 h-4 text-primary" />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-secondary">{t("assignments.occupied")}: <span className="text-text font-medium">{roomDetail.occupiedCount}</span></span>
                      <span className="text-secondary">{t("assignments.free")}: <span className="text-green-600 font-medium">{roomDetail.freeCount}</span></span>
                    </div>
                    <div className="bg-border rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${roomDetail.isFull ? "bg-red-500" : "bg-green-500"}`}
                        style={{ width: `${Math.min(100, (roomDetail.occupiedCount / roomDetail.capacity) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      {roomDetail.occupiedCount}/{roomDetail.capacity} {t("assignments.bedsOccupied")}
                    </p>
                  </div>
                </div>
                {roomDetail.isFull && (
                  <p className="text-xs text-red-600 font-medium">{t("wards.roomFull")}</p>
                )}
              </div>
            )}

            {/* Meta */}
            <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                {t("common.info")}
              </h4>
              <div className="flex justify-between text-sm">
                <span className="text-secondary">{t("forms.capacity")}</span>
                <span className="text-text">{roomDetail.capacity ?? "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary">{t("common.created")}</span>
                <span className="text-text">{formatShortDate(roomDetail.createdAt)}</span>
              </div>
            </div>

            {/* Actions */}
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
        description={sheet.editing ? t("assignments.editRoomDesc") : t("assignments.newRoomDesc")}
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
                description: sheet.editing.description ?? "",
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