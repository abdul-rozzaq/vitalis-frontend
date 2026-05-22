import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "success" | "danger" | "warning" | "info" | "secondary";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
}

const variantStyles = {
  primary: "bg-primary-50 text-primary border border-primary-100",
  success: "bg-success-50 text-success border border-success-100",
  danger: "bg-danger-50 text-danger border border-danger-100",
  warning: "bg-warning-50 text-warning border border-warning-100",
  info: "bg-info-50 text-info border border-info-100",
  secondary: "bg-surface-secondary text-text-secondary border border-border",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = "primary",
      size = "md",
      dot = false,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center gap-1.5
          rounded-full font-medium
          transition-colors duration-200
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {dot && (
          <span
            className={`
              inline-block rounded-full flex-shrink-0
              ${size === "sm" ? "w-1.5 h-1.5" : ""}
              ${size === "md" ? "w-2 h-2" : ""}
              ${size === "lg" ? "w-2.5 h-2.5" : ""}
              bg-current
            `}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
