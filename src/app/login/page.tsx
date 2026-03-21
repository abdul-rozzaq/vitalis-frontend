"use client";

import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/i18n";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, Mail, Stethoscope } from "lucide-react";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import * as z from "zod";

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const { login, isLoggingIn, loginError } = useAuth();
  const { t } = useI18n();

  const loginSchema = z.object({
    email: z.email(t("login.emailInvalid")),
    password: z.string(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    login(data);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm">
        <div className="bg-surface rounded-lg border border-border p-6 md:p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mb-3">
              <Stethoscope className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-semibold text-text tracking-tight">{t("login.title")}</h1>
            <p className="text-secondary text-sm mt-0.5">{t("login.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5 ml-0.5">{t("login.emailLabel")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  {...register("email")}
                  type="email"
                  placeholder={t("login.emailPlaceholder")}
                  className="w-full bg-background border border-border rounded-md py-2.5 pl-9 pr-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                />
              </div>
              {errors.email && <p className="text-danger-600 text-xs mt-1 ml-0.5">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5 ml-0.5">{t("login.passwordLabel")}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  {...register("password")}
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-background border border-border rounded-md py-2.5 pl-9 pr-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                />
              </div>
              {errors.password && <p className="text-danger-600 text-xs mt-1 ml-0.5">{errors.password.message}</p>}
            </div>

            {loginError && (
              <div className="bg-danger-50 border border-danger-100 text-danger-600 text-sm p-2.5 rounded-md text-center">{t("login.error")}</div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-text text-background hover:opacity-90 font-medium py-2.5 rounded-md transition-opacity flex items-center justify-center gap-2 mt-1 disabled:opacity-70 cursor-pointer"
            >
              {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : t("login.signIn")}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border-light text-center">
            <p className="text-text-muted text-xs">{t("login.secureNote")}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
