export interface Department {
  id: string;
  name: string;
  description?: string;
  price?: number | null;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  children?: Department[];
}