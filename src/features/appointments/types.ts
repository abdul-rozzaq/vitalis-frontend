export interface Assignment {
  id: string;
  user: { id: string; first_name: string; last_name: string };
  department: { id: string; name: string };
  room: { id: string; name: string } | null;
}

export interface Payment {
  id: string;
  amount: number;
  method?: string | null;
  status: "PAID" | "UNPAID";
  createdAt?: string;
  department?: { id: string; name: string } | null;
}

export interface AppointmentFile {
  id: string;
  name: string;
  url: string;
  createdAt?: string;
}

export interface Medicine {
  id: string;
  name: string;
}

export type MealRelation = "BEFORE_MEAL" | "AFTER_MEAL" | "WITH_MEAL" | "AT_SPECIFIC_TIME";

export interface PrescriptionItem {
  id: string;
  medicineId: string;
  medicine: Medicine;
  dosage: string;
  frequency: number;
  startDate: string;
  endDate: string;
  mealRelation: MealRelation;
  specificTime?: string | null;
  note?: string | null;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  items: PrescriptionItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  id: string;
  dateTime: string;
  conclusion?: string | null;
  patient: { id: string; first_name: string; last_name: string };
  patientId: string;
  assignment: Assignment;
  assignmentId: string;
  payments?: Payment[];
  files?: AppointmentFile[];
  prescription?: Prescription | null;
  caseStep?: {
    id: string;
    caseId: string;
    type: string;
    status: "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELLED";
    case?: { id: string; status: "ACTIVE" | "COMPLETED" | "CANCELLED" } | null;
  } | null;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

export interface AppointmentFormPayload {
  patientId: string;
  assignmentId: string;
  dateTime: string;
}
