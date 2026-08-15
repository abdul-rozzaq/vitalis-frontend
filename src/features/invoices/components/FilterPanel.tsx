"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Bed,
  FileEdit,
  FlaskConical,
  Scissors,
  SlidersHorizontal,
  Stethoscope,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";

import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { api } from "@/shared/lib/api";

export interface Filters {
  status: string;
  patientSearch: string;
  dateFrom: string;
  dateTo: string;
  sourceType: string[];
  doctorId: string;
  operationTypeId: string;
  operationDoctorId: string;
  amountMin?: string;
  amountMax?: string;
}

const SOURCE_TYPE_META: Record<
  string,
  { icon: typeof Bed; activeClass: string }
> = {
  WARD: {
    icon: Bed,
    activeClass: "bg-info text-white border-info",
  },
  APPOINTMENT: {
    icon: Stethoscope,
    activeClass: "bg-primary text-white border-primary",
  },
  OPERATION: {
    icon: Scissors,
    activeClass: "bg-danger text-white border-danger",
  },
  DIAGNOSTIC_ORDER: {
    icon: Activity,
    activeClass: "bg-warning text-white border-warning",
  },
  LAB_ORDER: {
    icon: FlaskConical,
    activeClass: "bg-secondary text-white border-secondary",
  },
  MANUAL: {
    icon: FileEdit,
    activeClass: "bg-text-muted text-white border-text-muted",
  },
};

const SOURCE_TYPE_ORDER = [
  "WARD",
  "APPOINTMENT",
  "OPERATION",
  "DIAGNOSTIC_ORDER",
  "LAB_ORDER",
  "MANUAL",
];

const STATUS_OPTIONS = [
  "",
  "DRAFT",
  "ISSUED",
  "PARTIALLY_PAID",
  "PAID",
  "CANCELLED",
];

interface OperationTypeOption {
  id: string;
  name: string;
}

