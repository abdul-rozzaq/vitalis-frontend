"use client";

import { Combobox } from "@/components/ui/combobox";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface Ward {
  id: string;
  checkIn: string;                                    // ← QO'SHILDI
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

  const [patientId, setPatientId] = useState("");     // ← QO'SHILDI
  const [roomId, setRoomId] = useState("");           // ← QO'SHILDI
  const [checkIn, setCheckIn] = useState("");         // ← QO'SHILDI
  const [expectedOut, setExpectedOut] = useState("");
  const [note, setNote] = useState("");

  // Xonalar va bemorlar — edit ochilganda yuklanadi
  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => api.get("/patients").then((r) => r.data),
    enabled: !!ward,
  });

  const { data: allRooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => api.get("/rooms").then((r) => r.data),
    enabled: !!ward,
  });

  const wardRooms = allRooms.filter((r: any) => r.roomType === "WARD");

  const patientOptions = patients.map((p: any) => ({
    label: `${p.first_name} ${p.last_name}`,
    value: p.id,
  }));

  const roomOptions = wardRooms.map((r: any) => ({
    // Hozirgi xona to'lgan bo'lsa ham tanlash mumkin bo'lsin (u allaqachon shu xonada)
    label: `${r.name}${r.capacity ? ` (${r.occupiedCount ?? 0}/${r.capacity})` : ""}${r.isFull && r.id !== ward?.room.id ? ` — ${t("wards.full")}` : ""}`,
    value: r.id,
    disabled: r.isFull && r.id !== ward?.room.id,
  }));

  useEffect(() => {
    if (ward) {
      setPatientId(ward.patient.id);                 // ← QO'SHILDI
      setRoomId(ward.room.id);                       // ← QO'SHILDI
      setCheckIn(ward.checkIn.split("T")[0]);        // ← QO'SHILDI
      setExpectedOut(ward.expectedOut ? ward.expectedOut.split("T")[0] : "");
      setNote(ward.note ?? "");
    }
  }, [ward]);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      api.patch(`/wards/${ward!.id}`, {
        patientId: patientId !== ward!.patient.id ? patientId : undefined,   // ← faqat o'zgargan bo'lsa
        roomId: roomId !== ward!.room.id ? roomId : undefined,               // ← faqat o'zgargan bo'lsa
        checkIn: checkIn !== ward!.checkIn.split("T")[0] ? checkIn : undefined, // ← faqat o'zgargan bo'lsa
        expectedOut: expectedOut || null,
        note: note || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wards"] });
      queryClient.invalidateQueries({ queryKey: ["ward", ward!.id] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      onClose();
    },
  });

  if (!ward) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-text">{t("wards.editTitle")}</h3>
            <p className="text-sm text-secondary mt-0.5">
              {ward.patient.first_name} {ward.patient.last_name} — {ward.room.name}
            </p>
          </div>
          <button onClick={onClose} className="text-secondary hover:text-text transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Bemor — QO'SHILDI */}
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

          {/* Xona — QO'SHILDI */}
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
              disabled={isPending}
            />
          </div>

          {/* Yotgan sana — QO'SHILDI */}
          <div>
            <label className="text-sm font-medium text-text mb-1 block">
              {t("wards.colCheckIn")} *
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
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
              min={checkIn}
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
            disabled={!patientId || !roomId || !checkIn || isPending}
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