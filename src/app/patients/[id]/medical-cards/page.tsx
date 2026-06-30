"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { MedicalCardListItem } from "@/features/patients/components/MedicalCardListItem";
import { MedicalCard003Summary } from "@/features/patients/types";
import { api } from "@/shared/lib/api";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function MedicalCardsListPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations();

  const { data: cards = [], isLoading } = useQuery<MedicalCard003Summary[]>({
    queryKey: ["patient-medical-cards", id],
    queryFn: () => api.get(`/patients/${id}/medical-cards`).then((r) => r.data),
  });

  const { data: patient } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.get(`/patients/${id}`).then((r) => r.data),
  });

  const fullName = patient ? `${patient.first_name} ${patient.last_name}` : "...";

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={t("medicalCard.myCards")}
        subtitle={fullName}
        breadcrumbs={[
          { label: t("patients.title"), href: "/patients" },
          { label: fullName, href: `/patients/${id}` },
          { label: t("medicalCard.myCards") },
        ]}
        actions={
          <Link
            href={`/patients/${id}/medical-cards/new`}
            className="inline-flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            {t("medicalCard.newCard")}
          </Link>
        }
      />
      <PageContent>
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
                <MedicalCardListItem card={card} patientId={id} />
              </motion.div>
            ))}
          </div>
        )}
      </PageContent>
    </div>
  );
}
