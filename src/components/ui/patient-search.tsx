"use client";

import { useTranslations } from "next-intl";
import { api } from "@/shared/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone_number?: string | null;
  gender: "male" | "female";
}

export function PatientSearch() {
  const t = useTranslations();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Debounce query by 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setIsOpen(debouncedQuery.length >= 2);
    setActiveIndex(-1);
  }, [debouncedQuery]);

  // Focus input when "/" is pressed outside of any input/textarea
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: results = [], isLoading } = useQuery<Patient[]>({
    queryKey: ["patient-search", debouncedQuery],
    queryFn: () => api.get("/patients", { params: { search: debouncedQuery } }).then((r) => r.data),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30 * 1000,
  });

  const showDropdown = isOpen && debouncedQuery.length >= 2;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        return;
      }
      if (!showDropdown || results.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => {
          const next = i < results.length - 1 ? i + 1 : 0;
          listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        
        setActiveIndex((i) => {
          const prev = i > 0 ? i - 1 : results.length - 1;
          listRef.current?.children[prev]?.scrollIntoView({ block: "nearest" });
          return prev;
        });
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();

        const patient = results[activeIndex];
        
        if (patient) {
          setIsOpen(false);
          setQuery("");
          setActiveIndex(-1);
          router.push(`/patients/${patient.id}`);
        }
      }
    },
    [showDropdown, results, activeIndex, router],
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
      
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (debouncedQuery.length >= 2) setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={t("search.placeholder")}
        className="w-full bg-background border border-border rounded-md py-1.5 pl-9 pr-8 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
      />
      {!query && (
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-text-muted bg-surface border border-border rounded px-1 py-0.5 font-mono leading-none">
          /
        </kbd>
      )}

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-text-muted">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {t("search.searching")}
            </div>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-text-muted">{t("search.noPatients")}</p>
          ) : (
            <ul ref={listRef} className="divide-y divide-border max-h-72 overflow-y-auto">
              {results.map((patient, index) => (
                <li key={patient.id}>
                  <Link
                    href={`/patients/${patient.id}`}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery("");
                      setActiveIndex(-1);
                    }}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                      index === activeIndex ? "bg-surface-hover" : "hover:bg-surface-hover"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-semibold shrink-0">
                      {patient.first_name[0]}
                      {patient.last_name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <p className="text-xs text-text-muted font-mono">{patient.phone_number}</p>
                    </div>
                    <span className="ml-auto text-xs text-text-muted capitalize shrink-0">{patient.gender}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
