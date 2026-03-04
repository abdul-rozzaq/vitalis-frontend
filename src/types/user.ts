export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  isSuperuser: boolean;
  role: {
    id: string;
    name: string;
  };
}
