import { SlidersHorizontal, X } from "lucide-react";

import { motion } from "motion/react";

export interface Filters {
  status: string;
  patientSearch: string;
  dateFrom: string;
  dateTo: string;
}

export function FilterPanel({ filters, onChange, onReset, activeCount }: { filters: Filters; onChange: (k: keyof Filters, v: string) => void; onReset: () => void; activeCount: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="bg-surface border border-border rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-text-muted flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter
          {activeCount > 0 && <span className="bg-primary text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">{activeCount}</span>}
        </span>
        {activeCount > 0 && (
          <button onClick={onReset} className="text-xs text-text-muted hover:text-danger transition-colors cursor-pointer flex items-center gap-1">
            <X className="w-3 h-3" /> Tozalash
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="space-y-0.5">
          <label className="text-xs font-medium text-text-muted">Holat</label>
          <select
            value={filters.status}
            onChange={(e) => onChange("status", e.target.value)}
            className="w-full bg-surface-hover border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
          >
            <option value="">Barchasi</option>
            <option value="DRAFT">Qoralama</option>
            <option value="ISSUED">Chiqarilgan</option>
            <option value="PARTIALLY_PAID">Qisman to'langan</option>
            <option value="PAID">To'langan</option>
            <option value="CANCELLED">Bekor qilingan</option>
          </select>
        </div>
        <div className="space-y-0.5">
          <label className="text-xs font-medium text-text-muted">Bemor</label>
          <input
            type="text"
            value={filters.patientSearch}
            onChange={(e) => onChange("patientSearch", e.target.value)}
            placeholder="Ism..."
            className="w-full bg-surface-hover border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="space-y-0.5">
          <label className="text-xs font-medium text-text-muted">Dan</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onChange("dateFrom", e.target.value)}
            className="w-full bg-surface-hover border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
          />
        </div>
        <div className="space-y-0.5">
          <label className="text-xs font-medium text-text-muted">Gacha</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onChange("dateTo", e.target.value)}
            className="w-full bg-surface-hover border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
          />
        </div>
      </div>
    </motion.div>
  );
}
