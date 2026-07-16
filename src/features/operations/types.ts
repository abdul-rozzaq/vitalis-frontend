// ─── Operation Type Types ────────────────────────────────────────────────────

export interface OperationTypeItem {
  id: string;
  name: string;
  price: string | number;
  isActive: boolean;
}

export interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface AssignedDoctor {
  doctor: Doctor;
}

export interface Department {
  id: string;
  name: string;
}

export interface OperationType {
  id: string;
  name: string;
  description?: string;
  basePrice: string | number;
  isActive: boolean;
  items: OperationTypeItem[];
  doctors: AssignedDoctor[];
  department: Department | null;
}

// ─── Form Types ──────────────────────────────────────────────────────────────

export interface OperationTypeItemInput {
  id?: string;
  name: string;
  price: string | number;
  isActive: boolean;
}

export interface OperationTypeFormValues {
  name: string;
  description?: string;
  basePrice: number;
  isActive: boolean;
  items: OperationTypeItemInput[];
  doctorIds?: string[];
  departmentId?: string | null;
}