"use client";

import { ShieldCheck } from "lucide-react";

/**
 * Permissions are now managed through role-based access control in code.
 * This page is kept as a placeholder.
 */
export default function AssignmentPermissionsPage() {
  return (
    <div className="bg-surface border border-border rounded-lg p-12 flex flex-col items-center justify-center gap-3 text-center">
      <ShieldCheck className="w-10 h-10 text-primary opacity-60" />
      <h2 className="text-base font-semibold text-text">Role-based access control</h2>
      <p className="text-sm text-text-muted max-w-sm">
        Permissions are now enforced at the code level via roles. Use the Roles page
        to manage user role assignments.
      </p>
    </div>
  );
}
