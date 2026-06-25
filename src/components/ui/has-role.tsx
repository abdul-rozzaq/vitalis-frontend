"use client";

import { useRole } from "@/shared/hooks/use-permissions";
import { UserRole } from "@/shared/types/user";
import React from "react";

interface HasRoleProps {
  roles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Renders `children` only if the current user has one of the given roles.
 * ADMIN always passes (full bypass).
 *
 * @example
 * <HasRole roles={["ADMIN", "KASSIR"]}>
 *   <Button>Add patient</Button>
 * </HasRole>
 */
export function HasRole({ roles, children, fallback = null }: HasRoleProps) {
  const { hasRole } = useRole();
  return hasRole(...roles) ? <>{children}</> : <>{fallback}</>;
}
