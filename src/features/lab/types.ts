export type LabOrderStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type LabItemStatus = "PENDING" | "IN_PROGRESS" | "READY" | "DELIVERED" | "CANCELLED";

export interface LabDefaultRow {
  code?: string | null;
  indicator: string;
  norm?: string | null;
  unit?: string | null;
  sortOrder?: number;
}

export interface LabResultTemplateRow {
  code?: string | null;
  indicator: string;
  norm?: string | null;
  unit?: string | null;
}

// Mustaqil natija shabloni — hech qanday laboratoriya/xizmatga tayinlanmagan,
// natija kiritish oynasida ro'yxatdan tanlab qo'llanadi.
export interface LabResultTemplate {
  id: string;
  name: string;
  rows: LabResultTemplateRow[];
}

export interface LabResultTemplateSummary {
  id: string;
  name: string;
}

export interface LaboratoryService {
  id: string;
  name: string;
  price?: number | null;
  laboratoryId: string;
  defaultRows?: LabDefaultRow[] | null;
}

export interface Laboratory {
  id: string;
  name: string;
  description?: string | null;
  services: LaboratoryService[];
  _count?: { assignments: number };
}

export interface LaboratoryAssignment {
  id: string;
  userId: string;
  laboratoryId: string;
  isActive: boolean;
  user: { id: string; first_name: string; last_name: string; role: string };
  laboratory: { id: string; name: string };
}

export interface LabOrderItemFile {
  id: string;
  url: string;
  name: string;
  createdAt: string;
}

export interface LabResultRow {
  id?: string;
  code?: string | null;
  indicator: string;
  result: string;
  norm?: string | null;
  unit?: string | null;
  sortOrder?: number;
}

export interface LabResultTable {
  id: string;
  labOrderItemId: string;
  rows: LabResultRow[];
}

export interface LabOrderItem {
  id: string;
  status: LabItemStatus;
  serviceId: string;
  // Xizmat pullik (invoice'ga qo'shilgan) yoki bepul ekanini bildiradi.
  isPaid: boolean;
  service: {
    id: string;
    name: string;
    price?: number | null;
    // Xizmat uchun standart natija shabloni (backend'dan keladi). Bo'lmasa —
    // bo'sh qatordan boshlanadi.
    defaultRows?: LabDefaultRow[] | null;
  };
  files: LabOrderItemFile[];
  resultTable?: LabResultTable | null;
  note?: string | null;
  completedAt?: string | null;
  startedAt?: string | null;
  readyAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LabOrder {
  id: string;
  status: LabOrderStatus;
  laboratoryId: string;
  laboratory: { id: string; name: string };
  patientId: string;
  patient: { id: string; first_name: string; last_name: string; phone_number: string };
  caseStep: { id: string; caseId: string; status: string };
  items: LabOrderItem[];
  createdAt: string;
  updatedAt: string;
}