"use client";
import { useTranslations } from "next-intl";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { api } from "@/lib/api";
import { formatAmount } from "@/lib/formatters";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Edit,
  Loader2,
  Play,
  Scissors,
  Trash2,
  XCircle
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

type OperationStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

interface OperationSurgeon {
  role: string;
  surgeon: { id: string; first_name: string; last_name: string; role: string };
}

interface OperationItem {
  id: string;
  operationTypeItemId: string;
  name: string;
  unitPrice: string;
  quantity: number;
  totalPrice: string;
}

interface Operation {
  id: string;
  patientId: string;
  status: OperationStatus;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  totalPrice: string;
  note?: string;
  patient: { id: string; first_name: string; last_name: string };
  operationType: { id: string; name: string };
  room?: { id: string; name: string };
  surgeons: OperationSurgeon[];
  items: OperationItem[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const fmt = formatAmount;

const initials = (first: string, last: string) =>
  `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();

// ─── Status config ─────────────────────────────────────────────────────────────



// ─── Sub-components ────────────────────────────────────────────────────────────



function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium text-text-muted tracking-wider uppercase mb-3">
      {children}
    </p>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-sm font-medium text-text">{value}</span>
    </div>
  );
}

function ActionButton({
  onClick,
  icon,
  label,
  variant,
  isPending,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant: "primary" | "success" | "danger" | "ghost" | "ghost-danger";
  isPending: boolean;
}) {
  const cls = {
    primary: "bg-primary text-white hover:bg-primary/90",
    success: "bg-success text-white hover:bg-success/90",
    danger: "bg-danger text-white hover:bg-danger/90",
    ghost: "border border-border text-text hover:bg-surface-hover",
    "ghost-danger": "border border-border text-danger hover:bg-danger-50",
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={isPending}
      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 cursor-pointer ${cls}`}
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {label}
    </button>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OperationDetailsPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const operationId = params?.id as string;
  const queryClient = useQueryClient();

