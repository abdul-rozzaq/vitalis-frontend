"use client";

import { Activity, Bed, FileEdit, FlaskConical, Scissors, SlidersHorizontal, Stethoscope, User, X } from "lucide-react";

import { api } from "@/shared/lib/api";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";

export interface Filters {
  status: string;
  patientSearch: string;
  dateFrom: string;
  dateTo: string;
  sourceType: string[];
  doctorId: string;
  amountMin?: string;
  amountMax?: string;
}

// Har bir manba turi uchun ikonka + faol rang. Label t("invoices.source.<KEY>")
// orqali keladi — bu yerda faqat vizual taqdimot (ikonka/rang) saqlanadi.
const SOURCE_TYPE_META: Record<string, { icon: typeof Bed; activeClass: string }> = {
  WARD: { icon: Bed, activeClass: "bg-info text-white border-info" },
  APPOINTMENT: { icon: Stethoscope, activeClass: "bg-primary text-white border-primary" },
  OPERATION: { icon: Scissors, activeClass: "bg-danger text-white border-danger" },
  DIAGNOSTIC_ORDER: { icon: Activity, activeClass: "bg-warning text-white border-warning" },
  LAB_ORDER: { icon: FlaskConical, activeClass: "bg-secondary text-white border-secondary" },
  MANUAL: { icon: FileEdit, activeClass: "bg-text-muted text-white border-text-muted" },
};

const SOURCE_TYPE_ORDER = ["WARD", "APPOINTMENT", "OPERATION", "DIAGNOSTIC_ORDER", "LAB_ORDER", "MANUAL"];
const STATUS_OPTIONS = ["", "DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "CANCELLED"];

interface AssignmentDoctor {
  id: string; // assignment id
  user: { id: string; first_name: string; last_name: string; role: string };
  department: { id: string; name: string };
}

export function FilterPanel({ filters, onChange, onReset, activeCount }: { filters: Filters; onChange: (k: keyof Filters, v: string | string[]) => void; onReset: () => void; activeCount: number }) {
  const t = useTranslations("invoices");

  const isAppointmentSelected = filters.sourceType.includes("APPOINTMENT");

  const { data: assignments = [] } = useQuery<AssignmentDoctor[]>({
    queryKey: ["assignments", "active"],
    queryFn: () => api.get("/assignments?isActive=true").then((r) => r.data),
    enabled: isAppointmentSelected, // shifokorlar ro'yxati faqat kerak bo'lganda yuklanadi
    staleTime: 5 * 60 * 1000,
  });

  const doctors = Array.from(
    new Map(
      assignments
        .filter((a) => a.user?.role === "DOCTOR")
        .map((a) => [a.user.id, { id: a.user.id, name: `${a.user.first_name} ${a.user.last_name}`, department: a.department?.name }]),
    ).values(),
  );

  const toggleSourceType = (value: string) => {
    const current = filters.sourceType ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange("sourceType", next);
    // Konsultatsiya o'chirilsa, tanlangan shifokor ham tozalanadi
    if (value === "APPOINTMENT" && current.includes(value) && filters.doctorId) {
      onChange("doctorId", "");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="bg-surface border border-border rounded-xl p-4 mb-4 shadow-sm">
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-muted">{t("fields.status")}</label>
          <select
            value={filters.status}
            onChange={(e) => onChange("status", e.target.value)}
            className="w-full bg-surface-hover border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s || "ALL"} value={s}>
                {t(`statusOptions.${s || "ALL"}`)}
              </option>
            ))}
          </select>
        </div>
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
            value={filters.amountMin ?? ""}
            onChange={(e) => onChange("amountMin", e.target.value)}
            placeholder="0"
            className="w-full bg-surface-hover border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-muted">{t("fields.amountMax")}</label>
          <input
            type="number"
            value={filters.amountMax ?? ""}
            onChange={(e) => onChange("amountMax", e.target.value)}
            placeholder="9999999"
            className="w-full bg-surface-hover border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Manba (sourceType) */}
      <div className="mt-4 pt-4 border-t border-border">
        <label className="text-xs font-medium text-text-muted mb-2 block">{t("fields.source")}</label>
        <div className="flex flex-wrap gap-2">
          {SOURCE_TYPE_ORDER.map((value) => {
            const active = (filters.sourceType ?? []).includes(value);
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

        {/* Shifokor bo'yicha qo'shimcha filtr — faqat "Qabul" tanlanganda chiqadi */}
        <AnimatePresence>
          {isAppointmentSelected && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
              <div className="mt-3 space-y-1 max-w-xs">
                <label className="text-xs font-medium text-text-muted flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  {t("fields.doctor")}
                </label>
                <select
                  value={filters.doctorId}
                  onChange={(e) => onChange("doctorId", e.target.value)}
                  className="w-full bg-surface-hover border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                  <option value="">{t("fields.doctorAll")}</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                      {d.department ? ` — ${d.department}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}