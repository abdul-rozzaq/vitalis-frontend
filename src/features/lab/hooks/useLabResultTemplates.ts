import { api } from "@/shared/lib/api";
import { useQuery } from "@tanstack/react-query";
import { LabResultTemplate } from "../types";

// Shablonlar hech qanday laboratoriya/xizmatga tayinlanmagan — mustaqil ro'yxat.
// Natija jadvalini to'ldirishda laborant shu ro'yxatdan birini tanlaydi.
export function useLabResultTemplates() {
  return useQuery({
    queryKey: ["lab-result-templates"],
    queryFn: () => api.get("/lab-result-templates").then((res) => res.data as LabResultTemplate[]),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
