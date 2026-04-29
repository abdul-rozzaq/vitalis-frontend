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
import { Edit, Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

export default function AssignmentsRoomsPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();

  const [sheet, setSheet] = useState<{ open: boolean; editing: Room | null }>({ open: false, editing: null });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: roomsRaw, isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => api.get("/rooms").then((r) => r.data as unknown),
    refetchOnWindowFocus: false,
  });

  const rooms = asArray<Room>(roomsRaw);

  const { mutateAsync: createRoom, isPending: creatingRoom } = useMutation({
    mutationFn: (data: RoomPayload) => api.post("/rooms", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });

  const { mutateAsync: updateRoom, isPending: updatingRoom } = useMutation({
    mutationFn: (data: RoomPayload) => api.patch(`/rooms/${sheet.editing?.id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });

  const { mutateAsync: deleteRoom, isPending: deletingRoom } = useMutation({
    mutationFn: (id: string) => api.delete(`/rooms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setDeletingId(null);
    },
  });

  const columns = useMemo<ColumnDef<Room>[]>(
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
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 text-sm font-medium">{row.original.name}</span>
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
              <button onClick={() => setSheet({ open: true, editing: row.original })} className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer" title={t("common.edit")}>
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
                {deletingRoom && deletingId === row.original.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
