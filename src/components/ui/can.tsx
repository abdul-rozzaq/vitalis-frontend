"use client";

import { useRole } from "@/hooks/use-permissions";
import { UserRole } from "@/types/user";
import React from "react";

interface CanProps {
  /** Roles that are allowed to see the children */
  roles: UserRole[];
  /** Content to show when allowed */
  children: React.ReactNode;
  /** Optional fallback when denied (default: nothing) */
  fallback?: React.ReactNode;
  // Legacy props kept for compatibility but ignored
  method?: string;
  path?: string;
}

/**
 * Role-based gate component.
 * Renders children only if the current user has one of the given roles.
 * ADMIN always passes.
 *
 * @example
 * <Can roles={["ADMIN", "KASSIR"]}>
 *   <button>Add Patient</button>
 * </Can>
 */
export function Can({ roles, children, fallback = null }: CanProps) {
  const { hasRole } = useRole();
  return hasRole(...roles) ? <>{children}</> : <>{fallback}</>;
}
