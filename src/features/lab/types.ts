export type LabOrderStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type LabItemStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export interface LaboratoryService {
  id: string;
  name: string;
  price?: number | null;
  laboratoryId: string;
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
  user: { id: string; first_name: string; last_name: string; role: { name: string } };
  laboratory: { id: string; name: string };
}

export interface LabPayment {
  id: string;
  amount: number;
  status: "PAID" | "UNPAID";
  method?: string | null;
}

export interface LabOrderItem {
  id: string;
  status: LabItemStatus;
  serviceId: string;
  service: { id: string; name: string; price?: number | null };
  fileUrl?: string | null;
  fileName?: string | null;
  note?: string | null;
  completedAt?: string | null;
  payment?: LabPayment | null;
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
