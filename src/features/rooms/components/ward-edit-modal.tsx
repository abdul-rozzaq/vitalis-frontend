"use client";

import { Combobox } from "@/components/ui/combobox";
import { api } from "@/shared/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Minus, Plus, Users, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface Ward {
  id: string;
  checkIn: string;
  expectedOut: string | null;
  note: string | null;
  status: "OCCUPIED" | "VACATED";
  companionsCount: number;
  cardNumber?: number | null;
  doctor?: { id: string; first_name: string; last_name: string } | null;
  patientPricePerDay?: number | null;
  companionPricePerDay?: number | null;
  patient: { id: string; first_name: string; last_name: string };
  department?: { id: string; name: string } | null;
  room: { id: string; name: string; department?: { id: string; name: string } | null };
}

interface Props {
  ward: Ward | null;
  onClose: () => void;
}

export function WardEditModal({ ward, onClose }: Props) {
  const t = useTranslations();
  const queryClient = useQueryClient();

  const [patientId, setPatientId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [expectedOut, setExpectedOut] = useState("");
  const [note, setNote] = useState("");
  const [companionsCount, setCompanionsCount] = useState(0); // ← QO'SHILDI

  const [patientPricePerDay, setPatientPricePerDay] = useState("");
  const [companionPricePerDay, setCompanionPricePerDay] = useState("");


  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => api.get("/patients").then((r) => r.data),
    enabled: !!ward,
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ["ward-doctors"],
    queryFn: () => api.get("/wards/doctors").then((r) => r.data),
    enabled: !!ward,
  });

  const { data: allRooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => api.get("/rooms").then((r) => r.data),
    enabled: !!ward,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((r) => r.data),
    enabled: !!ward,
  });

  const wardRooms = allRooms.filter((r: any) => r.roomType === "WARD");

  // Tanlangan xona bo'sh o'rinlari
  const selectedRoom = wardRooms.find((r: any) => r.id === roomId) as any | undefined;
  const maxCompanions = selectedRoom
    ? selectedRoom.id === ward?.room.id
      // Xuddi shu xona — hozirgi companionsCount ni ham hisobga olish
      ? Math.max(0, (selectedRoom.freeSlots ?? selectedRoom.capacity ?? 0) + (ward?.companionsCount ?? 0))
      : Math.max(0, (selectedRoom.freeSlots ?? selectedRoom.capacity ?? 0) - 1)
    : 0;

  const doctorOptions = doctors.map((d: any) => ({
    label: `${d.first_name} ${d.last_name}`,
    value: d.id,
  }));

  const patientOptions = patients.map((p: any) => ({
    label: `${p.first_name} ${p.last_name}`,
    value: p.id,
  }));

  const departmentOptions = departments.map((d: any) => ({
    label: d.name,
    value: d.id,
  }));

  const roomOptions = wardRooms.map((r: any) => ({
    label: `${r.name}${r.department ? ` (${r.department.name})` : ""}${r.capacity ? ` — ${r.occupiedCount ?? 0}/${r.capacity}` : ""}${r.isFull && r.id !== ward?.room.id ? ` ⛔ ${t("wards.full")}` : ""}`,
    value: r.id,
    disabled: r.isFull && r.id !== ward?.room.id,
  }));

  useEffect(() => {
    if (ward) {
      setPatientId(ward.patient.id);
      setRoomId(ward.room.id);
      setDepartmentId(ward.department?.id ?? ward.room.department?.id ?? "");
      setDoctorId(ward.doctor?.id ?? "");
      setCardNumber(ward.cardNumber?.toString() ?? "");
      setCheckIn(ward.checkIn.split("T")[0]);
      setExpectedOut(ward.expectedOut ? ward.expectedOut.split("T")[0] : "");
      setNote(ward.note ?? "");
      setCompanionsCount(ward.companionsCount ?? 0);  // ← QO'SHILDI
      setPatientPricePerDay(ward.patientPricePerDay?.toString() ?? "");
      setCompanionPricePerDay(ward.companionPricePerDay?.toString() ?? "");
    }
  }, [ward]);

  // Xona o'zgarganda sherik sonini reset va bo'limni yangi xonaga moslashtirish
  const handleRoomChange = (val: string) => {
    setRoomId(val);
    setCompanionsCount(0);
    const room = wardRooms.find((r: any) => r.id === val);
    setDepartmentId(room?.department?.id ?? "");
  };

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      api.patch(`/wards/${ward!.id}`, {
        patientId: patientId !== ward!.patient.id ? patientId : undefined,
        roomId: roomId !== ward!.room.id ? roomId : undefined,
        departmentId: departmentId !== (ward!.department?.id ?? ward!.room.department?.id ?? "") ? (departmentId || null) : undefined,
        doctorId: doctorId !== (ward!.doctor?.id ?? "") ? (doctorId || null) : undefined,
        cardNumber: cardNumber !== (ward!.cardNumber?.toString() ?? "") ? (cardNumber ? Number(cardNumber) : null) : undefined,
        checkIn: checkIn !== ward!.checkIn.split("T")[0] ? checkIn : undefined,
        expectedOut: expectedOut || null,
        note: note || undefined,
        companionsCount,                             // ← QO'SHILDI (har doim yuboriladi)
        patientPricePerDay: patientPricePerDay ? Number(patientPricePerDay) : null,
        companionPricePerDay: companionPricePerDay ? Number(companionPricePerDay) : null,
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
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
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
              disabled={isPending}
            />
          </div>

          {/* Bo'lim */}
          <div>
            <label className="text-sm font-medium text-text mb-1 block">
              {t("wards.department")}
            </label>
            <Combobox
              options={departmentOptions}
              value={departmentId}
              onChange={(val) => setDepartmentId(val as string)}
              placeholder={t("forms.select")}
              searchPlaceholder={t("common.search")}
              disabled={isPending}
            />
            <p className="text-xs text-secondary mt-1">{t("wards.departmentHint")}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-text mb-1 block">{t("wards.doctor")}</label>
            <Combobox
              options={doctorOptions}
              value={doctorId}
              onChange={(val) => setDoctorId(val as string)}
              placeholder={t("wards.selectDoctor")}
              searchPlaceholder={t("common.search")}
              disabled={isPending}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-text mb-1 block">{t("wards.cardNumber")}</label>
            <input
              type="number"
              min="1"
              step="1"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="Masalan: 1024"
              className="w-full bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          {/* Sheriklar soni — QO'SHILDI */}
          <div>
            <label className="text-sm font-medium text-text mb-1 flex items-center gap-1.5 block">
              <Users className="w-3.5 h-3.5" />
              {t("wards.companionsCount")}
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
                disabled={companionsCount >= maxCompanions || isPending}
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
            <p className="text-xs text-secondary mt-1">{t("wards.futurePricesHint")}</p>
          </div>

          {/* Yotgan sana */}
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