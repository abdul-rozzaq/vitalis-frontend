"use client";

import { api } from "@/shared/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Minus, Plus, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface WardCheckInFormProps {
  patientId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function WardCheckInForm({ patientId, onSuccess, onCancel }: WardCheckInFormProps) {
  const t = useTranslations();
  const [wardRoomId, setWardRoomId] = useState("");
  const [wardCheckInDate, setWardCheckInDate] = useState("");
  const [wardExpectedOut, setWardExpectedOut] = useState("");
  const [wardNote, setWardNote] = useState("");
  const [wardCompanionsCount, setWardCompanionsCount] = useState(0);

  const { data: allRoomsRaw = [] } = useQuery<any[]>({
    queryKey: ["rooms"],
    queryFn: () => api.get("/rooms").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const wardRoomsRaw = allRoomsRaw.filter((r: any) => r.roomType === "WARD");
  const selectedWardRoom = wardRoomsRaw.find((r: any) => r.id === wardRoomId) as any | undefined;
  const wardMaxCompanions = selectedWardRoom ? Math.max(0, (selectedWardRoom.freeSlots ?? selectedWardRoom.capacity ?? 0) - 1) : 0;

  const { mutate: doWardCheckIn, isPending } = useMutation({
    mutationFn: () =>
      api.post("/wards/check-in", {
        patientId,
        roomId: wardRoomId,
        companionsCount: wardCompanionsCount || 0,
        checkIn: wardCheckInDate || undefined,
        expectedOut: wardExpectedOut || undefined,
        note: wardNote || undefined,
      }),
    onSuccess: () => {
      setWardRoomId("");
      setWardCheckInDate("");
      setWardExpectedOut("");
      setWardNote("");
      setWardCompanionsCount(0);
      onSuccess();
    },
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text">{t("wards.colRoom")} *</label>
        <select
          value={wardRoomId}
          onChange={(e) => {
            setWardRoomId(e.target.value);
            setWardCompanionsCount(0);
          }}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        >
          <option value="">{t("forms.select")}</option>
          {wardRoomsRaw.map((r: any) => (
            <option key={r.id} value={r.id} disabled={r.isFull}>
              {r.name}
              {r.department ? ` (${r.department.name})` : ""}
              {r.capacity ? ` — ${r.occupiedCount ?? 0}/${r.capacity}` : ""}
              {r.isFull ? ` ⛔ ${t("wards.full")}` : ""}
            </option>
          ))}
        </select>
        {wardRoomsRaw.length === 0 && <p className="text-xs text-text-muted">{t("wards.noWards")}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {t("wards.companionsCount")}
          <span className="ml-1 text-text-muted font-normal text-xs">({t("common.optional")})</span>
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setWardCompanionsCount((c) => Math.max(0, c - 1))}
            disabled={wardCompanionsCount === 0}
            className="w-8 h-8 rounded-md border border-border bg-surface hover:bg-surface-hover flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-lg font-semibold text-text w-6 text-center">{wardCompanionsCount}</span>
          <button
            type="button"
            onClick={() => setWardCompanionsCount((c) => Math.min(wardMaxCompanions, c + 1))}
            disabled={!wardRoomId || wardCompanionsCount >= wardMaxCompanions}
            className="w-8 h-8 rounded-md border border-border bg-surface hover:bg-surface-hover flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          {wardRoomId && (
            <span className="text-xs text-secondary ml-1">
              {t("wards.maxCompanions")}: {wardMaxCompanions}
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted">Sheriq ro&apos;yxatga olinmaydi, lekin joy egallaydi</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text">
          {t("wards.colCheckIn")}
          <span className="ml-1 text-text-muted font-normal text-xs">{t("forms.optional")}</span>
        </label>
        <input
          type="date"
          value={wardCheckInDate}
          onChange={(e) => setWardCheckInDate(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        />
        <p className="text-xs text-text-muted">{t("wards.checkInHint")}</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text">
          {t("wards.colExpectedOut")}
          <span className="ml-1 text-text-muted font-normal text-xs">{t("forms.optional")}</span>
        </label>
        <input
          type="date"
          value={wardExpectedOut}
          onChange={(e) => setWardExpectedOut(e.target.value)}
          min={wardCheckInDate || new Date().toISOString().slice(0, 10)}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text">
          {t("wards.note")}
          <span className="ml-1 text-text-muted font-normal text-xs">{t("forms.optional")}</span>
        </label>
        <textarea
          value={wardNote}
          onChange={(e) => setWardNote(e.target.value)}
          rows={3}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
          {t("forms.cancel")}
        </button>
        <button
          type="button"
          disabled={!wardRoomId || isPending}
          onClick={() => doWardCheckIn()}
          className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary/20 cursor-pointer"
        >
          {isPending ? t("common.loading") : t("wards.checkIn")}
        </button>
      </div>
    </div>
  );
}
