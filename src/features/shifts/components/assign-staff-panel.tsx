"use client";

import { api } from "@/shared/lib/api";
import type { Shift, ShiftStaffMember, ShiftStaffRole } from "@/shared/lib/shifts-api";
import { shiftsApi, SHIFT_ROLE_LABEL } from "@/shared/lib/shifts-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Plus, Search, Stethoscope, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

export function AssignStaffPanel({ shift }: { shift: Shift }) {
  const qc = useQueryClient();
  // Bir nechta ekran shu smenani ko'rsatadi (detal sahifasi, board, ro'yxat) —
  // biriktirishdan keyin hammasini yangilaymiz.
  const invalidate = () => {
    for (const queryKey of [["shift", shift.id], ["shifts"], ["board-shifts"]]) {
      qc.invalidateQueries({ queryKey });
    }
  };

  const { data: users = [] } = useQuery<UserRow[]>({
    queryKey: ["staff-all"],
    queryFn: () => api.get("/users").then((r) => r.data.data ?? r.data),
  });

  const assign = useMutation({
    mutationFn: (v: { userId: string; role: ShiftStaffRole }) => shiftsApi.assignStaff(shift.id, v),
    onSuccess: () => {
      invalidate();
      toast.success("Biriktirildi");
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });
  const unassign = useMutation({
    mutationFn: (userId: string) => shiftsApi.unassignStaff(shift.id, userId),
    onSuccess: () => {
      invalidate();
      toast.success("Olib tashlandi");
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const assignedIds = new Set(shift.staff.map((s) => s.userId));
  const busy = assign.isPending || unassign.isPending;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RoleColumn
          title="Shifokorlar"
          icon={<Stethoscope className="w-4 h-4 text-primary" />}
          required={shift.staffing.requiredDoctors}
          assigned={shift.staff.filter((s) => s.role === "DOCTOR")}
          candidates={users.filter((u) => u.role === "DOCTOR" && !assignedIds.has(u.id))}
          onAdd={(userId) => assign.mutate({ userId, role: "DOCTOR" })}
          onRemove={(userId) => unassign.mutate(userId)}
          busy={busy}
        />
        <RoleColumn
          title="Hamshiralar"
          icon={<Users className="w-4 h-4 text-primary" />}
          required={shift.staffing.requiredNurses}
          assigned={shift.staff.filter((s) => s.role === "HAMSHIRA")}
          candidates={users.filter((u) => u.role === "HAMSHIRA" && !assignedIds.has(u.id))}
          onAdd={(userId) => assign.mutate({ userId, role: "HAMSHIRA" })}
          onRemove={(userId) => unassign.mutate(userId)}
          busy={busy}
        />
      </div>

      <OtherStaffColumn
        assigned={shift.staff.filter((s) => s.role !== "DOCTOR" && s.role !== "HAMSHIRA")}
        candidates={users.filter((u) => u.role !== "DOCTOR" && u.role !== "HAMSHIRA" && !assignedIds.has(u.id))}
        onAdd={(userId, role) => assign.mutate({ userId, role })}
        onRemove={(userId) => unassign.mutate(userId)}
        busy={busy}
      />
    </div>
  );
}

function RoleColumn({
  title,
  icon,
  required,
  assigned,
  candidates,
  onAdd,
  onRemove,
  busy,
}: {
  title: string;
  icon: React.ReactNode;
  required: number;
  assigned: ShiftStaffMember[];
  candidates: UserRow[];
  onAdd: (userId: string) => void;
  onRemove: (userId: string) => void;
  busy: boolean;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => candidates.filter((u) => `${u.first_name} ${u.last_name}`.toLowerCase().includes(q.toLowerCase())),
    [candidates, q],
  );
  const ok = assigned.length >= required;

  return (
    <div className="border border-border rounded-xl bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-2 text-sm font-semibold text-text">
          {icon}
          {title}
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
            ok ? "bg-success-50 text-success border-success-100" : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {assigned.length}/{required}
        </span>
      </div>

      <div className="p-3 space-y-2">
        {assigned.length === 0 && <p className="text-xs text-text-muted text-center py-2">Hali biriktirilmagan</p>}
        {assigned.map((s) => (
          <div key={s.userId} className="flex items-center justify-between bg-background border border-border rounded-lg px-3 py-2">
            <span className="text-sm text-text">
              {s.user.first_name} {s.user.last_name}
            </span>
            <button onClick={() => onRemove(s.userId)} disabled={busy} className="text-text-muted hover:text-danger-600 disabled:opacity-50">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Xodim qidirish…"
            className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {q && (
          <div className="max-h-40 overflow-y-auto border border-border rounded-lg divide-y divide-border">
            {filtered.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-2">Topilmadi</p>
            ) : (
              filtered.slice(0, 20).map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    onAdd(u.id);
                    setQ("");
                  }}
                  disabled={busy}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-text hover:bg-surface-hover disabled:opacity-50"
                >
                  <span>
                    {u.first_name} {u.last_name}
                  </span>
                  <Plus className="w-3.5 h-3.5 text-primary" />
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Shifokor/hamshiradan boshqa barcha rollar (labarant, admin, ...) uchun umumiy panel. */
function OtherStaffColumn({
  assigned,
  candidates,
  onAdd,
  onRemove,
  busy,
}: {
  assigned: ShiftStaffMember[];
  candidates: UserRow[];
  onAdd: (userId: string, role: ShiftStaffRole) => void;
  onRemove: (userId: string) => void;
  busy: boolean;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => candidates.filter((u) => `${u.first_name} ${u.last_name}`.toLowerCase().includes(q.toLowerCase())),
    [candidates, q],
  );

  return (
    <div className="border border-border rounded-xl bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-2 text-sm font-semibold text-text">
          <Briefcase className="w-4 h-4 text-primary" />
          Boshqa xodimlar
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-surface-secondary text-text-muted border-border">
          {assigned.length}
        </span>
      </div>

      <div className="p-3 space-y-2">
        {assigned.length === 0 && <p className="text-xs text-text-muted text-center py-2">Hali biriktirilmagan</p>}
        {assigned.map((s) => (
          <div key={s.userId} className="flex items-center justify-between bg-background border border-border rounded-lg px-3 py-2">
            <span className="text-sm text-text">
              {s.user.first_name} {s.user.last_name}
              <span className="ml-2 text-xs text-text-muted">{SHIFT_ROLE_LABEL[s.role]}</span>
            </span>
            <button onClick={() => onRemove(s.userId)} disabled={busy} className="text-text-muted hover:text-danger-600 disabled:opacity-50">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Xodim qidirish…"
            className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {q && (
          <div className="max-h-40 overflow-y-auto border border-border rounded-lg divide-y divide-border">
            {filtered.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-2">Topilmadi</p>
            ) : (
              filtered.slice(0, 20).map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    onAdd(u.id, u.role as ShiftStaffRole);
                    setQ("");
                  }}
                  disabled={busy}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-text hover:bg-surface-hover disabled:opacity-50"
                >
                  <span>
                    {u.first_name} {u.last_name}
                    <span className="ml-2 text-xs text-text-muted">{SHIFT_ROLE_LABEL[u.role as ShiftStaffRole] ?? u.role}</span>
                  </span>
                  <Plus className="w-3.5 h-3.5 text-primary" />
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
