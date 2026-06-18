"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

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

  // Dropdown pozitsiyasini trigger'ga qarab hisoblash
  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = 240; // max-h-52 + search bar

    const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    setDropdownStyle({
      position: "fixed",
      left: rect.left,
      width: rect.width,
      minWidth: 200,
      zIndex: 9999,
      ...(showAbove
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  };

  useEffect(() => {
    if (open) {
      updatePosition();
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const portal = document.getElementById("combobox-portal-root");
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        portal &&
        !portal.contains(target)
      ) {
        setOpen(false);
        setSearch("");
      }
    };

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousedown", handleMouseDown);
    };
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

  const dropdown = open ? (
    <div
      id="combobox-portal-root"
      style={dropdownStyle}
      className="bg-surface border border-border rounded-lg shadow-xl overflow-hidden"
    >
      {/* Search */}
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
          <button
            type="button"
            onClick={() => setSearch("")}
            className="text-text-muted hover:text-text transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Options */}
      <div className="max-h-52 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-xs text-text-muted text-center">
            Natija topilmadi
          </p>
        ) : (
          filtered.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(option.value);
                }}
                className={`
                  w-full flex items-center gap-2.5 text-sm text-left
                  transition-colors cursor-pointer
                  ${option.indent ? "pl-6 pr-2.5 py-1.5" : "px-2.5 py-2"}
                  ${isSelected
                    ? "bg-primary/10 text-primary"
                    : "text-text hover:bg-surface-hover"}
                `}
              >
                {option.indent && (
                  <span className={`shrink-0 text-xs ${isSelected ? "text-primary/50" : "text-text-muted"}`}>
                    ›
                  </span>
                )}

                {option.avatar && (
                  <span
                    className={`w-6 h-6 rounded-full text-[10px] font-semibold flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-primary/20 text-primary"
                        : "bg-surface-hover text-text-muted"
                    }`}
                  >
                    {option.avatar}
                  </span>
                )}

                <span className="flex-1 min-w-0">
                  <span
                    className={`block truncate ${
                      option.indent ? "font-normal" : "font-medium"
                    }`}
                  >
                    {option.label}
                  </span>
                  {option.sublabel && (
                    <span
                      className={`block text-xs truncate ${
                        isSelected ? "text-primary/70" : "text-text-muted"
                      }`}
                    >
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
  ) : null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`
          w-full flex items-center justify-between gap-2
          bg-surface border rounded-md px-3 py-2
          text-sm text-left transition-all shadow-sm
          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
          disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
          ${error
            ? "border-danger"
            : open
            ? "border-primary ring-2 ring-primary/20"
            : "border-border hover:border-border/80"}
        `}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1">
          {selected ? (
            <>
              {selected.avatar && (
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold flex items-center justify-center shrink-0">
                  {selected.avatar}
                </span>
              )}
              <span className="truncate text-text">{selected.label}</span>
              {selected.sublabel && (
                <span className="text-xs text-text-muted shrink-0 truncate">
                  {selected.sublabel}
                </span>
              )}
            </>
          ) : (
            <span className="text-text-muted">{placeholder}</span>
          )}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selected && (
            <span
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-surface-hover text-text-muted hover:text-text transition-colors"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-text-muted transition-transform duration-150 ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {/* Portal: dropdown body ga render bo'ladi, overflow kesilmaydi */}
      {typeof window !== "undefined" && dropdown
        ? createPortal(dropdown, document.body)
        : null}
    </div>
  );
}