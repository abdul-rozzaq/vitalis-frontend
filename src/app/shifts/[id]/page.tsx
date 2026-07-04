"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { Can } from "@/components/ui/can";
import { Sheet } from "@/components/ui/sheet";
import { AssignStaffPanel } from "@/features/shifts/components/assign-staff-panel";
import { ShiftForm } from "@/features/shifts/components/shift-form";
import type { BoardRoom, CreateShiftPayload, Shift } from "@/shared/lib/shifts-api";
import { fmtShiftDay, fmtShiftRange, SHIFT_STATUS_LABEL, SHIFT_STATUS_STYLE, shiftsApi } from "@/shared/lib/shifts-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BedDouble, Edit2, Loader2, Trash2, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ShiftDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: shift, isLoading } = useQuery<Shift>({
    queryKey: ["shift", id],
    queryFn: () => shiftsApi.retrieve(id),
  });

  const { data: board = [] } = useQuery<BoardRoom[]>({
    queryKey: ["shift-board", id],
    queryFn: () => shiftsApi.board(id),
    enabled: !!shift,
  });

  const update = useMutation({
    mutationFn: (data: CreateShiftPayload) => shiftsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shift", id] });
      qc.invalidateQueries({ queryKey: ["shifts"] });
      setEditing(false);
      toast.success("Yangilandi");
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const remove = useMutation({
    mutationFn: () => shiftsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("O'chirildi");
      router.push("/shifts/list");
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  if (isLoading || !shift) {
    return (
      <PageContent>
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-text-muted" />
        </div>
      </PageContent>
    );
  }

  const totalPatients = board.reduce((n, r) => n + r.patients.length, 0);

  return (
    <>
      <PageHeader
        title={shift.department.name}
        subtitle={`${fmtShiftDay(shift.startAt)} · ${fmtShiftRange(shift.startAt, shift.endAt)}`}
        breadcrumbs={[
          { label: "Smenalar", href: "/shifts/list" },
          { label: shift.department.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border self-center ${SHIFT_STATUS_STYLE[shift.status]}`}>
              {SHIFT_STATUS_LABEL[shift.status]}
            </span>
            <Can roles={["ADMIN", "DIREKTOR"]}>
              <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-text hover:bg-surface-hover">
                <Edit2 className="w-4 h-4" /> Tahrirlash
              </button>
              <button
                onClick={() => {
                  if (confirm("Bu smenani o'chirasizmi?")) remove.mutate();
                }}
                className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-danger-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" /> O'chirish
              </button>
            </Can>
          </div>
        }
      />

      <PageContent>
        {shift.note && (
          <div className="text-sm text-text-muted bg-surface border border-border rounded-lg px-4 py-3">{shift.note}</div>
        )}

        <div>
          <h2 className="text-lg font-semibold text-text mb-1">Xodimlar qamrovi</h2>
          <p className="text-sm text-text-muted mb-4">Kerakli va biriktirilgan xodimlar</p>
          <Can roles={["ADMIN", "DIREKTOR"]} fallback={<ReadOnlyStaff shift={shift} />}>
            <AssignStaffPanel shift={shift} />
          </Can>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <BedDouble className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-text">Palatalar va bemorlar</h2>
            <span className="text-sm text-text-muted">· {totalPatients} bemor</span>
          </div>
          {board.length === 0 ? (
            <div className="text-center text-text-muted py-10 bg-surface border border-dashed border-border rounded-xl">
              Bu bo'limda xona yo'q
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {board.map((room) => (
                <div key={room.id} className="border border-border rounded-xl bg-surface overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background">
                    <span className="text-sm font-semibold text-text">{room.name}</span>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {room.patients.length}/{room.capacity}
                    </span>
                  </div>
                  <div className="divide-y divide-border-light">
                    {room.patients.length === 0 ? (
                      <p className="text-xs text-text-muted text-center py-4">Bo'sh</p>
                    ) : (
                      room.patients.map((p) => (
                        <div key={p.wardId} className="px-4 py-2 text-sm text-text">
                          {p.patient.first_name} {p.patient.last_name}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageContent>

      <Sheet isOpen={editing} onClose={() => setEditing(false)} title="Smenani tahrirlash">
        <ShiftForm initial={shift} onSubmit={(p) => update.mutate(p)} onCancel={() => setEditing(false)} loading={update.isPending} />
      </Sheet>
    </>
  );
}

function ReadOnlyStaff({ shift }: { shift: Shift }) {
  const doctors = shift.staff.filter((s) => s.role === "DOCTOR");
  const nurses = shift.staff.filter((s) => s.role === "NURSE");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { title: "Shifokorlar", list: doctors, req: shift.staffing.requiredDoctors },
        { title: "Hamshiralar", list: nurses, req: shift.staffing.requiredNurses },
      ].map((col) => (
        <div key={col.title} className="border border-border rounded-xl bg-surface p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-text">{col.title}</span>
            <span className="text-xs text-text-muted">
              {col.list.length}/{col.req}
            </span>
          </div>
          <div className="space-y-1">
            {col.list.length === 0 ? (
              <p className="text-xs text-text-muted">Biriktirilmagan</p>
            ) : (
              col.list.map((s) => (
                <p key={s.userId} className="text-sm text-text">
                  {s.user.first_name} {s.user.last_name}
                </p>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
