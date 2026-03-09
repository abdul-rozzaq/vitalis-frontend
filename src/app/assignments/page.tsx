"use client";

import { AssignmentForm, type AssignmentFormValues } from "@/components/assignments/assignment-form";
import { PermissionsEditor } from "@/components/assignments/permissions-editor";
import { RoleForm } from "@/components/assignments/role-form";
import { RoomForm } from "@/components/assignments/room-form";
import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { BedDouble, Building2, Calendar, CheckCircle2, Clock, DoorOpen, Edit, KeyRound, Loader2, Plus, Shield, Trash2, User, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface Room {
  id: string;
  name: string;
  capacity: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface Assignment {
  id: string;
  userId: string;
  departmentId: string;
  roomId?: string;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  user?: { id: string; first_name: string; last_name: string; role: Role };
  department?: { id: string; name: string };
  room?: { id: string; name: string };
  schedules?: Schedule[];
  createdAt: string;
}

interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  assignmentId: string;
}

const DAY_LABELS: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
};

const ROLE_STYLES: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: "bg-purple-100", text: "text-purple-700" },
  DOCTOR: { bg: "bg-blue-100", text: "text-blue-700" },
  NURSE: { bg: "bg-green-100", text: "text-green-700" },
  RECEPTIONIST: { bg: "bg-amber-100", text: "text-amber-700" },
};

// ─── Shared button styles ──────────────────────────────────────────────────────

const TAB_BASE = "px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer";
const TAB_ACTIVE = "bg-primary text-white shadow-sm shadow-primary-600/20";
const TAB_IDLE = "text-secondary hover:bg-surface-hover hover:text-text";

// ─── Tabs ──────────────────────────────────────────────────────────────────────

type TabId = "assignments" | "rooms" | "roles" | "permissions" | "schedule";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "assignments", label: "Assignments", icon: User },
  { id: "rooms", label: "Rooms", icon: DoorOpen },
  { id: "roles", label: "Roles", icon: Shield },
  { id: "permissions", label: "Permissions", icon: KeyRound },
  { id: "schedule", label: "Schedule", icon: Calendar },
];

// ─── Weekly Schedule View ──────────────────────────────────────────────────────

