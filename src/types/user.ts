export interface User {
  id: string;
  phone: string;
  first_name: string;
  last_name: string;
  isSuperUser: boolean;
  birthday?: string | null;
  photo?: string | null;
  role: {
    id: string;
    name: string;
  };
}
