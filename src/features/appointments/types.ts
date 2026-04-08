export interface Assignment {
  id: string;
  user: { id: string; first_name: string; last_name: string };
  department: { id: string; name: string };
  room: { id: string; name: string } | null;
}

export interface Appointment {
  id: string;
  dateTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  patient: { id: string; first_name: string; last_name: string };
  patientId: string;
  assignment: Assignment;
  assignmentId: string;
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
  status?: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
}
