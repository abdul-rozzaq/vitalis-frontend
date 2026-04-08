import { z } from "zod";

export const createProfileSchema = (t: (key: string) => string) =>
  z.object({
    first_name: z.string().min(2, t("forms.firstNameTooShort")),
    last_name: z.string().min(2, t("forms.lastNameTooShort")),
    phone: z
      .string()
      .min(1, t("forms.phoneRequired"))
      .regex(/^\+998[0-9]{9}$/, t("forms.phoneInvalidUzbekistan")),
    birthday: z.string().optional(),
    photo: z.string().optional(),
  });

export const createPasswordSchema = (t: (key: string) => string) =>
  z
    .object({
      currentPassword: z.string().min(1, t("settings.currentPasswordRequired")),
      newPassword: z.string().min(6, t("forms.passwordTooShort")),
      confirmPassword: z.string().min(1, t("settings.confirmPasswordRequired")),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("settings.passwordsMismatch"),
      path: ["confirmPassword"],
    });
