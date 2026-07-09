"use client";

import { Combobox } from "@/components/ui/combobox";
import { api } from "@/shared/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BedDouble, Gift, Loader2, Minus, Plus, UserRound, Users, X } from "lucide-react";
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
  const [checkIn, setCheckIn] = useState("");
  const [expectedOut, setExpectedOut] = useState("");
  const [note, setNote] = useState("");
  const [companionsCount, setCompanionsCount] = useState(0);

  const [patientPricePerDay, setPatientPricePerDay] = useState("");
  const [companionPricePerDay, setCompanionPricePerDay] = useState("");
  const [freeDays, setFreeDays] = useState("");


  const { data: patients = [] } = useQuery({
    queryKey: ["patients-available-for-ward"],
    queryFn: () =>
      api.get("/patients", { params: { excludeOccupied: "true" } }).then((r) => r.data),
    enabled: open,
    staleTime: 0,
  });

  const { data: allRooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => api.get("/rooms").then((r) => r.data),
    enabled: open,
  });

  const rooms = allRooms.filter((r: any) => r.roomType === "WARD");

  const selectedRoom = rooms.find((r: any) => r.id === roomId) as any | undefined;
  const maxCompanions = selectedRoom
    ? Math.max(0, (selectedRoom.freeSlots ?? selectedRoom.capacity ?? 0) - 1)
    : 0;

  // Tanlangan xonadagi bemorlarni olish — /wards/room/:roomId (OCCUPIED filtri backendda)
  const { data: roomOccupants = [], isLoading: isLoadingOccupants } = useQuery({
    queryKey: ["room-occupants", roomId],
    queryFn: () =>
      api.get(`/wards/room/${roomId}`).then((r) => r.data),
    enabled: !!roomId,
    staleTime: 0,
  });

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
        checkIn: checkIn || undefined,
        expectedOut: expectedOut || undefined,
        note: note || undefined,
        companionsCount,
        patientPricePerDay: patientPricePerDay ? Number(patientPricePerDay) : undefined,
        companionPricePerDay: companionPricePerDay ? Number(companionPricePerDay) : undefined,
        freeDays: freeDays ? Number(freeDays) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wards"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["patients-available-for-ward"] });
      handleClose();
    },
  });

  const handleClose = () => {
    setPatientId("");
    setRoomId("");
    setCheckIn("");
    setExpectedOut("");
    setNote("");
    setCompanionsCount(0);
    setPatientPricePerDay("");
    setCompanionPricePerDay("");
    setFreeDays("");
    onClose();
  };

  const handleRoomChange = (val: string) => {
    setRoomId(val);
    setCompanionsCount(0);
    const room = rooms.find((r: any) => r.id === val);
    setPatientPricePerDay(room?.department?.patientDailyPrice?.toString() ?? "");
    setCompanionPricePerDay(room?.department?.companionDailyPrice?.toString() ?? "");
    setFreeDays("");
  };

  const bonusAmount =
    freeDays && patientPricePerDay
      ? Number(freeDays) * Number(patientPricePerDay)
      : 0;


  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
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
              onChange={(val) => handleRoomChange(val as string)}
              placeholder={t("forms.select")}
              searchPlaceholder={t("common.search")}
              disabled={isPending || rooms.length === 0}
            />
            {rooms.length === 0 && (
              <p className="text-xs text-secondary mt-1">{t("wards.noWards")}</p>
            )}
          </div>

          {/* Tanlangan xonadagi bemorlar — preview panel */}
          {roomId && (
            <div className="rounded-lg border border-border bg-surface-hover/50 overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface">
                <BedDouble className="w-3.5 h-3.5 text-secondary" />
                <span className="text-xs font-medium text-text">
                  {selectedRoom?.name} — {t("wards.currentOccupants")}
                </span>
                <span className="ml-auto text-xs text-secondary">
                  {selectedRoom?.occupiedCount ?? 0}/{selectedRoom?.capacity ?? "—"}
                </span>
              </div>

              {/* Bemorlar ro'yxati */}
              <div className="divide-y divide-border">
                {isLoadingOccupants ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-secondary" />
                  </div>
                ) : roomOccupants.length === 0 ? (
                  <div className="py-3 px-3 text-xs text-secondary text-center">
                    {t("wards.noOccupants")}
                  </div>
                ) : (
                  roomOccupants.map((ward: any) => {
                    const patient = ward.patient ?? ward;
                    const fullName =
                      patient.first_name && patient.last_name
                        ? `${patient.first_name} ${patient.last_name}`
                        : patient.name ?? "—";
                    const companions = ward.companionsCount ?? ward.companions_count ?? 0;

                    return (
                      <div
                        key={ward.id}
                        className="flex items-center gap-2.5 px-3 py-2"
                      >
                        {/* Avatar placeholder */}
                        <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <UserRound className="w-3.5 h-3.5 text-accent" />
                        </div>

                        {/* Ism */}
                        <span className="text-sm text-text flex-1 truncate">{fullName}</span>

                        {/* Sheriklar soni */}
                        {companions > 0 && (
                          <div className="flex items-center gap-1 text-xs text-secondary bg-surface rounded-md px-1.5 py-0.5 border border-border">
                            <Users className="w-3 h-3" />
                            <span>{companions}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Qarovchilar soni */}
          <div>
            <label className="text-sm font-medium text-text mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {t("wards.companionsCount")}
              <span className="text-secondary font-normal ml-1">({t("common.optional")})</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCompanionsCount((v) => Math.max(0, v - 1))}
                disabled={companionsCount === 0 || isPending}
                className="w-8 h-8 rounded-md border border-border bg-surface hover:bg-surface-hover flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <span className="text-lg font-semibold text-text w-6 text-center">
                {companionsCount}
              </span>

              <button
                type="button"
                onClick={() => setCompanionsCount((v) => Math.min(maxCompanions, v + 1))}
                disabled={!roomId || companionsCount >= maxCompanions || isPending}
                className="w-8 h-8 rounded-md border border-border bg-surface hover:bg-surface-hover flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              {roomId && (
                <span className="text-xs text-secondary ml-1">
                  {t("wards.maxCompanions")}: {maxCompanions}
                </span>
              )}
            </div>
          </div>

          {/* Kunlik narxlar section */}
          <div className="rounded-lg border border-border bg-surface-hover/50 p-3 space-y-3">
            <p className="text-xs font-semibold text-text uppercase tracking-wide">
              {t("wards.dailyPrices")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium text-text mb-1 block">
                  {t("wards.patientPricePerDay")}
                </label>
                <input
                  type="number"
                  min="0"
                  value={patientPricePerDay}
                  onChange={(e) => setPatientPricePerDay(e.target.value)}
                  className="w-full bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text mb-1 block">
                  {t("wards.companionPricePerDay")}
                </label>
                <input
                  type="number"
                  min="0"
                  value={companionPricePerDay}
                  onChange={(e) => setCompanionPricePerDay(e.target.value)}
                  className="w-full bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>
          </div>

          {/* Accommodation bonus section */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3 space-y-2">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5" />
              {t("wards.accommodationBonus")}
              <span className="font-normal normal-case ml-1">({t("common.optional")})</span>
            </p>
            <div>
              <label className="text-sm font-medium text-text mb-1 block">
                {t("wards.freeDays")}
              </label>
              <input
                type="number"
                min="0"
                value={freeDays}
                onChange={(e) => setFreeDays(e.target.value)}
                placeholder="0"
                className="w-full bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            {bonusAmount > 0 && (
              <p className="text-sm font-medium text-amber-700">
                {t("wards.accommodationBonusAmount")}: {bonusAmount.toLocaleString("uz-UZ")} {t("common.currency")}
              </p>
            )}
          </div>

          {/* Yotgan sana */}
          <div>
            <label className="text-sm font-medium text-text mb-1 block">
              {t("wards.colCheckIn")}
              <span className="text-secondary font-normal ml-1">({t("common.optional")})</span>
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
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