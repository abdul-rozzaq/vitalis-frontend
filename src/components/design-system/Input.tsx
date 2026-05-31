import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className = "",
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random()}`;

    return (
      <div className={`flex flex-col gap-1.5 ${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text block"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 flex-shrink-0 text-text-muted">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`
              w-full px-3 py-2.5 text-base
              rounded-md
              border transition-all duration-200
              bg-surface text-text
              placeholder:text-text-muted
              disabled:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              ${leftIcon ? "pl-10" : ""}
              ${rightIcon ? "pr-10" : ""}
              ${error ? "border-danger focus:ring-danger" : "border-border"}
              ${className}
            `}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 flex-shrink-0 text-text-muted">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p className="text-sm text-danger font-medium">{error}</p>
        )}

        {helperText && !error && (
          <p className="text-sm text-text-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  rows?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      rows = 4,
      className = "",
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random()}`;

    return (
      <div className={`flex flex-col gap-1.5 ${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-text block"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          className={`
            w-full px-3 py-2.5 text-base
            rounded-md
            border transition-all duration-200
            bg-surface text-text resize-none
            placeholder:text-text-muted
            disabled:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
            ${error ? "border-danger focus:ring-danger" : "border-border"}
            ${className}
          `}
          {...props}
        />

        {error && (
          <p className="text-sm text-danger font-medium">{error}</p>
        )}

        {helperText && !error && (
          <p className="text-sm text-text-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      options,
      placeholder,
      className = "",
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random()}`;

    return (
      <div className={`flex flex-col gap-1.5 ${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-text block"
          >
            {label}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`
            w-full px-3 py-2.5 text-base
            rounded-md
            border transition-all duration-200
            bg-surface text-text
            disabled:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
            ${error ? "border-danger focus:ring-danger" : "border-border"}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <p className="text-sm text-danger font-medium">{error}</p>
        )}

        {helperText && !error && (
          <p className="text-sm text-text-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
