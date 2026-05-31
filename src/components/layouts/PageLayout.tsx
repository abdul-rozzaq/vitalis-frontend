"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import React, { ReactNode } from "react";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
}: PageHeaderProps) {
  return (
    <div className="space-y-6 px-6 py-6 border-b border-border">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {crumb.href ? (
                <Link href={crumb.href} className="text-text-muted hover:text-text transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-text">{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 && (
                <ChevronRight className="w-4 h-4 text-text-muted" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Title & Actions */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text">{title}</h1>
          {subtitle && <p className="text-text-muted mt-2">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}

interface PageContentProps {
  children: ReactNode;
  className?: string;
}

export function PageContent({ children, className = "" }: PageContentProps) {
  return (
    <div className={`px-6 py-6 space-y-6 ${className}`}>
      {children}
    </div>
  );
}

interface SectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  divider?: boolean;
  action?: ReactNode;
}

export function Section({ title, description, children, divider = true, action }: SectionProps) {
  return (
    <div className={`space-y-4 ${divider ? "pb-6 border-b border-border" : ""}`}>
      {(title || description) && (
        <div className="flex items-start justify-between">
          <div>
            {title && <h2 className="text-lg font-semibold text-text">{title}</h2>}
            {description && <p className="text-sm text-text-muted mt-1">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

interface GridProps {
  cols?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  children: ReactNode;
}

const colClasses = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
};

const gapClasses = {
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
};

export function Grid({ cols = 2, gap = "md", children }: GridProps) {
  return (
    <div className={`grid ${colClasses[cols]} ${gapClasses[gap]}`}>
      {children}
    </div>
  );
}

interface CardProps {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  hoverable?: boolean;
  action?: ReactNode;
}

export function Card({ title, children, footer, hoverable = false, action }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-surface p-4 space-y-4 ${
        hoverable ? "hover:border-text-muted hover:shadow-md transition-all" : ""
      }`}
    >
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text">{title}</h3>
          {action}
        </div>
      )}
      <div>{children}</div>
      {footer && <div className="pt-4 border-t border-border text-sm text-text-muted">{footer}</div>}
    </div>
  );
}

interface StatProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
}

export function Stat({ label, value, unit, trend }: StatProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-text-muted">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-text">{value}</span>
        {unit && <span className="text-sm text-text-muted">{unit}</span>}
      </div>
      {trend && (
        <p
          className={`text-xs font-medium ${
            trend.direction === "up" ? "text-success" : "text-danger-500"
          }`}
        >
          {trend.direction === "up" ? "+" : ""}{trend.value}% vs last month
        </p>
      )}
    </div>
  );
}

interface StatsGridProps {
  stats: StatProps[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <Grid cols={4}>
      {stats.map((stat, i) => (
        <Card key={i}>
          <Stat {...stat} />
        </Card>
      ))}
    </Grid>
  );
}

interface ActivityFeedProps {
  activities: Array<{
    id: string;
    user: string;
    action: string;
    timestamp: string;
    avatar?: string;
  }>;
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex gap-4 pb-4 border-b border-border last:border-b-0">
          <div className="w-8 h-8 rounded-full bg-primary-50 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-text">
              <span className="font-medium">{activity.user}</span> {activity.action}
            </p>
            <p className="text-xs text-text-muted mt-1">{activity.timestamp}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
