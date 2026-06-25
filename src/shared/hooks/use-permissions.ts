"use client";

import { UserRole } from "@/shared/types/user";
import { useAuth } from "./use-auth";

/**
 * Role-based access hook.
 * Replaces the legacy permission-based (method+path) system.
 *
 * @example
 * const { role, hasRole, isAdmin } = useRole();
 * hasRole("DOCTOR", "HAMSHIRA") // → true if current user is DOCTOR or HAMSHIRA
 */
export function useRole() {
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;

  function hasRole(...roles: UserRole[]): boolean {
    if (!role) return false;
    if (role === "ADMIN") return true;
    return roles.includes(role);
  }

  const isAdmin = role === "ADMIN";

  return {
    role,
    hasRole,
    isAdmin,
  };
}

// Keep legacy export for gradual migration
export function usePermissions() {
  const { hasRole, isAdmin } = useRole();

  function can(_method: string, _path: string): boolean {
    return isAdmin;
  }

  return {
    permissions: [] as never[],
    isLoading: false,
    can,
  };
}
