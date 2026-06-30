"use client";

import { api } from "@/shared/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFieldArray, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

// ── Private helpers ──────────────────────────────────────────────────────────

const inputCls = "w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm";
const textareaCls = "w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm resize-none";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-text uppercase tracking-wider border-b border-border pb-2">{children}</h2>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const dailyNoteSchema = z.object({ date: z.string().min(1), note: z.string().min(1) });

const schema = z.object({
  admissionDate: z.string().min(1),
  dischargeDate: z.string().optional(),
  wardNumber: z.string().optional(),
  departmentName: z.string().optional(),
  doctorName: z.string().optional(),
  nurseName: z.string().optional(),
  complaints: z.string().optional(),
  anamnesis: z.string().optional(),
  lifeAnamnesis: z.string().optional(),
  diagnosisInitial: z.string().optional(),
  diagnosisFinal: z.string().optional(),
  treatment: z.string().optional(),
  dailyNotes: z.array(dailyNoteSchema),
});

type FormValues = z.infer<typeof schema>;

// ── Component ────────────────────────────────────────────────────────────────

interface MedicalCardFormProps {
  patientId: string;
  onSuccess: (cardId: string) => void;
  onCancel: () => void;
}

export function MedicalCardForm({ patientId, onSuccess, onCancel }: MedicalCardFormProps) {
  const t = useTranslations();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: { dailyNotes: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "dailyNotes" });

  const { mutate, isPending } = useMutation<{ data: { id: string } }, Error, FormValues>({
    mutationFn: (data: FormValues) =>
      api.post("/medical-cards/003x", {
        ...data,
        patientId,
        dischargeDate: data.dischargeDate || null,
      }),
    onSuccess: (res: any) => {
      toast.success(t("medicalCard.cardSaved"));
      onSuccess(res.data.id);
    },
    onError: () => {
      toast.error(t("notifications.error"));
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-8">
      {/* Hospitalization */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <SectionTitle>{t("medicalCard.hospitalization")}</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("medicalCard.admissionDate")} error={errors.admissionDate?.message}>
            <input type="date" {...register("admissionDate")} className={inputCls} />
          </Field>
          <Field label={`${t("medicalCard.dischargeDate")} (${t("common.optional").replace(/[()]/g, "")})`}>
            <input type="date" {...register("dischargeDate")} className={inputCls} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("medicalCard.wardNumber")}>
            <input {...register("wardNumber")} placeholder="220-A" className={inputCls} />
          </Field>
          <Field label={t("medicalCard.departmentName")}>
            <input {...register("departmentName")} placeholder={t("medicalCard.wardPlaceholder")} className={inputCls} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("medicalCard.doctorName")}>
            <input {...register("doctorName")} placeholder="Dr. Karimov" className={inputCls} />
          </Field>
          <Field label={t("medicalCard.nurseName")}>
            <input {...register("nurseName")} placeholder={t("medicalCard.nursePlaceholder")} className={inputCls} />
          </Field>
        </div>
      </motion.div>

      {/* Complaints */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <SectionTitle>{t("medicalCard.complaints")}</SectionTitle>
        <Field label={t("medicalCard.complaints")}>
          <textarea {...register("complaints")} rows={4} className={textareaCls} placeholder={t("medicalCard.complaintPlaceholder")} />
        </Field>
      </motion.div>

      {/* Anamnesis */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <SectionTitle>{t("medicalCard.anamnesis")}</SectionTitle>
        <Field label={t("medicalCard.anamnesis")}>
          <textarea {...register("anamnesis")} rows={4} className={textareaCls} placeholder="Kasallik tarixi..." />
        </Field>
        <Field label={t("medicalCard.lifeAnamnesis")}>
          <textarea {...register("lifeAnamnesis")} rows={4} className={textareaCls} placeholder="Hayot tarixi..." />
        </Field>
      </motion.div>

      {/* Diagnosis */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <SectionTitle>{t("medicalCard.diagnosis")}</SectionTitle>
        <Field label={t("medicalCard.diagnosisInitial")}>
          <input {...register("diagnosisInitial")} className={inputCls} placeholder={t("medicalCard.preliminaryDiagnosisPlaceholder")} />
        </Field>
        <Field label={t("medicalCard.diagnosisFinal")}>
          <input {...register("diagnosisFinal")} className={inputCls} placeholder={t("medicalCard.finalDiagnosisPlaceholder")} />
        </Field>
      </motion.div>

      {/* Treatment */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <SectionTitle>{t("medicalCard.treatment")}</SectionTitle>
        <Field label={t("medicalCard.treatment")}>
          <textarea {...register("treatment")} rows={5} className={textareaCls} placeholder={t("medicalCard.treatmentPlanPlaceholder")} />
        </Field>
      </motion.div>

      {/* Daily Notes */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle>{t("medicalCard.dailyNotes")}</SectionTitle>
          <button
            type="button"
            onClick={() => append({ date: new Date().toISOString().slice(0, 10), note: "" })}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 bg-primary-50 hover:bg-primary-100 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("medicalCard.addNote")}
          </button>
        </div>
        {fields.length === 0 && <p className="text-sm text-secondary text-center py-4">{t("medicalCard.noCards")}</p>}
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <input type="date" {...register(`dailyNotes.${index}.date`)} className={`${inputCls} flex-1`} />
                <button type="button" onClick={() => remove(index)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <textarea {...register(`dailyNotes.${index}.note`)} rows={3} className={textareaCls} placeholder="Kunlik kuzatuv..." />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Submit */}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 text-center bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          {t("common.cancel")}
        </button>
        <button type="submit" disabled={isPending} className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-primary/20 cursor-pointer">
          {isPending ? t("medicalCard.saving") : t("medicalCard.saveCard")}
        </button>
      </div>
    </form>
  );
}
