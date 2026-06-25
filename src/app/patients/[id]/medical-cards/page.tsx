"use client";

import { api } from "@/shared/lib/api";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ClipboardList, FileText, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";

interface MedicalCard003 {
  id: string;
  admissionDate: string;
  dischargeDate: string | null;
  departmentName: string | null;
  doctorName: string | null;
  diagnosisFinal: string | null;
  diagnosisInitial: string | null;
  createdAt: string;
}

export default function MedicalCardsListPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations();

  const { data: cards = [], isLoading } = useQuery<MedicalCard003[]>({
    queryKey: ["patient-medical-cards", id],
    queryFn: () => api.get(`/patients/${id}/medical-cards`).then((r) => r.data),
  });

  const { data: patient } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.get(`/patients/${id}`).then((r) => r.data),
  });

  const fullName = patient ? `${patient.first_name} ${patient.last_name}` : "...";

  return (
    <div className="p-6 max-w-4xl mx-auto w-full space-y-5">
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
        <Link
          href={`/patients/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-text transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {t("medicalCard.backToPatient")}
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-text">{t("medicalCard.myCards")}</h1>
          <p className="text-sm text-secondary">{fullName}</p>
        </div>
        <Link
          href={`/patients/${id}/medical-cards/new`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          {t("medicalCard.newCard")}
        </Link>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-border rounded w-1/3 mb-3" />
              <div className="h-3 bg-border rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <ClipboardList className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-secondary text-sm">{t("medicalCard.noCards")}</p>
          <Link
            href={`/patients/${id}/medical-cards/new`}
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("medicalCard.createCard")}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <div className="bg-surface border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-text">
                        003/x — {card.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-secondary">
                      {t("medicalCard.admissionDate")}:{" "}
                      {new Date(card.admissionDate).toLocaleDateString()}
                      {card.dischargeDate && (
                        <> → {new Date(card.dischargeDate).toLocaleDateString()}</>
                      )}
                    </p>
                    {card.departmentName && (
                      <p className="text-xs text-secondary">{card.departmentName}</p>
                    )}
                    {(card.diagnosisFinal || card.diagnosisInitial) && (
                      <p className="text-xs text-text-muted line-clamp-1">
                        {card.diagnosisFinal ?? card.diagnosisInitial}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/patients/${id}/medical-cards/${card.id}`}
                    className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-secondary hover:text-text bg-surface border border-border hover:bg-surface-hover px-2.5 py-1.5 rounded-md transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {t("medicalCard.viewCard")}
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
