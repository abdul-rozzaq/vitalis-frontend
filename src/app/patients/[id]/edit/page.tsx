"use client";

import { PatientForm } from "@/components/patients/patient-form";
import { api } from "@/lib/api";
import { PATIENTS_MOCK_DATA } from "@/lib/mock-data";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
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

  const { mutateAsync: updatePatient, isPending } = useMutation({
    mutationFn: (data: any) => api.patch(`/patients/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient", id] });
      router.push(`/patients/${id}`);
    },
  });

  return (
    <div className="p-6 max-w-2xl mx-auto w-full space-y-5">
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
        <Link href={`/patients/${id}`} className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-text transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {t("patients.backToPatient")}
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        <h2 className="text-xl font-semibold text-text tracking-tight">{t("patients.editPatientSheet")}</h2>
        <p className="text-secondary text-sm mt-0.5">{t("patients.editPatientDesc")}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
          </div>
        ) : (
          <PatientForm
            initialData={{
              ...patient,
              birth_date: patient.birth_date
                ? new Date(patient.birth_date).toISOString().split('T')[0]
                : undefined,
            }}
            onSubmit={(data) => updatePatient(data)}
            onCancel={() => router.push(`/patients/${id}`)}
            isPending={isPending}
          />
        )}
      </motion.div>
    </div>
  );
}
