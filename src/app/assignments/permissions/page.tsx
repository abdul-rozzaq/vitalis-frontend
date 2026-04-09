"use client";

import { PermissionsEditor } from "@/components/assignments/permissions-editor";
import { Role } from "@/features/assignments/types";
import { asArray } from "@/features/assignments/utils";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function AssignmentPermissionsPage() {
  const { data: rolesRaw, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.get("/roles").then((r) => r.data as unknown),
    refetchOnWindowFocus: false,
  });

  const roles = asArray<Role>(rolesRaw);

  return isLoading ? (
    <div className="bg-surface border border-border rounded-lg h-48 flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
    </div>
  ) : (
    <PermissionsEditor roles={roles} loadingRoles={isLoading} />
  );
}
