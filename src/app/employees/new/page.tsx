"use client";

import { EmployeeForm, EmployeeSubmitData } from "@/features/employees/components/employee-form";
import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewEmployeePage() {
  const router = useRouter();
  const t = useTranslations();

  const { mutateAsync: addEmployee, isPending } = useMutation({
    mutationFn: (data: any) => api.post("/users", data),
    onSuccess: () => router.push("/employees"),
  });

  const handleSubmit = async (data: EmployeeSubmitData) => {
    const { photoFile, ...rest } = data;
    let photo = rest.photo;

    if (photoFile) {
      const formData = new FormData();
      formData.append("photo", photoFile);
      const res = await api.post("/uploads/photo", formData);
      photo = res.data.url;
    }
    await addEmployee({ ...rest, photo });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto w-full space-y-5">
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
        <Link href="/employees" className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-text transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {t("employees.backToEmployees")}
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        <h2 className="text-xl font-semibold text-text tracking-tight">{t("employees.addNewTitle")}</h2>
        <p className="text-secondary text-sm mt-0.5">{t("employees.addNewDesc")}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <EmployeeForm onSubmit={handleSubmit} onCancel={() => router.push("/employees")} isPending={isPending} />
      </motion.div>
    </div>
  );
}
