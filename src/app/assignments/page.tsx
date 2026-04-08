"use client";

import { AssignmentForm, type AssignmentFormValues } from "@/components/assignments/assignment-form";
import { PermissionsEditor } from "@/components/assignments/permissions-editor";
import { RoleForm } from "@/components/assignments/role-form";
import { RoomForm } from "@/components/assignments/room-form";
import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import {
  Assignment,
  DepartmentOption,
  Role,
  RolePayload,
  Room,
  RoomPayload,
  SheetState,
  TabId,
  UserOption,
} from "@/features/assignments/types";
import {
  ROLE_STYLES,
  TAB_ACTIVE,
  TAB_BASE,
  TAB_IDLE,
  asArray,
  formatShortDate,
  getAssignmentTabs,
  getTableRowIndex,
} from "@/features/assignments/utils";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { BedDouble, Building2, CheckCircle2, DoorOpen, Edit, ExternalLink, Loader2, Plus, Shield, Trash2, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AssignmentsPage() {
  const queryClient = useQueryClient();
  const t = useTranslations();

  const tabs = useMemo(() => getAssignmentTabs(t), [t]);

  const [tab, setTab] = useState<TabId>("assignments");

  const [roomSheet, setRoomSheet] = useState<SheetState<Room>>({ open: false, editing: null });
  const [roleSheet, setRoleSheet] = useState<SheetState<Role>>({ open: false, editing: null });
  const [assignSheet, setAssignSheet] = useState<SheetState<Assignment>>({ open: false, editing: null });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: roomsRaw, isLoading: loadingRooms } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => api.get("/rooms").then((r) => r.data as unknown),
    refetchOnWindowFocus: false,
  });

  const { data: rolesRaw, isLoading: loadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.get("/roles").then((r) => r.data as unknown),
    refetchOnWindowFocus: false,
  });

  const { data: assignmentsRaw, isLoading: loadingAssignments } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => api.get("/assignments").then((r) => r.data as unknown),
    refetchOnWindowFocus: false,
  });

  const { data: usersRaw } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get("/users").then((r) => r.data as unknown),
    refetchOnWindowFocus: false,
  });

  const { data: departmentsRaw } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((r) => r.data as unknown),
    refetchOnWindowFocus: false,
  });

  const rooms = asArray<Room>(roomsRaw);
  const roles = asArray<Role>(rolesRaw);
  const assignments = asArray<Assignment>(assignmentsRaw);
  const users = asArray<UserOption>(usersRaw);
  const departments = asArray<DepartmentOption>(departmentsRaw);

  const { mutateAsync: createRoom, isPending: creatingRoom } = useMutation({
    mutationFn: (data: RoomPayload) => api.post("/rooms", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });

  const { mutateAsync: updateRoom, isPending: updatingRoom } = useMutation({
    mutationFn: (data: RoomPayload) => api.patch(`/rooms/${roomSheet.editing?.id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });

  const { mutateAsync: deleteRoom, isPending: deletingRoom } = useMutation({
    mutationFn: (id: string) => api.delete(`/rooms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setDeletingId(null);
    },
  });

  const { mutateAsync: createRole, isPending: creatingRole } = useMutation({
    mutationFn: (data: RolePayload) => api.post("/roles", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });

  const { mutateAsync: updateRole, isPending: updatingRole } = useMutation({
    mutationFn: (data: RolePayload) => api.patch(`/roles/${roleSheet.editing?.id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });

  const { mutateAsync: deleteRole, isPending: deletingRole } = useMutation({
    mutationFn: (id: string) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setDeletingId(null);
    },
  });

  const { mutateAsync: createAssignment, isPending: creatingAssignment } = useMutation({
    mutationFn: (data: AssignmentFormValues) => api.post("/assignments", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assignments"] }),
  });

  const { mutateAsync: updateAssignment, isPending: updatingAssignment } = useMutation({
    mutationFn: (data: AssignmentFormValues) => api.patch(`/assignments/${assignSheet.editing?.id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assignments"] }),
  });

  const { mutateAsync: deleteAssignment, isPending: deletingAssignment } = useMutation({
    mutationFn: (id: string) => api.delete(`/assignments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      setDeletingId(null);
    },
  });

  const openRoomSheet = useCallback((room: Room | null) => {
    setRoomSheet({ open: true, editing: room });
  }, []);

  const openRoleSheet = useCallback((role: Role | null) => {
    setRoleSheet({ open: true, editing: role });
  }, []);

  const openAssignmentSheet = useCallback((assignment: Assignment | null) => {
    setAssignSheet({ open: true, editing: assignment });
  }, []);

  const closeRoomSheet = useCallback(() => {
    setRoomSheet({ open: false, editing: null });
  }, []);

  const closeRoleSheet = useCallback(() => {
    setRoleSheet({ open: false, editing: null });
  }, []);

  const closeAssignmentSheet = useCallback(() => {
    setAssignSheet({ open: false, editing: null });
  }, []);

  const handleRoomSubmit = useCallback((data: RoomPayload) => {
    const action = roomSheet.editing ? updateRoom(data) : createRoom(data);
    void action.then(closeRoomSheet);
  }, [roomSheet.editing, updateRoom, createRoom, closeRoomSheet]);

  const handleRoleSubmit = useCallback((data: RolePayload) => {
    const action = roleSheet.editing ? updateRole(data) : createRole(data);
    void action.then(closeRoleSheet);
  }, [roleSheet.editing, updateRole, createRole, closeRoleSheet]);

  const handleAssignSubmit = useCallback((data: AssignmentFormValues) => {
    const action = assignSheet.editing ? updateAssignment(data) : createAssignment(data);
    void action.then(closeAssignmentSheet);
  }, [assignSheet.editing, updateAssignment, createAssignment, closeAssignmentSheet]);

  const handleDeleteRole = useCallback((role: Role) => {
    if (confirm(`Delete role "${role.name}"?`)) {
      setDeletingId(role.id);
      void deleteRole(role.id);
    }
  }, [deleteRole]);

  const handleDeleteRoom = useCallback((room: Room) => {
    if (confirm("Delete this room?")) {
      setDeletingId(room.id);
      void deleteRoom(room.id);
    }
  }, [deleteRoom]);

  const handleDeleteAssignment = useCallback((assignment: Assignment) => {
    if (confirm("Delete this assignment?")) {
      setDeletingId(assignment.id);
      void deleteAssignment(assignment.id);
    }
  }, [deleteAssignment]);

  const roleColumns = useMemo<ColumnDef<Role>[]>(
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
        header: t("assignments.colRole"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-purple-600" />
            </div>
            <p className="font-medium text-text text-sm">{row.original.name}</p>
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: t("assignments.colDescription"),
        cell: ({ getValue }) => {
          const value = getValue<string | null | undefined>();
          return <span className="text-secondary text-sm">{value ?? <span className="text-text-muted italic">—</span>}</span>;
        },
      },
      {
        accessorKey: "createdAt",
        header: t("assignments.colCreated"),
        cell: ({ getValue }) => <span className="text-secondary text-sm">{formatShortDate(getValue<string>())}</span>,
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("common.actions")}</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Can method="PATCH" path="/api/roles/:id">
              <button
                onClick={() => openRoleSheet(row.original)}
                className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer"
                title="Edit Role"
              >
                <Edit className="w-4 h-4" />
              </button>
            </Can>
            <Can method="DELETE" path="/api/roles/:id">
              <button
                onClick={() => handleDeleteRole(row.original)}
                disabled={deletingRole && deletingId === row.original.id}
                className="p-1 rounded-md hover:bg-red-50 text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                title="Delete Role"
              >
                {deletingRole && deletingId === row.original.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </Can>
          </div>
        ),
      },
    ],
    [deletingRole, deletingId, t, openRoleSheet, handleDeleteRole],
  );

  const roomColumns = useMemo<ColumnDef<Room>[]>(
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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
              <DoorOpen className="w-4 h-4 text-cyan-600" />
            </div>
            <div>
              <p className="font-medium text-text text-sm">{row.original.name}</p>
              {row.original.description && <p className="text-xs text-secondary truncate max-w-[180px]">{row.original.description}</p>}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "capacity",
        header: t("assignments.colCapacity"),
        cell: ({ row }) =>
          row.original.roomType === "WARD" && row.original.capacity != null ? (
            <div className="flex items-center gap-1.5 text-secondary text-sm">
              <BedDouble className="w-3.5 h-3.5" />
              <span>{row.original.capacity}</span>
            </div>
          ) : (
            <span className="text-xs text-secondary italic">—</span>
          ),
      },
      {
        accessorKey: "createdAt",
        header: t("assignments.colCreated"),
        cell: ({ getValue }) => <span className="text-secondary text-sm">{formatShortDate(getValue<string>())}</span>,
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("common.actions")}</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Can method="PATCH" path="/api/rooms/:id">
              <button
                onClick={() => openRoomSheet(row.original)}
                className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer"
                title="Edit Room"
              >
                <Edit className="w-4 h-4" />
              </button>
            </Can>
            <Can method="DELETE" path="/api/rooms/:id">
              <button
                onClick={() => handleDeleteRoom(row.original)}
                disabled={deletingRoom && deletingId === row.original.id}
                className="p-1 rounded-md hover:bg-red-50 text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                title="Delete Room"
              >
                {deletingRoom && deletingId === row.original.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </Can>
          </div>
        ),
      },
    ],
    [deletingRoom, deletingId, t, openRoomSheet, handleDeleteRoom],
  );


  const assignmentColumns = useMemo<ColumnDef<Assignment>[]>(
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
        id: "employee",
        header: t("assignments.colEmployee"),
        cell: ({ row }) => {
          const u = row.original.user;
          if (!u) return <span className="text-text-muted text-sm">—</span>;
          const style = ROLE_STYLES[u.role.name] ?? { bg: "bg-gray-100", text: "text-gray-700" };
          return (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-semibold shrink-0">
                {u.first_name[0]}
                {u.last_name[0]}
              </div>
              <div>
                <p className="font-medium text-text text-sm">
                  {u.first_name} {u.last_name}
                </p>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${style.bg} ${style.text}`}>{u.role.name}</span>
              </div>
            </div>
          );
        },
      },
      {
        id: "department",
        header: t("assignments.colDepartment"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-secondary text-sm">
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            {row.original.department?.name ?? "—"}
          </div>
        ),
      },
      {
        id: "room",
        header: t("assignments.colRoom"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-secondary text-sm">
            <DoorOpen className="w-3.5 h-3.5 shrink-0" />
            {row.original.room?.name ?? <span className="text-text-muted italic">{t("assignments.notAssigned")}</span>}
          </div>
        ),
      },
      {
        id: "schedule",
        header: t("assignments.colSchedule"),
        cell: ({ row }) => {
          const schedules = row.original.schedules ?? [];
          if (schedules.length === 0) return <span className="text-text-muted text-xs italic">{t("assignments.noSchedule")}</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {schedules.map((s) => (
                <span key={s.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary-50 text-primary-700 rounded text-[10px] font-medium">
                  {s.startTime}–{s.endTime}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        id: "isActive",
        header: t("assignments.colStatus"),
        cell: ({ row }) =>
          row.original.isActive ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
              <CheckCircle2 className="w-3 h-3" /> {t("assignments.active")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
              <XCircle className="w-3 h-3" /> {t("assignments.inactive")}
            </span>
          ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("common.actions")}</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Link
              href={`/assignments/${row.original.id}`}
              className="p-1 rounded-md hover:bg-surface-hover text-secondary hover:text-primary transition-colors"
              title={t("assignments.viewAssignment")}
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
            <Can method="PATCH" path="/api/assignments/:id">
              <button
                onClick={() => openAssignmentSheet(row.original)}
                className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer"
                title="Edit Assignment"
              >
                <Edit className="w-4 h-4" />
              </button>
            </Can>
            <Can method="DELETE" path="/api/assignments/:id">
              <button
                onClick={() => handleDeleteAssignment(row.original)}
                disabled={deletingAssignment && deletingId === row.original.id}
                className="p-1 rounded-md hover:bg-red-50 text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                title="Delete Assignment"
              >
                {deletingAssignment && deletingId === row.original.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </Can>
          </div>
        ),
      },
    ],
    [deletingAssignment, deletingId, t, openAssignmentSheet, handleDeleteAssignment],
  );

  const isTableLoading = tab === "rooms" ? loadingRooms : tab === "roles" ? loadingRoles : tab === "permissions" ? false : loadingAssignments;

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto w-full">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-text tracking-tight">{t("assignments.title")}</h2>
          <p className="text-secondary text-sm mt-0.5">{t("assignments.description")}</p>
        </div>

        {/* Add button per tab */}
        {tab === "rooms" && (
          <Can method="POST" path="/api/rooms">
            <button
              onClick={() => openRoomSheet(null)}
              className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("assignments.addRoom")}
            </button>
          </Can>
        )}
        {tab === "roles" && (
          <Can method="POST" path="/api/roles">
            <button
              onClick={() => openRoleSheet(null)}
              className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("assignments.addRole")}
            </button>
          </Can>
        )}
        {tab === "assignments" && (
          <Can method="POST" path="/api/assignments">
            <button
              onClick={() => openAssignmentSheet(null)}
              className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("assignments.newAssignment")}
            </button>
          </Can>
        )}
      </motion.div>

      {/* Tab bar */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="flex items-center gap-1 bg-surface border border-border p-1 rounded-xl w-fit"
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`${TAB_BASE} flex items-center gap-2 ${tab === id ? TAB_ACTIVE : TAB_IDLE}`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </motion.div>

      {/* Tab content */}
      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
        {isTableLoading ? (
          <div className="bg-surface border border-border rounded-lg h-48 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
          </div>
        ) : tab === "rooms" ? (
          <DataTable columns={roomColumns} data={rooms} />
        ) : tab === "roles" ? (
          <DataTable columns={roleColumns} data={roles} />
        ) : tab === "permissions" ? (
          <PermissionsEditor roles={roles} loadingRoles={loadingRoles} />
        ) : (
          <DataTable columns={assignmentColumns} data={assignments} />
        )}
      </motion.div>

      {/* ── Room Sheet ─────────────────────────────────────────────────────────── */}
      <Sheet
        isOpen={roomSheet.open}
        onClose={closeRoomSheet}
        title={roomSheet.editing ? t("assignments.editRoomTitle") : t("assignments.addRoomTitle")}
        description={roomSheet.editing ? t("assignments.editRoomDesc") : t("assignments.addRoomDesc")}
      >
        <RoomForm
          key={roomSheet.editing?.id ?? "new-room"}
          initialData={
            roomSheet.editing
              ? {
                name: roomSheet.editing.name,
                capacity: roomSheet.editing.capacity ?? undefined,
                description: roomSheet.editing.description,
              }
              : undefined
          }
          onSubmit={handleRoomSubmit}
          onCancel={closeRoomSheet}
          isLoading={creatingRoom || updatingRoom}
        />
      </Sheet>

      {/* ── Role Sheet ─────────────────────────────────────────────────────────── */}
      <Sheet
        isOpen={roleSheet.open}
        onClose={closeRoleSheet}
        title={roleSheet.editing ? t("assignments.editRoleTitle") : t("assignments.addRoleTitle")}
        description={roleSheet.editing ? t("assignments.editRoleDesc") : t("assignments.addRoleDesc")}
      >
        <RoleForm
          key={roleSheet.editing?.id ?? "new-role"}
          initialData={
            roleSheet.editing
              ? {
                name: roleSheet.editing.name,
                description: roleSheet.editing.description,
              }
              : undefined
          }
          onSubmit={handleRoleSubmit}
          onCancel={closeRoleSheet}
          isLoading={creatingRole || updatingRole}
        />
      </Sheet>

      {/* ── Assignment Sheet ──────────────────────────────────────────────────── */}
      <Sheet
        isOpen={assignSheet.open}
        onClose={closeAssignmentSheet}
        title={assignSheet.editing ? t("assignments.editAssignmentTitle") : t("assignments.newAssignment")}
        description={assignSheet.editing ? t("assignments.editAssignmentDesc") : t("assignments.newAssignmentDesc")}
        className="max-w-lg"
      >
        <AssignmentForm
          key={assignSheet.editing?.id ?? "new-assign"}
          users={users}
          departments={departments}
          rooms={rooms}
          initialData={
            assignSheet.editing
              ? {
                userId: assignSheet.editing.userId,
                departmentId: assignSheet.editing.departmentId,
                roomId: assignSheet.editing.roomId,
                isActive: assignSheet.editing.isActive,
                schedules: assignSheet.editing.schedules?.map((s) => ({
                  dayOfWeek: s.dayOfWeek,
                  startTime: s.startTime,
                  endTime: s.endTime,
                })),
              }
              : undefined
          }
          onSubmit={handleAssignSubmit}
          onCancel={closeAssignmentSheet}
          isLoading={creatingAssignment || updatingAssignment}
        />
      </Sheet>
    </div>
  );
}
