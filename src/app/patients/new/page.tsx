"use client";

import { PatientForm } from "@/components/patients/patient-form";
import { NewPatientPayload } from "@/features/patients/new/types";
import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
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
    <div className="p-6 max-w-2xl mx-auto w-full space-y-5">
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
        <Link href="/patients" className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-text transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {t("patients.backToPatients")}
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        <h2 className="text-xl font-semibold text-text tracking-tight">{t("patients.addNewPatient")}</h2>
        <p className="text-secondary text-sm mt-0.5">{t("patients.addNewDesc")}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <PatientForm
          onSubmit={(data) => addPatient(data)}
          onCancel={() => router.push("/patients")}
          isPending={isPending}
        />
      </motion.div>
    </div>
  );
}
