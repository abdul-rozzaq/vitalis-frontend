"use client";

import { Combobox } from "@/components/ui/combobox";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { LabStepState } from "../hooks/useLabStepState";
import { Laboratory } from "../types";

interface LabStepFieldsProps {
  labDepts: Laboratory[];
  state: LabStepState;
}

/**
 * Barcha lab bo'limlarini doim ko'rinadigan qilib ko'rsatadi — combobox
 * ichida "tanlandi" deb yashirilmaydi, o'rniga har bir bo'lim o'zining
 * joyida tanlangan/tanlanmagan holatini belgi bilan ko'rsatadi. Shu
 * dizayn bemor case-step formasida va lab bo'limidan mustaqil buyurtma
 * yaratishda bir xil ishlatiladi.
 */
export function LabStepFields({ labDepts, state }: LabStepFieldsProps) {
  const t = useTranslations();
  const {
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
  } = state;

  const inputCls =
    "w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm";

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text">{t("lab.labDepartments")}</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {labDepts.map((dept) => {
            const isSelected = labDepartmentIds.includes(dept.id);
            return (
              <button
                key={dept.id}
                type="button"
                onClick={() => toggleLabDepartment(dept.id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary-50/60 text-primary"
                    : "border-border text-text hover:bg-surface-hover"
                }`}
              >
                <span
                  className={`shrink-0 w-4 h-4 rounded-[5px] border flex items-center justify-center ${
                    isSelected ? "bg-primary border-primary text-white" : "border-border"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" strokeWidth={3} />}
                </span>
                <span className="truncate">{dept.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {labDepartmentIds.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {labDepartmentIds.map((labId) => {
            const dept = labDepts.find((d) => d.id === labId);
            if (!dept) return null;
            const selectedForLab = serviceIdsByLab[labId] ?? [];
            const allSelected = dept.services.length > 0 && selectedForLab.length === dept.services.length;
            return (
              <div key={labId} className="space-y-2 border border-border rounded-lg p-3 bg-surface/50 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-medium text-text truncate">{dept.name}</label>
                  <button
                    type="button"
                    onClick={() => removeLabDepartment(labId)}
                    className="shrink-0 text-xs text-danger-500 hover:underline cursor-pointer"
                  >
                    {t("lab.removeLab")}
                  </button>
                </div>
                <Combobox
                  multiple
                  options={dept.services.map((svc) => ({
                    value: svc.id,
                    label: svc.name,
                    sublabel: svc.price != null ? `${svc.price.toLocaleString()} UZS` : undefined,
                  }))}
                  value={selectedForLab}
                  onChange={(ids) => setServicesForLab(labId, ids)}
                  placeholder={t("lab.services")}
                />
                <button
                  type="button"
                  onClick={() => setServicesForLab(labId, allSelected ? [] : dept.services.map((s) => s.id))}
                  className={`w-full text-xs font-medium rounded-md px-2.5 py-1.5 border transition-colors cursor-pointer ${
                    allSelected
                      ? "border-primary bg-primary-50/60 text-primary"
                      : "border-border text-text-muted hover:bg-surface-hover hover:text-text"
                  }`}
                >
                  {allSelected ? t("lab.deselectAll") : t("lab.selectAll")}
                </button>
                {selectedForLab.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {dept.services
                      .filter((svc) => selectedForLab.includes(svc.id))
                      .map((svc) => (
                        <span
                          key={svc.id}
                          className="inline-flex items-center gap-1 text-xs bg-primary-50/60 text-primary border border-primary-200 rounded-full pl-2.5 pr-1.5 py-0.5"
                        >
                          <span className="truncate max-w-[9rem]">{svc.name}</span>
                          <button
                            type="button"
                            onClick={() => setServicesForLab(labId, selectedForLab.filter((id) => id !== svc.id))}
                            className="shrink-0 hover:bg-primary/20 rounded-full p-0.5 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {labDepartmentIds.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-text">{t("cases.labInvoiceTimingLabel")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setLabInvoiceTiming("now")}
              className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                labInvoiceTiming === "now" ? "border-primary bg-primary-50/40" : "border-border hover:bg-surface-hover"
              }`}
            >
              <p className="text-xs font-semibold text-text">{t("cases.labInvoiceNowOption")}</p>
              <p className="text-[11px] text-text-muted mt-0.5">{t("cases.labInvoiceNowHint")}</p>
            </button>
            <button
              type="button"
              onClick={() => setLabInvoiceTiming("defer")}
              className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                labInvoiceTiming === "defer" ? "border-primary bg-primary-50/40" : "border-border hover:bg-surface-hover"
              }`}
            >
              <p className="text-xs font-semibold text-text">{t("cases.labInvoiceDeferOption")}</p>
              <p className="text-[11px] text-text-muted mt-0.5">{t("cases.labInvoiceDeferHint")}</p>
            </button>
          </div>
        </div>
      )}

      {labInvoiceTiming === "now" && labDepartmentIds.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text">{t("lab.totalAmount")}</label>
          <div className="relative">
            <input
              type="number"
              min={0}
              value={labAmount}
              onChange={(e) => setLabAmountOverride(e.target.value)}
              className={`${inputCls} pr-14`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">so&apos;m</span>
          </div>
          <p className="text-[11px] text-text-muted">
            {t("lab.totalAmountHint", { nominal: labNominalTotal.toLocaleString() })}
          </p>
        </div>
      )}
    </div>
  );
}
