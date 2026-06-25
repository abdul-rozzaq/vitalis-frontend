import { Patient } from "../patients/types";
import { Appointment } from "./types";
import { toAssignmentOptions } from "@/shared/lib/helpers";

export { toAssignmentOptions };

export const CASE_STATUS_STYLES: Record<string, string> = {
  // PatientCase statuslari
  ACTIVE: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-success-50 text-success",
  CANCELLED: "bg-gray-100 text-gray-500",
  // CaseStep statuslari
  PENDING: "bg-yellow-50 text-yellow-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  DONE: "bg-success-50 text-success",
};

export const toPatientOptions = (patients: Patient[]) =>
  patients.map((patient) => ({
    id: patient.id,
    name: `${patient.first_name} ${patient.last_name}`,
  }));

export const filterAppointmentsByPatientName = (appointments: Appointment[], filterText: string) => {
  const trimmed = filterText.trim();
  if (!trimmed) return appointments;
  const lowered = trimmed.toLowerCase();

  return appointments.filter((appointment) => `${appointment.patient?.first_name ?? ""} ${appointment.patient?.last_name ?? ""}`.toLowerCase().includes(lowered));
};

export function getAppointmentStatus(appointment: Appointment) {
  // Avval CaseStep.status ni ko'rsat (IN_PROGRESS, DONE, PENDING)
  if (appointment.caseStep?.status) {
    return appointment.caseStep.status;
  }

  // Fallback — patient.cases dan
  // if (appointment.patient?.cases?.length) {
  //   return appointment.patient.cases[0].status;
  // }

  return null;
}
