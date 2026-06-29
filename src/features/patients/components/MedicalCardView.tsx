"use client";

import { MedicalCard003 } from "@/features/patients/types";
import { Calendar, User } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

// ── Private helpers ──────────────────────────────────────────────────────────

function fmt(date?: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("uz-UZ");
}

function val(v?: string | null): string {
  return v?.trim() || "—";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
      <h2 className="text-sm font-semibold text-text uppercase tracking-wider border-b border-border pb-2">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
      <span className="text-xs font-medium text-text-muted sm:w-40 shrink-0">{label}</span>
      <span className="text-sm text-text">{value}</span>
    </div>
  );
}

function TextBlock({ value }: { value: string | null }) {
  if (!value?.trim()) return <p className="text-sm text-text-muted">—</p>;
  return <p className="text-sm text-text whitespace-pre-wrap">{value}</p>;
}

// ── Component ────────────────────────────────────────────────────────────────

interface MedicalCardViewProps {
  card: MedicalCard003;
}

export function MedicalCardView({ card }: MedicalCardViewProps) {
  const t = useTranslations();
  const patient = card.patient;
  const fullName = `${patient.last_name} ${patient.first_name}`;
  const location = [patient.district?.region?.name, patient.district?.name].filter(Boolean).join(", ");
  const dailyNotes = Array.isArray(card.dailyNotes) ? card.dailyNotes : [];

  return (
    <>
      {/* Patient Info */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <Section title={t("medicalCard.basicInfo")}>
          <Row label="F.I.O" value={fullName} />
          <Row label={t("forms.birthDate")} value={fmt(patient.birth_date)} />
          <Row label={t("forms.gender")} value={patient.gender === "male" ? "Erkak" : "Ayol"} />
          <Row label={t("forms.phone")} value={val(patient.phone_number)} />
          {patient.blood_type && <Row label={t("forms.bloodType")} value={patient.blood_type.replace(/_/g, " ")} />}
          {location && <Row label={t("forms.region")} value={location} />}
          {patient.pinfl && <Row label="PINFL" value={patient.pinfl} />}
        </Section>
      </motion.div>

      {/* Hospitalization */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Section title={t("medicalCard.hospitalization")}>
          <Row label={t("medicalCard.admissionDate")} value={fmt(card.admissionDate)} />
          <Row label={t("medicalCard.dischargeDate")} value={fmt(card.dischargeDate)} />
          <Row label={t("medicalCard.wardNumber")} value={val(card.wardNumber)} />
          <Row label={t("medicalCard.departmentName")} value={val(card.departmentName)} />
          <Row label={t("medicalCard.doctorName")} value={val(card.doctorName)} />
          <Row label={t("medicalCard.nurseName")} value={val(card.nurseName)} />
        </Section>
      </motion.div>

      {/* Complaints */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Section title={t("medicalCard.complaints")}>
          <TextBlock value={card.complaints} />
        </Section>
      </motion.div>

      {/* Anamnesis */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <Section title={t("medicalCard.anamnesis")}>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-text-muted mb-1">{t("medicalCard.anamnesis")}</p>
              <TextBlock value={card.anamnesis} />
            </div>
            <div>
              <p className="text-xs font-medium text-text-muted mb-1">{t("medicalCard.lifeAnamnesis")}</p>
              <TextBlock value={card.lifeAnamnesis} />
            </div>
          </div>
        </Section>
      </motion.div>

      {/* Diagnosis */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <Section title={t("medicalCard.diagnosis")}>
          <Row label={t("medicalCard.diagnosisInitial")} value={val(card.diagnosisInitial)} />
          <Row label={t("medicalCard.diagnosisFinal")} value={val(card.diagnosisFinal)} />
        </Section>
      </motion.div>

      {/* Treatment */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
        <Section title={t("medicalCard.treatment")}>
          <TextBlock value={card.treatment} />
        </Section>
      </motion.div>

      {/* Daily Notes */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
        <Section title={t("medicalCard.dailyNotes")}>
          {dailyNotes.length === 0 ? (
            <p className="text-sm text-text-muted">—</p>
          ) : (
            <div className="space-y-3">
              {dailyNotes.map((note, i) => (
                <div key={i} className="border border-border rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-xs font-medium text-secondary">{fmt(note.date)}</span>
                  </div>
                  <p className="text-sm text-text whitespace-pre-wrap">{note.note}</p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </motion.div>

      {/* Signatures */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Section title={t("medicalCard.signatures")}>
          <div className="grid grid-cols-2 gap-6 py-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-secondary">
                <User className="w-4 h-4 text-text-muted" />
                {val(card.doctorName)}
              </div>
              <div className="border-b border-border pb-1 text-xs text-text-muted">{t("medicalCard.doctorSignature")}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-secondary">
                <User className="w-4 h-4 text-text-muted" />
                {val(card.nurseName)}
              </div>
              <div className="border-b border-border pb-1 text-xs text-text-muted">{t("medicalCard.nurseSignature")}</div>
            </div>
          </div>
        </Section>
      </motion.div>
    </>
  );
}
