const DEPARTMENT_COLORS: { bg: string; icon: string }[] = [
  { bg: "bg-primary-50", icon: "text-primary" },
  { bg: "bg-info-50", icon: "text-info" },
  { bg: "bg-success-50", icon: "text-success" },
  { bg: "bg-warning-50", icon: "text-warning" },
  { bg: "bg-danger-50", icon: "text-danger" },
  { bg: "bg-surface-hover", icon: "text-text-muted" },
];

export function getDepartmentColor(id: string) {
  const index = id.charCodeAt(0) % DEPARTMENT_COLORS.length;

  return DEPARTMENT_COLORS[index];
}
