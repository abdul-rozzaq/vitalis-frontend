import { Department } from "@/features/departments/types";
import { CaseStep, Patient } from "@/features/patients/types";
import { User } from "@/shared/types/user";
import { Room } from "../assignments/types";

export interface Assignment {
  id: string;
  user: User;
  department: Department;
  room: Room | null;
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
  patient: Patient;
  patientId: string;
  assignment: Assignment;
  assignmentId: string;
  files?: AppointmentFile[];
  prescription?: Prescription | null;
  caseStep?: CaseStep | null;
}

export interface AppointmentFormPayload {
  patientId: string;
  assignmentId: string;
  dateTime: string;
}
