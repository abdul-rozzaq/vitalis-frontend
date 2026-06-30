import { INVOICE_STATUS_CONFIG } from "./style-colors";

export type InvoiceStatus = "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";

export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "OTHER";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Naqd",
  CARD: "Karta",
  TRANSFER: "O'tkazma",
  OTHER: "Boshqa",
};

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  sourceType: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  status: InvoiceStatus;
  totalAmount: string;
  paidCash: string;
  paidBonus: string;
  sourceType: string;
  sourceId: string;
  dueDate?: string;
  note?: string;
  createdAt: string;
  patient?: { id: string; first_name: string; last_name: string };
  items: InvoiceItem[];
}


export const SOURCE_LABELS: Record<string, string> = {
  WARD: "Palata",
  APPOINTMENT: "Qabul",
  LAB_ORDER: "Laboratoriya",
  MANUAL: "Qo'lda",
};