function WeeklySchedule({ assignments }: { assignments: Assignment[] }) {
  const days = [1, 2, 3, 4, 5, 6, 7];
  const fullDayLabels: Record<number, string> = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
    7: "Sunday",
  };

  const byDay: Record<number, { assignment: Assignment; schedule: Schedule }[]> = {};

  days.forEach((d) => (byDay[d] = []));

  assignments.forEach((a) => {
    (a.schedules ?? []).forEach((s) => {
      if (byDay[s.dayOfWeek]) {
        byDay[s.dayOfWeek].push({ assignment: a, schedule: s });
      }
    });
  });

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {days.map((d) => (
          <div
            key={d}
            className={`px-3 py-2.5 text-xs font-semibold text-center border-r last:border-r-0 border-border ${d >= 6 ? "text-danger-600 bg-danger-50/30" : "text-secondary bg-background"}`}
          >
            {fullDayLabels[d]}
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-7 divide-x divide-border min-h-[320px]`}>
        {days.map((d) => (
          <div key={d} className={`p-2 space-y-1.5 ${d >= 6 ? "bg-background/40" : ""}`}>
            {byDay[d].length === 0 && (
              <div className="h-full flex items-center justify-center">
                <span className="text-xs text-text-muted">—</span>
              </div>
            )}
            {byDay[d].map(({ assignment, schedule }) => {
              const roleStyle = ROLE_STYLES[assignment.user?.role.name ?? ""] ?? { bg: "bg-gray-100", text: "text-gray-700" };
              
              return (
                <div key={schedule.id} className={`rounded-md p-2 ${roleStyle.bg} space-y-1`}>
                  <p className={`text-[11px] font-semibold leading-tight ${roleStyle.text} truncate`}>
                    {assignment.user?.first_name} {assignment.user?.last_name}
                  </p>
                  <div className="flex items-center gap-1">
                    <Clock className={`w-2.5 h-2.5 ${roleStyle.text} shrink-0`} />
                    <p className={`text-[10px] ${roleStyle.text} opacity-80`}>
                      {schedule.startTime}–{schedule.endTime}
                    </p>
                  </div>
                  {assignment.room && (
                    <div className="flex items-center gap-1">
                      <DoorOpen className={`w-2.5 h-2.5 ${roleStyle.text} shrink-0`} />
                      <p className={`text-[10px] ${roleStyle.text} opacity-80 truncate`}>{assignment.room.name}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AssignmentsPage() {
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<TabId>("assignments");

  // Sheet state
  const [roomSheet, setRoomSheet] = useState<{ open: boolean; editing: Room | null }>({ open: false, editing: null });
  const [roleSheet, setRoleSheet] = useState<{ open: boolean; editing: Role | null }>({ open: false, editing: null });
  const [assignSheet, setAssignSheet] = useState<{ open: boolean; editing: Assignment | null }>({ open: false, editing: null });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: roomsRaw, isLoading: loadingRooms } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => api.get("/rooms").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const { data: rolesRaw, isLoading: loadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.get("/roles").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const { data: assignmentsRaw, isLoading: loadingAssignments } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => api.get("/assignments").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const { data: usersRaw } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get("/users").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const { data: departmentsRaw } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const rooms: Room[] = Array.isArray(roomsRaw) ? roomsRaw : [];
  const roles: Role[] = Array.isArray(rolesRaw) ? rolesRaw : [];
  const assignments: Assignment[] = Array.isArray(assignmentsRaw) ? assignmentsRaw : [];
  const users = usersRaw ?? [];
  const departments = departmentsRaw ?? [];

  // ── Room mutations ────────────────────────────────────────────────────────────

  const { mutateAsync: createRoom, isPending: creatingRoom } = useMutation({
    mutationFn: (d: any) => api.post("/rooms", d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });

  const { mutateAsync: updateRoom, isPending: updatingRoom } = useMutation({
    mutationFn: (d: any) => api.patch(`/rooms/${roomSheet.editing?.id}`, d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });

  const { mutateAsync: deleteRoom, isPending: deletingRoom } = useMutation({
    mutationFn: (id: string) => api.delete(`/rooms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setDeletingId(null);
    },
  });

  // ── Role mutations ────────────────────────────────────────────────────────────

  const { mutateAsync: createRole, isPending: creatingRole } = useMutation({
    mutationFn: (d: any) => api.post("/roles", d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });

  const { mutateAsync: updateRole, isPending: updatingRole } = useMutation({
    mutationFn: (d: any) => api.patch(`/roles/${roleSheet.editing?.id}`, d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });

  const { mutateAsync: deleteRole, isPending: deletingRole } = useMutation({
    mutationFn: (id: string) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setDeletingId(null);
    },
  });

  // ── Assignment mutations ──────────────────────────────────────────────────────

  const { mutateAsync: createAssignment, isPending: creatingAssignment } = useMutation({
    mutationFn: (d: any) => api.post("/assignments", d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assignments"] }),
  });

  const { mutateAsync: updateAssignment, isPending: updatingAssignment } = useMutation({
    mutationFn: (d: any) => api.patch(`/assignments/${assignSheet.editing?.id}`, d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assignments"] }),
  });

  const { mutateAsync: deleteAssignment, isPending: deletingAssignment } = useMutation({
    mutationFn: (id: string) => api.delete(`/assignments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      setDeletingId(null);
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleRoomSubmit = (data: any) => {
    const action = roomSheet.editing ? updateRoom(data) : createRoom(data);
    action.then(() => setRoomSheet({ open: false, editing: null }));
  };

  const handleRoleSubmit = (data: any) => {
    const action = roleSheet.editing ? updateRole(data) : createRole(data);
    action.then(() => setRoleSheet({ open: false, editing: null }));
  };

  const handleAssignSubmit = (data: AssignmentFormValues) => {
    const action = assignSheet.editing ? updateAssignment(data) : createAssignment(data);
    action.then(() => setAssignSheet({ open: false, editing: null }));
  };

  // ── Role columns ──────────────────────────────────────────────────────────────

  const roleColumns = useMemo<ColumnDef<Role>[]>(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: ({ row, table }) => (
          <span className="font-medium text-primary bg-primary-50 px-1.5 py-0.5 rounded text-xs">
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "Role",
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
        header: "Description",
        cell: (info: any) => <span className="text-secondary text-sm">{info.getValue() ?? <span className="text-text-muted italic">—</span>}</span>,
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: (info: any) => (
          <span className="text-secondary text-sm">{new Date(info.getValue()).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Can method="PATCH" path="/api/roles/:id">
              <button
                onClick={() => setRoleSheet({ open: true, editing: row.original })}
                className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer"
                title="Edit Role"
              >
                <Edit className="w-4 h-4" />
              </button>
            </Can>
            <Can method="DELETE" path="/api/roles/:id">
              <button
                onClick={() => {
                  if (confirm(`Delete role "${row.original.name}"?`)) {
                    setDeletingId(row.original.id);
                    deleteRole(row.original.id);
                  }
                }}
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
    [deletingRole, deletingId],
  );

  // ── Columns ───────────────────────────────────────────────────────────────────

  const roomColumns = useMemo<ColumnDef<Room>[]>(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: ({ row, table }) => (
          <span className="font-medium text-primary bg-primary-50 px-1.5 py-0.5 rounded text-xs">
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "Room",
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
        header: "Capacity",
        cell: (info: any) => (
          <div className="flex items-center gap-1.5 text-secondary text-sm">
            <BedDouble className="w-3.5 h-3.5" />
            <span>{info.getValue()}</span>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: (info: any) => (
          <span className="text-secondary text-sm">{new Date(info.getValue()).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Can method="PATCH" path="/api/rooms/:id">
              <button
                onClick={() => setRoomSheet({ open: true, editing: row.original })}
                className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer"
                title="Edit Room"
              >
                <Edit className="w-4 h-4" />
              </button>
            </Can>
            <Can method="DELETE" path="/api/rooms/:id">
              <button
                onClick={() => {
                  if (confirm("Delete this room?")) {
                    setDeletingId(row.original.id);
                    deleteRoom(row.original.id);
                  }
                }}
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
    [deletingRoom, deletingId],
  );


  const assignmentColumns = useMemo<ColumnDef<Assignment>[]>(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: ({ row, table }) => (
          <span className="font-medium text-primary bg-primary-50 px-1.5 py-0.5 rounded text-xs">
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + row.index + 1}
          </span>
        ),
      },
      {
        id: "employee",
        header: "Employee",
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
        header: "Department",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-secondary text-sm">
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            {row.original.department?.name ?? "—"}
          </div>
        ),
      },
      {
        id: "room",
        header: "Room",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-secondary text-sm">
            <DoorOpen className="w-3.5 h-3.5 shrink-0" />
            {row.original.room?.name ?? <span className="text-text-muted italic">Not assigned</span>}
          </div>
        ),
      },
      {
        id: "schedule",
        header: "Schedule",
        cell: ({ row }) => {
          const schedules = row.original.schedules ?? [];
          if (schedules.length === 0) return <span className="text-text-muted text-xs italic">No schedule</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {schedules.map((s) => (
                <span key={s.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary-50 text-primary-700 rounded text-[10px] font-medium">
                  <span>{DAY_LABELS[s.dayOfWeek]}</span>
                  <span className="opacity-60">
                    {s.startTime}–{s.endTime}
                  </span>
                </span>
              ))}
            </div>
          );
        },
      },
      {
        id: "isActive",
        header: "Status",
        cell: ({ row }) =>
          row.original.isActive ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
              <CheckCircle2 className="w-3 h-3" /> Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
              <XCircle className="w-3 h-3" /> Inactive
            </span>
          ),
      },
      {
        id: "startDate",
        header: "Period",
        cell: ({ row }) => {
          const start = new Date(row.original.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          const end = row.original.endDate ? new Date(row.original.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "ongoing";
          return (
            <span className="text-secondary text-xs">
              {start} → {end}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Can method="PATCH" path="/api/assignments/:id">
              <button
                onClick={() => setAssignSheet({ open: true, editing: row.original })}
                className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer"
                title="Edit Assignment"
              >
                <Edit className="w-4 h-4" />
              </button>
            </Can>
            <Can method="DELETE" path="/api/assignments/:id">
              <button
                onClick={() => {
                  if (confirm("Delete this assignment?")) {
                    setDeletingId(row.original.id);
                    deleteAssignment(row.original.id);
                  }
                }}
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
    [deletingAssignment, deletingId],
  );

  // ─────────────────────────────────────────────────────────────────────────────

  const isTableLoading = tab === "rooms" ? loadingRooms : tab === "roles" ? loadingRoles : tab === "permissions" ? false : loadingAssignments;

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto w-full">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-text tracking-tight">Assignments</h2>
          <p className="text-secondary text-sm mt-0.5">Manage staff assignments, rooms and weekly schedules.</p>
        </div>

        {/* Add button per tab */}
        {tab === "rooms" && (
          <Can method="POST" path="/api/rooms">
            <button
              onClick={() => setRoomSheet({ open: true, editing: null })}
              className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Room
            </button>
          </Can>
        )}
        {tab === "roles" && (
          <Can method="POST" path="/api/roles">
            <button
              onClick={() => setRoleSheet({ open: true, editing: null })}
              className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Role
            </button>
          </Can>
        )}
        {tab === "assignments" && (
          <Can method="POST" path="/api/assignments">
            <button
              onClick={() => setAssignSheet({ open: true, editing: null })}
              className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              New Assignment
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
        {TABS.map(({ id, label, icon: Icon }) => (
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
        ) : tab === "assignments" ? (
          <DataTable columns={assignmentColumns} data={assignments} />
        ) : (
          // Weekly schedule view
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-text-muted">
              {Object.entries(ROLE_STYLES).map(([role, s]) => (
                <span key={role} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${s.bg} ${s.text}`}>
                  {role}
                </span>
              ))}
              <span className="ml-auto">Showing {assignments.filter((a) => a.isActive).length} active assignments</span>
            </div>
            <WeeklySchedule assignments={assignments.filter((a) => a.isActive)} />
          </div>
        )}
      </motion.div>

      {/* ── Room Sheet ─────────────────────────────────────────────────────────── */}
      <Sheet
        isOpen={roomSheet.open}
        onClose={() => setRoomSheet({ open: false, editing: null })}
        title={roomSheet.editing ? "Edit Room" : "Add New Room"}
        description={roomSheet.editing ? "Update room information." : "Create a new room in the facility."}
      >
        <RoomForm
          key={roomSheet.editing?.id ?? "new-room"}
          initialData={
            roomSheet.editing
              ? {
                  name: roomSheet.editing.name,
                  capacity: roomSheet.editing.capacity,
                  description: roomSheet.editing.description,
                }
              : undefined
          }
          onSubmit={handleRoomSubmit}
          onCancel={() => setRoomSheet({ open: false, editing: null })}
          isLoading={creatingRoom || updatingRoom}
        />
      </Sheet>

      {/* ── Role Sheet ─────────────────────────────────────────────────────────── */}
      <Sheet
        isOpen={roleSheet.open}
        onClose={() => setRoleSheet({ open: false, editing: null })}
        title={roleSheet.editing ? "Edit Role" : "Add New Role"}
        description={roleSheet.editing ? "Update role information." : "Create a new role for staff members."}
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
          onCancel={() => setRoleSheet({ open: false, editing: null })}
          isLoading={creatingRole || updatingRole}
        />
      </Sheet>

      {/* ── Assignment Sheet ──────────────────────────────────────────────────── */}
      <Sheet
        isOpen={assignSheet.open}
        onClose={() => setAssignSheet({ open: false, editing: null })}
        title={assignSheet.editing ? "Edit Assignment" : "New Assignment"}
        description={assignSheet.editing ? "Update this assignment." : "Assign an employee to a department and room with a schedule."}
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
                  startDate: assignSheet.editing.startDate?.slice(0, 10),
                  endDate: assignSheet.editing.endDate?.slice(0, 10),
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
          onCancel={() => setAssignSheet({ open: false, editing: null })}
          isLoading={creatingAssignment || updatingAssignment}
        />
      </Sheet>
    </div>
  );
}
