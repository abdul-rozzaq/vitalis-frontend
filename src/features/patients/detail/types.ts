export type DocumentType = "PASSPORT" | "BIRTH_CERTIFICATE" | "FOREIGN_PASSPORT" | "RESIDENCE_PERMIT";

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  gender: "male" | "female";
  birth_date: string | null;
  address?: string;
  document_type?: DocumentType | null;
  document_series?: string | null;
  document_number?: string | null;
  pinfl?: string | null;
  district?: {
    name: string;
    region?: {
      name: string;
    } | null;
  } | null;
}

export interface AppointmentPayment {
  id: string;
  createdAt: string;
  amount: number;
  status: "PAID" | "UNPAID";
  method?: string | null;
  department?: { name: string };
}

export interface AppointmentFile {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

export interface AppointmentTimelineItem {
  id: string;
  assignmentId?: string;
  dateTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  files?: AppointmentFile[];
  assignment: {
    id?: string;
    department: { name: string };
    user: { first_name: string; last_name: string };
  };
  payments?: AppointmentPayment[];
}

export type SheetMode = "visit" | "edit" | "editAppointment" | null;

export interface AssignmentSource {
  id: string;
  user: { first_name: string; last_name: string };
  department: { name: string };
  room?: { name: string } | null;
}

export interface AppointmentFormPayload {
  patientId: string;
  assignmentId: string;
  dateTime: string;
  status?: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
}
