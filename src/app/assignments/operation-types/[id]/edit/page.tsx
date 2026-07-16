"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { DepartmentsSectionEdit } from "@/features/operations/components/departments-section-edit";
import { DoctorsSectionEdit } from "@/features/operations/components/doctors-section-edit";
import { OperationTypeForm } from "@/features/operations/components/operation-type-form";
import { OperationType, OperationTypeFormValues } from "@/features/operations/types";
import { api } from "@/shared/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

const BASE = "/assignments/operation-types";

export default function EditOperationTypePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations();

  const { data: operationType, isLoading } = useQuery<OperationType>({
    queryKey: ["operation-types", id],
    queryFn: () => api.get(`/operation-types/${id}`).then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const updateMutation = useMutation({
    mutationFn: (dto: OperationTypeFormValues) => {
      const { doctorIds: _doctorIds, departmentIds: _departmentIds, ...rest } = dto;
      return api.patch(`/operation-types/${id}`, rest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operation-types"] });
      toast.success("Operatsiya turi yangilandi");
      router.push(BASE);
    },
    onError: () => toast.error("Yangilashda xatolik yuz berdi"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-white/30" />
      </div>
    );
  }

  if (!operationType) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-white/40 text-sm">Operatsiya turi topilmadi</p>
        <button
          onClick={() => router.push(BASE)}
          className="text-xs text-primary hover:underline"
        >
          Ro'yxatga qaytish
        </button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Operatsiya turini tahrirlash"
        actions={
          <button
            onClick={() => router.push(BASE)}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Orqaga
          </button>
        }
      />

      <PageContent>
        {/* Main form + doctors side by side */}
        <div className="space-y-6">
          <OperationTypeForm
            initialData={{
              name: operationType.name,
              description: operationType.description,
              basePrice: Number(operationType.basePrice ?? 0),
              isActive: operationType.isActive,
              departmentId: operationType.department?.id ?? null,
              items: operationType.items.map((i) => ({
                id: i.id,
                name: i.name,
                price: Number(i.price),
                isActive: i.isActive,
              })),
            }}
            onSubmit={(data) => updateMutation.mutate(data)}
            onCancel={() => router.push(BASE)}
            isPending={updateMutation.isPending}
          />

          {/* Doctors section — edit only, below form */}
          <div className="bg-[#161824] border border-white/6 rounded-2xl p-5">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
              Operatsiya doktorlari
            </p>
            <DoctorsSectionEdit
              operationTypeId={id}
              assignedDoctors={operationType.doctors}
            />
          </div>

          {/* Departments section — edit only, below doctors */}
          <div className="bg-[#161824] border border-white/6 rounded-2xl p-5">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
              Operatsiya bo'limlari
            </p>
            <DepartmentsSectionEdit
              operationTypeId={id}
              assignedDepartments={operationType.departments}
            />
          </div>
        </div>
      </PageContent>
    </>
  );
}
