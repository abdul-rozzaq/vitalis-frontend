/**
 * Enterprise Healthcare CRM Design System
 * Comprehensive design tokens for scalable, professional healthcare UI
 */

// ──────────────────────────────────────────────────────────────────────────────
// Color Palette
// ──────────────────────────────────────────────────────────────────────────────

export const colors = {
  // Primary: Professional teal/blue-green for healthcare context
  primary: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e", // Main primary
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#145231",
  },

  // Secondary: Professional slate gray for balance
  slate: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b", // Neutral base
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },

  // Status colors
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",

  // Semantic
  background: "#f8fafc",
  surface: "#ffffff",
  surfaceHover: "#f1f5f9",
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
  text: "#0f172a",
  textMuted: "#64748b",
  textSecondary: "#475569",
} as const;

// ──────────────────────────────────────────────────────────────────────────────
// Typography Scale
// ──────────────────────────────────────────────────────────────────────────────

export const typography = {
  // Font families
  fontFamily: {
    sans: "system-ui, -apple-system, sans-serif",
    mono: "ui-monospace, monospace",
  },

  // Font sizes (rem-based)
  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
  },

  // Font weights
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line heights
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0em",
    wide: "0.025em",
    wider: "0.05em",
  },
} as const;

// ──────────────────────────────────────────────────────────────────────────────
// Spacing Scale (8px base unit)
// ──────────────────────────────────────────────────────────────────────────────

export const spacing = {
  0: "0",
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
} as const;

// ──────────────────────────────────────────────────────────────────────────────
// Border Radius
// ──────────────────────────────────────────────────────────────────────────────

export const borderRadius = {
  none: "0",
  xs: "2px",
  sm: "4px",
  md: "6px",
  lg: "8px",
  xl: "12px",
  "2xl": "16px",
  full: "9999px",
} as const;

// ──────────────────────────────────────────────────────────────────────────────
// Shadows
// ──────────────────────────────────────────────────────────────────────────────

export const shadows = {
  none: "none",
  xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)",
} as const;

// ──────────────────────────────────────────────────────────────────────────────
// Transitions & Animations
// ──────────────────────────────────────────────────────────────────────────────

export const transitions = {
  duration: {
    fast: "150ms",
    base: "200ms",
    slow: "300ms",
    slower: "500ms",
  },
  timing: {
    linear: "linear",
    ease: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
} as const;

// ──────────────────────────────────────────────────────────────────────────────
// Component-Specific Tokens
// ──────────────────────────────────────────────────────────────────────────────

export const components = {
  button: {
    paddingY: spacing[2],
    paddingX: spacing[4],
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  card: {
    padding: spacing[6],
    borderRadius: borderRadius.lg,
    shadow: shadows.md,
  },
  input: {
    paddingY: spacing[2],
    paddingX: spacing[3],
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
    border: `1px solid ${colors.border}`,
  },
  table: {
    rowHeight: spacing[10],
    headerBackground: colors.slate[50],
    borderColor: colors.border,
  },
} as const;

// ──────────────────────────────────────────────────────────────────────────────
// Responsive Breakpoints
// ──────────────────────────────────────────────────────────────────────────────

export const breakpoints = {
  xs: "320px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// ──────────────────────────────────────────────────────────────────────────────
// Z-Index Scale
// ──────────────────────────────────────────────────────────────────────────────

export const zIndex = {
  hide: "-1",
  base: "0",
  dropdown: "1000",
  sticky: "1020",
  fixed: "1030",
  backdrop: "1040",
  modal: "1050",
  popover: "1060",
  tooltip: "1070",
} as const;
