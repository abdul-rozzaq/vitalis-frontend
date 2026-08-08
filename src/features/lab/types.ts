export type LabOrderStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type LabItemStatus = "PENDING" | "IN_PROGRESS" | "READY" | "DELIVERED" | "CANCELLED";

export type LabResultColumnKey = "code" | "indicator" | "result" | "norm" | "unit";

export interface LabResultColumn {
  key: LabResultColumnKey;
  label: string;
  width?: number;
}

export interface LabResultLayout {
  columns: LabResultColumn[];
}

export const CBC_RESULT_LAYOUT: LabResultLayout = {
  columns: [
    { key: "code", label: "", width: 10 },
    { key: "indicator", label: "Кўрсаткичлар", width: 30 },
    { key: "result", label: "Натижа", width: 16 },
    { key: "norm", label: "Меъйёри", width: 27 },
    { key: "unit", label: "Ўлчов бирлиги", width: 17 },
  ],
};

export const BIOCHEMISTRY_RESULT_LAYOUT: LabResultLayout = {
  columns: [
    { key: "indicator", label: "Анализ тури", width: 48 },
    { key: "result", label: "Натижа", width: 20 },
    { key: "norm", label: "Меъёри", width: 32 },
  ],
};

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
  layout?: LabResultLayout;
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
  resultLayout?: LabResultLayout;
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