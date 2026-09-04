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

export interface RevenueByMethodRow {
  method: string;
  amount: number;
  count: number;
}

export interface RevenueByStaffRow {
  staffId: string;
  staffName: string;
  cash: number;
  bonus: number;
  total: number;
  count: number;
}

export interface RevenueByDepartmentRow {
  departmentId: string | null;
  departmentName: string;
  cash: number;
  bonus: number;
  total: number;
  count: number;
}

/**
 * To'lov turi — alohida o'lchov (naqd/karta/o'tkazma/boshqa/bonus), shu
 * sababli manba ranglaridan mustaqil, lekin bir xil validatsiyadan o'tgan
 * --chart-* tokenlar to'plamidan qayta ishlatiladi.
 */
export const PAYMENT_METHOD_ORDER = ["CASH", "CARD", "TRANSFER", "OTHER", "BONUS"] as const;

export const PAYMENT_METHOD_CHART_COLOR: Record<string, string> = {
  CASH: "var(--chart-operation)",
  CARD: "var(--chart-appointment)",
  TRANSFER: "var(--chart-diagnostic)",
  OTHER: "var(--chart-manual)",
  BONUS: "var(--chart-ward)",
};
