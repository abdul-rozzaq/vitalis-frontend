import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined";
  padding?: "sm" | "md" | "lg";
  isInteractive?: boolean;
}

const variantStyles = {
  default: "bg-surface border border-border",
  elevated: "bg-surface shadow-lg",
  outlined: "bg-transparent border-2 border-primary",
};

const paddingStyles = {
  sm: "p-3",
  md: "p-6",
  lg: "p-8",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "default",
      padding = "md",
      isInteractive = false,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`
          rounded-lg
          transition-all duration-200
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${isInteractive ? "hover:shadow-md cursor-pointer" : ""}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export interface CardHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, action, className = "", children, ...props }, ref) => {
    return (
      <div ref={ref} className={`flex items-start justify-between gap-4 mb-4 ${className}`} {...props}>
        <div>
          {title && <h3 className="text-lg font-semibold text-text">{title}</h3>}
          {subtitle && (
            <p className="text-sm text-text-muted mt-1">{subtitle}</p>
          )}
          {children}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

export interface CardBodyProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div ref={ref} className={`text-text ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

CardBody.displayName = "CardBody";

export interface CardFooterProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`border-t border-border pt-4 mt-4 flex items-center justify-between gap-4 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = "CardFooter";
