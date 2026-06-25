"use client";
import { useTranslations } from "next-intl";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { RoundModal } from "@/features/wards/components/RoundModal";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BedDouble, CheckCircle2, ClipboardList, Clock, Users } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface ActiveShift {
  roomShiftId: string;
  roomShift: {
    id: string;
    name: string;
    startHour: number;
    endHour: number;
  };
  roomId: string;
  room: { id: string; name: string };
  doctorId: string;
  doctor: { id: string; first_name: string; last_name: string };
  nurses: { nurseId: string; nurse: { id: string; first_name: string; last_name: string } }[];
  date: string | null;
  isOverride: boolean;
  assignmentId: string | null;
}

interface WardPatient {
  id: string;
  checkIn: string;
  daysStayed: number | null;
  status: string;
  patient: { id: string; first_name: string; last_name: string };
}

interface WardRound {
  id: string;
  scheduledAt: string;
  completedAt: string | null;
  patientNotes: {
    patientId: string;
    condition: string;
    notes: string | null;
    patient: { id: string; first_name: string; last_name: string };
  }[];
}

const CONDITION_STYLES: Record<string, string> = {
  STABLE: "bg-success-100 text-success",
  IMPROVING: "bg-blue-100 text-blue-700",
  WORSENING: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

const CONDITION_LABELS: Record<string, string> = {
  STABLE: "Barqaror",
  IMPROVING: "Yaxshilanmoqda",
  WORSENING: "Yomonlashmoqda",
  CRITICAL: "Kritik",
};

export default function DutyPage() {
  const t = useTranslations();
  const qc = useQueryClient();
  const [roundModalData, setRoundModalData] = useState<{
    roundId: string;
    patients: { patientId: string; patientName: string; currentCondition?: "STABLE" | "IMPROVING" | "WORSENING" | "CRITICAL" }[];
  } | null>(null);

  const { data: activeShifts = [], isLoading } = useQuery<ActiveShift[]>({
    queryKey: ["active-shifts"],
    queryFn: () => api.get("/shift-assignments/my/active").then((r) => r.data),
    refetchInterval: 60000,
  });

  return (
    <>
      <PageHeader title={t("wards.myDuty")} subtitle="Joriy smena — palatalar va bemorlar" />
      <PageContent>
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-text-muted">
            <Clock className="w-5 h-5 animate-spin mr-2" />
            Yuklanmoqda...
          </div>
        )}

        {!isLoading && activeShifts.length === 0 && (
          <div className="text-center text-text-muted py-16 bg-surface border border-dashed border-border rounded-xl">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Bugun navbatda emassiz</p>
            <p className="text-sm mt-1">Yoki hozir faol smena vaqti emas</p>
          </div>
        )}

        {activeShifts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5 items-start">
            {activeShifts.map((shift) => (
              <ShiftDutyCard key={`${shift.roomShiftId}-${shift.roomId}`} shift={shift} qc={qc} onStartRound={(roundId, patients) => setRoundModalData({ roundId, patients })} />
            ))}
          </div>
        )}

        {roundModalData && <RoundModal roundId={roundModalData.roundId} patients={roundModalData.patients} onClose={() => setRoundModalData(null)} />}
      </PageContent>
    </>
  );
}

