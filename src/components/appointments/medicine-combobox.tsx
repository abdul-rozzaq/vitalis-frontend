"use client";

import { Medicine } from "@/features/appointments/types";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

interface MedicineComboboxProps {
  value?: string;
  displayName?: string;
  onChange: (medicine: Medicine) => void;
  disabled?: boolean;
}

export function MedicineCombobox({
  value,
  displayName,
  onChange,
  disabled,
}: MedicineComboboxProps) {
  const t = useTranslations();
  const [query, setQuery] = useState(displayName ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(displayName ?? "");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedQuery(query);
      setHighlightedIndex(-1);
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: medicines = [], isFetching, refetch } = useQuery<Medicine[]>({
    queryKey: ["medicines", debouncedQuery],
    queryFn: () =>
      api
        .get("/medicines", { params: { search: debouncedQuery.trim() || undefined } })
        .then((r) => r.data),
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });

  const exact = useMemo(
    () => medicines.find((m) => m.name.toLowerCase() === query.trim().toLowerCase()),
    [medicines, query],
  );

  const selected = useMemo(
    () =>
      medicines.find((m) => m.id === value) ??
      (value && displayName ? { id: value, name: displayName } : null),
    [medicines, value, displayName],
  );

  const isSelected = selected?.id === value && query === selected?.name;
  const showCreate = query.trim().length > 0 && !exact && !isFetching;

  const handleSelect = (medicine: Medicine) => {
    onChange(medicine);
    setQuery(medicine.name);
    setOpen(false);
  };

  const handleCreate = async () => {
    const name = query.trim();
    if (!name) return;
    const created = await api.post("/medicines/upsert", { name }).then((r) => r.data as Medicine);
    onChange(created);
    setQuery(created.name);
    setOpen(false);
    void refetch();
  };

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          {/* Left icon */}
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {isSelected ? (
              <Check className="w-3.5 h-3.5 text-primary" />
            ) : (
              <Search className="w-3.5 h-3.5 text-text-muted" />
            )}
          </span>

          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (!open || medicines.length === 0) return;

              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlightedIndex((prev) => (prev + 1) % medicines.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlightedIndex((prev) => (prev === -1 ? medicines.length - 1 : prev - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (highlightedIndex >= 0 && medicines[highlightedIndex]) {
                  handleSelect(medicines[highlightedIndex]);
                }
              } else if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
              }
            }}
            onBlur={() => {
              // small delay so click on dropdown item registers first
              setTimeout(() => {
                const picked = medicines.find(
                  (m) => m.name.toLowerCase() === query.trim().toLowerCase(),
                );
                if (picked) {
                  onChange(picked);
                  setQuery(picked.name);
                } else if (selected) {
                  setQuery(selected.name);
                }
              }, 150);
            }}
            placeholder={t("prescription.searchMedicine")}
            disabled={disabled}
            className={[
              "w-full bg-surface border rounded-lg pl-9 pr-3 py-2 text-sm",
              "focus:outline-none focus:ring-2 transition-colors",
              isSelected
                ? "border-primary focus:ring-primary/15 focus:border-primary"
                : "border-border focus:ring-accent/15 focus:border-accent",
            ].join(" ")}
          />
        </div>

        {/* Add button */}
        {showCreate && (
          <button
            type="button"
            onClick={handleCreate}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
              border border-primary/25 bg-primary-50 hover:bg-primary-100
              text-primary transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("prescription.addMedicine")}
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (medicines.length > 0 || isFetching) && (
        <ul className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-xl
          shadow-lg shadow-black/5 overflow-hidden py-1">
          {isFetching && medicines.length === 0 ? (
            <li className="flex items-center gap-2 px-3 py-2.5 text-sm text-text-muted">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {t("prescription.searching")}
            </li>
          ) : (
            medicines.map((medicine, index) => (
              <li
                key={medicine.id}
                onMouseDown={() => handleSelect(medicine)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={[
                  "flex items-center justify-between px-3 py-2.5 text-sm cursor-pointer transition-colors",
                  index === highlightedIndex
                    ? "bg-accent/15 text-accent font-medium"
                    : medicine.id === value
                      ? "bg-accent/8 text-accent font-medium"
                      : "hover:bg-surface-hover text-text",
                ].join(" ")}
              >
                <span>{medicine.name}</span>
                {medicine.id === value && <Check className="w-3.5 h-3.5 shrink-0" />}
              </li>
            ))
          )}
        </ul>
      )}

      {/* Status line */}
      <div className="text-xs text-text-muted min-h-4 flex items-center gap-1.5">
        {isFetching && medicines.length > 0 ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            {t("prescription.searching")}
          </>
        ) : isSelected ? (
          <>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-primary">
              {t("prescription.selected")}: {selected!.name}
            </span>
          </>
        ) : showCreate ? (
          <span className="text-text-muted">{t("prescription.notFound")} — {t("prescription.addMedicine")}</span>
        ) : null}
      </div>
    </div>
  );
}