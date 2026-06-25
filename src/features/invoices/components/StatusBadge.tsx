import { INVOICE_STATUS_CONFIG } from "../style-colors";
import { InvoiceStatus } from "../types";

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg = INVOICE_STATUS_CONFIG[status] ?? INVOICE_STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
