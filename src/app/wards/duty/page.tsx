"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { Sheet } from "@/components/ui/sheet";
import { RoundModal } from "@/features/rooms/components/RoundModal";
import { api } from "@/shared/lib/api";
import type { BoardRoom, PatientCondition, Shift, WardRoundRef } from "@/shared/lib/shifts-api";
import { CONDITION_LABEL, CONDITION_STYLE, fmtShiftRange, shiftsApi } from "@/shared/lib/shifts-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BedDouble, CheckCircle2, ClipboardList, Clock, LogOut, Search, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface RoundPatientRow {
  patientId: string;
  patientName: string;
  currentCondition?: PatientCondition;
}

export default function DutyPage() {
  const { data: shifts = [], isLoading } = useQuery<Shift[]>({
    queryKey: ["my-active-shifts"],
    queryFn: shiftsApi.myActive,
    refetchInterval: 60000,
  });

  return (
    <>
      <PageHeader title="Mening navbatim" subtitle="Joriy smena — palatalar va bemorlar" />
      <PageContent>
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-text-muted">
            <Clock className="w-5 h-5 animate-spin mr-2" />
            Yuklanmoqda...
          </div>
        )}

        {!isLoading && shifts.length === 0 && (
          <div className="text-center text-text-muted py-16 bg-surface border border-dashed border-border rounded-xl">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Hozir navbatda emassiz</p>
            <p className="text-sm mt-1">Faol smena vaqti bo'lganda bu yerda ko'rinadi</p>
          </div>
        )}

        <div className="space-y-6">
          {shifts.map((shift) => (
            <ActiveDutyCard key={shift.id} shift={shift} />
          ))}
        </div>
      </PageContent>
    </>
  );
}

