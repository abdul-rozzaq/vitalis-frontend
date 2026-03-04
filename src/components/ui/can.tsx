"use client";

import { usePermissions } from "@/hooks/use-permissions";
import React from "react";

interface CanProps {
  /** HTTP method: "GET" | "POST" | "PATCH" | "DELETE" */
  method: string;
  /** API path: "/api/users" | "/api/users/:id" */
  path: string;
  /** Content to show when permission granted */
  children: React.ReactNode;
  /** Optional fallback when permission denied (default: nothing) */
  fallback?: React.ReactNode;
}

/**
 * Declarative permission gate component.
 * Renders children only if the current user has the given permission.
 *
 * @example
 * <Can method="POST" path="/api/users">
 *   <button>Add Employee</button>
 * </Can>
 *
 * <Can method="DELETE" path="/api/users/:id" fallback={<span>No access</span>}>
 *   <button onClick={handleDelete}>Delete</button>
 * </Can>
 */
export function Can({ method, path, children, fallback = null }: CanProps) {
  const { can, isLoading } = usePermissions();

  // While loading permissions, don't flash buttons
  if (isLoading) return null;

  const result = can(method, path);

  console.log(method, path, result);

  return result ? <>{children}</> : <>{fallback}</>;
}
