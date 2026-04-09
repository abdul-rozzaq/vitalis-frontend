import { AssignmentsShell } from "@/features/assignments/components/assignments-shell";

export default function AssignmentsLayout({ children }: { children: React.ReactNode }) {
  return <AssignmentsShell>{children}</AssignmentsShell>;
}
