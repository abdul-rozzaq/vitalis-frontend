"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { OperationTypeForm } from "@/features/operations/components/operation-type-form";
import { OperationTypeFormValues } from "@/features/operations/types";
import { api } from "@/shared/lib/api";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const BASE = "/assignments/operation-types";

export default function CreateOperationTypePage() {
  const router = useRouter();
  const t = useTranslations();

  const createMutation = useMutation({
    mutationFn: async (dto: OperationTypeFormValues) => {
      const { doctorIds, ...rest } = dto;
      const res = await api.post("/operation-types", rest);
      const newId: string = res.data.id;
      if (doctorIds && doctorIds.length > 0) {
        await Promise.all(
          doctorIds.map((doctorId) =>
            api.post(`/operation-types/${newId}/doctors`, { doctorId })
          )
        );
      }
      return res.data;
    },
    onSuccess: () => {
      toast.success(t("operationTypes.created"));
      router.push(BASE);
    },
    onError: () => toast.error("Yaratishda xatolik yuz berdi"),
  });

  return (
    <>
      <PageHeader
        title="Yangi operatsiya turi"
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
        <OperationTypeForm
          showDoctorSelector
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => router.push(BASE)}
          isPending={createMutation.isPending}
        />
      </PageContent>
    </>
  );
}