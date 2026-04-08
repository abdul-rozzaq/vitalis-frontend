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
