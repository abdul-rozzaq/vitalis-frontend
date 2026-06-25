export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  birthday?: string | null;
  photo?: string | null;
  role: string;
  createdAt: string;
}
