"use client";

import { UserRole } from "@/types/user";
import { useAuth } from "./use-auth";

// ─── Role → allowed endpoints mapping ────────────────────────────────────────
// Mirrors the @Roles() decorators defined in the NestJS backend controllers.
// Each entry is [METHOD, path-pattern] — path patterns support :param wildcards.

const ROLE_PERMISSIONS: Record<UserRole, [string, string][]> = {
  ADMIN: [], // ADMIN bypasses all checks — handled separately below

  KASSIR: [
    ["GET", "/api/patients"],
    ["GET", "/api/patients/:id"],
    ["POST", "/api/patients"],
    ["PATCH", "/api/patients/:id"],
    ["GET", "/api/appointments"],
    ["GET", "/api/appointments/:id"],
    ["POST", "/api/appointments"],
    ["PATCH", "/api/appointments/:id"],
    ["GET", "/api/payments"],
    ["POST", "/api/payments/:id/pay"],
    ["GET", "/api/assignments"],
    ["GET", "/api/cases"],
    ["GET", "/api/cases/:id"],
    ["POST", "/api/cases"],
    ["GET", "/api/patients/:patientId/cases"],
  ],

  DOCTOR: [
    ["GET", "/api/patients"],
    ["GET", "/api/patients/:id"],
    ["GET", "/api/appointments"],
    ["GET", "/api/appointments/:id"],
    ["GET", "/api/payments"],
    ["GET", "/api/assignments"],
    ["GET", "/api/cases"],
    ["GET", "/api/cases/:id"],
    ["POST", "/api/cases"],
    ["POST", "/api/cases/:id/steps"],
    ["PATCH", "/api/cases/:id/steps/:stepId"],
    ["PATCH", "/api/cases/:id/close"],
    ["GET", "/api/patients/:patientId/cases"],
    ["GET", "/api/prescriptions"],
    ["GET", "/api/prescriptions/:id"],
    ["POST", "/api/prescriptions"],
    ["PATCH", "/api/prescriptions/:id"],
    ["GET", "/api/medical-cards/003x"],
    ["POST", "/api/patients/:patientId/medical-cards"],
    ["GET", "/api/patients/:patientId/medical-cards"],
    ["GET", "/api/lab-orders"],
    ["GET", "/api/lab-orders/:id"],
    ["POST", "/api/lab-orders"],
    ["PATCH", "/api/lab-orders/:id"],
    ["GET", "/api/medicines"],
  ],

  HAMSHIRA: [
    ["GET", "/api/patients"],
    ["GET", "/api/patients/:id"],
    ["GET", "/api/appointments"],
    ["GET", "/api/appointments/:id"],
    ["GET", "/api/cases"],
    ["GET", "/api/cases/:id"],
    ["PATCH", "/api/cases/:id/steps/:stepId"],
    ["GET", "/api/patients/:patientId/cases"],
    ["GET", "/api/prescriptions"],
    ["GET", "/api/prescriptions/:id"],
    ["GET", "/api/medical-cards/003x"],
    ["GET", "/api/patients/:patientId/medical-cards"],
    ["GET", "/api/medicines"],
  ],

  LABARANT: [
    ["GET", "/api/patients"],
    ["GET", "/api/patients/:id"],
    ["GET", "/api/lab-orders"],
    ["GET", "/api/lab-orders/:id"],
    ["PATCH", "/api/lab-orders/:id"],
    ["GET", "/api/laboratories"],
    ["GET", "/api/laboratories/:id"],
  ],

  DIREKTOR: [
    ["GET", "/api/patients"],
    ["GET", "/api/patients/:id"],
    ["GET", "/api/appointments"],
    ["GET", "/api/appointments/:id"],
    ["GET", "/api/payments"],
    ["GET", "/api/assignments"],
    ["GET", "/api/departments"],
    ["GET", "/api/departments/:id"],
    ["GET", "/api/laboratories"],
    ["GET", "/api/laboratories/:id"],
    ["GET", "/api/stats"],
  ],

  HISOBCHI: [
    ["GET", "/api/payments"],
    ["GET", "/api/payments/:id"],
    ["PATCH", "/api/payments/:id"],
    ["GET", "/api/stats"],
  ],

  TEXNIK_HODIM: [],
};

// ─── Path matching ────────────────────────────────────────────────────────────

function pathToRegex(template: string): RegExp {
  const escaped = template.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/:[^/]+/g, "[^/]+");
  return new RegExp(`^${escaped}$`);
}

function matchesPath(pattern: string, path: string): boolean {
  if (pattern === path) return true;
  try {
    return pathToRegex(pattern).test(path) || pathToRegex(path).test(pattern);
  } catch {
    return false;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePermissions() {
  const { user, isLoading } = useAuth();

  function can(method: string, path: string): boolean {
    if (!user) return false;

    // ADMIN bypasses everything
    if (user.role === "ADMIN") return true;

    const allowed = ROLE_PERMISSIONS[user.role as UserRole] ?? [];
    return allowed.some(([m, p]) => m.toUpperCase() === method.toUpperCase() && matchesPath(p, path));
  }

  const canRead = (path: string) => can("GET", path);
  const canCreate = (path: string) => can("POST", path);
  const canEdit = (path: string) => can("PATCH", path);
  const canDelete = (path: string) => can("DELETE", path);

  return {
    permissions: [], // kept for API compatibility
    isLoading,
    can,
    canRead,
    canCreate,
    canEdit,
    canDelete,
  };
}