function ShiftDutyCard({
  shift,
  qc,
  onStartRound,
}: {
  shift: ActiveShift;
  qc: ReturnType<typeof useQueryClient>;
  onStartRound: (roundId: string, patients: { patientId: string; patientName: string; currentCondition?: "STABLE" | "IMPROVING" | "WORSENING" | "CRITICAL" }[]) => void;
}) {
  const t = useTranslations();
  const { data: patients = [] } = useQuery<WardPatient[]>({
    queryKey: ["room-patients", shift.room.id],
    queryFn: () => api.get(`/wards/room/${shift.room.id}`).then((r) => r.data),
    refetchInterval: 30000,
  });

  const assignmentId = shift.assignmentId;

  const { data: rounds = [] } = useQuery<WardRound[]>({
    queryKey: ["ward-rounds", assignmentId],
    queryFn: () => (assignmentId ? api.get(`/ward-rounds?shiftAssignmentId=${assignmentId}`).then((r) => r.data) : Promise.resolve([])),
    enabled: !!assignmentId,
  });

  const createRoundMutation = useMutation({
    mutationFn: async () => {
      // assignmentId yo'q bo'lsa (template-based smena) — avval materiallashtiramiz
      const resolvedId = assignmentId ? assignmentId : await api.post("/shift-assignments/materialize", { roomShiftId: shift.roomShiftId, roomId: shift.room.id }).then((r) => r.data.id);
      return api.post("/ward-rounds", { shiftAssignmentId: resolvedId });
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["ward-rounds", assignmentId] });
      const occupiedPatients = patients.filter((p) => p.status === "OCCUPIED");
      onStartRound(
        res.data.id,
        occupiedPatients.map((p) => ({
          patientId: p.patient.id,
          patientName: `${p.patient.first_name} ${p.patient.last_name}`,
        })),
      );
    },
    onError: () => toast.error("Xatolik"),
  });

  const occupiedPatients = patients.filter((p) => p.status === "OCCUPIED");
  const activeRound = rounds.find((r) => !r.completedAt);

  if (occupiedPatients.length === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-background gap-3">
        <div className="flex items-center gap-3">
          <BedDouble className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold text-text">{shift.room.name}</h3>
            <p className="text-xs text-text-muted">
              {shift.roomShift.name} — {String(shift.roomShift.startHour).padStart(2, "0")}:00–{String(shift.roomShift.endHour).padStart(2, "0")}:00
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-text-muted flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {occupiedPatients.length} bemor
          </div>
          {activeRound ? (
            <button
              onClick={() => {
                onStartRound(
                  activeRound.id,
                  occupiedPatients.map((p) => ({
                    patientId: p.patient.id,
                    patientName: `${p.patient.first_name} ${p.patient.last_name}`,
                    currentCondition: activeRound.patientNotes.find((n) => n.patientId === p.patient.id)?.condition as "STABLE" | "IMPROVING" | "WORSENING" | "CRITICAL" | undefined,
                  })),
                );
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 border border-amber-300 rounded-lg text-xs font-medium hover:bg-amber-200"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Davom etish
            </button>
          ) : (
            <button
              onClick={() => createRoundMutation.mutate()}
              disabled={createRoundMutation.isPending || occupiedPatients.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              {createRoundMutation.isPending ? "..." : "Apoxot boshlash"}
            </button>
          )}
        </div>
      </div>

      {/* Staff */}
      <div className="flex items-center gap-4 px-5 py-3 bg-surface-hover text-xs text-text-muted border-b border-border">
        <span>
          Shifokor:{" "}
          <span className="text-text font-medium">
            {shift.doctor.first_name} {shift.doctor.last_name}
          </span>
        </span>
        {shift.nurses.length > 0 && (
          <span>
            Hamshiralar: <span className="text-text">{shift.nurses.map((n) => `${n.nurse.first_name} ${n.nurse.last_name}`).join(", ")}</span>
          </span>
        )}
      </div>

      {/* Patients table */}
      <div className="divide-y divide-border-light">
        {occupiedPatients.length === 0 ? (
          <p className="text-center text-text-muted text-sm py-6">Palatada bemor yo'q</p>
        ) : (
          occupiedPatients.map((ward) => {
            const lastNote = rounds
              .filter((r) => r.completedAt)
              .flatMap((r) => r.patientNotes)
              .filter((n) => n.patientId === ward.patient.id)
              .at(-1);

            return (
              <div key={ward.id} className="flex items-center justify-between px-5 py-3 hover:bg-surface-hover transition-colors">
                <div>
                  <p className="font-medium text-text text-sm">
                    {ward.patient.first_name} {ward.patient.last_name}
                  </p>
                  <p className="text-xs text-text-muted">
                    Yotgan: {new Date(ward.checkIn).toLocaleDateString("uz-UZ")} · {ward.daysStayed ?? 0} kun
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {lastNote ? (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CONDITION_STYLES[lastNote.condition] ?? "bg-surface text-text-muted"}`}>
                      {CONDITION_LABELS[lastNote.condition] ?? lastNote.condition}
                    </span>
                  ) : (
                    <span className="text-xs text-text-muted">Apoxot yo'q</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Past rounds */}
      {rounds.filter((r) => r.completedAt).length > 0 && (
        <div className="px-5 py-3 border-t border-border bg-background">
          <p className="text-xs font-medium text-text-muted mb-2">{t("wards.pastRounds")}</p>
          <div className="flex gap-2 flex-wrap">
            {rounds
              .filter((r) => r.completedAt)
              .slice(0, 5)
              .map((r) => (
                <span key={r.id} className="flex items-center gap-1 text-xs text-success bg-success-50 border border-success-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  {new Date(r.completedAt!).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
