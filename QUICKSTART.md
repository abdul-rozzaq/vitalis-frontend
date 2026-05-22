# Quick Start Guide - Vitalis Design System

Get up and running with the enterprise healthcare design system in minutes.

## Installation

The design system is already integrated into this project. No additional installation needed!

## Viewing the Component Showcase

Visit `/design-system` in your app to see all available components with interactive examples.

## Basic Usage

### Importing Components

```tsx
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Input,
} from '@/components/design-system';
```

### Creating a Simple Page

```tsx
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  PageHeader,
  Container,
  Stack,
} from '@/components/design-system';

export default function MyPage() {
  return (
    <div>
      <PageHeader
        title="My Page"
        actions={<Button>Add Item</Button>}
      />

      <Container>
        <Card>
          <CardHeader title="Card Title" />
          <CardBody>
            <Stack gap="md">
              <Input label="Name" placeholder="Enter name" />
              <Button>Submit</Button>
            </Stack>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
```

## Key Components

### Buttons

```tsx
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button disabled>Disabled</Button>
<Button isLoading>Loading...</Button>
```

### Cards

```tsx
<Card>
  <CardHeader title="Title" action={<Button size="sm">Edit</Button>} />
  <CardBody>Content here</CardBody>
</Card>
```

### Input Fields

```tsx
<Input label="Email" type="email" placeholder="user@example.com" />
<Textarea label="Notes" placeholder="Enter notes..." rows={4} />
<Select
  label="Status"
  options={[
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]}
/>
```

### Alerts

```tsx
<Alert variant="info" title="Information">Message here</Alert>
<Alert variant="success" dismissible>Success message</Alert>
<Alert variant="error" title="Error">Error message</Alert>
```

### Layout

```tsx
import { Container, PageLayout, GridLayout, Stack } from '@/components/design-system';

// Constrain content
<Container size="lg" padding="md">
  Content with max-width
</Container>

// Two-column layout
<PageLayout sidebar={<Navigation />}>
  Main content
</PageLayout>

// Responsive grid
<GridLayout columns={3} gap="md">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</GridLayout>

// Flexible stacking
<Stack direction="row" justify="between" gap="md">
  <div>Left</div>
  <div>Right</div>
</Stack>
```

## Design Tokens

```tsx
import { colors, spacing, typography, borderRadius } from '@/lib/design-tokens';

// Use in style objects
<div style={{
  backgroundColor: colors.primary[500],
  padding: spacing[4],
  borderRadius: borderRadius.lg,
  fontSize: typography.fontSize.lg,
}}>
  Custom styled element
</div>
```

## Dark Mode

Dark mode is automatically supported. No additional code needed:

```tsx
// This element automatically adapts to dark mode
<div className="bg-surface text-text">
  Content
</div>
```

## Accessibility

The system includes built-in accessibility:

```tsx
// Proper labels
<Input id="email" label="Email" />

// Keyboard support (modals close on Escape)
<Modal isOpen={isOpen} onClose={handleClose}>
  Modal content
</Modal>

// ARIA labels
<Button aria-label="Close">×</Button>
```

## Common Patterns

### Form

```tsx
import { Input, Button, Stack } from '@/components/design-system';

export default function FormExample() {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  return (
    <Stack gap="md">
      <Input
        label="Email"
        value={values.email}
        onChange={(e) => setValues({...values, email: e.target.value})}
        error={errors.email}
      />
      <Input
        label="Password"
        type="password"
        value={values.password}
        onChange={(e) => setValues({...values, password: e.target.value})}
      />
      <Button onClick={handleSubmit}>Login</Button>
    </Stack>
  );
}
```

### Modal Dialog

```tsx
import { Button, Modal } from '@/components/design-system';
import { useState } from 'react';

export default function ModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button>Confirm</Button>
          </div>
        }
      >
        Are you sure?
      </Modal>
    </>
  );
}
```

### Card Grid

```tsx
import { GridLayout, Card, CardHeader, CardBody } from '@/components/design-system';

export default function CardGridExample() {
  const items = [
    { id: 1, title: 'Item 1' },
    { id: 2, title: 'Item 2' },
    { id: 3, title: 'Item 3' },
  ];

  return (
    <GridLayout columns={3} gap="md" responsive>
      {items.map((item) => (
        <Card key={item.id}>
          <CardHeader title={item.title} />
          <CardBody>Content</CardBody>
        </Card>
      ))}
    </GridLayout>
  );
}
```

## Documentation

- **Full Design System Guide**: See `DESIGN_SYSTEM.md`
- **Implementation Details**: See `IMPLEMENTATION_GUIDE.md`
- **Component Showcase**: Visit `/design-system` route

## Tips & Tricks

### Responsive Columns

```tsx
// Automatically responsive: 1 col on mobile, 2 on tablet, 3 on desktop
<GridLayout columns={3} responsive>
  {items.map((item) => <Card key={item.id}>{item.title}</Card>)}
</GridLayout>
```

### Button Loading State

```tsx
<Button isLoading>Loading...</Button>
// Automatically shows spinner and disables button
```

### Input with Icons

```tsx
import { Input } from '@/components/design-system';
import { SearchIcon } from 'lucide-react';

<Input
  placeholder="Search..."
  leftIcon={<SearchIcon />}
/>
```

### Dismissible Alerts

```tsx
<Alert
  variant="warning"
  dismissible
  onDismiss={() => console.log('Alert dismissed')}
>
  This alert can be closed
</Alert>
```

### Full-Width Buttons

```tsx
<Button fullWidth>
  Full Width Button
</Button>
```

## TypeScript Support

Full TypeScript support for all components:

```tsx
import { Button, type ButtonProps } from '@/components/design-system';

// Use type for custom button
interface MyButtonProps extends ButtonProps {
  customProp?: string;
}

export const MyButton: React.FC<MyButtonProps> = ({
  customProp,
  ...props
}) => <Button {...props} />;
```

## Need Help?

1. **See Examples**: Visit `/design-system` showcase page
2. **Check Docs**: Read `DESIGN_SYSTEM.md` for comprehensive guide
3. **Review Code**: Components are well-commented in source files
4. **Ask Questions**: Review `IMPLEMENTATION_GUIDE.md` for architecture details

## Common Issues

### Dark Mode Not Working?
Ensure the theme script in `layout.tsx` is running. Check browser console for errors.

### Component Not Rendering?
- Check that you're importing from `@/components/design-system`
- Verify all required props are provided
- Check TypeScript errors with `npm run type-check`

### Styling Not Applied?
- Ensure `globals.css` is imported in root layout
- Check that Tailwind CSS is properly configured
- Verify CSS custom properties are defined

## Next Steps

1. Explore the component showcase at `/design-system`
2. Review `DESIGN_SYSTEM.md` for complete API documentation
3. Start building pages using the design system
4. Customize colors and tokens as needed
5. Share feedback and contribute improvements

---

Happy building! 🚀
