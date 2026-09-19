"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { EnterpriseDataTable } from "@/components/ui/enterprise-data-table";
import { formatCurrency, formatDateShort } from "@/shared/lib/formatters";
import { api } from "@/shared/lib/api";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";

interface JournalRow {
  id: string;
  patientId: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  chiefComplaint: string | null;
  openedAt: string;
  closedAt: string | null;
  patient: { id: string; first_name: string; last_name: string; phone_number: string | null };
  invoice: { id: string; status: string; totalAmount: string; paidCash: string; paidBonus: string; billedAmount: string; unbilledAmount: string } | null;
}

type StatusFilter = "ACTIVE" | "COMPLETED" | "ALL";

export default function JournalsPage() {
  const t = useTranslations();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");

  const { data: journals = [], isLoading } = useQuery<JournalRow[]>({
    queryKey: ["journals", statusFilter],
    queryFn: () =>
      api
        .get("/cases", {
          params: { billingMode: "MASTER", ...(statusFilter !== "ALL" ? { status: statusFilter } : {}) },
        })
        .then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const columns = useMemo<ColumnDef<JournalRow>[]>(
    () => [
      {
        id: "patientName",
        header: t("journals.colPatient"),
        accessorFn: (row) => `${row.patient.first_name} ${row.patient.last_name}`,
        cell: ({ row }) => {
          const p = row.original.patient;
          return (
            <Link href={`/patients/${p.id}/journal`} className="flex flex-col hover:underline">
              <span className="font-medium text-text">
                {p.first_name} {p.last_name}
              </span>
              {p.phone_number && <span className="text-xs text-text-muted">{p.phone_number}</span>}
            </Link>
          );
        },
      },
      {
        accessorKey: "chiefComplaint",
        header: t("journals.colCase"),
        cell: ({ row }) => <span className="text-sm text-text-muted">{row.original.chiefComplaint || "—"}</span>,
      },
      {
        id: "openedAt",
        header: t("journals.colOpened"),
        accessorFn: (row) => row.openedAt,
        cell: ({ row }) => <span className="text-sm text-text-muted">{formatDateShort(row.original.openedAt)}</span>,
      },
      {
        id: "total",
        header: t("journals.colTotal"),
        accessorFn: (row) => Number(row.invoice?.totalAmount ?? 0),
        cell: ({ getValue }) => <span className="text-sm font-mono text-text">{formatCurrency(getValue<number>())} UZS</span>,
      },
      {
        id: "billed",
        header: t("journal.billed"),
        accessorFn: row => Number(row.invoice?.billedAmount ?? 0),
        cell: ({ getValue }) => <span className="text-sm tabular-nums text-accent">{formatCurrency(getValue<number>())} UZS</span>,
      },
      {
        id: "unbilled",
        header: t("journal.unbilled"),
        accessorFn: row => Number(row.invoice?.unbilledAmount ?? 0),
        cell: ({ getValue }) => <span className="text-sm tabular-nums text-warning">{formatCurrency(getValue<number>())} UZS</span>,
      },
      {
        id: "paid",
        header: t("journals.colPaid"),
        accessorFn: (row) => Number(row.invoice?.paidCash ?? 0) + Number(row.invoice?.paidBonus ?? 0),
        cell: ({ getValue }) => <span className="text-sm font-mono text-success">{formatCurrency(getValue<number>())} UZS</span>,
      },
      {
        id: "remaining",
        header: t("journals.colRemaining"),
        accessorFn: (row) => Number(row.invoice?.totalAmount ?? 0) - (Number(row.invoice?.paidCash ?? 0) + Number(row.invoice?.paidBonus ?? 0)),
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return <span className={`text-sm font-mono font-semibold ${val > 0 ? "text-warning" : "text-text-muted"}`}>{formatCurrency(Math.max(val, 0))} UZS</span>;
        },
      },
      {
        accessorKey: "status",
        header: t("journals.colStatus"),
        cell: ({ row }) => {
          const s = row.original.status;
          const cfg =
            s === "ACTIVE"
              ? "bg-info-50 text-info border-info-100"
              : s === "COMPLETED"
                ? "bg-success-50 text-success border-success-100"
                : "bg-surface-secondary text-text-muted border-border";
          return <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg}`}>{t(`cases.status.${s}`)}</span>;
        },
      },
    ],
    [t],
  );

  return (
    <div>
      <PageHeader title={t("nav.journals")} subtitle={t("journals.subtitle")} />
      <PageContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              { label: t("nav.journals"), value: String(journals.length), money: false },
              { label: t("journal.totalServices"), value: formatCurrency(journals.reduce((sum, row) => sum + Number(row.invoice?.totalAmount ?? 0), 0)), money: true },
              { label: t("journal.billed"), value: formatCurrency(journals.reduce((sum, row) => sum + Number(row.invoice?.billedAmount ?? 0), 0)), money: true },
              { label: t("journal.unbilled"), value: formatCurrency(journals.reduce((sum, row) => sum + Number(row.invoice?.unbilledAmount ?? 0), 0)), money: true },
            ].map(metric => <div key={metric.label} className="rounded-xl border border-border bg-surface p-5"><p className="text-xs text-text-muted mb-2">{metric.label}</p><p className="text-xl font-semibold text-text tabular-nums">{isLoading ? "…" : metric.value}</p>{metric.money && <p className="text-[10px] text-text-muted mt-1">UZS</p>}</div>)}
          </div>
          <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1 w-fit">
            {(["ACTIVE", "COMPLETED", "ALL"] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  statusFilter === f ? "bg-background text-text shadow-sm" : "text-secondary hover:text-text"
                }`}
              >
                {f === "ACTIVE" ? t("journals.filterActive") : f === "COMPLETED" ? t("journals.filterClosed") : t("journals.filterAll")}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface border border-border rounded-xl p-4 animate-pulse h-14" />
              ))}
            </div>
          ) : journals.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-12 text-center">
              <BookOpen className="w-8 h-8 text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-muted">{t("journals.empty")}</p>
            </div>
          ) : (
            <EnterpriseDataTable columns={columns} data={journals} pageSize={20} searchKey="patientName" searchPlaceholder={t("common.filterPlaceholder")} />
          )}
        </div>
      </PageContent>
    </div>
  );
}
