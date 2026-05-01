"use client";

import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface Ward {
  id: string;
  wardNumber: string | null;
  expectedOut: string | null;
  note: string | null;
  status: "OCCUPIED" | "VACATED";
  patient: { id: string; first_name: string; last_name: string };
  room: { id: string; name: string };
}

interface Props {
  ward: Ward | null;
  onClose: () => void;
}

export function WardEditModal({ ward, onClose }: Props) {
  const t = useTranslations();
  const queryClient = useQueryClient();

  const [wardNumber, setWardNumber] = useState("");
  const [expectedOut, setExpectedOut] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (ward) {
      setWardNumber(ward.wardNumber ?? "");
      setExpectedOut(
        ward.expectedOut ? ward.expectedOut.split("T")[0] : "",
      );
      setNote(ward.note ?? "");
    }
  }, [ward]);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      api.patch(`/wards/${ward!.id}`, {
        wardNumber: wardNumber || undefined,
        expectedOut: expectedOut || undefined,
        note: note || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wards"] });
      queryClient.invalidateQueries({ queryKey: ["ward", ward!.id] });
      onClose();
    },
  });

  if (!ward) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-text">
              {t("wards.editTitle")}
            </h3>
            <p className="text-sm text-secondary mt-0.5">
              {ward.patient.first_name} {ward.patient.last_name} — {ward.room.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-secondary hover:text-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Palata raqami */}
          <div>
            <label className="text-sm font-medium text-text mb-1 block">
              {t("wards.colWardNumber")}
            </label>
            <input
              type="text"
              value={wardNumber}
              onChange={(e) => setWardNumber(e.target.value)}
              placeholder="12-A"
              maxLength={20}
              className="w-full bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          {/* Taxminiy chiqish */}
          <div>
            <label className="text-sm font-medium text-text mb-1 block">
              {t("wards.colExpectedOut")}
            </label>
            <input
              type="date"
              value={expectedOut}
              onChange={(e) => setExpectedOut(e.target.value)}
              className="w-full bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          {/* Izoh */}
          <div>
            <label className="text-sm font-medium text-text mb-1 block">
              {t("wards.note")}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-sm text-secondary hover:bg-surface-hover border border-border transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={() => mutate()}
            disabled={isPending}
            className="px-3 py-1.5 rounded-md text-sm bg-primary text-white hover:bg-primary-700 transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}