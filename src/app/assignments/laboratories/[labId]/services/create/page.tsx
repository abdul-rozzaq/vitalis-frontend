"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { LaboratoryServiceForm, LaboratoryServiceFormValues } from "@/features/lab/components/LaboratoryServiceForm";
import { Laboratory } from "@/features/lab/types";
import { api } from "@/shared/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";

export default function CreateLaboratoryServicePage() {
  const { labId } = useParams<{ labId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations();

  const backHref = `/assignments/laboratories`;

  const { data: laboratory } = useQuery<Laboratory>({
    queryKey: ["laboratories", labId],
    queryFn: () => api.get(`/laboratories/${labId}`).then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const createSvc = useMutation({
    mutationFn: (values: LaboratoryServiceFormValues) => api.post(`/laboratories/${labId}/services`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laboratories"] });
      router.push(backHref);
    },
  });

  return (
    <>
      <PageHeader
        title={t("laboratories.addService")}
        subtitle={laboratory?.name}
        breadcrumbs={[
          { label: t("laboratories.title"), href: backHref },
          { label: t("laboratories.addService") },
        ]}
      />
      <PageContent>
        <LaboratoryServiceForm
          onSubmit={(values) => createSvc.mutate(values)}
          onCancel={() => router.push(backHref)}
          isPending={createSvc.isPending}
        />
      </PageContent>
    </>
  );
}