function ActiveDutyCard({ shift }: { shift: Shift }) {
  const qc = useQueryClient();
  const [placeRoom, setPlaceRoom] = useState<{ roomId: string; roomName: string } | null>(null);
  const [round, setRound] = useState<{ roundId: string; patients: RoundPatientRow[] } | null>(null);

  const boardKey = ["shift-board", shift.id];
  const roundsKey = ["shift-rounds", shift.id];

  const { data: board = [] } = useQuery<BoardRoom[]>({
    queryKey: boardKey,
    queryFn: () => shiftsApi.board(shift.id),
    refetchInterval: 30000,
  });
  const { data: rounds = [] } = useQuery<WardRoundRef[]>({
    queryKey: roundsKey,
    queryFn: () => shiftsApi.roundsByShift(shift.id),
  });

  const allPatients = board.flatMap((r) => r.patients);
  const activeRound = rounds.find((r) => !r.completedAt);
  const completedRounds = rounds.filter((r) => r.completedAt);

  // Har bir bemorning oxirgi qayd etilgan holati
  const lastCondition = new Map<string, PatientCondition>();
  completedRounds.forEach((r) => r.patientNotes.forEach((n) => lastCondition.set(n.patientId, n.condition)));

  const checkOut = useMutation({
    mutationFn: (wardId: string) => shiftsApi.checkOut(wardId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKey });
      toast.success("Bemor chiqarildi");
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const startRound = useMutation({
    mutationFn: () => shiftsApi.createRound(shift.id),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: roundsKey });
      openRound(r.id);
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  function openRound(roundId: string) {
    setRound({
      roundId,
      patients: allPatients.map((p) => ({
        patientId: p.patient.id,
        patientName: `${p.patient.first_name} ${p.patient.last_name}`,
        currentCondition: lastCondition.get(p.patient.id),
      })),
    });
  }

  function closeRound() {
    setRound(null);
    qc.invalidateQueries({ queryKey: roundsKey });
    qc.invalidateQueries({ queryKey: boardKey });
  }

  return (
    <div className="border border-border rounded-2xl bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-background gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <BedDouble className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold text-text">{shift.department.name}</h3>
            <p className="text-xs text-text-muted">{fmtShiftRange(shift.startAt, shift.endAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {allPatients.length} bemor
          </span>
          {activeRound ? (
            <button
              onClick={() => openRound(activeRound.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 border border-amber-300 rounded-lg text-xs font-medium hover:bg-amber-200"
            >
              <ClipboardList className="w-3.5 h-3.5" /> Obhodni davom ettirish
            </button>
          ) : (
            <button
              onClick={() => startRound.mutate()}
              disabled={startRound.isPending || allPatients.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              {startRound.isPending ? "..." : "Obhod boshlash"}
            </button>
          )}
        </div>
      </div>

      {/* Staff */}
      <div className="flex items-center gap-4 px-5 py-2.5 bg-surface-hover text-xs text-text-muted border-b border-border flex-wrap">
        <span>
          Shifokorlar:{" "}
          <span className="text-text font-medium">
            {shift.staff.filter((s) => s.role === "DOCTOR").map((s) => `${s.user.first_name} ${s.user.last_name}`).join(", ") || "—"}
          </span>
        </span>
        <span>
          Hamshiralar:{" "}
          <span className="text-text">
            {shift.staff.filter((s) => s.role === "HAMSHIRA").map((s) => `${s.user.first_name} ${s.user.last_name}`).join(", ") || "—"}
          </span>
        </span>
      </div>

      {/* Rooms */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {board.map((room) => (
          <div key={room.id} className="border border-border rounded-xl bg-background overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
              <span className="text-sm font-semibold text-text">{room.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">
                  {room.patients.length}/{room.capacity}
                </span>
                <button
                  onClick={() => setPlaceRoom({ roomId: room.id, roomName: room.name })}
                  disabled={room.patients.length >= room.capacity}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-primary border border-primary/30 rounded-lg hover:bg-primary/10 disabled:opacity-40"
                  title="Bemor yotqizish"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Bemor
                </button>
              </div>
            </div>
            <div className="divide-y divide-border-light">
              {room.patients.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-4">Bo'sh</p>
              ) : (
                room.patients.map((p) => {
                  const cond = lastCondition.get(p.patient.id);
                  return (
                    <div key={p.wardId} className="flex items-center justify-between px-3.5 py-2 group">
                      <div className="min-w-0">
                        <p className="text-sm text-text truncate">
                          {p.patient.first_name} {p.patient.last_name}
                        </p>
                        <p className="text-xs text-text-muted">{p.daysStayed ?? 0} kun</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {cond ? (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CONDITION_STYLE[cond]}`}>{CONDITION_LABEL[cond]}</span>
                        ) : (
                          <span className="text-xs text-text-muted">Obhot yo'q</span>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`${p.patient.first_name} ${p.patient.last_name}ni chiqarasizmi?`)) checkOut.mutate(p.wardId);
                          }}
                          className="p-1 text-text-muted hover:text-danger-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Chiqarish"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Completed rounds */}
      {completedRounds.length > 0 && (
        <div className="px-5 py-3 border-t border-border bg-background">
          <p className="text-xs font-medium text-text-muted mb-2">Yakunlangan obhodlar</p>
          <div className="flex gap-2 flex-wrap">
            {completedRounds.slice(0, 8).map((r) => (
              <span key={r.id} className="flex items-center gap-1 text-xs text-success bg-success-50 border border-success-100 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                {new Date(r.completedAt!).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
              </span>
            ))}
          </div>
        </div>
      )}

      {placeRoom && (
        <PlacePatientSheet
          room={placeRoom}
          onClose={() => setPlaceRoom(null)}
          onPlaced={() => {
            qc.invalidateQueries({ queryKey: boardKey });
            setPlaceRoom(null);
          }}
        />
      )}

      {round && <RoundModal roundId={round.roundId} patients={round.patients} onClose={closeRound} />}
    </div>
  );
}

interface PatientHit {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

function PlacePatientSheet({
  room,
  onClose,
  onPlaced,
}: {
  room: { roomId: string; roomName: string };
  onClose: () => void;
  onPlaced: () => void;
}) {
  const [q, setQ] = useState("");
  const { data: results = [], isFetching } = useQuery<PatientHit[]>({
    queryKey: ["patient-search", q],
    queryFn: () => api.get("/patients", { params: { search: q } }).then((r) => r.data),
    enabled: q.trim().length >= 2,
  });

  const place = useMutation({
    mutationFn: (patientId: string) => shiftsApi.checkIn({ patientId, roomId: room.roomId }),
    onSuccess: () => {
      toast.success("Bemor yotqizildi");
      onPlaced();
    },
    onError: () => toast.error("Yotqizib bo'lmadi"),
  });

  return (
    <Sheet isOpen onClose={onClose} title={`${room.roomName} — bemor yotqizish`} description="Bemorni qidirib tanlang">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ism yoki telefon…"
            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {q.trim().length < 2 ? (
          <p className="text-sm text-text-muted text-center py-6">Kamida 2 ta harf kiriting</p>
        ) : isFetching ? (
          <p className="text-sm text-text-muted text-center py-6">Qidirilmoqda…</p>
        ) : results.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6">Bemor topilmadi</p>
        ) : (
          <div className="border border-border rounded-lg divide-y divide-border">
            {results.slice(0, 30).map((p) => (
              <button
                key={p.id}
                onClick={() => place.mutate(p.id)}
                disabled={place.isPending}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-surface-hover disabled:opacity-50"
              >
                <div>
                  <p className="text-sm font-medium text-text">
                    {p.first_name} {p.last_name}
                  </p>
                  <p className="text-xs text-text-muted font-mono">{p.phone_number}</p>
                </div>
                <UserPlus className="w-4 h-4 text-primary" />
              </button>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}
