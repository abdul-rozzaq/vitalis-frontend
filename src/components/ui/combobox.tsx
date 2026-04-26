"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
  avatar?: string;
  indent?: boolean;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Tanlang...",
  searchPlaceholder = "Qidirish...",
  disabled = false,
  className = "",
  error = false,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = options.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.label.toLowerCase().includes(q) ||
      (o.sublabel?.toLowerCase().includes(q) ?? false)
    );
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`
          w-full flex items-center justify-between gap-2
          bg-surface border rounded-md px-3 py-2
          text-sm text-left transition-all shadow-sm
          focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
          disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
          ${error ? "border-danger-500" : open ? "border-accent ring-2 ring-accent/20" : "border-border hover:border-border/80"}
        `}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1">
          {selected ? (
            <>
              {selected.avatar && (
                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-[10px] font-semibold flex items-center justify-center shrink-0">
                  {selected.avatar}
                </span>
              )}
              <span className="truncate text-text">{selected.label}</span>
              {selected.sublabel && (
                <span className="text-xs text-secondary shrink-0 truncate">{selected.sublabel}</span>
              )}
            </>
          ) : (
            <span className="text-text-muted">{placeholder}</span>
          )}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selected && (
            <span onClick={handleClear} className="p-0.5 rounded hover:bg-surface-hover text-secondary hover:text-text transition-colors">
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-secondary transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-2.5 py-2 border-b border-border">
            <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-text-muted hover:text-text transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-xs text-text-muted text-center">Natija topilmadi</p>
            ) : (
              filtered.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`
                      w-full flex items-center gap-2.5 text-sm text-left
                      transition-colors cursor-pointer
                      ${option.indent ? "pl-6 pr-2.5 py-1.5" : "px-2.5 py-2"}
                      ${isSelected ? "bg-primary-50 text-primary" : "text-text hover:bg-surface-hover"}
                    `}
                  >
                    {option.indent && (
                      <span className={`shrink-0 text-xs ${isSelected ? "text-primary/50" : "text-text-muted"}`}>›</span>
                    )}

                    {option.avatar && (
                      <span className={`w-6 h-6 rounded-full text-[10px] font-semibold flex items-center justify-center shrink-0 ${isSelected ? "bg-primary-100 text-primary-700" : "bg-surface-hover text-secondary"}`}>
                        {option.avatar}
                      </span>
                    )}

                    <span className="flex-1 min-w-0">
                      <span className={`block truncate ${option.indent ? "font-normal" : "font-medium"}`}>
                        {option.label}
                      </span>
                      {option.sublabel && (
                        <span className={`block text-xs truncate ${isSelected ? "text-primary/70" : "text-secondary"}`}>
                          {option.sublabel}
                        </span>
                      )}
                    </span>

                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}