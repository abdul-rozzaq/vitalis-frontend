"use client";

import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Download, FileText, User } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";

interface DailyNote {
  date: string;
  note: string;
}

interface MedicalCard003 {
  id: string;
  admissionDate: string;
  dischargeDate: string | null;
  wardNumber: string | null;
  departmentName: string | null;
  doctorName: string | null;
  nurseName: string | null;
  complaints: string | null;
  anamnesis: string | null;
  lifeAnamnesis: string | null;
  diagnosisInitial: string | null;
  diagnosisFinal: string | null;
  treatment: string | null;
  dailyNotes: DailyNote[];
  createdAt: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    birth_date: string;
    gender: string;
    phone_number: string;
    blood_type: string | null;
    pinfl: string | null;
    address: string | null;
    district: { name: string; region: { name: string } | null } | null;
  };
}

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
      <h2 className="text-sm font-semibold text-text uppercase tracking-wider border-b border-border pb-2">
        {title}
      </h2>
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

export default function MedicalCardDetailPage() {
  const { id, cardId } = useParams<{ id: string; cardId: string }>();
  const t = useTranslations();

  const { data: card, isLoading } = useQuery<MedicalCard003>({
    queryKey: ["medical-card-003", cardId],
    queryFn: () => api.get(`/medical-cards/003x/${cardId}`).then((r) => r.data),
  });

  async function handleExport() {
    try {
      const res = await api.get(`/medical-cards/003x/${cardId}/export`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `medical-card-003x-${cardId.slice(0, 8)}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("medicalCard.exportFailed"));
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto w-full space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-5 animate-pulse">
            <div className="h-4 bg-border rounded w-1/4 mb-4" />
            <div className="space-y-2">
              <div className="h-3 bg-border rounded w-3/4" />
              <div className="h-3 bg-border rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!card) return null;

  const patient = card.patient;
  const fullName = `${patient.last_name} ${patient.first_name}`;
  const location = [patient.district?.region?.name, patient.district?.name]
    .filter(Boolean)
    .join(", ");
  const dailyNotes = Array.isArray(card.dailyNotes) ? card.dailyNotes : [];

  return (
    <div className="p-6 max-w-3xl mx-auto w-full space-y-5">
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
        <Link
          href={`/patients/${id}/medical-cards`}
          className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-text transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {t("medicalCard.myCards")}
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-text">{t("medicalCard.title")}</h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {card.id.slice(0, 8).toUpperCase()} · {t("common.created")}: {fmt(card.createdAt)}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border text-secondary hover:bg-surface-hover hover:text-text text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          {t("medicalCard.downloadWord")}
        </button>
      </motion.div>

      {/* Patient Info */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
      >
        <Section title={t("medicalCard.basicInfo")}>
          <Row label="F.I.O" value={fullName} />
          <Row
            label={t("forms.birthDate")}
            value={fmt(patient.birth_date)}
          />
          <Row
            label={t("forms.gender")}
            value={patient.gender === "male" ? "Erkak" : "Ayol"}
          />
          <Row label={t("forms.phone")} value={val(patient.phone_number)} />
          {patient.blood_type && (
            <Row
              label={t("forms.bloodType")}
              value={patient.blood_type.replace(/_/g, " ")}
            />
          )}
          {location && <Row label={t("forms.region")} value={location} />}
          {patient.pinfl && <Row label="PINFL" value={patient.pinfl} />}
        </Section>
      </motion.div>

      {/* Hospitalization */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
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
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Section title={t("medicalCard.complaints")}>
          <TextBlock value={card.complaints} />
        </Section>
      </motion.div>

      {/* Anamnesis */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <Section title={t("medicalCard.anamnesis")}>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-text-muted mb-1">
                {t("medicalCard.anamnesis")}
              </p>
              <TextBlock value={card.anamnesis} />
            </div>
            <div>
              <p className="text-xs font-medium text-text-muted mb-1">
                {t("medicalCard.lifeAnamnesis")}
              </p>
              <TextBlock value={card.lifeAnamnesis} />
            </div>
          </div>
        </Section>
      </motion.div>

      {/* Diagnosis */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
      >
        <Section title={t("medicalCard.diagnosis")}>
          <Row label={t("medicalCard.diagnosisInitial")} value={val(card.diagnosisInitial)} />
          <Row label={t("medicalCard.diagnosisFinal")} value={val(card.diagnosisFinal)} />
        </Section>
      </motion.div>

      {/* Treatment */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
      >
        <Section title={t("medicalCard.treatment")}>
          <TextBlock value={card.treatment} />
        </Section>
      </motion.div>

      {/* Daily Notes */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <Section title={t("medicalCard.dailyNotes")}>
          {dailyNotes.length === 0 ? (
            <p className="text-sm text-text-muted">—</p>
          ) : (
            <div className="space-y-3">
              {dailyNotes.map((note, i) => (
                <div key={i} className="border border-border rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-xs font-medium text-secondary">
                      {fmt(note.date)}
                    </span>
                  </div>
                  <p className="text-sm text-text whitespace-pre-wrap">{note.note}</p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </motion.div>

      {/* Signatures placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Section title={t("medicalCard.signatures")}>
          <div className="grid grid-cols-2 gap-6 py-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-secondary">
                <User className="w-4 h-4 text-text-muted" />
                {val(card.doctorName)}
              </div>
              <div className="border-b border-border pb-1 text-xs text-text-muted">
                {t("medicalCard.doctorSignature")}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-secondary">
                <User className="w-4 h-4 text-text-muted" />
                {val(card.nurseName)}
              </div>
              <div className="border-b border-border pb-1 text-xs text-text-muted">
                {t("medicalCard.nurseSignature")}
              </div>
            </div>
          </div>
        </Section>
      </motion.div>

      {/* Bottom actions */}
      <div className="flex gap-3 pb-6">
        <Link
          href={`/patients/${id}/medical-cards`}
          className="flex-1 text-center bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {t("medicalCard.backToPatient")}
        </Link>
        <button
          onClick={handleExport}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-primary/20 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          {t("medicalCard.downloadWord")}
        </button>
      </div>
    </div>
  );
}
