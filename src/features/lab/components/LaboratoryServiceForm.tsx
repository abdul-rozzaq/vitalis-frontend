"use client";

import { FlaskConical, ListChecks, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DefaultRowsEditor } from "./DefaultRowsEditor";
import { CBC_RESULT_LAYOUT, LabDefaultRow, LabResultLayout } from "../types";

export interface LaboratoryServiceFormValues {
  name: string;
  price?: number;
  defaultRows?: LabDefaultRow[];
  resultLayout: LabResultLayout;
}

interface LaboratoryServiceFormProps {
  initialData?: {
    name: string;
    price?: number | null;
    defaultRows?: LabDefaultRow[] | null;
    resultLayout?: LabResultLayout;
  };
  onSubmit: (values: LaboratoryServiceFormValues) => void;
  onCancel: () => void;
  isPending?: boolean;
}

// Laboratoriya xizmatini yaratish/tahrirlash formasi. Ilgari `assignments/laboratories`
// sahifasidagi yon panelda (Sheet) ochilardi — endi alohida sahifalarda ishlatiladi
// (services/create va services/[serviceId]/edit).
export function LaboratoryServiceForm({ initialData, onSubmit, onCancel, isPending }: LaboratoryServiceFormProps) {
  const t = useTranslations();

  const [name, setName] = useState(initialData?.name ?? "");
  const [price, setPrice] = useState(initialData?.price != null ? String(initialData.price) : "");
  const [rows, setRows] = useState<LabDefaultRow[]>(initialData?.defaultRows ?? []);
  const [layout, setLayout] = useState<LabResultLayout>(initialData?.resultLayout ?? CBC_RESULT_LAYOUT);

  const handleSubmit = () => {
    if (!name.trim()) return;
    const filteredRows = rows.filter((r) => r.indicator.trim());
    onSubmit({
      name: name.trim(),
      price: price !== "" ? Number(price) : undefined,
      defaultRows: filteredRows.length ? filteredRows : undefined,
      resultLayout: layout,
    });
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_1fr] gap-5 items-start">
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4 shadow-sm lg:sticky lg:top-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary shrink-0">
              <FlaskConical className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-text">{t("laboratories.basicInfoSection")}</h3>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">{t("laboratories.serviceName")}</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">
              {t("laboratories.servicePrice")}
              <span className="ml-1 text-text-muted font-normal text-xs">{t("forms.optional")}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-surface border border-border rounded-md pl-3 pr-14 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
                so&apos;m
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm min-w-0">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary shrink-0">
              <ListChecks className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-text">{t("laboratories.resultTemplateSection")}</h3>
          </div>

          <DefaultRowsEditor rows={rows} onChange={setRows} layout={layout} onLayoutChange={setLayout} />
        </div>
      </div>

      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm py-3 -mx-6 px-6 border-t border-border flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 sm:flex-none sm:px-8 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer"
        >
          {t("forms.cancel")}
        </button>
        <button
          type="button"
          disabled={!name.trim() || isPending}
          onClick={handleSubmit}
          className="flex-1 sm:flex-none sm:px-8 flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors shadow-sm cursor-pointer"
        >
          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {isPending ? t("common.loading") : t("common.save")}
        </button>
      </div>
    </div>
  );
}
