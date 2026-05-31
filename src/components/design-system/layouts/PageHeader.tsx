import React from "react";

export interface PageHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  backButton?: boolean;
  onBack?: () => void;
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      title,
      subtitle,
      actions,
      breadcrumbs,
      backButton,
      onBack,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`bg-surface border-b border-border py-6 px-4 sm:px-8 ${className}`}
        {...props}
      >
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-2 mb-4 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span className="text-text-muted">/</span>}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="text-primary hover:underline"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-text-muted">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            {backButton && (
              <button
                onClick={onBack}
                className="flex-shrink-0 mt-1 text-text-muted hover:text-text transition-colors"
                aria-label="Go back"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold text-text truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-base text-text-muted mt-1">{subtitle}</p>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex-shrink-0 flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    );
  }
);

PageHeader.displayName = "PageHeader";
