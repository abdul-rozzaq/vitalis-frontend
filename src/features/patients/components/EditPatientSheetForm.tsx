"use client";

import { Patient } from "@/features/patients/types";
import { PatientForm } from "./patient-form";
import { api } from "@/shared/lib/api";
import { useMutation } from "@tanstack/react-query";

interface EditPatientSheetFormProps {
  patient: Patient;
  patientId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditPatientSheetForm({ patient, patientId, onSuccess, onCancel }: EditPatientSheetFormProps) {
  const { mutateAsync: updatePatient, isPending } = useMutation({
    mutationFn: (data: any) => api.patch(`/patients/${patientId}`, data),
    onSuccess: () => onSuccess(),
  });

  return (
    <PatientForm
      initialData={{
        ...patient,
        birth_date: patient.birth_date ? new Date(patient.birth_date).toISOString().split("T")[0] : undefined,
        districtId: patient.district?.id ?? null,
        district: patient.district
          ? { id: patient.district.id, regionId: patient.district.region?.id ?? "" }
          : null,
      }}
      onSubmit={(data) => updatePatient(data)}
      onCancel={onCancel}
      isPending={isPending}
    />
  );
}
