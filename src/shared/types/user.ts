export type UserRole = "ADMIN" | "KASSIR" | "DOCTOR" | "HAMSHIRA" | "LABARANT" | "DIAGNOST" | "TEXNIK_HODIM" | "DIREKTOR" | "HISOBCHI";

/** SMENA = navbat bo'yicha ishlaydi. FIXED = aniq kunlik ish vaqti bor (registrator, kassir kabi). */
export type WorkType = "SMENA" | "FIXED";

export interface User {
  id: string;
  phone: string;
  first_name: string;
  last_name: string;
  birthday?: string | null;
  photo?: string | null;
  role: UserRole;
  /** Hikvision Face ID terminalidagi xodim raqami. Bo'sh bo'lsa xodimning
   *  skanlari hech qaysi smenaga bog'lanmaydi. */
  employeeNo?: string | null;
  workType: WorkType;
  createdAt: string;
}
