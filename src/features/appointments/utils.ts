import { Appointment, Assignment, Patient } from "./types";

export const CASE_STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-primary-50 text-primary",
  COMPLETED: "bg-info-50 text-info-600",
  CANCELLED: "bg-danger-50 text-danger-600",
};

export const toPatientOptions = (patients: Patient[]) =>
  patients.map((patient) => ({
    id: patient.id,
    name: `${patient.first_name} ${patient.last_name}`,
  }));

export const toAssignmentOptions = (assignments: Assignment[]) =>
  assignments.map((assignment) => ({
    id: assignment.id,
    label: `Dr. ${assignment.user.first_name} ${assignment.user.last_name} — ${assignment.department.name}${assignment.room ? ` (${assignment.room.name})` : ""}`,
  }));

export const filterAppointmentsByPatientName = (appointments: Appointment[], filterText: string) => {
  const trimmed = filterText.trim();
  if (!trimmed) return appointments;
  const lowered = trimmed.toLowerCase();

  return appointments.filter((appointment) => `${appointment.patient?.first_name ?? ""} ${appointment.patient?.last_name ?? ""}`.toLowerCase().includes(lowered));
};
