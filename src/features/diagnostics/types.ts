export type DiagnosticItemStatus = "PENDING" | "IN_PROGRESS" | "READY" | "DELIVERED" | "CANCELLED";

export interface DiagnosticOrderFile {
  id: string;
  url: string;
  name: string;
}

export interface DiagnosticService {
  id: string;
  name: string;
  price?: number | null;
}

export interface DiagnosticOrderItem {
  id: string;
  status: DiagnosticItemStatus;
  note?: string | null;
  files: DiagnosticOrderFile[];
  service: DiagnosticService;
  createdAt: string;
  startedAt?: string | null;
  readyAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
}

export interface DiagnosticPatient {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

export interface DiagnosticsCenter {
  id: string;
  name: string;
}

export interface DiagnosticOrder {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  patient: DiagnosticPatient;
  diagnostics: DiagnosticsCenter;
  items: DiagnosticOrderItem[];
  createdAt: string;
}


export interface ItemEditForm {
  status: DiagnosticItemStatus;
  note: string;
}

export type ViewMode = "tasks" | "orders";
