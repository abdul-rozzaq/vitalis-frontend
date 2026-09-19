import { Invoice } from "@/features/invoices/types";
import { PatientCase } from "@/features/patients/types";
import { api } from "@/shared/lib/api";
import { useQuery } from "@tanstack/react-query";

export interface JournalRecord {
  case: PatientCase;
  invoice: Invoice;
}

export function useJournalData(patientId: string) {
  const casesQuery = useQuery<PatientCase[]>({
    queryKey: ["patient-cases", patientId],
    queryFn: () => api.get(`/patients/${patientId}/cases`).then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const invoicesQuery = useQuery<Invoice[]>({
    queryKey: ["patient-case-invoices", patientId],
    queryFn: () =>
      api
        .get(`/patients/${patientId}/cases/journals`)
        .then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const cases = casesQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];

  const journals: JournalRecord[] = cases
    .filter((c) => c.billingMode === "MASTER")
    .map((c) => ({ case: c, invoice: invoices.find((inv) => inv.sourceId === c.id) }))
    .filter((j): j is JournalRecord => Boolean(j.invoice))
    .sort((a, b) => new Date(b.case.openedAt).getTime() - new Date(a.case.openedAt).getTime());

  const active = journals.find((j) => j.case.status === "ACTIVE") ?? null;
  const history = journals.filter((j) => j.case.status !== "ACTIVE");

  // Jurnal hali boshlanmagan bo'lsa — qaysi ACTIVE case'ni "Jurnal
  // boshlash" bilan MASTER rejimga o'tkazish mumkinligini topib beramiz
  // (odatda bemorda bir vaqtda bitta faol case bo'ladi).
  const activeCaseCandidate =
    !active &&
    cases
      .filter((c) => c.status === "ACTIVE" && c.billingMode !== "MASTER")
      .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime())[0];

  return {
    isLoading: casesQuery.isLoading || invoicesQuery.isLoading,
    isError: casesQuery.isError || invoicesQuery.isError,
    refetch: () => { casesQuery.refetch(); invoicesQuery.refetch(); },
    cases,
    journals,
    active,
    history,
    activeCaseCandidate: activeCaseCandidate || null,
  };
}