interface OperationDoctorOption {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface AssignmentDoctor {
  id: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  department: {
    id: string;
    name: string;
  };
}

interface FilterPanelProps {
  filters: Filters;
  onChange: (key: keyof Filters, value: string | string[]) => void;
  onReset: () => void;
  activeCount: number;
}

export function FilterPanel({
  filters,
  onChange,
  onReset,
  activeCount,
}: FilterPanelProps) {
  const t = useTranslations("invoices");

  const isAppointmentSelected =
    filters.sourceType.includes("APPOINTMENT");

  const isOperationSelected =
    filters.sourceType.includes("OPERATION");

  // =========================
  // Appointment doctors
  // =========================

  const { data: assignments = [] } = useQuery<AssignmentDoctor[]>({
    queryKey: ["assignments", "active"],
    queryFn: () =>
      api
        .get("/assignments?isActive=true")
        .then((response) => response.data),
    enabled: isAppointmentSelected,
    staleTime: 5 * 60 * 1000,
  });

  const doctors = Array.from(
    new Map(
      assignments
        .filter((assignment) => assignment.user?.role === "DOCTOR")
        .map((assignment) => [
          assignment.user.id,
          {
            id: assignment.user.id,
            name: `${assignment.user.first_name} ${assignment.user.last_name}`,
            department: assignment.department?.name,
          },
        ]),
    ).values(),
  );

  // =========================
  // Operation types
  // =========================

  const {
    data: operationTypes = [],
    isLoading: isLoadingOperationTypes,
  } = useQuery<OperationTypeOption[]>({
    queryKey: ["invoice-operation-types"],
    queryFn: () =>
      api
        .get("/operation-types")
        .then((response) => response.data),
    enabled: isOperationSelected,
    staleTime: 5 * 60 * 1000,
  });

  // =========================
  // Operation doctors
  // =========================

  const {
    data: operationDoctors = [],
    isLoading: isLoadingOperationDoctors,
  } = useQuery<OperationDoctorOption[]>({
    queryKey: [
      "invoice-operation-doctors",
      filters.operationTypeId,
    ],
    queryFn: () => {
      const query = filters.operationTypeId
        ? `?operationTypeId=${encodeURIComponent(
          filters.operationTypeId,
        )}`
        : "";

      return api
        .get(`/invoices/operation-doctors${query}`)
        .then((response) => response.data);
    },
    enabled: isOperationSelected,
    staleTime: 5 * 60 * 1000,
  });

  // =========================
  // Source toggle
  // =========================

  const toggleSourceType = (value: string) => {
    const current = filters.sourceType ?? [];

    const isCurrentlySelected = current.includes(value);

    const next = isCurrentlySelected
      ? current.filter((item) => item !== value)
      : [...current, value];

    onChange("sourceType", next);

    // Appointment o'chirilsa
    if (
      value === "APPOINTMENT" &&
      isCurrentlySelected &&
      filters.doctorId
    ) {
      onChange("doctorId", "");
    }

    // Operation o'chirilsa
    if (
      value === "OPERATION" &&
      isCurrentlySelected
    ) {
      onChange("operationTypeId", "");
      onChange("operationDoctorId", "");
    }

    // Operation tanlansa appointment doctorini tozalash
    if (
      value === "OPERATION" &&
      !isCurrentlySelected &&
      filters.doctorId
    ) {
      onChange("doctorId", "");
    }

    // Appointment tanlansa operation filterlarini tozalash
    if (
      value === "APPOINTMENT" &&
      !isCurrentlySelected
    ) {
      onChange("operationTypeId", "");
      onChange("operationDoctorId", "");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.15 }}
      className="bg-surface border border-border rounded-xl p-4 mb-4 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-text-muted flex items-center gap-2 uppercase tracking-wide">
          <SlidersHorizontal className="w-3.5 h-3.5" />

          {t("filter")}

          {activeCount > 0 && (
            <span className="bg-primary text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </span>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-text-muted hover:text-danger transition-colors cursor-pointer flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            {t("reset")}
          </button>
        )}
      </div>

      {/* General filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {/* Status */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-muted">
            {t("fields.status")}
          </label>

          <Combobox
            value={filters.status}
            onChange={(value) =>
              onChange("status", value)
            }
            options={STATUS_OPTIONS.map(
              (status): ComboboxOption => ({
                value: status,
                label: t(
                  `statusOptions.${status || "ALL"
                  }`,
                ),
              }),
            )}
            placeholder={t("statusOptions.ALL")}
            searchPlaceholder="Statusni qidirish..."
            className="w-full"
          />
        </div>

        {/* Patient */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-muted">
            {t("fields.patient")}
          </label>

          <input
            type="text"
            value={filters.patientSearch}
            onChange={(event) =>
              onChange(
                "patientSearch",
                event.target.value,
              )
            }
            placeholder={t(
              "fields.patientPlaceholder",
            )}
            className="w-full bg-surface-hover border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Date from */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-muted">
            {t("fields.dateFrom")}
          </label>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={(event) =>
              onChange(
                "dateFrom",
                event.target.value,
              )
            }
            className="w-full bg-surface-hover border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
          />
        </div>

        {/* Date to */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-muted">
            {t("fields.dateTo")}
          </label>

          <input
            type="date"
            value={filters.dateTo}
            onChange={(event) =>
              onChange(
                "dateTo",
                event.target.value,
              )
            }
            className="w-full bg-surface-hover border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
          />
        </div>

        {/* Amount min */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-muted">
            {t("fields.amountMin")}
          </label>

          <input
            type="number"
            value={filters.amountMin ?? ""}
            onChange={(event) =>
              onChange(
                "amountMin",
                event.target.value,
              )
            }
            placeholder="0"
            className="w-full bg-surface-hover border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Amount max */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-muted">
            {t("fields.amountMax")}
          </label>

          <input
            type="number"
            value={filters.amountMax ?? ""}
            onChange={(event) =>
              onChange(
                "amountMax",
                event.target.value,
              )
            }
            placeholder="9999999"
            className="w-full bg-surface-hover border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Source */}
      <div className="mt-4 pt-4 border-t border-border">
        <label className="text-xs font-medium text-text-muted mb-2 block">
          {t("fields.source")}
        </label>

        <div className="flex flex-wrap gap-2">
          {SOURCE_TYPE_ORDER.map((value) => {
            const active = (
              filters.sourceType ?? []
            ).includes(value);

            const meta =
              SOURCE_TYPE_META[value];

            const Icon =
              meta?.icon ?? FileEdit;

            return (
              <button
                key={value}
                type="button"
                onClick={() =>
                  toggleSourceType(value)
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${active
                  ? meta?.activeClass ??
                  "bg-primary text-white border-primary"
                  : "bg-surface-hover border-border text-text-muted hover:text-text hover:border-text-muted"
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />

                {t(`source.${value}`)}
              </button>
            );
          })}
        </div>

        {/* Appointment doctor */}
        <AnimatePresence>
          {isAppointmentSelected && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                height: 0,
              }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-1 max-w-xs">
                <label className="text-xs font-medium text-text-muted flex items-center gap-1.5">
                  <User className="w-3 h-3" />

                  {t("fields.doctor")}
                </label>

                <Combobox
                  value={filters.doctorId}
                  onChange={(value) =>
                    onChange(
                      "doctorId",
                      value,
                    )
                  }
                  options={[
                    {
                      value: "",
                      label: t(
                        "fields.doctorAll",
                      ),
                    },
                    ...doctors.map(
                      (
                        doctor,
                      ): ComboboxOption => ({
                        value: doctor.id,
                        label: doctor.name,
                        sublabel:
                          doctor.department,
                      }),
                    ),
                  ]}
                  placeholder={t(
                    "fields.doctorAll",
                  )}
                  searchPlaceholder="Shifokorni qidirish..."
                  className="w-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Operation filters */}
        <AnimatePresence>
          {isOperationSelected && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                height: 0,
              }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Operation type */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-muted">
                    {t(
                      "fields.operationType",
                    )}
                  </label>

                  <Combobox
                    value={
                      filters.operationTypeId
                    }
                    onChange={(value) => {
                      onChange(
                        "operationTypeId",
                        value,
                      );

                      // Operation o'zgarsa,
                      // doctor ham reset bo'ladi
                      onChange(
                        "operationDoctorId",
                        "",
                      );
                    }}
                    options={[
                      {
                        value: "",
                        label: t(
                          "fields.operationTypeAll",
                        ),
                      },
                      ...operationTypes.map(
                        (
                          operationType,
                        ): ComboboxOption => ({
                          value:
                            operationType.id,
                          label:
                            operationType.name,
                        }),
                      ),
                    ]}
                    placeholder={t(
                      "fields.operationTypeAll",
                    )}
                    searchPlaceholder="Operatsiyani qidirish..."
                    disabled={
                      isLoadingOperationTypes
                    }
                    className="w-full"
                  />
                </div>

                {/* Operation doctor */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-muted flex items-center gap-1.5">
                    <User className="w-3 h-3" />

                    {t(
                      "fields.operationDoctor",
                    )}
                  </label>

                  <Combobox
                    value={
                      filters.operationDoctorId
                    }
                    onChange={(value) =>
                      onChange(
                        "operationDoctorId",
                        value,
                      )
                    }
                    options={[
                      {
                        value: "",
                        label: t(
                          "fields.operationDoctorAll",
                        ),
                      },
                      ...operationDoctors.map(
                        (
                          doctor,
                        ): ComboboxOption => ({
                          value: doctor.id,
                          label: `${doctor.first_name} ${doctor.last_name}`,
                          sublabel:
                            doctor.role,
                        }),
                      ),
                    ]}
                    placeholder={t(
                      "fields.operationDoctorAll",
                    )}
                    searchPlaceholder="Operatsiya shifokorini qidirish..."
                    disabled={
                      isLoadingOperationDoctors ||
                      operationDoctors.length ===
                      0
                    }
                    className="w-full"
                  />

                  {operationDoctors.length ===
                    0 &&
                    !isLoadingOperationDoctors && (
                      <p className="text-[11px] text-text-muted">
                        {t(
                          "fields.operationDoctorNone",
                        )}
                      </p>
                    )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}