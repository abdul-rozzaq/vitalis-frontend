import { useMemo, useState } from "react";
import { Laboratory } from "../types";

/**
 * LAB turidagi case-step (yoki mustaqil lab buyurtmasi) uchun umumiy holat.
 * Bir nechta laboratoriyaga bir vaqtda yuborish, har biri uchun xizmat
 * tanlash va invois vaqtini belgilash — bu bemor sahifasidagi case-step
 * formasi bilan lab bo'limidan to'g'ridan-to'g'ri buyurtma yaratish
 * oynasi orasida bir xil ishlashi uchun umumlashtirilgan.
 */
export function useLabStepState(labDepts: Laboratory[]) {
  const [labDepartmentIds, setLabDepartmentIds] = useState<string[]>([]);
  const [serviceIdsByLab, setServiceIdsByLab] = useState<Record<string, string[]>>({});
  const [labInvoiceTiming, setLabInvoiceTiming] = useState<"now" | "defer">("now");
  // null = foydalanuvchi hali summani qo'lda tahrirlamagan — bu holatda
  // tanlangan xizmatlar narxlari yig'indisi avtomatik ko'rsatiladi.
  const [labAmountOverride, setLabAmountOverride] = useState<string | null>(null);

  const toggleLabDepartment = (labId: string) => {
    setLabDepartmentIds((prev) => {
      if (prev.includes(labId)) {
        setServiceIdsByLab((svc) => {
          const rest = { ...svc };
          delete rest[labId];
          return rest;
        });
        return prev.filter((id) => id !== labId);
      }
      return [...prev, labId];
    });
  };

  const removeLabDepartment = (labId: string) => {
    setLabDepartmentIds((prev) => prev.filter((id) => id !== labId));
    setServiceIdsByLab((prev) => {
      const rest = { ...prev };
      delete rest[labId];
      return rest;
    });
  };

  const setServicesForLab = (labId: string, serviceIds: string[]) => {
    setServiceIdsByLab((prev) => ({ ...prev, [labId]: serviceIds }));
  };

  const labNominalTotal = useMemo(() => {
    return labDepartmentIds.reduce((sum, labId) => {
      const dept = labDepts.find((d) => d.id === labId);
      const selectedIds = serviceIdsByLab[labId] ?? [];
      const deptSum = (dept?.services ?? [])
        .filter((s) => selectedIds.includes(s.id))
        .reduce((s, svc) => s + (svc.price ?? 0), 0);
      return sum + deptSum;
    }, 0);
  }, [labDepartmentIds, serviceIdsByLab, labDepts]);

  const labAmount = labAmountOverride ?? (labNominalTotal ? String(labNominalTotal) : "");

  const reset = () => {
    setLabDepartmentIds([]);
    setServiceIdsByLab({});
    setLabInvoiceTiming("now");
    setLabAmountOverride(null);
  };

  const isValid =
    labDepartmentIds.length > 0 && labDepartmentIds.every((labId) => (serviceIdsByLab[labId] ?? []).length > 0);

  const buildPayload = () => {
    const allServiceIds = labDepartmentIds.flatMap((labId) => serviceIdsByLab[labId] ?? []);
    const payload: Record<string, unknown> = {
      type: "LAB",
      serviceIds: allServiceIds,
      deferLabInvoice: labInvoiceTiming === "defer",
    };
    if (labInvoiceTiming === "now" && labAmount.trim() !== "") {
      payload.labTotalPrice = Number(labAmount);
    }
    return payload;
  };

  return {
    labDepartmentIds,
    serviceIdsByLab,
    labInvoiceTiming,
    setLabInvoiceTiming,
    labAmountOverride,
    setLabAmountOverride,
    toggleLabDepartment,
    removeLabDepartment,
    setServicesForLab,
    labNominalTotal,
    labAmount,
    isValid,
    reset,
    buildPayload,
  };
}

export type LabStepState = ReturnType<typeof useLabStepState>;
