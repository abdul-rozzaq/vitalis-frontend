"use client";

// QZ Tray / Xprinter hozircha o'chirilgan (printer xatolik beryapti).
// import { PrinterSettingsCard } from "@/features/settings/components/PrinterSettingsCard";
import { createPasswordSchema, createProfileSchema } from "@/features/settings/schemas";
import { ChangePasswordPayload, PasswordFormValues, ProfileFormValues } from "@/features/settings/types";
import { getApiErrorMessage, getInitialPhotoPreview } from "@/features/settings/utils";
import { useAuth } from "@/shared/hooks/use-auth";
import { api } from "@/shared/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Camera, KeyRound, Loader2, LogOut, Phone, Shield, User, X } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

export default function SettingsPage() {
  const t = useTranslations();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const profileSchema = createProfileSchema(t);
  const passwordSchema = createPasswordSchema(t);

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    getInitialPhotoPreview(apiBase, user?.photo)
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<z.input<typeof profileSchema>, unknown, z.output<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      phone: user?.phone ?? "",
      birthday: user?.birthday ? user.birthday.slice(0, 10) : "",
      photo: user?.photo ?? "",
    },
  });

  const {
    register: regPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<z.input<typeof passwordSchema>, unknown, z.output<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  });

  const { mutateAsync: updateProfile, isPending: isUpdatingProfile } = useMutation({
    mutationFn: (data: ProfileFormValues) => api.patch(`/users/${user?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    },
  });

  const { mutateAsync: changePassword, isPending: isChangingPassword, error: passwordError } = useMutation({
    mutationFn: (data: ChangePasswordPayload) =>
      api.patch("/auth/change-password", data),
    onSuccess: () => {
      resetPassword();
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onProfileSubmit = async (data: ProfileFormValues) => {
    let photo = data.photo;
    if (photoFile) {
      const formData = new FormData();
      formData.append("photo", photoFile);
      const res = await api.post("/uploads/photo", formData);
      photo = res.data.url;
    }
    await updateProfile({ ...data, photo });
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
  };

  const passwordErrorMsg = getApiErrorMessage(passwordError);

  return (
    <div className="p-6 max-w-2xl mx-auto w-full space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-semibold text-text tracking-tight">{t("settings.title")}</h2>
        <p className="text-secondary text-sm mt-0.5">{t("settings.description")}</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="bg-surface border border-border rounded-xl p-6 space-y-5"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text">{t("settings.profileTitle")}</h3>
            <p className="text-xs text-secondary">{t("settings.profileDesc")}</p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {photoPreview ? (
                <div className="w-16 h-16 rounded-full overflow-hidden border border-border">
                  <Image src={photoPreview} alt="photo" width={64} height={64} className="object-cover w-full h-full" unoptimized />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-50 border border-dashed border-primary-300 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary-400" />
                </div>
              )}
              {photoPreview && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-danger-600 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="settings-photo" />
              <label
                htmlFor="settings-photo"
                className="cursor-pointer inline-flex items-center gap-1.5 bg-surface border border-border hover:bg-surface-hover text-secondary px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                {photoPreview ? t("forms.changePhoto") : t("forms.uploadPhoto")}
              </label>
              <p className="text-xs text-secondary mt-1">{t("forms.photoHint")}</p>
            </div>
          </div>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text">{t("forms.firstName")}</label>
              <input
                {...regProfile("first_name")}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
              {profileErrors.first_name && <p className="text-xs text-danger-600">{profileErrors.first_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text">{t("forms.lastName")}</label>
              <input
                {...regProfile("last_name")}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
              {profileErrors.last_name && <p className="text-xs text-danger-600">{profileErrors.last_name.message}</p>}
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-primary-500" />
              {t("forms.phone")}
            </label>
            <input
              {...regProfile("phone")}
              type="tel"
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
            {profileErrors.phone && <p className="text-xs text-danger-600">{profileErrors.phone.message}</p>}
          </div>

          {/* Birthday */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary-500" />
              {t("forms.birthday")}
            </label>
            <input
              {...regProfile("birthday")}
              type="date"
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary-600/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {isUpdatingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {t("common.saveChanges")}
            </button>
            {profileSuccess && (
              <span className="text-sm text-success font-medium">{t("settings.savedSuccessfully")}</span>
            )}
          </div>
        </form>
      </motion.div>

      {/* Password Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-surface border border-border rounded-xl p-6 space-y-5"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text">{t("settings.passwordTitle")}</h3>
            <p className="text-xs text-secondary">{t("settings.passwordDesc")}</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-primary-500" />
              {t("settings.currentPassword")}
            </label>
            <input
              {...regPassword("currentPassword")}
              type="password"
              placeholder="••••••••"
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
            {passwordErrors.currentPassword && (
              <p className="text-xs text-danger-600">{passwordErrors.currentPassword.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text">{t("settings.newPassword")}</label>
              <input
                {...regPassword("newPassword")}
                type="password"
                placeholder="••••••••"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
              {passwordErrors.newPassword && (
                <p className="text-xs text-danger-600">{passwordErrors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text">{t("settings.confirmPassword")}</label>
              <input
                {...regPassword("confirmPassword")}
                type="password"
                placeholder="••••••••"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-danger-600">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {passwordErrorMsg && (
            <p className="text-sm text-danger-600 font-medium">{passwordErrorMsg}</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary-600/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {isChangingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {t("settings.changePasswordBtn")}
            </button>
            {passwordSuccess && (
              <span className="text-sm text-success font-medium">{t("settings.savedSuccessfully")}</span>
            )}
          </div>
        </form>
      </motion.div>

      {/* QZ Tray / Xprinter hozircha o'chirilgan (printer xatolik beryapti). */}
      {/* <PrinterSettingsCard /> */}

      {/* Account / Sign out Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="bg-surface border border-border rounded-xl p-6 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text truncate">
              {user?.first_name} {user?.last_name}
            </h3>
            <p className="text-xs text-secondary truncate">{user?.role}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="inline-flex items-center gap-2 bg-surface border border-border hover:bg-danger-50 hover:text-danger-600 hover:border-danger-100 text-secondary px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
          {t("nav.signOut")}
        </button>
      </motion.div>
    </div>
  );
}
