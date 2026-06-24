/** "15.01.2025" — uz-UZ default date */
export function formatDateUz(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("uz-UZ");
}

/** "15.01 14:30" — compact date+time, uz-UZ (lab, diagnostics) */
export function formatDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return (
    d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit" }) +
    " " +
    d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
  );
}

/** "January 15, 2025" — full month name, en-US (patient detail) */
export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** "Jan 15, 2025" — short month name, en-US (assignments) */
export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** "02:30 PM" — time only, en-US (patient detail) */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "1 234 567.89" — uz-UZ currency with decimals (invoices, balance) */
export function formatCurrency(val: string | number, decimals = 2): string {
  return Number(val).toLocaleString("uz-UZ", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** "1 234 567" — uz-UZ amount without decimals (operations) */
export function formatAmount(val: string | number): string {
  return Number(val).toLocaleString("uz-UZ", { minimumFractionDigits: 0 });
}
