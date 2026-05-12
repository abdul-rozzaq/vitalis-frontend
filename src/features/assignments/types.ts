export interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export type RoomType = "WARD" | "EXAMINATION";

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
    role: Role;
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
  role: Role;
}

export interface DepartmentOption {
  id: string;
  name: string;
  price?: number | null;
}

export type TabId = "assignments" | "rooms" | "roles" | "permissions" | "lab-assignments";

export interface SheetState<T> {
  open: boolean;
  editing: T | null;
}

export type RoomPayload = {
  name: string;
  roomType: "WARD" | "EXAMINATION";
  capacity?: number;
  description?: string;
  departmentId?: string | null;
};

export type RolePayload = {
  name: string;
  description?: string;
};
