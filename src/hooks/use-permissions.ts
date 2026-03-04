"use client";

import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Permission {
  id: string;
  method: string; // "GET" | "POST" | "PATCH" | "DELETE"
  path: string;   // "/api/users" | "/api/users/:id"
}

// ─── Path normalization ───────────────────────────────────────────────────────
// Strips the /api prefix for comparison since the backend stores full paths.
// e.g. "/api/users/:id" matches "/api/users/:id"
// Frontend uses short form like "users" → we match against "/api/users"

/**
 * Converts a permission path template to a regex.
 * "/api/users/:id" → /^\/api\/users\/[^/]+$/
 */
function pathToRegex(template: string): RegExp {
  const escaped = template
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // escape special chars
    .replace(/:[^/]+/g, "[^/]+");             // replace :param with wildcard
  return new RegExp(`^${escaped}$`);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePermissions() {
  const { user } = useAuth();
  const roleId = user?.role?.id;

  const { data: permissions = [], isLoading } = useQuery<Permission[]>({
    queryKey: ["permissions", roleId],
    queryFn: async () => {
      const { data } = await api.get(`/roles/${roleId}/permissions`);
      return data;
    },
    enabled: !!roleId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: false,
  });

  /**
   * Check if the current user has permission for a given HTTP method + path.
   *
   * @param method  - "GET" | "POST" | "PATCH" | "DELETE"
   * @param path    - e.g. "/api/users" or "/api/users/:id"
   *
   * @example
   * can("DELETE", "/api/users/:id")  // → true or false
   * can("POST",   "/api/assignments") // → true or false
   */
  function can(method: string, path: string): boolean {
    console.log(method, path);
    
    if (user?.isSuperuser) return true;
    
    if (!permissions.length) return false;

    return permissions.some((p) => {
      if (p.method.toUpperCase() !== method.toUpperCase()) return false;
      // Exact match first
      if (p.path === path) return true;
      // Pattern match (:id params)
      try {
        return pathToRegex(p.path).test(path) || pathToRegex(path).test(p.path);
      } catch {
        return false;
      }
    });
  }

  /**
   * Shorthand helpers for common actions.
   * Each accepts a base path like "/api/users".
   *
   * @example
   * const { canCreate, canEdit, canDelete, canRead } = usePermissions();
   * canCreate("/api/users")  // checks POST /api/users
   * canEdit("/api/users/:id") // checks PATCH /api/users/:id
   */
  const canRead = (path: string) => can("GET", path);
  const canCreate = (path: string) => can("POST", path);
  const canEdit = (path: string) => can("PATCH", path);
  const canDelete = (path: string) => can("DELETE", path);

  return {
    permissions,
    isLoading,
    can,
    canRead,
    canCreate,
    canEdit,
    canDelete,
  };
}
