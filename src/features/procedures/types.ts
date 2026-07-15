export interface Procedure {
  id: string;
  name: string;
  description?: string;
  price?: number;
  departmentId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProcedurePayload {
  name: string;
  description?: string;
  price?: number;
  departmentId: string;
}

export interface UpdateProcedurePayload {
  name?: string;
  description?: string;
  price?: number;
}
