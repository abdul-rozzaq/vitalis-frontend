"use client";

import { Can } from "@/components/ui/can";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckSquare2, KeyRound, Loader2, Save, Shield, Square } from "lucide-react";
import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface AvailableRoute {
  group: string;
  method: string;
  path: string;
  description?: string;
  allowed: boolean;
}

// ─── Method badge styles ──────────────────────────────────────────────────────

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-primary-100 text-primary",
  POST: "bg-info-50 text-info-600",
  PATCH: "bg-warning-50 text-warning-600",
  DELETE: "bg-danger-50 text-danger-600",
};

// ─── Group color cycle ────────────────────────────────────────────────────────

const GROUP_COLORS = [
  { header: "bg-info-50 border-border", dot: "bg-info-600" },
  { header: "bg-primary-50 border-border", dot: "bg-primary" },
  { header: "bg-danger-50 border-border", dot: "bg-danger-500" },
  { header: "bg-warning-50 border-border", dot: "bg-amber-500" },
  { header: "bg-primary-100 border-border", dot: "bg-primary-500" },
  { header: "bg-danger-100 border-border", dot: "bg-danger-600" },
  { header: "bg-info-50 border-border", dot: "bg-info-600" },
  { header: "bg-surface-hover border-border", dot: "bg-secondary" },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

const permKey = (method: string, path: string) => `${method}::${path}`;

// ─── Component ────────────────────────────────────────────────────────────────

interface PermissionsEditorProps {
  roles: Role[];
  loadingRoles: boolean;
}

export function PermissionsEditor({ roles, loadingRoles }: PermissionsEditorProps) {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);

  // Pick first role by default once roles load
  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  // ── Fetch available routes with allowed status for selected role ────────────

  const { data: routes = [], isLoading: loadingRoutes } = useQuery<AvailableRoute[]>({
    queryKey: ["available-routes", selectedRoleId],
    queryFn: async () => {
      const params = selectedRoleId ? `?roleId=${selectedRoleId}` : "";
      const { data } = await api.get(`/permissions/available-routes${params}`);
      return data;
    },
    enabled: !!selectedRoleId,
    staleTime: 0,
  });

  // ── Sync local checked state when routes load ───────────────────────────────

  useEffect(() => {
    if (routes.length > 0) {
      setChecked(new Set(routes.filter((r) => r.allowed).map((r) => permKey(r.method, r.path))));
      setDirty(false);
    }
  }, [routes]);

  // ── Toggle helpers ──────────────────────────────────────────────────────────

  const toggle = (method: string, path: string) => {
    const key = permKey(method, path);
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    setDirty(true);
  };

  const toggleGroup = (groupRoutes: AvailableRoute[]) => {
    const allChecked = groupRoutes.every((r) => checked.has(permKey(r.method, r.path)));
    setChecked((prev) => {
      const next = new Set(prev);
      groupRoutes.forEach((r) => (allChecked ? next.delete(permKey(r.method, r.path)) : next.add(permKey(r.method, r.path))));
      return next;
    });
    setDirty(true);
  };

  // ── Save ───────────────────────────────────────────────────────────────────

  const { mutate: savePermissions, isPending: saving } = useMutation({
    mutationFn: async () => {
      const permissions = [...checked].map((key) => {
        const [method, path] = key.split("::");
        return { method, path };
      });

      await api.put(`/roles/${selectedRoleId}/permissions`, permissions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["available-routes", selectedRoleId] });
      queryClient.invalidateQueries({ queryKey: ["permissions", selectedRoleId] });
      setDirty(false);
    },
  });

  // ── Group routes by `group` field ───────────────────────────────────────────

  const groups = routes.reduce<Record<string, AvailableRoute[]>>((acc, route) => {
    if (!acc[route.group]) acc[route.group] = [];

    acc[route.group].push(route);

    return acc;
  }, {});

  const groupEntries = Object.entries(groups);
  const totalChecked = checked.size;
  const totalEndpoints = routes.length;
  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  // ── Loading / empty states ─────────────────────────────────────────────────

  if (loadingRoles) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
        <Shield className="w-8 h-8 text-text-muted" />
        <p className="text-secondary text-sm">No roles found. Create a role first from the Roles tab.</p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex gap-5 items-start">
      {/* ── Left: Role list ─────────────────────────────────────────────────── */}
      <div className="w-52 shrink-0 bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border bg-background">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Roles</p>
        </div>
        <div className="flex flex-col">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => {
                if (dirty && !confirm("You have unsaved changes. Switch role anyway?")) return;
                setSelectedRoleId(role.id);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors cursor-pointer border-b border-border last:border-b-0 ${selectedRoleId === role.id ? "bg-primary-50 text-primary" : "text-secondary hover:bg-surface-hover hover:text-text"
                }`}
            >
              <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${selectedRoleId === role.id ? "bg-primary-100" : "bg-background"}`}>
                <Shield className={`w-3.5 h-3.5 ${selectedRoleId === role.id ? "text-primary" : "text-text-muted"}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{role.name}</p>
                {role.description && <p className="text-[11px] text-text-muted truncate">{role.description}</p>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: Permission matrix ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-medium text-text flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-text-muted" />
              Permissions for <span className="text-primary font-semibold">{selectedRole?.name ?? "—"}</span>
            </p>
            <p className="text-xs text-text-muted mt-0.5">{loadingRoutes ? "Loading..." : `${totalChecked} / ${totalEndpoints} endpoints enabled`}</p>
          </div>
          <Can method="PUT" path="/api/roles/:id/permissions">
            <button
              onClick={() => savePermissions()}
              disabled={!dirty || saving}
              className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer shadow-sm shadow-primary/20"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </Can>
        </div>

        {/* Loading routes */}
        {loadingRoutes ? (
          <div className="flex items-center justify-center h-48 bg-surface border border-border rounded-lg">
            <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
          </div>
        ) : routes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 bg-surface border border-border rounded-lg gap-2">
            <KeyRound className="w-7 h-7 text-text-muted" />
            <p className="text-sm text-secondary">No available routes returned from the server.</p>
            <p className="text-xs text-text-muted">
              Make sure <code className="font-mono bg-background px-1 rounded">GET /api/permissions/available-routes</code> is implemented.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {groupEntries.map(([groupName, groupRoutes], groupIdx) => {
                const colorStyle = GROUP_COLORS[groupIdx % GROUP_COLORS.length];
                const allChecked = groupRoutes.every((r) => checked.has(permKey(r.method, r.path)));
                const someChecked = groupRoutes.some((r) => checked.has(permKey(r.method, r.path)));

                return (
                  <div key={groupName} className="bg-surface border border-border rounded-lg overflow-hidden">
                    {/* Group header */}
                    <div className={`flex items-center justify-between px-3 py-2 border-b border-border ${colorStyle.header}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${colorStyle.dot}`} />
                        <span className="text-sm font-semibold text-text">{groupName}</span>
                        <span className="text-[11px] text-text-muted">
                          ({groupRoutes.filter((r) => checked.has(permKey(r.method, r.path))).length}/{groupRoutes.length})
                        </span>
                      </div>
                      {/* Toggle all in group */}
                      <button onClick={() => toggleGroup(groupRoutes)} title={allChecked ? "Deselect all" : "Select all"} className="cursor-pointer">
                        {allChecked ? (
                          <CheckSquare2 className="w-4 h-4 text-primary-500" />
                        ) : someChecked ? (
                          <CheckSquare2 className="w-4 h-4 text-text-muted opacity-50" />
                        ) : (
                          <Square className="w-4 h-4 text-text-muted" />
                        )}
                      </button>
                    </div>

                    {/* Endpoints */}
                    <div className="divide-y divide-border">
                      {groupRoutes.map((route) => {
                        const key = permKey(route.method, route.path);
                        const isChecked = checked.has(key);
                        return (
                          <label key={key} className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-surface-hover transition-colors">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggle(route.method, route.path)}
                              className="w-3.5 h-3.5 mt-0.5 accent-primary-600 cursor-pointer rounded shrink-0"
                            />
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide shrink-0 ${METHOD_STYLES[route.method] ?? "bg-surface-hover text-secondary"
                                }`}
                            >
                              {route.method}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs text-secondary font-mono truncate">{route.path}</p>
                              {route.description && <p className="text-[11px] text-text-muted truncate mt-0.5">{route.description}</p>}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Unsaved changes indicator */}
            {dirty && !saving && (
              <p className="text-xs text-warning-600 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0" />
                Unsaved changes — click "Save Changes" to apply
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
