"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { Combobox } from "@/components/ui/combobox";
import { PaymentMethod, PAYMENT_METHOD_LABELS } from "@/features/invoices/types";
import { api } from "@/shared/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BedDouble, Gift, Loader2, Minus, Plus, UserRound, Users, Banknote } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { differenceInDays, startOfDay, addDays, format } from "date-fns";

const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "CARD", "TRANSFER", "OTHER"];

export default function WardCheckInPage() {
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [patientId, setPatientId] = useState("");
  const [roomId, setRoomId] = useState("");
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

  const { data: patients = [] } = useQuery({
    queryKey: ["patients-available-for-ward"],
    queryFn: () =>
      api.get("/patients", { params: { excludeOccupied: "true" } }).then((r) => r.data),
    staleTime: 0,
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ["ward-doctors"],
    queryFn: () => api.get("/wards/doctors").then((r) => r.data),
  });

  const { data: allRooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => api.get("/rooms").then((r) => r.data),
  });

  const rooms = allRooms.filter((r: any) => r.roomType === "WARD");

  const selectedRoom = rooms.find((r: any) => r.id === roomId) as any | undefined;
  const maxCompanions = selectedRoom
    ? Math.max(0, (selectedRoom.freeSlots ?? selectedRoom.capacity ?? 0) - 1)
    : 0;

  const { data: roomOccupants = [], isLoading: isLoadingOccupants } = useQuery({
    queryKey: ["room-occupants", roomId],
    queryFn: () => api.get(`/wards/room/${roomId}`).then((r) => r.data),
    enabled: !!roomId,
    staleTime: 0,
  });

  const patientOptions = patients.map((p: any) => ({
    label: `${p.first_name} ${p.last_name}`,
    value: p.id,
  }));

  const doctorOptions = doctors.map((d: any) => ({
    label: `${d.first_name} ${d.last_name}`,
    value: d.id,
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
      queryClient.invalidateQueries({ queryKey: ["wards"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["patients-available-for-ward"] });
      router.push("/wards");
    },
  });

  const handleRoomChange = (val: string) => {
    setRoomId(val);
    setCompanionsCount(0);
    const room = rooms.find((r: any) => r.id === val);
    setPatientPricePerDay(room?.department?.patientDailyPrice?.toString() ?? "");
    setCompanionPricePerDay(room?.department?.companionDailyPrice?.toString() ?? "");
    setFreeDays("");
  };

  const parsedCheckIn = checkIn ? new Date(checkIn) : new Date();
  const parsedExpectedOut = expectedOut ? new Date(expectedOut) : null;
  const days = parsedExpectedOut
    ? Math.max(0, differenceInDays(startOfDay(parsedExpectedOut), startOfDay(parsedCheckIn)))
    : 0;

  const patientTotal = days * Number(patientPricePerDay || 0);
  const companionTotal = days * companionsCount * Number(companionPricePerDay || 0);
  const grossTotal = patientTotal + companionTotal;

  const bonusAmount =
    freeDays && patientPricePerDay
      ? Number(freeDays) *
        (Number(patientPricePerDay) +
          (isBonusForCompanions && companionPricePerDay
            ? companionsCount * Number(companionPricePerDay)
            : 0))
      : 0;

  const netTotal = Math.max(0, grossTotal - bonusAmount);

  // Auto-fill prepaymentAmount when netTotal changes
  useEffect(() => {
    // Faqat agar netTotal > 0 bo'lsa va foydalanuvchi hali to'lov kiritmagan bo'lsa yoki netTotal o'zgarsa yangilaymiz
    setPrepaymentAmount(netTotal > 0 ? netTotal.toString() : "");
  }, [netTotal]);

  return (
    <div className="flex flex-col h-full bg-background relative z-0 pb-16 md:pb-0">
      <PageHeader
        title={t("wards.checkInTitle")}
        subtitle={t("wards.checkInDesc")}
      />
      <PageContent>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Chap ustun — Asosiy ma'lumotlar */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-surface rounded-xl shadow-sm border border-border p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                {/* Shifokor */}
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

                {/* Tibbiy karta raqami */}
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
              </div>

              {/* Tanlangan xonadagi bemorlar — preview panel */}
              {roomId && (
                <div className="rounded-lg border border-border bg-surface-hover/50 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface">
                    <BedDouble className="w-3.5 h-3.5 text-secondary" />
                    <span className="text-xs font-medium text-text">
                      {selectedRoom?.name} — {t("wards.currentOccupants")}
                    </span>
                    <span className="ml-auto text-xs text-secondary">
                      {selectedRoom?.occupiedCount ?? 0}/{selectedRoom?.capacity ?? "—"}
                    </span>
                  </div>
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
                          <div key={ward.id} className="flex items-center gap-2.5 px-3 py-2">
                            <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                              <UserRound className="w-3.5 h-3.5 text-accent" />
                            </div>
                            <span className="text-sm text-text flex-1 truncate">{fullName}</span>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                {/* Taxminiy kunlar */}
                <div>
                  <label className="text-sm font-medium text-text mb-1 block">
                    {t("wards.estimatedDays")}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={days || ""}
                    onChange={(e) => {
                      const d = parseInt(e.target.value, 10);
                      if (!isNaN(d) && d >= 0) {
                        const baseDate = checkIn ? new Date(checkIn) : new Date();
                        const newDate = addDays(baseDate, d);
                        setExpectedOut(format(newDate, "yyyy-MM-dd"));
                      } else if (e.target.value === "") {
                        setExpectedOut("");
                      }
                    }}
                    placeholder="0"
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
                    min={checkIn || new Date().toISOString().slice(0, 10)}
                    className="w-full bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                {/* Izoh */}
                <div className="md:col-span-2">
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
            </div>
          </div>

          {/* O'ng ustun — Narxlar, Bonus, To'lov */}
          <div className="space-y-6">
            <div className="bg-surface rounded-xl shadow-sm border border-border p-5 space-y-6">
              
              {/* Kunlik narxlar section */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-text uppercase tracking-wide">
                  {t("wards.dailyPrices")}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-text mb-1 block">
                      {t("wards.patientPricePerDay")}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={patientPricePerDay}
                      onChange={(e) => setPatientPricePerDay(e.target.value)}
                      className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
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
                      className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>
              </div>

              {/* Accommodation bonus section */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-3">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Gift className="w-4 h-4" />
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
                    className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  {freeDays && Number(freeDays) > 0 && companionsCount > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      <input
                        type="checkbox"
                        id="bonusCompanions"
                        checked={isBonusForCompanions}
                        onChange={(e) => setIsBonusForCompanions(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                      />
                      <label htmlFor="bonusCompanions" className="text-sm text-amber-800 cursor-pointer select-none">
                        {t("wards.bonusForCompanions")}
                      </label>
                    </div>
                  )}
                </div>
                {bonusAmount > 0 && (
                  <p className="text-sm font-medium text-amber-700 pt-1">
                    {t("wards.accommodationBonusAmount")}: {bonusAmount.toLocaleString("uz-UZ")} {t("ward.currency")}
                  </p>
                )}
              </div>

              {/* Receipt / Check */}
              <div className="rounded-lg border border-border bg-surface p-4 space-y-3 font-mono text-sm">
                <p className="text-center font-semibold border-b border-dashed border-border pb-2 mb-2">
                  {t("ward.summary", { default: "To'lov xulosasi" })}
                </p>
                
                <div className="flex justify-between">
                  <span>{t("wards.colPatient")} ({days} kun)</span>
                  <span>{patientTotal.toLocaleString("uz-UZ")} {t("ward.currency")}</span>
                </div>
                
                {companionsCount > 0 && (
                  <div className="flex justify-between">
                    <span>{t("wards.companionsCount")} ({companionsCount} {t("wards.person", { default: "kishi" })})</span>
                    <span>{companionTotal.toLocaleString("uz-UZ")} {t("ward.currency")}</span>
                  </div>
                )}
                
                {bonusAmount > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>{t("wards.accommodationBonus", { default: "Chegirma" })}</span>
                    <span>-{bonusAmount.toLocaleString("uz-UZ")} {t("ward.currency")}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-bold border-t border-dashed border-border pt-2 mt-2">
                  <span>{t("ward.totalRequired", { default: "Jami to'lanishi kerak" })}</span>
                  <span>{netTotal.toLocaleString("uz-UZ")} {t("ward.currency")}</span>
                </div>
              </div>

              {/* Prepayment section */}
              <div className="rounded-lg border border-primary-200 bg-primary-50 dark:bg-primary-950/20 p-4 space-y-4">
                <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Banknote className="w-4 h-4" />
                  {t("wards.prepayment")}
                  <span className="font-normal normal-case ml-1">({t("common.optional")})</span>
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-text mb-1 block">
                      {t("wards.prepaymentAmount")}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={prepaymentAmount}
                      onChange={(e) => setPrepaymentAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text mb-1 block">
                      {t("payments.qp.method")}
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {t(`paymentMethods.${method}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => mutate()}
                  disabled={!patientId || !roomId || isPending}
                  className="w-full py-2.5 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm shadow-primary-600/20"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("wards.checkIn")}
                </button>
                <button
                  onClick={() => router.push("/wards")}
                  className="w-full py-2.5 rounded-md text-sm font-medium text-secondary hover:bg-surface-hover border border-border transition-colors"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageContent>
    </div>
  );
}
