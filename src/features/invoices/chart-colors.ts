/**
 * Manba (invoice sourceType) uchun grafiklardagi doimiy rang tartibi.
 * Tartib har doim bir xil bo'lishi kerak — bitta manba filtr bilan yo'qolib
 * qolsa ham, qolgan manbalarning rangi o'zgarmasligi kerak (identifikatsiya
 * kanali barqaror bo'lishi uchun). Qiymatlar globals.css'dagi --chart-* CSS
 * o'zgaruvchilariga ishora qiladi, shu sababli light/dark rejim avtomatik
 * moslashadi.
 */
export const SOURCE_ORDER = [
  "APPOINTMENT",
  "LAB_ORDER",
  "OPERATION",
  "DIAGNOSTIC_ORDER",
  "WARD",
  "PROCEDURE_ORDER",
  "MANUAL",
] as const;

export const SOURCE_CHART_COLOR: Record<string, string> = {
  APPOINTMENT: "var(--chart-appointment)",
  LAB_ORDER: "var(--chart-lab)",
  OPERATION: "var(--chart-operation)",
  DIAGNOSTIC_ORDER: "var(--chart-diagnostic)",
  WARD: "var(--chart-ward)",
  PROCEDURE_ORDER: "var(--chart-procedure)",
  MANUAL: "var(--chart-manual)",
};

export interface RevenueBySourceRow {
  sourceType: string;
  cash: number;
  bonus: number;
  total: number;
  count: number;
}
