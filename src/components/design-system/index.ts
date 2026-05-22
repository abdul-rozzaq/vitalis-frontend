// Design System - Enterprise Healthcare CRM
// Comprehensive component library and design tokens

// Core Components
export { Button, type ButtonProps } from "./Button";
export {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  type CardProps,
  type CardHeaderProps,
  type CardBodyProps,
  type CardFooterProps,
} from "./Card";
export { Badge, type BadgeProps } from "./Badge";
export { Input, Textarea, Select, type InputProps, type TextareaProps, type SelectProps } from "./Input";
export { Alert, type AlertProps } from "./Alert";

// Modal & Dialog
export { Modal, Drawer, type ModalProps, type DrawerProps } from "./Modal";

// Layout Components
export {
  Container,
  PageLayout,
  GridLayout,
  Stack,
  type ContainerProps,
  type PageLayoutProps,
  type GridLayoutProps,
  type StackProps,
} from "./layouts/Container";
export { PageHeader, type PageHeaderProps } from "./layouts/PageHeader";

// Design Tokens
export * from "@/lib/design-tokens";
