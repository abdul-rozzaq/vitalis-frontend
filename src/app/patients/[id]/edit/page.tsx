"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { PatientForm } from "@/features/patients/components/patient-form";
import { api } from "@/shared/lib/api";
import { PATIENTS_MOCK_DATA } from "@/shared/lib/mock-data";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";

export default function EditPatientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations();

  const { data: patientData, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.get(`/patients/${id}`).then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const patient = patientData ?? PATIENTS_MOCK_DATA.find((p) => p.id === id) ?? PATIENTS_MOCK_DATA[0];
  const fullName = patient ? `${patient.first_name} ${patient.last_name}` : "...";

  const { mutateAsync: updatePatient, isPending } = useMutation({
    mutationFn: (data: any) => api.patch(`/patients/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient", id] });
      router.push(`/patients/${id}`);
    },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={t("patients.editPatientSheet")}
        subtitle={t("patients.editPatientDesc")}
        breadcrumbs={[
          { label: t("patients.title"), href: "/patients" },
          { label: fullName, href: `/patients/${id}` },
          { label: t("patients.editPatientSheet") },
        ]}
      />
      <PageContent>
        <div className="max-w-2xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
            </div>
          ) : (
            <PatientForm
              initialData={{
                ...patient,
                birth_date: patient.birth_date ? new Date(patient.birth_date).toISOString().split("T")[0] : undefined,
              }}
              onSubmit={(data) => updatePatient(data)}
              onCancel={() => router.push(`/patients/${id}`)}
              isPending={isPending}
            />
          )}
        </div>
      </PageContent>
    </div>
  );
}
