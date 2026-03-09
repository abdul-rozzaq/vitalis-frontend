"use client";

import { PatientForm } from "@/components/patients/patient-form";
import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewPatientPage() {
  const router = useRouter();

  const { mutateAsync: addPatient, isPending } = useMutation({
    mutationFn: (data: any) => api.post("/patients", data),
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
          Back to Patients
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        <h2 className="text-xl font-semibold text-text tracking-tight">Add New Patient</h2>
        <p className="text-secondary text-sm mt-0.5">Create a new entry in your patient directory.</p>
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
