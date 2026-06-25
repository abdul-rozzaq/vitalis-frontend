// ─── Initials ─────────────────────────────────────────────────────────────────

export function initialsOf(firstName: string, lastName: string): string {
  return (firstName[0] ?? "") + (lastName[0] ?? "");
}

// ─── Order status derivation ──────────────────────────────────────────────────

type OrderStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type ItemStatus = "PENDING" | "IN_PROGRESS" | "READY" | "DELIVERED" | "CANCELLED";

interface OrderLike {
  status: OrderStatus;
  items: Array<{ status: ItemStatus }>;
}

/**
 * Derives the "real" order status from its items — mirrors the backend's
 * recalcOrderStatus logic. Use this instead of order.status which can
 * lag behind when items are updated manually.
 */
export function deriveOrderStatus(order: OrderLike): OrderStatus {
  if (order.items.length === 0) return order.status;
  const statuses = order.items.map((i) => i.status);
  if (statuses.every((s) => s === "DELIVERED" || s === "CANCELLED")) return "COMPLETED";
  if (statuses.some((s) => s === "READY" || s === "DELIVERED" || s === "IN_PROGRESS")) return "IN_PROGRESS";
  return "PENDING";
}

// ─── Assignment options ───────────────────────────────────────────────────────

interface AssignmentLike {
  id: string;
  user: { first_name: string; last_name: string };
  department: { name: string };
  room?: { name: string } | null;
}

export function toAssignmentOptions(assignments: AssignmentLike[]) {
  return assignments.map((a) => ({
    id: a.id,
    label: `Dr. ${a.user.first_name} ${a.user.last_name} — ${a.department.name}${a.room ? ` (${a.room.name})` : ""}`,
  }));
}
