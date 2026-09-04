"use client";

import { Combobox } from "@/components/ui/combobox";
import { PaymentMethod } from "@/features/invoices/types";
import { api } from "@/shared/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BedDouble, Banknote, Gift, Loader2, Minus, Plus, UserRound, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { addDays, differenceInDays, format, startOfDay } from "date-fns";

interface WardCheckInFormProps {
  patientId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "CARD", "TRANSFER", "OTHER"];

export function WardCheckInForm({ patientId, onSuccess, onCancel }: WardCheckInFormProps) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [roomId, setRoomId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [expectedOut, setExpectedOut] = useState("");
  const [note, setNote] = useState("");
  const [companionsCount, setCompanionsCount] = useState(0);
  const [patientPricePerDay, setPatientPricePerDay] = useState("");
  const [companionPricePerDay, setCompanionPricePerDay] = useState("");
  const [freeDays, setFreeDays] = useState("");
  const [isBonusForCompanions, setIsBonusForCompanions] = useState(false);
  const [prepaymentAmount, setPrepaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  const { data: allRooms = [] } = useQuery<any[]>({
    queryKey: ["rooms"],
    queryFn: () => api.get("/rooms").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const { data: doctors = [] } = useQuery<any[]>({
    queryKey: ["ward-doctors"],
    queryFn: () => api.get("/wards/doctors").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const rooms = allRooms.filter((r: any) => r.roomType === "WARD");
  const selectedRoom = rooms.find((r: any) => r.id === roomId);
  const maxCompanions = selectedRoom
    ? Math.max(0, (selectedRoom.freeSlots ?? selectedRoom.capacity ?? 0) - 1)
    : 0;

  const { data: roomOccupants = [], isLoading: isLoadingOccupants } = useQuery<any[]>({
    queryKey: ["room-occupants", roomId],
    queryFn: () => api.get(`/wards/room/${roomId}`).then((r) => r.data),
    enabled: !!roomId,
    staleTime: 0,
  });

  const roomOptions = rooms.map((r: any) => ({
    label: `${r.name}${r.department ? ` (${r.department.name})` : ""}${r.capacity ? ` — ${r.occupiedCount ?? 0}/${r.capacity}` : ""}${r.isFull ? ` ⛔ ${t("wards.full")}` : ""}`,
    value: r.id,
    disabled: r.isFull,
  }));

  const doctorOptions = doctors.map((d: any) => ({
    label: `${d.first_name} ${d.last_name}`,
    value: d.id,
  }));

  const departmentOptions = departments.map((d: any) => ({
    label: d.name,
    value: d.id,
  }));

  const handleRoomChange = (value: string) => {
    setRoomId(value);
    setCompanionsCount(0);
    const room = rooms.find((r: any) => r.id === value);
    // Bemor rasman biriktirilgan bo'lim — standart holatda xonaning bo'limi,
    // ammo xona to'lib qolgan bo'limga yotqizish uchun keyin qo'lda o'zgartirish mumkin
    setDepartmentId(room?.department?.id ?? "");
    setPatientPricePerDay(room?.department?.patientDailyPrice?.toString() ?? "");
    setCompanionPricePerDay(room?.department?.companionDailyPrice?.toString() ?? "");
    setFreeDays("");
  };

  const handleDepartmentChange = (value: string) => {
    setDepartmentId(value);
    const dept = departments.find((d: any) => d.id === value);
    setPatientPricePerDay(dept?.patientDailyPrice?.toString() ?? "");
    setCompanionPricePerDay(dept?.companionDailyPrice?.toString() ?? "");
  };

  const parsedCheckIn = checkIn ? new Date(checkIn) : new Date();
  const days = expectedOut
    ? Math.max(0, differenceInDays(startOfDay(new Date(expectedOut)), startOfDay(parsedCheckIn)))
    : 0;
  const patientTotal = days * Number(patientPricePerDay || 0);
  const companionTotal = days * companionsCount * Number(companionPricePerDay || 0);
  const grossTotal = patientTotal + companionTotal;
  const bonusAmount = freeDays && patientPricePerDay
    ? Number(freeDays) * (Number(patientPricePerDay) + (isBonusForCompanions && companionPricePerDay ? companionsCount * Number(companionPricePerDay) : 0))
    : 0;
  const netTotal = Math.max(0, grossTotal - bonusAmount);

  useEffect(() => {
    setPrepaymentAmount(netTotal > 0 ? netTotal.toString() : "");
  }, [netTotal]);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      api.post("/wards/check-in", {
        patientId,
        roomId,
        departmentId: departmentId || undefined,
        doctorId: doctorId || undefined,
        cardNumber: cardNumber ? Number(cardNumber) : undefined,
        checkIn: checkIn || undefined,
        expectedOut: expectedOut || undefined,
        note: note || undefined,
        companionsCount,
        patientPricePerDay: patientPricePerDay ? Number(patientPricePerDay) : undefined,
        companionPricePerDay: companionPricePerDay ? Number(companionPricePerDay) : undefined,
        freeDays: freeDays ? Number(freeDays) : undefined,
        isBonusForCompanions,
        prepaymentAmount: prepaymentAmount ? Number(prepaymentAmount) : undefined,
        paymentMethod: prepaymentAmount ? paymentMethod : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-ward", patientId] });
      queryClient.invalidateQueries({ queryKey: ["wards"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["room-occupants"] });
      onSuccess();
    },
  });

  return (
    <div className="space-y-5 pb-2">
      <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-sm font-medium text-text mb-1 block">{t("wards.colRoom")} *</label>
            <Combobox options={roomOptions} value={roomId} onChange={(v) => handleRoomChange(v as string)} placeholder={t("forms.select")} searchPlaceholder={t("common.search")} disabled={isPending || rooms.length === 0} />
            {rooms.length === 0 && <p className="text-xs text-secondary mt-1">{t("wards.noWards")}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-text mb-1 block">{t("wards.department")} *</label>
            <Combobox options={departmentOptions} value={departmentId} onChange={(v) => handleDepartmentChange(v as string)} placeholder={t("forms.select")} searchPlaceholder={t("common.search")} disabled={isPending || !roomId} />
            <p className="text-xs text-secondary mt-1">{t("wards.departmentHint")}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-text mb-1 block">{t("wards.doctor")}</label>
            <Combobox options={doctorOptions} value={doctorId} onChange={(v) => setDoctorId(v as string)} placeholder={t("wards.selectDoctor")} searchPlaceholder={t("common.search")} disabled={isPending} />
          </div>

          <div>
            <label className="text-sm font-medium text-text mb-1 block">{t("wards.cardNumber")}</label>
            <input type="number" min="1" step="1" value={cardNumber} onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))} placeholder="Masalan: 1024" className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
          </div>
        </div>

        {roomId && (
          <div className="rounded-lg border border-border bg-surface-hover/50 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface">
              <BedDouble className="w-3.5 h-3.5 text-secondary" />
              <span className="text-xs font-medium text-text">{selectedRoom?.name} — {t("wards.currentOccupants")}</span>
              <span className="ml-auto text-xs text-secondary">{selectedRoom?.occupiedCount ?? 0}/{selectedRoom?.capacity ?? "—"}</span>
            </div>
            <div className="divide-y divide-border">
              {isLoadingOccupants ? <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-secondary" /></div> : roomOccupants.length === 0 ? <div className="py-3 px-3 text-xs text-secondary text-center">{t("wards.noOccupants")}</div> : roomOccupants.map((w: any) => {
                const p = w.patient ?? w;
                return <div key={w.id} className="flex items-center gap-2.5 px-3 py-2"><div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center"><UserRound className="w-3.5 h-3.5 text-accent" /></div><span className="text-sm text-text flex-1 truncate">{p.first_name} {p.last_name}</span></div>;
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-text mb-1 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{t("wards.companionsCount")} <span className="text-secondary font-normal">({t("common.optional")})</span></label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setCompanionsCount((v) => Math.max(0, v - 1))} disabled={companionsCount === 0 || isPending} className="w-8 h-8 rounded-md border border-border bg-surface hover:bg-surface-hover flex items-center justify-center disabled:opacity-40"><Minus className="w-3.5 h-3.5" /></button>
              <span className="text-lg font-semibold text-text w-6 text-center">{companionsCount}</span>
              <button type="button" onClick={() => setCompanionsCount((v) => Math.min(maxCompanions, v + 1))} disabled={!roomId || companionsCount >= maxCompanions || isPending} className="w-8 h-8 rounded-md border border-border bg-surface hover:bg-surface-hover flex items-center justify-center disabled:opacity-40"><Plus className="w-3.5 h-3.5" /></button>
              {roomId && <span className="text-xs text-secondary">{t("wards.maxCompanions")}: {maxCompanions}</span>}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-text mb-1 block">{t("wards.colCheckIn")} <span className="text-secondary font-normal">({t("common.optional")})</span></label>
            <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} max={new Date().toISOString().slice(0, 10)} className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm border-border focus:outline-none focus:ring-2 focus:ring-accent/20" />
          </div>

          <div>
            <label className="text-sm font-medium text-text mb-1 block">{t("wards.estimatedDays")}</label>
            <input type="number" min="0" value={days || ""} onChange={(e) => { const d = parseInt(e.target.value, 10); if (!Number.isNaN(d) && d >= 0) setExpectedOut(format(addDays(checkIn ? new Date(checkIn) : new Date(), d), "yyyy-MM-dd")); else if (!e.target.value) setExpectedOut(""); }} placeholder="0" className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20" />
          </div>

          <div>
            <label className="text-sm font-medium text-text mb-1 block">{t("wards.colExpectedOut")}</label>
            <input type="date" value={expectedOut} onChange={(e) => setExpectedOut(e.target.value)} min={checkIn || new Date().toISOString().slice(0, 10)} className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20" />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-text mb-1 block">{t("wards.note")}</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/20" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
        <p className="text-xs font-semibold text-text uppercase tracking-wide">{t("wards.dailyPrices")}</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium text-text mb-1 block">{t("wards.patientPricePerDay")}</label><input type="number" min="0" value={patientPricePerDay} onChange={(e) => setPatientPricePerDay(e.target.value)} className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm" /></div>
          <div><label className="text-sm font-medium text-text mb-1 block">{t("wards.companionPricePerDay")}</label><input type="number" min="0" value={companionPricePerDay} onChange={(e) => setCompanionPricePerDay(e.target.value)} className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm" /></div>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-3">
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1.5"><Gift className="w-4 h-4" />{t("wards.accommodationBonus")} <span className="font-normal">({t("common.optional")})</span></p>
        <input type="number" min="0" value={freeDays} onChange={(e) => setFreeDays(e.target.value)} placeholder="0" className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm" />
        {freeDays && Number(freeDays) > 0 && companionsCount > 0 && <label className="flex items-center gap-2 text-sm text-amber-800"><input type="checkbox" checked={isBonusForCompanions} onChange={(e) => setIsBonusForCompanions(e.target.checked)} />{t("wards.bonusForCompanions")}</label>}
        {bonusAmount > 0 && <p className="text-sm font-medium text-amber-700">{t("wards.accommodationBonusAmount")}: {bonusAmount.toLocaleString("uz-UZ")} UZS</p>}
      </div>

      <div className="rounded-lg border border-primary-200 bg-primary-50 dark:bg-primary-950/20 p-4 space-y-3">
        <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide flex items-center gap-1.5"><Banknote className="w-4 h-4" />{t("wards.prepayment")} <span className="font-normal">({t("common.optional")})</span></p>
        <input type="number" min="0" value={prepaymentAmount} onChange={(e) => setPrepaymentAmount(e.target.value)} placeholder="0" className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm" />
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm">{PAYMENT_METHODS.map((m) => <option key={m} value={m}>{t(`paymentMethods.${m}`)}</option>)}</select>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-md text-sm text-secondary hover:bg-surface-hover border border-border">{t("common.cancel")}</button>
        <button type="button" onClick={() => mutate()} disabled={!roomId || isPending} className="flex-1 px-4 py-2.5 rounded-md text-sm bg-primary text-white hover:bg-primary-700 disabled:opacity-40 flex items-center justify-center gap-2">{isPending && <Loader2 className="w-4 h-4 animate-spin" />}{t("wards.checkIn")}</button>
      </div>
    </div>
  );
}
