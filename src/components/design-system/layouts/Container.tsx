import React from "react";

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  padding?: "none" | "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-full",
};

const paddingStyles = {
  none: "px-0",
  sm: "px-4",
  md: "px-6",
  lg: "px-8",
};

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      size = "lg",
      padding = "md",
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
          mx-auto w-full
          ${sizeStyles[size]}
          ${paddingStyles[padding]}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = "Container";

export interface PageLayoutProps
  extends React.HTMLAttributes<HTMLDivElement> {
  sidebar?: React.ReactNode;
  sidebarPosition?: "left" | "right";
  sidebarWidth?: "sm" | "md" | "lg";
}

const sidebarWidthStyles = {
  sm: "w-64",
  md: "w-80",
  lg: "w-96",
};

export const PageLayout = React.forwardRef<HTMLDivElement, PageLayoutProps>(
  (
    {
      sidebar,
      sidebarPosition = "left",
      sidebarWidth = "md",
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const isLeftSidebar = sidebarPosition === "left";

    return (
      <div
        ref={ref}
        className={`flex gap-0 ${className}`}
        {...props}
      >
        {isLeftSidebar && sidebar && (
          <aside
            className={`
              hidden lg:block
              ${sidebarWidthStyles[sidebarWidth]}
              border-r border-border
              overflow-y-auto
            `}
          >
            {sidebar}
          </aside>
        )}

        <main className="flex-1 overflow-y-auto">{children}</main>

        {!isLeftSidebar && sidebar && (
          <aside
            className={`
              hidden lg:block
              ${sidebarWidthStyles[sidebarWidth]}
              border-l border-border
              overflow-y-auto
            `}
          >
            {sidebar}
          </aside>
        )}
      </div>
    );
  }
);

PageLayout.displayName = "PageLayout";

export interface GridLayoutProps
  extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4 | 6;
  gap?: "sm" | "md" | "lg";
  responsive?: boolean;
}

const columnStyles = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  6: "grid-cols-6",
};

const gapStyles = {
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
};

export const GridLayout = React.forwardRef<HTMLDivElement, GridLayoutProps>(
  (
    {
      columns = 3,
      gap = "md",
      responsive = true,
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
          grid
          ${responsive ? "grid-cols-1 sm:grid-cols-2 lg:" : ""}${columnStyles[columns]}
          ${gapStyles[gap]}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GridLayout.displayName = "GridLayout";

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "column";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
  gap?: "sm" | "md" | "lg" | "xl";
}

const gapMap = {
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

const alignMap = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

const justifyMap = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
};

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  (
    {
      direction = "column",
      align = "stretch",
      justify = "start",
      gap = "md",
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
          flex
          ${direction === "row" ? "flex-row" : "flex-col"}
          ${alignMap[align]}
          ${justifyMap[justify]}
          ${gapMap[gap]}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Stack.displayName = "Stack";
