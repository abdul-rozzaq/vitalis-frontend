"use client";

import { MedicineCombobox } from "@/features/appointments/components/medicine-combobox";
import { MealRelation, Prescription } from "@/features/appointments/types";
import { api } from "@/shared/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

type ItemInput = {
  medicineId: string;
  medicineName?: string;
  dosage: string;
  frequency: number;
  startDate: string;
  endDate: string;
  mealRelation: MealRelation;
  specificTime?: string;
  note?: string;
};

type FormValues = {
  items: ItemInput[];
};

interface PrescriptionEditorProps {
  appointmentId: string;
  initialData?: Prescription | null;
  enterAddsRow?: boolean;
}

const EMPTY_ROW: ItemInput = {
  medicineId: "",
  medicineName: "",
  dosage: "",
  frequency: 1,
  startDate: "",
  endDate: "",
  mealRelation: "AFTER_MEAL",
  specificTime: "",
  note: "",
};

export function PrescriptionEditor({ appointmentId, initialData, enterAddsRow }: PrescriptionEditorProps) {
  const t = useTranslations();
  const queryClient = useQueryClient();

  const { control, handleSubmit, setValue } = useForm<FormValues>({
    defaultValues: {
      items:
        initialData?.items?.map((item) => ({
          medicineId: item.medicineId,
          medicineName: item.medicine?.name,
          dosage: item.dosage,
          frequency: item.frequency,
          startDate: item.startDate?.slice(0, 10),
          endDate: item.endDate?.slice(0, 10),
          mealRelation: item.mealRelation,
          specificTime: item.specificTime ?? "",
          note: item.note ?? "",
        })) ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = useWatch({ control, name: "items" });

  const { mutateAsync: savePrescription, isPending } = useMutation({
    mutationFn: (data: FormValues) => api.post("/prescriptions", { appointmentId, items: data.items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["appointments", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  const onSubmit = (values: FormValues) => {
    const normalized = values.items.map((item) => ({
      ...item,
      specificTime: item.mealRelation === "AT_SPECIFIC_TIME" ? item.specificTime || undefined : undefined,
      note: item.note || undefined,
    }));
    void savePrescription({ items: normalized });
  };

  // Note inputida Enter bosganda yangi qator qo'shadi
  const handleNoteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (enterAddsRow && e.key === "Enter") {
      e.preventDefault();
      append({ ...EMPTY_ROW });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-text">{t("appointments.prescription")}</h3>
        <button
          type="button"
          onClick={() => append({ ...EMPTY_ROW })}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          {t("prescription.addRow")}
        </button>
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-text-muted border border-dashed border-border rounded-lg p-4 text-center">
          {t("appointments.noPrescription")}
        </p>
      ) : (
        <div className="space-y-2">
          {fields.map((field, idx) => {
            const mealRelation = items?.[idx]?.mealRelation;
            const cell = "bg-surface border border-border rounded-md px-2.5 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-accent/30";
            const isLast = idx === fields.length - 1;
            return (
              <div key={field.id} className="border border-border rounded-lg p-3 space-y-2 bg-surface">
                {/* Row 1: Medicine · Dosage · Frequency */}
                <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 items-start">
                  <div>
                    <label className="text-xs text-secondary mb-1 block">{t("prescription.medicine")}</label>
                    <MedicineCombobox
                      value={items?.[idx]?.medicineId}
                      displayName={items?.[idx]?.medicineName || undefined}
                      onChange={(medicine) => {
                        setValue(`items.${idx}.medicineId`, medicine.id, { shouldDirty: true });
                        setValue(`items.${idx}.medicineName`, medicine.name, { shouldDirty: true });
                      }}
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-secondary mb-1 block">{t("prescription.dosage")}</label>
                    <input
                      value={items?.[idx]?.dosage || ""}
                      onChange={(e) => setValue(`items.${idx}.dosage`, e.target.value, { shouldDirty: true })}
                      className={cell}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-secondary mb-1 block">{t("prescription.frequency")}</label>
                    <input
                      type="number"
                      min={1}
                      value={items?.[idx]?.frequency || 1}
                      onChange={(e) => setValue(`items.${idx}.frequency`, Number(e.target.value || 1), { shouldDirty: true })}
                      className={cell}
                    />
                  </div>
                </div>

                {/* Row 2: Start · End · Meal · (time) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="text-xs text-secondary mb-1 block">{t("prescription.startDate")}</label>
                    <input
                      type="date"
                      value={items?.[idx]?.startDate || ""}
                      onChange={(e) => setValue(`items.${idx}.startDate`, e.target.value, { shouldDirty: true })}
                      className={cell}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-secondary mb-1 block">{t("prescription.endDate")}</label>
                    <input
                      type="date"
                      value={items?.[idx]?.endDate || ""}
                      onChange={(e) => setValue(`items.${idx}.endDate`, e.target.value, { shouldDirty: true })}
                      className={cell}
                    />
                  </div>
                  <div className={mealRelation === "AT_SPECIFIC_TIME" ? "" : "sm:col-span-2"}>
                    <label className="text-xs text-secondary mb-1 block">{t("prescription.mealRelation")}</label>
                    <select
                      value={mealRelation || "AFTER_MEAL"}
                      onChange={(e) => setValue(`items.${idx}.mealRelation`, e.target.value as MealRelation, { shouldDirty: true })}
                      className={cell}
                    >
                      <option value="BEFORE_MEAL">{t("prescription.beforeMeal")}</option>
                      <option value="AFTER_MEAL">{t("prescription.afterMeal")}</option>
                      <option value="WITH_MEAL">{t("prescription.withMeal")}</option>
                      <option value="AT_SPECIFIC_TIME">{t("prescription.atTime")}</option>
                    </select>
                  </div>
                  {mealRelation === "AT_SPECIFIC_TIME" && (
                    <div>
                      <label className="text-xs text-secondary mb-1 block">{t("prescription.specificTime")}</label>
                      <input
                        type="time"
                        value={items?.[idx]?.specificTime || ""}
                        onChange={(e) => setValue(`items.${idx}.specificTime`, e.target.value, { shouldDirty: true })}
                        className={cell}
                      />
                    </div>
                  )}
                </div>

                {/* Row 3: Note · Remove */}
                <div className="flex items-center gap-2">
                  <input
                    value={items?.[idx]?.note || ""}
                    onChange={(e) => setValue(`items.${idx}.note`, e.target.value, { shouldDirty: true })}
                    // ✅ Oxirgi qatorda Enter bosganda yangi qator qo'shiladi
                    onKeyDown={isLast ? handleNoteKeyDown : undefined}
                    placeholder={
                      enterAddsRow && isLast
                        ? `${t("prescription.note")} · Enter → yangi qator`
                        : t("prescription.note")
                    }
                    className={`${cell} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="shrink-0 inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t("prescription.remove")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-primary hover:bg-primary-700 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary-600/20 cursor-pointer inline-flex items-center gap-2"
      >
        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        {t("prescription.save")}
      </button>
    </form>
  );
}