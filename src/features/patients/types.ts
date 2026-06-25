import { District } from "@/shared/types/localtion";
import { AppointmentFile, Assignment, Prescription } from "../appointments/types";
import { LabItemStatus, LabOrderStatus } from "../lab/types";

export type DocumentType = "PASSPORT" | "BIRTH_CERTIFICATE" | "FOREIGN_PASSPORT" | "RESIDENCE_PERMIT";

export type BloodType = "O_POSITIVE" | "O_NEGATIVE" | "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE";

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
  blood_type: BloodType | null;
  district?: District | null;
}

export interface AppointmentTimelineItem {
  id: string;
  assignmentId?: string;
  dateTime: string;
  conclusion?: string | null;
  files?: AppointmentFile[];
  assignment: Assignment;
  caseStep?: { case?: { id: string; status: CaseStatus } | null } | null;
}

export type CaseStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type CaseStepType = "CHECKIN" | "CONSULTATION" | "LAB" | "PROCEDURE" | "REFERRAL" | "DISCHARGE" | "DIAGNOSTIC" | "OPERATION";
export type CaseStepStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELLED";

// export type LabOrderStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
// export type LabItemStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export interface CaseStep {
  id: string;
  caseId: string;
  type: CaseStepType;
  status: CaseStepStatus;
  note?: string | null;
  createdAt: string;
  completedAt?: string | null;
  assignmentId?: string | null;
  appointmentId?: string | null;

  assignment?: Assignment | null;
  appointment?: AppointmentTimelineItem | null;

  case: { id: string; status: CaseStatus };

  prescription?: Prescription | null;

  labOrder?: {
    id: string;
    status: LabOrderStatus;
    laboratory: { id: string; name: string };
    items: {
      id: string;
      status: LabItemStatus;
      service: { id: string; name: string; price?: number | null };
      files: { id: string; url: string; name: string }[];
    }[];
  } | null;

  diagnosticOrder?: {
    id: string;
    diagnostics: {
      id: string;
      name: string;
    };
    items: {
      id: string;
      status: LabItemStatus;
      service: {
        id: string;
        name: string;
        price?: number | null;
      };
      files: {
        id: string;
        url: string;
        name: string;
      }[];
    }[];
  } | null;
}

export interface PatientCase {
  id: string;
  patientId: string;
  status: CaseStatus;
  chiefComplaint?: string | null;
  openedAt: string;
  closedAt?: string | null;
  steps: CaseStep[];
  createdAt: string;
}

export type SheetMode = "checkin" | "visit" | "edit" | "editAppointment" | null;

export interface AssignmentSource {
  id: string;
  user: { first_name: string; last_name: string };
  department: { name: string; price: number };
  room?: { name: string } | null;
}

export interface AppointmentFormPayload {
  patientId: string;
  assignmentId: string;
  dateTime: string;
  status?: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
}

export type NewPatientPayload = {
  first_name: string;
  last_name: string;
  phone_number: string;
  gender: "male" | "female";
  birth_date: string;
  address?: string;
  document_type?: "PASSPORT" | "BIRTH_CERTIFICATE" | "FOREIGN_PASSPORT" | "RESIDENCE_PERMIT" | null;
  document_series?: string | null;
  document_number?: string | null;
  pinfl?: string | null;
  districtId?: string | null;
};
