"use client";

import { Can } from "@/components/ui/can";
import { WardEditModal } from "@/components/wards/ward-edit-modal";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BedDouble,
  Building2,
  Calendar,
  CalendarCheck,
  Clock,
  Edit,
  Loader2,
  LogOut,
  PhoneCall,
  StickyNote,
  Users,
  Wallet
} from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

interface Ward {
  id: string;
  checkIn: string;
  expectedOut: string | null;
  actualOut: string | null;
  daysStayed: number | null;
  dailyRate: number | null;
  status: "OCCUPIED" | "VACATED";
  note: string | null;
  companionsCount: number;
  patient: { id: string; first_name: string; last_name: string; phone_number?: string };
  room: {
    id: string;
    name: string;
    roomType: string;
    capacity?: number | null;
    description?: string | null;
    department?: { id: string; name: string } | null;
  };
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-primary",
  bg = "bg-primary-50",
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub?: string;
  color?: string;
  bg?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-surface border border-border rounded-xl p-4 flex items-start gap-3"
    >
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon className={`w-4.5 h-4.5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-secondary font-medium mb-0.5">{label}</p>
        <div className="text-sm font-semibold text-text leading-snug">{value}</div>
        {sub && <p className="text-xs text-secondary mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-secondary">{label}</span>
      <span className="text-sm font-medium text-text text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export default function WardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "payment">("info");

  const { data: ward, isLoading } = useQuery<Ward>({
    queryKey: ["ward", id],
    queryFn: () => api.get(`/wards/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const { mutate: checkOut, isPending: isCheckingOut } = useMutation({
    mutationFn: () => api.patch(`/wards/${id}/check-out`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ward", id] });
      queryClient.invalidateQueries({ queryKey: ["wards"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const daysStayed =
    ward?.status === "OCCUPIED"
      ? Math.max(1, Math.ceil((Date.now() - new Date(ward.checkIn).getTime()) / 86400000))
      : (ward?.daysStayed ?? 0);

  const isOverdue =
    ward?.status === "OCCUPIED" &&
    ward.expectedOut &&
    new Date(ward.expectedOut) < new Date();

  const estimatedTotal =
    ward?.dailyRate && ward.dailyRate > 0 ? daysStayed * ward.dailyRate : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-secondary" />
      </div>
    );
  }

  if (!ward) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-secondary text-sm">{t("common.notFound")}</p>
      </div>
    );
  }

  const initials = `${ward.patient.first_name[0] ?? ""}${ward.patient.last_name[0] ?? ""}`.toUpperCase();

  return (
    <div className="p-6 max-w-4xl mx-auto w-full space-y-5">
      {/* Back */}
      <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
        <Link
          href="/wards"
          className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-text transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {t("wards.title")}
        </Link>
      </motion.div>

      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="bg-surface border border-border rounded-2xl overflow-hidden"
      >
        {/* Status bar */}
        <div
          className={`h-1.5 w-full ${ward.status === "OCCUPIED"
              ? isOverdue
                ? "bg-red-400"
                : "bg-primary"
              : "bg-gray-300"
            }`}
        />

        <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Patient avatar */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-primary font-bold text-xl shrink-0">
              {initials}
            </div>
            <div>
              <Link
                href={`/patients/${ward.patient.id}`}
                className="text-lg font-bold text-text hover:text-primary transition-colors"
              >
                {ward.patient.first_name} {ward.patient.last_name}
              </Link>
              {ward.patient.phone_number && (
                <p className="text-sm text-secondary flex items-center gap-1 mt-0.5">
                  <PhoneCall className="w-3.5 h-3.5" />
                  {ward.patient.phone_number}
                </p>
              )}
            </div>
          </div>

          <div className="sm:ml-auto flex flex-wrap items-center gap-2">
            {/* Room badge */}
            <div className="flex items-center gap-1.5 bg-surface-hover border border-border rounded-lg px-3 py-1.5">
              <BedDouble className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-text">{ward.room.name}</span>
              {ward.room.department && (
                <span className="text-xs text-secondary">· {ward.room.department.name}</span>
              )}
            </div>

            {/* Status badge */}
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide ${ward.status === "OCCUPIED"
                  ? isOverdue
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
                }`}
            >
              {ward.status === "OCCUPIED"
                ? isOverdue
                  ? "⚠️ " + t("wards.statusOccupied")
                  : t("wards.statusOccupied")
                : t("wards.statusVacated")}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={Clock}
          label={t("wards.colDays")}
          value={
            <span className="text-xl font-bold">
              {daysStayed} <span className="text-sm font-medium text-secondary">{t("wards.currentDay")}</span>
            </span>
          }
          color="text-primary"
          bg="bg-primary-50"
          delay={0.06}
        />
        <StatCard
          icon={Users}
          label={t("wards.companionsCount")}
          value={
            ward.companionsCount > 0 ? (
              <span>{ward.companionsCount} ta</span>
            ) : (
              <span className="text-secondary font-normal">Yo'q</span>
            )
          }
          color="text-amber-600"
          bg="bg-amber-50"
          delay={0.08}
        />
        <StatCard
          icon={Calendar}
          label={t("wards.colCheckIn")}
          value={new Date(ward.checkIn).toLocaleDateString("uz-UZ")}
          sub={
            ward.expectedOut
              ? `${t("wards.colExpectedOut")}: ${new Date(ward.expectedOut).toLocaleDateString("uz-UZ")}`
              : undefined
          }
          color="text-blue-600"
          bg="bg-blue-50"
          delay={0.1}
        />
        <StatCard
          icon={Wallet}
          label={t("ward.dailyRate")}
          value={
            ward.dailyRate && ward.dailyRate > 0 ? (
              <span>{ward.dailyRate.toLocaleString("uz-UZ")} so'm</span>
            ) : (
              <span className="text-secondary font-normal">—</span>
            )
          }
          sub={
            estimatedTotal
              ? `Jami: ${estimatedTotal.toLocaleString("uz-UZ")} so'm`
              : undefined
          }
          color="text-emerald-600"
          bg="bg-emerald-50"
          delay={0.12}
        />
      </div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.14 }}>
        <div className="flex gap-1 bg-surface-hover rounded-lg p-1 w-fit border border-border">
          {[
            { key: "info", label: t("wards.colRoom") + " / " + t("common.description"), icon: BedDouble },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${activeTab === key
                  ? "bg-surface text-text shadow-sm border border-border"
                  : "text-secondary hover:text-text"
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      {activeTab === "info" && (
        <motion.div
          key="info"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Room info */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BedDouble className="w-3.5 h-3.5" />
              {t("wards.colRoom")}
            </p>
            <InfoItem label={t("common.name")} value={ward.room.name} />
            {ward.room.department && (
              <InfoItem
                label={t("forms.department")}
                value={
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-secondary" />
                    {ward.room.department.name}
                  </span>
                }
              />
            )}
            {ward.room.capacity != null && (
              <InfoItem label={t("assignments.capacity")} value={`${ward.room.capacity} o'rin`} />
            )}
            {ward.room.description && (
              <InfoItem label={t("common.description")} value={ward.room.description} />
            )}
          </div>

          {/* Dates */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {t("wards.dates")}
            </p>
            <InfoItem
              label={t("wards.colCheckIn")}
              value={new Date(ward.checkIn).toLocaleDateString("uz-UZ")}
            />
            {ward.expectedOut && (
              <InfoItem
                label={t("wards.colExpectedOut")}
                value={
                  <span className={isOverdue ? "text-red-600 font-semibold" : ""}>
                    {new Date(ward.expectedOut).toLocaleDateString("uz-UZ")}
                    {isOverdue && " ⚠️"}
                  </span>
                }
              />
            )}
            {ward.actualOut && (
              <InfoItem
                label={t("wards.actualOut")}
                value={new Date(ward.actualOut).toLocaleDateString("uz-UZ")}
              />
            )}
            <InfoItem
              label={t("wards.colDays")}
              value={
                <span className="flex items-center gap-1 text-primary font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  {daysStayed} {t("wards.currentDay")}
                </span>
              }
            />
          </div>

          {/* Note */}
          {ward.note && (
            <div className="bg-surface border border-border rounded-xl p-4 md:col-span-2">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" />
                {t("wards.note")}
              </p>
              <p className="text-sm text-secondary leading-relaxed">{ward.note}</p>
            </div>
          )}
        </motion.div>
      )}


      {/* Action buttons */}
      <Can roles={["ADMIN", "KASSIR", "HAMSHIRA", "DOCTOR"]}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-3"
        >
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border text-secondary hover:bg-surface-hover text-sm font-medium transition-colors cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            {t("common.edit")}
          </button>

          {ward.status === "OCCUPIED" && (
            <button
              onClick={() => {
                if (confirm(t("wards.checkOutConfirm"))) checkOut();
              }}
              disabled={isCheckingOut}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-sm font-medium transition-colors cursor-pointer disabled:opacity-40"
            >
              {isCheckingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              {t("wards.checkOut")}
            </button>
          )}
        </motion.div>
      </Can>

      <WardEditModal
        ward={
          editOpen
            ? {
              id: ward.id,
              checkIn: ward.checkIn,
              expectedOut: ward.expectedOut,
              note: ward.note,
              status: ward.status,
              companionsCount: ward.companionsCount,
              patient: ward.patient,
              room: ward.room,
            }
            : null
        }
        onClose={() => {
          setEditOpen(false);
          queryClient.invalidateQueries({ queryKey: ["ward", id] });
        }}
      />
    </div>
  );
}