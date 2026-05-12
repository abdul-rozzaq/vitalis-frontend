"use client";

import { Combobox } from "@/components/ui/combobox";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function WardCheckInModal({ open, onClose }: Props) {
  const t = useTranslations();
  const queryClient = useQueryClient();

  const [patientId, setPatientId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState("");          // ← QO'SHILDI
  const [expectedOut, setExpectedOut] = useState("");
  const [note, setNote] = useState("");

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => api.get("/patients").then((r) => r.data),
    enabled: open,
  });

  const { data: allRooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => api.get("/rooms").then((r) => r.data),
    enabled: open,
  });

  const rooms = allRooms.filter((r: any) => r.roomType === "WARD");

  const patientOptions = patients.map((p: any) => ({
    label: `${p.first_name} ${p.last_name}`,
    value: p.id,
  }));

  const roomOptions = rooms.map((r: any) => ({
    label: `${r.name}${r.department ? ` (${r.department.name})` : ""}${r.capacity ? ` — ${r.occupiedCount ?? 0}/${r.capacity}` : ""}${r.isFull ? ` ⛔ ${t("wards.full")}` : ""}`,
    value: r.id,
    disabled: r.isFull,
  }));

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      api.post("/wards/check-in", {
        patientId,
        roomId,
        checkIn: checkIn || undefined,               // ← QO'SHILDI
        expectedOut: expectedOut || undefined,
        note: note || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wards"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      handleClose();
    },
  });

  const handleClose = () => {
    setPatientId("");
    setRoomId("");
    setCheckIn("");                                   // ← QO'SHILDI
    setExpectedOut("");
    setNote("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-text">{t("wards.checkInTitle")}</h3>
          <button onClick={handleClose} className="text-secondary hover:text-text transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Bemor */}
          <div>
            <label className="text-sm font-medium text-text mb-1 block">
              {t("wards.colPatient")} *
            </label>
            <Combobox
              options={patientOptions}
              value={patientId}
              onChange={(val) => setPatientId(val as string)}
              placeholder={t("forms.select")}
              searchPlaceholder={t("common.search")}
              disabled={isPending}
            />
          </div>

          {/* Xona */}
          <div>
            <label className="text-sm font-medium text-text mb-1 block">
              {t("wards.colRoom")} *
            </label>
            <Combobox
              options={roomOptions}
              value={roomId}
              onChange={(val) => setRoomId(val as string)}
              placeholder={t("forms.select")}
              searchPlaceholder={t("common.search")}
              disabled={isPending || rooms.length === 0}
            />
            {rooms.length === 0 && (
              <p className="text-xs text-secondary mt-1">{t("wards.noWards")}</p>
            )}
          </div>

          {/* Yotgan sana — QO'SHILDI */}
          <div>
            <label className="text-sm font-medium text-text mb-1 block">
              {t("wards.colCheckIn")}
              <span className="text-secondary font-normal ml-1">({t("common.optional")})</span>
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}   // kelajak sana kiritilmasin
              className="w-full bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <p className="text-xs text-secondary mt-1">{t("wards.checkInHint")}</p>
          </div>

          {/* Kutilgan chiqish */}
          <div>
            <label className="text-sm font-medium text-text mb-1 block">
              {t("wards.colExpectedOut")}
            </label>
            <input
              type="date"
              value={expectedOut}
              onChange={(e) => setExpectedOut(e.target.value)}
              min={checkIn || new Date().toISOString().slice(0, 10)}
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
              rows={2}
              className="w-full bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={handleClose}
            className="px-3 py-1.5 rounded-md text-sm text-secondary hover:bg-surface-hover border border-border transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={() => mutate()}
            disabled={!patientId || !roomId || isPending}
            className="px-3 py-1.5 rounded-md text-sm bg-primary text-white hover:bg-primary-700 transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {t("wards.checkIn")}
          </button>
        </div>
      </div>
    </div>
  );
}