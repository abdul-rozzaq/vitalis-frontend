import { UserRole } from "@/types/user";

export type RoomType = "WARD" | "EXAMINATION" | "OPERATION";

export interface Room {
  id: string;
  name: string;
  roomType: RoomType;
  capacity?: number | null;
  description?: string;
  department?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  assignmentId: string;
}

export interface Assignment {
  id: string;
  userId: string;
  departmentId: string;
  roomId?: string;
  isActive: boolean;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    role: UserRole;
  };
  department?: {
    id: string;
    name: string;
  };
  room?: {
    id: string;
    name: string;
  };
  schedules?: Schedule[];
  createdAt: string;
}

export interface UserOption {
  id: string;
  first_name: string;
  last_name: string;
  role: UserRole;
}

export interface DepartmentOption {
  id: string;
  name: string;
  price?: number | null;
}

export type TabId = "assignments" | "rooms" | "roles" | "permissions" | "lab-assignments" | "laboratories" | "diagnostics" | "diagnostics-assignments" | "operation-types";

export interface SheetState<T> {
  open: boolean;
  editing: T | null;
}

export type RoomPayload = {
  name: string;
  roomType: RoomType;
  capacity?: number;
  description?: string;
  departmentId?: string | null;
};

export type RolePayload = {
  name: string;
  description?: string; 
};
