"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { MedicalCardForm } from "@/features/patients/components/MedicalCardForm";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";

export default function NewMedicalCardPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations();
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={t("medicalCard.title")}
        subtitle="003/x"
        breadcrumbs={[
          { label: t("patients.title"), href: "/patients" },
          { label: t("medicalCard.backToPatient"), href: `/patients/${id}` },
          { label: t("medicalCard.newCard") },
        ]}
      />
      <PageContent>
        <div className="max-w-3xl">
          <MedicalCardForm
            patientId={id}
            onSuccess={(cardId) => router.push(`/patients/${id}/medical-cards/${cardId}`)}
            onCancel={() => router.push(`/patients/${id}`)}
          />
        </div>
      </PageContent>
    </div>
  );
}
