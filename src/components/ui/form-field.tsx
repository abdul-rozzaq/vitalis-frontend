"use client";

import React, { ReactNode } from "react";

interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  helperText?: string;
  children: ReactNode;
}

export function FormField({
  label,
  error,
  required = false,
  helperText,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-text">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-danger-500">{error}</p>}
      {helperText && !error && <p className="text-xs text-text-muted">{helperText}</p>}
    </div>
  );
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
  helperText?: string;
}

export function TextInput({
  label,
  error,
  required,
  helperText,
  ...props
}: TextInputProps) {
  return (
    <FormField label={label} error={error} required={required} helperText={helperText}>
      <input
        {...props}
        className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${
          error ? "border-danger-500 bg-danger-50" : "border-border bg-surface hover:border-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
        } text-text placeholder:text-text-muted`}
      />
    </FormField>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
  helperText?: string;
}

export function TextArea({
  label,
  error,
  required,
  helperText,
  ...props
}: TextAreaProps) {
  return (
    <FormField label={label} error={error} required={required} helperText={helperText}>
      <textarea
        {...props}
        className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors resize-none ${
          error ? "border-danger-500 bg-danger-50" : "border-border bg-surface hover:border-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
        } text-text placeholder:text-text-muted`}
      />
    </FormField>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  required?: boolean;
  helperText?: string;
  options: { label: string; value: string }[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  required,
  helperText,
  options,
  placeholder = "Select...",
  ...props
}: SelectProps) {
  return (
    <FormField label={label} error={error} required={required} helperText={helperText}>
      <select
        {...props}
        className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${
          error ? "border-danger-500 bg-danger-50" : "border-border bg-surface hover:border-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
        } text-text`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Checkbox({ label, error, ...props }: CheckboxProps) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          {...props}
          className={`w-4 h-4 rounded border transition-colors cursor-pointer ${
            error ? "border-danger-500" : "border-border hover:border-text-muted focus:ring-2 focus:ring-primary/20"
          }`}
        />
        {label && <span className="text-sm text-text">{label}</span>}
      </label>
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  );
}

interface RadioGroupProps {
  options: { label: string; value: string }[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
}

export function RadioGroup({
  options,
  value,
  onChange,
  label,
  error,
  required,
}: RadioGroupProps) {
  return (
    <FormField label={label} error={error} required={required}>
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name={label}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange?.(e.target.value)}
              className="w-4 h-4 rounded-full border border-border cursor-pointer"
            />
            <span className="text-sm text-text">{option.label}</span>
          </label>
        ))}
      </div>
    </FormField>
  );
}
