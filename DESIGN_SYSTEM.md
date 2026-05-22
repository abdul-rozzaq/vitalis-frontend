# Enterprise Healthcare CRM Design System

A comprehensive, scalable design system built for modern healthcare applications. This system provides a foundation for building consistent, accessible, and professional user interfaces across the Vitalis CRM platform.

## 📋 Table of Contents

- [Overview](#overview)
- [Design Principles](#design-principles)
- [Color System](#color-system)
- [Typography](#typography)
- [Components](#components)
- [Layout Patterns](#layout-patterns)
- [Usage Guidelines](#usage-guidelines)

## 🎯 Overview

The Vitalis Design System consists of:

- **Design Tokens**: Color palette, typography, spacing, and shadows
- **Component Library**: Reusable UI components with variants
- **Layout System**: Flexible layout patterns for common page structures
- **Design Patterns**: Best practices for healthcare UI/UX

### Key Principles

- **Professional**: Builds trust through clean, clinical design
- **Accessible**: WCAG 2.1 AA compliant with semantic HTML
- **Scalable**: Modular architecture supports 100+ pages
- **Responsive**: Mobile-first, responsive design patterns
- **Consistent**: Design tokens ensure visual coherence

## 🎨 Design Principles

### 1. **Clinical Clarity**
Healthcare interfaces require absolute clarity. Every element should communicate its purpose unambiguously.

### 2. **Patient Safety**
Design decisions prioritize patient safety. Destructive actions require confirmation, sensitive data is protected, and critical information is highlighted.

### 3. **Data-Driven**
Designed for data-rich interfaces. Tables, charts, and dashboards are optimized for scanning and analysis.

### 4. **Inclusive Design**
Accessible to users with disabilities. Proper contrast ratios, keyboard navigation, and screen reader support.

### 5. **Minimal Cognitive Load**
Healthcare professionals are busy. Minimize distractions and present only necessary information.

## 🎨 Color System

### Primary Palette

The design system uses a professional green as the primary color, chosen for its medical/healthcare associations:

- **Primary**: `#16a34a` (Professional green)
- **Primary-500**: `#22c55e` (Lighter green for accents)

### Status Colors

- **Success**: `#22c55e` - Positive actions, confirmations
- **Warning**: `#f59e0b` - Caution, pending actions
- **Danger**: `#ef4444` - Errors, destructive actions
- **Info**: `#3b82f6` - Information, neutral actions

### Neutral Palette

- **Slate-50** to **Slate-900**: Grayscale for backgrounds, borders, and text
- **Background**: `#f8fafc` (Light mode), `#0f172a` (Dark mode)
- **Surface**: `#ffffff` (Light mode), `#1e293b` (Dark mode)

### Usage

```tsx
import { colors } from '@/lib/design-tokens';

// Access colors in TypeScript
const primaryColor = colors.primary[500];
```

```html
<!-- Use in HTML with CSS variables -->
<button style="background-color: var(--color-primary)">Button</button>
```

## 📝 Typography

### Font Stack

- **Sans-serif**: System fonts for optimal performance
- **Monospace**: For code and technical content

### Type Scale

| Size | Usage | Base |
|------|-------|------|
| **xs** | Small labels, captions | 0.75rem (12px) |
| **sm** | Form labels, helpers | 0.875rem (14px) |
| **base** | Body text, default | 1rem (16px) |
| **lg** | Subheadings | 1.125rem (18px) |
| **xl** | Section headings | 1.25rem (20px) |
| **2xl** | Page headings | 1.5rem (24px) |
| **3xl** | Large headings | 1.875rem (30px) |
| **4xl** | Hero headings | 2.25rem (36px) |

### Font Weights

- **Light** (300): Rare, decorative use only
- **Normal** (400): Body text and default
- **Medium** (500): Labels and emphasis
- **Semibold** (600): Headings and strong emphasis
- **Bold** (700): Important headings

### Line Height

- **Tight** (1.25): Headings
- **Normal** (1.5): Body text (recommended)
- **Relaxed** (1.625): Large bodies, accessibility
- **Loose** (2): Multi-column text

## 🧩 Components

### Button

Versatile button component with multiple variants.

```tsx
import { Button } from '@/components/design-system';

// Basic
<Button>Click me</Button>

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Delete</Button>
<Button variant="success">Confirm</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>

// States
<Button disabled>Disabled</Button>
<Button isLoading>Loading...</Button>
<Button fullWidth>Full Width</Button>

// Icons
<Button leftIcon={<SearchIcon />}>Search</Button>
<Button rightIcon={<ArrowIcon />}>Next</Button>
```

### Card

Container for grouped content with optional header and footer.

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/design-system';

<Card>
  <CardHeader
    title="Patient Information"
    subtitle="Update patient details"
    action={<EditButton />}
  />
  <CardBody>
    {/* Content here */}
  </CardBody>
  <CardFooter>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

### Badge

Label component for status, categories, or tags.

```tsx
import { Badge } from '@/components/design-system';

// Variants
<Badge variant="primary">Primary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="danger">Danger</Badge>
<Badge variant="info">Info</Badge>

// With dot indicator
<Badge dot>Active</Badge>

// Sizes
<Badge size="sm">Small</Badge>
<Badge size="md">Medium (default)</Badge>
<Badge size="lg">Large</Badge>
```

### Input Components

Text input, textarea, and select with validation support.

```tsx
import { Input, Textarea, Select } from '@/components/design-system';

// Input with label and error
<Input
  label="Email Address"
  placeholder="user@example.com"
  error={formErrors.email}
  helperText="We'll never share your email"
/>

// Textarea for longer content
<Textarea
  label="Clinical Notes"
  placeholder="Enter patient notes..."
  rows={6}
/>

// Select dropdown
<Select
  label="Patient Status"
  options={[
    { value: 'active', label: 'Active' },
    { value: 'discharged', label: 'Discharged' },
    { value: 'pending', label: 'Pending' },
  ]}
/>
```

### Alert

Prominent notification component for messages and alerts.

```tsx
import { Alert } from '@/components/design-system';

// Variants
<Alert variant="info">Informational message</Alert>
<Alert variant="success" title="Success">Operation completed successfully</Alert>
<Alert variant="warning" title="Warning">Please review before proceeding</Alert>
<Alert variant="danger" dismissible onDismiss={handleDismiss}>Error occurred</Alert>
```

### Modal

Dialog component for focused interactions.

```tsx
import { Modal } from '@/components/design-system';
import { useState } from 'react';

export default function Example() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button variant="danger">Delete</Button>
          </div>
        }
      >
        Are you sure? This action cannot be undone.
      </Modal>
    </>
  );
}
```

### Drawer

Side panel component for secondary navigation or content.

```tsx
import { Drawer } from '@/components/design-system';

<Drawer
  isOpen={isOpen}
  onClose={handleClose}
  title="Filters"
  side="right"
  footer={<Button onClick={handleApply}>Apply Filters</Button>}
>
  {/* Filter content */}
</Drawer>
```

## 📐 Layout Patterns

### Container

Constrains content to a maximum width with responsive padding.

```tsx
import { Container } from '@/components/design-system';

<Container size="lg" padding="md">
  {children}
</Container>
```

**Sizes**: `sm` (2xl), `md` (4xl), `lg` (6xl), `xl` (7xl), `full`

### PageLayout

Two-column layout with optional sidebar (left or right).

```tsx
<PageLayout
  sidebar={<Navigation />}
  sidebarPosition="left"
  sidebarWidth="md"
>
  {mainContent}
</PageLayout>
```

### GridLayout

Responsive grid for card-based layouts.

```tsx
<GridLayout columns={3} gap="md" responsive>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</GridLayout>
```

### Stack

Flexbox wrapper for layouts (horizontal or vertical).

```tsx
import { Stack } from '@/components/design-system';

// Vertical stack (default)
<Stack gap="md" align="center">
  <Item>1</Item>
  <Item>2</Item>
</Stack>

// Horizontal stack
<Stack direction="row" justify="between">
  <Item>Left</Item>
  <Item>Right</Item>
</Stack>
```

### PageHeader

Consistent header for pages with title, breadcrumbs, and actions.

```tsx
import { PageHeader } from '@/components/design-system';

<PageHeader
  title="Patient Records"
  subtitle="Manage all patient information"
  breadcrumbs={[
    { label: 'Home', href: '/' },
    { label: 'Patients' },
  ]}
  actions={<Button>Add Patient</Button>}
/>
```

## 📖 Usage Guidelines

### Best Practices

1. **Use Design Tokens**: Always import and use design tokens instead of hardcoding values
   ```tsx
   // Good
   import { spacing } from '@/lib/design-tokens';
   <div style={{ padding: spacing[4] }}>

   // Avoid
   <div style={{ padding: '16px' }}>
   ```

2. **Semantic HTML**: Use appropriate HTML elements
   ```tsx
   // Good
   <button onClick={handleClick}>Click</button>

   // Avoid
   <div onClick={handleClick}>Click</div>
   ```

3. **Accessibility**: Include labels and ARIA attributes
   ```tsx
   <label htmlFor="email">Email</label>
   <input id="email" type="email" />
   ```

4. **Responsive First**: Design mobile-first, enhance for larger screens
   ```tsx
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
   ```

### Dark Mode

The design system supports dark mode automatically:

```tsx
// Automatically adapts to dark mode
<div className="text-text bg-surface">
  Content automatically switches colors
</div>
```

### Component Composition

Components are designed to be composable:

```tsx
<Card>
  <CardHeader title="Title" action={<Button>Action</Button>} />
  <CardBody>
    <Stack gap="md">
      <Input label="Field 1" />
      <Input label="Field 2" />
    </Stack>
  </CardBody>
  <CardFooter>
    <Button>Submit</Button>
  </CardFooter>
</Card>
```

## 📚 Resources

- **Design Tokens**: `/src/lib/design-tokens.ts`
- **Components**: `/src/components/design-system/`
- **Layouts**: `/src/components/design-system/layouts/`
- **Global Styles**: `/src/app/globals.css`

## 🔄 Contributing

When adding new components:

1. Create component in appropriate folder
2. Export from `design-system/index.ts`
3. Add comprehensive JSDoc comments
4. Include TypeScript types
5. Support dark mode
6. Add keyboard navigation where applicable
7. Include ARIA attributes for accessibility

## 📝 License

Part of the Vitalis CRM Enterprise Healthcare Platform.
