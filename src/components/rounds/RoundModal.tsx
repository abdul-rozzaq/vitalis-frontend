"use client";

import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export type PatientCondition = "STABLE" | "IMPROVING" | "WORSENING" | "CRITICAL";

interface PatientRow {
  patientId: string;
  patientName: string;
  currentCondition?: PatientCondition;
}

interface RoundModalProps {
  roundId: string;
  patients: PatientRow[];
  onClose: () => void;
}

const CONDITION_LABELS: Record<PatientCondition, { label: string; color: string }> = {
  STABLE: { label: "Barqaror", color: "bg-green-100 text-green-800 border-green-300" },
  IMPROVING: { label: "Yaxshilanmoqda", color: "bg-blue-100 text-blue-800 border-blue-300" },
  WORSENING: { label: "Yomonlashmoqda", color: "bg-orange-100 text-orange-800 border-orange-300" },
  CRITICAL: { label: "Kritik", color: "bg-red-100 text-red-800 border-red-300" },
};

export function RoundModal({ roundId, patients, onClose }: RoundModalProps) {
  const qc = useQueryClient();
  const [statuses, setStatuses] = useState<Record<string, { condition: PatientCondition; notes: string }>>(() => {
    const init: Record<string, { condition: PatientCondition; notes: string }> = {};
    patients.forEach((p) => {
      init[p.patientId] = { condition: p.currentCondition ?? "STABLE", notes: "" };
    });
    return init;
  });

  const complete = useMutation({
    mutationFn: () =>
      api.post(`/ward-rounds/${roundId}/complete`, {
        patients: Object.entries(statuses).map(([patientId, s]) => ({
          patientId,
          condition: s.condition,
          notes: s.notes || undefined,
        })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ward-rounds"] });
      qc.invalidateQueries({ queryKey: ["active-shifts"] });
      toast.success("Apoxot yakunlandi");
      onClose();
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  function setCondition(patientId: string, condition: PatientCondition) {
    setStatuses((prev) => ({ ...prev, [patientId]: { ...prev[patientId], condition } }));
  }

  function setNotes(patientId: string, notes: string) {
    setStatuses((prev) => ({ ...prev, [patientId]: { ...prev[patientId], notes } }));
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-surface rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-text text-lg">Apoxot — Bemor holatlari</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-4">
          {patients.length === 0 && (
            <p className="text-text-muted text-sm text-center py-4">Palatada bemor yo'q</p>
          )}
          {patients.map((p) => {
            const s = statuses[p.patientId];
            return (
              <div key={p.patientId} className="bg-background border border-border rounded-xl p-4">
                <div className="font-medium text-text mb-3">{p.patientName}</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(Object.keys(CONDITION_LABELS) as PatientCondition[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCondition(p.patientId, c)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        s?.condition === c
                          ? CONDITION_LABELS[c].color + " ring-2 ring-offset-1 ring-current"
                          : "bg-surface border-border text-text-muted hover:border-primary"
                      }`}
                    >
                      {CONDITION_LABELS[c].label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={s?.notes ?? ""}
                  onChange={(e) => setNotes(p.patientId, e.target.value)}
                  placeholder="Izoh (ixtiyoriy)..."
                  rows={2}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-text resize-none focus:outline-none focus:border-primary"
                />
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-border flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg text-sm text-text hover:bg-surface-hover"
          >
            Bekor
          </button>
          <button
            onClick={() => complete.mutate()}
            disabled={complete.isPending}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-60"
          >
            {complete.isPending ? "Saqlanmoqda..." : "Apoxotni yakunlash"}
          </button>
        </div>
      </div>
    </div>
  );
}
