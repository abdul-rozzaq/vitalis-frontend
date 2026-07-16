"use client";

import { EmployeeForm, EmployeeSubmitData } from "@/features/employees/components/employee-form";
import { api } from "@/shared/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function EditEmployeePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations();

  const { data: employee, isLoading } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => api.get(`/users/${id}`).then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: updateEmployee, isPending } = useMutation({
    mutationFn: (data: any) => api.patch(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", id] });
      router.push("/employees");
    },
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
    await updateEmployee({ ...rest, photo });
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
        <h2 className="text-xl font-semibold text-text tracking-tight">{t("employees.editTitle")}</h2>
        <p className="text-secondary text-sm mt-0.5">{t("employees.editDesc")}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
          </div>
        ) : (
          <EmployeeForm
            initialData={{
              first_name: employee.first_name,
              last_name: employee.last_name,
              phone: employee.phone ?? undefined,
              role: employee.role,
              birthday: employee.birthday ? new Date(employee.birthday).toISOString().split("T")[0] : undefined,
              photo: employee.photo ?? undefined,
              employeeNo: employee.employeeNo ?? undefined,
            }}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/employees")}
            isPending={isPending}
          />
        )}
      </motion.div>
    </div>
  );
}
