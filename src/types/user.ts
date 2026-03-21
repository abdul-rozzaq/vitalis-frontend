export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  isSuperUser: boolean;
  birthday?: string | null;
  phone?: string | null;
  photo?: string | null;
  role: {
    id: string;
    name: string;
  };
}
