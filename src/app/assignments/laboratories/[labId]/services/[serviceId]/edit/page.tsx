"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { LaboratoryServiceForm, LaboratoryServiceFormValues } from "@/features/lab/components/LaboratoryServiceForm";
import { Laboratory } from "@/features/lab/types";
import { api } from "@/shared/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";

export default function EditLaboratoryServicePage() {
  const { labId, serviceId } = useParams<{ labId: string; serviceId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations();

  const backHref = `/assignments/laboratories`;

  // Xizmatning o'zi uchun alohida endpoint yo'q — laboratoriyani olib, ichidan topamiz.
  const { data: laboratory, isLoading } = useQuery<Laboratory>({
    queryKey: ["laboratories", labId],
    queryFn: () => api.get(`/laboratories/${labId}`).then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const service = laboratory?.services.find((s) => s.id === serviceId);

  const updateSvc = useMutation({
    mutationFn: (values: LaboratoryServiceFormValues) => api.patch(`/laboratories/${labId}/services/${serviceId}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laboratories"] });
      router.push(backHref);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-text-muted text-sm">{t("laboratories.serviceNotFound")}</p>
        <button onClick={() => router.push(backHref)} className="text-xs text-primary hover:underline">
          {t("common.backTo", { page: t("laboratories.title") })}
        </button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={t("laboratories.editService")}
        subtitle={laboratory?.name}
        breadcrumbs={[
          { label: t("laboratories.title"), href: backHref },
          { label: service.name },
        ]}
      />
      <PageContent>
        <LaboratoryServiceForm
          initialData={service}
          onSubmit={(values) => updateSvc.mutate(values)}
          onCancel={() => router.push(backHref)}
          isPending={updateSvc.isPending}
        />
      </PageContent>
    </>
  );
}
