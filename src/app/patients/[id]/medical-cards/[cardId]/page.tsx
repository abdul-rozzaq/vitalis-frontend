"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { MedicalCardView } from "@/features/patients/components/MedicalCardView";
import { MedicalCard003 } from "@/features/patients/types";
import { api } from "@/shared/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";

export default function MedicalCardDetailPage() {
  const { id, cardId } = useParams<{ id: string; cardId: string }>();
  const t = useTranslations();

  const { data: card, isLoading } = useQuery<MedicalCard003>({
    queryKey: ["medical-card-003", cardId],
    queryFn: () => api.get(`/medical-cards/003x/${cardId}`).then((r) => r.data),
  });

  async function handleExport() {
    try {
      const res = await api.get(`/medical-cards/003x/${cardId}/export`, { responseType: "blob" });
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
      <div className="flex flex-col min-h-screen">
        <PageHeader title={t("medicalCard.title")} subtitle="003/x" breadcrumbs={[{ label: t("patients.title"), href: "/patients" }]} />
        <PageContent>
          <div className="max-w-3xl space-y-4">
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
        </PageContent>
      </div>
    );
  }

  if (!card) return null;

  const fullName = `${card.patient.last_name} ${card.patient.first_name}`;
  const fmt = (d?: string | null) => d ? new Date(d).toLocaleDateString("uz-UZ") : "—";

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={t("medicalCard.title")}
        subtitle={`${card.id.slice(0, 8).toUpperCase()} · ${t("common.created")}: ${fmt(card.createdAt)}`}
        breadcrumbs={[
          { label: t("patients.title"), href: "/patients" },
          { label: fullName, href: `/patients/${id}` },
          { label: t("medicalCard.myCards"), href: `/patients/${id}/medical-cards` },
          { label: t("medicalCard.title") },
        ]}
        actions={
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3 py-2 bg-surface border border-border text-secondary hover:bg-surface-hover hover:text-text text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {t("medicalCard.downloadWord")}
          </button>
        }
      />
      <PageContent>
        <div className="max-w-3xl space-y-5">
          <MedicalCardView card={card} />

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
      </PageContent>
    </div>
  );
}
