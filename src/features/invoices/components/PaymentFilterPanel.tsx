"use client";

import { Activity, Bed, FileEdit, FlaskConical, Scissors, SlidersHorizontal, Stethoscope, User, X } from "lucide-react";
import { api } from "@/shared/lib/api";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { PAYMENT_METHOD_LABELS, PaymentMethod } from "../types";

export interface PaymentFilters {
  patientSearch: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
  invoiceSourceType: string[];
  paymentMethod: string[];
  operationTypeId: string;
  doctorId: string;
}

const SOURCE_TYPE_META: Record<string, { icon: typeof Bed; activeClass: string }> = {
  WARD: { icon: Bed, activeClass: "bg-info text-white border-info" },
  APPOINTMENT: { icon: Stethoscope, activeClass: "bg-primary text-white border-primary" },
  OPERATION: { icon: Scissors, activeClass: "bg-danger text-white border-danger" },
  DIAGNOSTIC_ORDER: { icon: Activity, activeClass: "bg-warning text-white border-warning" },
  LAB_ORDER: { icon: FlaskConical, activeClass: "bg-secondary text-white border-secondary" },
  MANUAL: { icon: FileEdit, activeClass: "bg-text-muted text-white border-text-muted" },
};

const SOURCE_TYPE_ORDER = ["WARD", "APPOINTMENT", "OPERATION", "DIAGNOSTIC_ORDER", "LAB_ORDER", "MANUAL"];

interface PaymentFilterPanelProps {
  filters: PaymentFilters;
  onChange: (k: keyof PaymentFilters, v: string | string[]) => void;
  onReset: () => void;
  activeCount: number;
}

interface OperationTypeOption {
  id: string;
  name: string;
}

interface DoctorOption {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

export function PaymentFilterPanel({ filters, onChange, onReset, activeCount }: PaymentFilterPanelProps) {
  const t = useTranslations("invoices");
  const isOperationSelected = (filters.invoiceSourceType ?? []).includes("OPERATION");

  const { data: operationTypes = [], isLoading: isLoadingOperationTypes } = useQuery<OperationTypeOption[]>({
    queryKey: ["payment-operation-types"],
    queryFn: () => api.get("/operation-types").then((r) => r.data),
    enabled: isOperationSelected,
    staleTime: 5 * 60 * 1000,
  });

  const { data: doctors = [], isLoading: isLoadingDoctors } = useQuery<DoctorOption[]>({
    queryKey: ["payment-operation-doctors", filters.operationTypeId],
    queryFn: () => {
      const params = filters.operationTypeId
        ? `?operationTypeId=${encodeURIComponent(filters.operationTypeId)}`
        : "";
      return api.get(`/invoices/payments/operation-doctors${params}`).then((r) => r.data);
    },
    enabled: isOperationSelected,
    staleTime: 5 * 60 * 1000,
  });

  const toggleSourceType = (value: string) => {
    const current = filters.invoiceSourceType ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange("invoiceSourceType", next);

    if (value === "OPERATION" && current.includes(value)) {
      onChange("operationTypeId", "");
      onChange("doctorId", "");
    }
  };

  const togglePaymentMethod = (value: string) => {
    const current = filters.paymentMethod ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange("paymentMethod", next);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.15 }}
      className="bg-surface border border-border rounded-xl p-4 mb-4 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-text-muted flex items-center gap-2 uppercase tracking-wide">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {t("filter")}
          {activeCount > 0 && <span className="bg-primary text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">{activeCount}</span>}
        </span>
        {activeCount > 0 && (
          <button onClick={onReset} className="text-xs text-text-muted hover:text-danger transition-colors cursor-pointer flex items-center gap-1">
            <X className="w-3 h-3" /> {t("reset")}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-muted">{t("fields.patient")}</label>
          <input
            type="text"
            value={filters.patientSearch}
            onChange={(e) => onChange("patientSearch", e.target.value)}
            placeholder={t("fields.patientPlaceholder")}
            className="w-full bg-surface-hover border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-muted">{t("fields.dateFrom")}</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onChange("dateFrom", e.target.value)}
            className="w-full bg-surface-hover border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-muted">{t("fields.dateTo")}</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onChange("dateTo", e.target.value)}
            className="w-full bg-surface-hover border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-muted">{t("fields.amountMin")}</label>
          <input
            type="number"
            value={filters.amountMin}
            onChange={(e) => onChange("amountMin", e.target.value)}
            placeholder="0"
            className="w-full bg-surface-hover border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-muted">{t("fields.amountMax")}</label>
          <input
            type="number"
            value={filters.amountMax}
            onChange={(e) => onChange("amountMax", e.target.value)}
            placeholder="9999999"
            className="w-full bg-surface-hover border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-text-muted mb-2 block">{t("fields.source")}</label>
          <div className="flex flex-wrap gap-2">
            {SOURCE_TYPE_ORDER.map((value) => {
              const active = (filters.invoiceSourceType ?? []).includes(value);
              const meta = SOURCE_TYPE_META[value];
              const Icon = meta?.icon ?? FileEdit;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleSourceType(value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    active ? (meta?.activeClass ?? "bg-primary text-white border-primary") : "bg-surface-hover border-border text-text-muted hover:text-text hover:border-text-muted"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t(`source.${value}`)}
                </button>
              );
            })}
          </div>
        </div>
        
        <div>
          <label className="text-xs font-medium text-text-muted mb-2 block">{t("payments.colMethod")}</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((value) => {
              const active = (filters.paymentMethod ?? []).includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => togglePaymentMethod(value)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    active ? "bg-primary text-white border-primary" : "bg-surface-hover border-border text-text-muted hover:text-text hover:border-text-muted"
                  }`}
                >
                  {PAYMENT_METHOD_LABELS[value]}
                </button>
              );
            })}
          </div>
        </div>

        {isOperationSelected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.15 }}
            className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted">
                {t("fields.operationType")}
              </label>
              <select
                value={filters.operationTypeId}
                onChange={(e) => {
                  onChange("operationTypeId", e.target.value);
                  onChange("doctorId", "");
                }}
                disabled={isLoadingOperationTypes}
                className="w-full bg-surface-hover border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer disabled:opacity-50"
              >
                <option value="">{t("fields.operationTypeAll")}</option>
                {operationTypes.map((operationType) => (
                  <option key={operationType.id} value={operationType.id}>
                    {operationType.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted flex items-center gap-1.5">
                <User className="w-3 h-3" />
                {t("fields.operationDoctor")}
              </label>
              <select
                value={filters.doctorId}
                onChange={(e) => onChange("doctorId", e.target.value)}
                disabled={isLoadingDoctors || doctors.length === 0}
                className="w-full bg-surface-hover border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer disabled:opacity-50"
              >
                <option value="">{t("fields.operationDoctorAll")}</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.first_name} {doctor.last_name}
                  </option>
                ))}
              </select>
              {doctors.length === 0 && !isLoadingDoctors && (
                <p className="text-[11px] text-text-muted">
                  {t("fields.operationDoctorNone")}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
