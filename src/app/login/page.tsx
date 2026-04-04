"use client";

import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, Phone } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import * as z from "zod";

type LoginFormValues = {
  phone: string;
  password: string;
};

export default function LoginPage() {
  const { login, isLoggingIn, loginError } = useAuth();
  const t = useTranslations();

  const loginSchema = z.object({
    phone: z.string().regex(/^\+998[0-9]{9}$/, t("login.phoneInvalid")),
    password: z.string(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "+998",
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
            <div className="w-40 h-14 flex items-center justify-center mb-3">
              <Image src="/logo.png" alt="Vitalis logo" width={160} height={56} className="w-40 h-14 object-contain" priority />
            </div>
            <h1 className="text-xl font-semibold text-text tracking-tight">{t("login.title")}</h1>
            <p className="text-secondary text-sm mt-0.5">{t("login.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5 ml-0.5">{t("login.phoneLabel")}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  {...register("phone")}
                  type="tel"
                  placeholder={t("login.phonePlaceholder")}
                  className="w-full bg-background border border-border rounded-md py-2.5 pl-9 pr-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                />
              </div>
              {errors.phone && <p className="text-danger-600 text-xs mt-1 ml-0.5">{errors.phone.message}</p>}
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
