// ─── Role ─────────────────────────────────────────────────────────────────────

export const ROLE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  ADMIN: { bg: "bg-primary-50", text: "text-primary", label: "Admin" },
  KASSIR: { bg: "bg-primary-50", text: "text-primary", label: "Kassir" },
  DOCTOR: { bg: "bg-info-50", text: "text-info", label: "Doctor" },
  HAMSHIRA: { bg: "bg-success-50", text: "text-success", label: "Hamshira" },
  LABARANT: { bg: "bg-warning-50", text: "text-warning", label: "Labarant" },
  DIAGNOST: { bg: "bg-warning-50", text: "text-warning", label: "Diagnost" },
  TEXNIK_HODIM: { bg: "bg-surface-hover", text: "text-text-muted", label: "Texnik Hodim" },
  DIREKTOR: { bg: "bg-danger-50", text: "text-danger", label: "Direktor" },
  HISOBCHI: { bg: "bg-primary-50", text: "text-primary", label: "Hisobchi" },
};