  const STATUS_CONFIG: Record<
    OperationStatus,
    { label: string; badgeCls: string; dotCls: string; icon: React.ElementType }
  > = {
    SCHEDULED: {
      label: t("operations.statusScheduled"),
      badgeCls: "bg-info-50 text-info",
      dotCls: "bg-info",
      icon: Clock,
    },
    IN_PROGRESS: {
      label: "Jarayonda",
      badgeCls: "bg-warning-50 text-warning",
      dotCls: "bg-warning",
      icon: Play,
    },
    COMPLETED: {
      label: "Yakunlangan",
      badgeCls: "bg-success-50 text-success",
      dotCls: "bg-success",
      icon: CheckCircle2,
    },
    CANCELLED: {
      label: "Bekor qilingan",
      badgeCls: "bg-danger-50 text-danger",
      dotCls: "bg-danger",
      icon: XCircle,
    },
  };
  function StatusBadge({ status }: { status: OperationStatus }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.SCHEDULED;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${cfg.badgeCls}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotCls}`} />
        {cfg.label}
      </span>
    );
  }

  const { data: op, isLoading } = useQuery<Operation>({
    queryKey: ["operation", operationId],
    queryFn: () => api.get(`/operations/${operationId}`).then((r) => r.data),
    enabled: !!operationId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["operations"] });
    queryClient.invalidateQueries({ queryKey: ["operation", operationId] });
  };

  const startMutation = useMutation({
    mutationFn: () => api.patch(`/operations/${operationId}/start`),
    onSuccess: () => { invalidate(); toast.success("Operatsiya boshlandi"); },
    onError: () => toast.error("Amalni bajarishda xatolik yuz berdi"),
  });

  const completeMutation = useMutation({
    mutationFn: () => api.patch(`/operations/${operationId}/complete`),
    onSuccess: () => { invalidate(); toast.success("Operatsiya yakunlandi"); },
    onError: () => toast.error("Amalni bajarishda xatolik yuz berdi"),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.patch(`/operations/${operationId}/cancel`),
    onSuccess: () => { invalidate(); toast.success("Operatsiya bekor qilindi"); },
    onError: () => toast.error("Amalni bajarishda xatolik yuz berdi"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/operations/${operationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operations"] });
      toast.success("Operatsiya o'chirib tashlandi");
      router.push("/operations");
    },
    onError: () => toast.error("O'chirishda xatolik yuz berdi"),
  });

  const isActionPending =
    startMutation.isPending ||
    completeMutation.isPending ||
    cancelMutation.isPending ||
    deleteMutation.isPending;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <>
        <PageHeader title="Operatsiya tafsilotlari" />
        <PageContent>
          <div className="flex justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
          </div>
        </PageContent>
      </>
    );
  }

  if (!op) {
    return (
      <>
        <PageHeader
          title="Operatsiya tafsilotlari"
          actions={
            <button
              onClick={() => router.push("/operations")}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border text-text-muted hover:bg-surface-hover transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Orqaga
            </button>
          }
        />
        <PageContent>
          <div className="text-center py-24 text-text-muted text-sm">Operatsiya topilmadi</div>
        </PageContent>
      </>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        title={`${op.patient.first_name} ${op.patient.last_name}`}
        actions={
          <button
            onClick={() => router.push("/operations")}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border text-text-muted hover:bg-surface-hover transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Orqaga
          </button>
        }
      />

      <PageContent>
        {/* Two-column layout: main content + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-5 items-start">

          {/* ══ MAIN (chap) ═══════════════════════════════════════════════════ */}
          <div className="space-y-4">

            {/* Hero card */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-5 pb-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Scissors className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-text">{op.operationType.name}</h2>
                    <p className="text-sm text-text-muted mt-0.5">
                      {op.patient.first_name} {op.patient.last_name}
                      {op.room && <> · {op.room.name}</>}
                    </p>
                  </div>
                </div>
                <StatusBadge status={op.status} />
              </div>

              {/* Meta info grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-text-muted mb-1">Rejalashtirilgan</p>
                  <p className="text-sm font-medium text-text">
                    {new Date(op.scheduledAt).toLocaleString("uz-UZ")}
                  </p>
                </div>
                {op.startedAt && (
                  <div>
                    <p className="text-xs text-text-muted mb-1">Boshlandi</p>
                    <p className="text-sm font-medium text-text">
                      {new Date(op.startedAt).toLocaleString("uz-UZ")}
                    </p>
                  </div>
                )}
                {op.completedAt && (
                  <div>
                    <p className="text-xs text-text-muted mb-1">Yakunlandi</p>
                    <p className="text-sm font-medium text-text">
                      {new Date(op.completedAt).toLocaleString("uz-UZ")}
                    </p>
                  </div>
                )}
                {op.room && (
                  <div>
                    <p className="text-xs text-text-muted mb-1">Xona</p>
                    <p className="text-sm font-medium text-text">{op.room.name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Surgeons */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <SectionLabel>Jarrohlar</SectionLabel>
              <div className="space-y-2">
                {op.surgeons.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2.5 bg-surface-hover rounded-lg"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0 ${s.role === "LEAD"
                          ? "bg-primary/10 text-primary"
                          : "bg-border text-text-muted"
                          }`}
                      >
                        {initials(s.surgeon.first_name, s.surgeon.last_name)}
                      </div>
                      <span className="text-sm text-text">
                        {s.surgeon.first_name} {s.surgeon.last_name}
                      </span>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${s.role === "LEAD"
                        ? "bg-primary/10 text-primary"
                        : "bg-surface border border-border text-text-muted"
                        }`}
                    >
                      {s.role === "LEAD" ? "Bosh jarroh" : "Assistent"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Items table */}
            {op.items.length > 0 && (
              <div className="bg-surface border border-border rounded-xl p-5">
                <SectionLabel>Xizmatlar va vositalar</SectionLabel>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
                    <thead>
                      <tr className="bg-surface-hover border-b border-border">
                        <th className="text-left px-3 py-2.5 text-xs font-medium text-text-muted" style={{ width: "45%" }}>
                          Nomi
                        </th>
                        <th className="text-right px-3 py-2.5 text-xs font-medium text-text-muted" style={{ width: "15%" }}>
                          Miqdor
                        </th>
                        <th className="text-right px-3 py-2.5 text-xs font-medium text-text-muted" style={{ width: "20%" }}>
                          Narx
                        </th>
                        <th className="text-right px-3 py-2.5 text-xs font-medium text-text-muted" style={{ width: "20%" }}>
                          Jami
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {op.items.map((item) => (
                        <tr key={item.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-2.5 text-text">{item.name}</td>
                          <td className="px-3 py-2.5 text-right text-text-muted">{item.quantity}</td>
                          <td className="px-3 py-2.5 text-right text-text-muted">{fmt(item.unitPrice)}</td>
                          <td className="px-3 py-2.5 text-right font-medium text-text">{fmt(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between pt-3 mt-1">
                  <span className="text-sm text-text-muted">Umumiy:</span>
                  <span className="text-base font-semibold text-text">{fmt(op.totalPrice)} so'm</span>
                </div>
              </div>
            )}

            {/* Note */}
            {op.note && (
              <div className="bg-surface border border-border rounded-xl p-5">
                <SectionLabel>Izoh</SectionLabel>
                <p className="text-sm text-text bg-surface-hover rounded-lg px-3 py-2.5 leading-relaxed border-l-2 border-border">
                  {op.note}
                </p>
              </div>
            )}
          </div>

          {/* ══ SIDEBAR (o'ng) ════════════════════════════════════════════════ */}
          <div className="space-y-4">

            {/* Total price */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <p className="text-xs text-text-muted mb-1">Umumiy summa</p>
              <p className="text-2xl font-semibold text-text">
                {fmt(op.totalPrice)}{" "}
                <span className="text-sm font-normal text-text-muted">so'm</span>
              </p>
            </div>

            {/* Time info */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <SectionLabel>Ma'lumotlar</SectionLabel>
              <InfoItem
                label={t("operations.statusScheduled")}
                value={new Date(op.scheduledAt).toLocaleDateString("uz-UZ")}
              />
              {op.startedAt && (
                <InfoItem
                  label={t("operations.statusStarted")}
                  value={new Date(op.startedAt).toLocaleTimeString("uz-UZ", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                />
              )}
              {op.completedAt && (
                <InfoItem
                  label="Yakunlandi"
                  value={new Date(op.completedAt).toLocaleTimeString("uz-UZ", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                />
              )}
              {op.room && <InfoItem label="Xona" value={op.room.name} />}
              <InfoItem label="Xizmatlar soni" value={`${op.items.length} ta`} />
              <InfoItem label="Jarrohlar soni" value={`${op.surgeons.length} ta`} />
            </div>

            {/* Actions */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <SectionLabel>Amallar</SectionLabel>
              <div className="space-y-2">
                {(op.status === "SCHEDULED" || op.status === "IN_PROGRESS") && (
                  <ActionButton
                    onClick={() => router.push(`/operations/${op.id}/edit`)}
                    icon={<Edit className="w-4 h-4" />}
                    label={t("operations.actionEdit")}
                    variant="ghost"
                    isPending={isActionPending}
                  />
                )}

                {op.status === "SCHEDULED" && (
                  <ActionButton
                    onClick={() => startMutation.mutate()}
                    icon={<Play className="w-4 h-4" />}
                    label={t("operations.actionStart")}
                    variant="primary"
                    isPending={isActionPending}
                  />
                )}

                {op.status === "IN_PROGRESS" && (
                  <ActionButton
                    onClick={() => {
                      if (confirm("Operatsiyani yakunlashni tasdiqlaysizmi?"))
                        completeMutation.mutate();
                    }}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    label={t("operations.actionComplete")}
                    variant="success"
                    isPending={isActionPending}
                  />
                )}

                {(op.status === "SCHEDULED" || op.status === "IN_PROGRESS") && (
                  <>
                    <div className="h-px bg-border my-1" />
                    <ActionButton
                      onClick={() => {
                        if (confirm("Operatsiyani bekor qilishni tasdiqlaysizmi?"))
                          cancelMutation.mutate();
                      }}
                      icon={<XCircle className="w-4 h-4" />}
                      label={t("operations.actionCancel")}
                      variant="danger"
                      isPending={isActionPending}
                    />
                  </>
                )}

                {op.status === "SCHEDULED" && (
                  <ActionButton
                    onClick={() => {
                      if (confirm("Operatsiyani o'chirishni tasdiqlaysizmi?"))
                        deleteMutation.mutate();
                    }}
                    icon={<Trash2 className="w-4 h-4" />}
                    label={t("operations.actionDelete")}
                    variant="ghost-danger"
                    isPending={isActionPending}
                  />
                )}
              </div>
            </div>

          </div>
        </div>
      </PageContent>
    </>
  );
}