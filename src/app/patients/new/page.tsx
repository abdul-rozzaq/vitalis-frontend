"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { PatientForm } from "@/features/patients/components/patient-form";
import { NewPatientPayload } from "@/features/patients/types";
import { api } from "@/shared/lib/api";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function NewPatientPage() {
  const router = useRouter();
  const t = useTranslations();

  const { mutateAsync: addPatient, isPending } = useMutation({
    mutationFn: (data: NewPatientPayload) => api.post("/patients", data),
    onSuccess: (res) => {
      const id = res.data?.id;
      router.push(id ? `/patients/${id}` : "/patients");
    },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={t("patients.addNewPatient")}
        subtitle={t("patients.addNewDesc")}
        breadcrumbs={[
          { label: t("patients.title"), href: "/patients" },
          { label: t("patients.addNewPatient") },
        ]}
      />
      <PageContent>
        <div className="max-w-2xl">
          <PatientForm
            onSubmit={(data) => addPatient(data)}
            onCancel={() => router.push("/patients")}
            isPending={isPending}
          />
        </div>
      </PageContent>
    </div>
  );
}
