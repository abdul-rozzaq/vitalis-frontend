'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  Input,
  Textarea,
  Select,
  Alert,
  Modal,
  Container,
  Stack,
  GridLayout,
  PageHeader,
} from '@/components/design-system';

export default function DesignSystemPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Design System Showcase"
        subtitle="Enterprise Healthcare CRM Components"
        backButton
      />

      <Container size="lg" padding="md" className="py-12 space-y-12">
        {/* Buttons Section */}
        <section>
          <h2 className="text-2xl font-bold text-text mb-6">Buttons</h2>

          <Card>
            <CardBody className="space-y-6">
              {/* Button Variants */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-text">
                  Variants
                </h3>
                <Stack direction="row" gap="md" align="center">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="success">Success</Button>
                  <Button variant="danger">Danger</Button>
                </Stack>
              </div>

              {/* Button Sizes */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-text">
                  Sizes
                </h3>
                <Stack direction="row" gap="md" align="center">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </Stack>
              </div>

              {/* Button States */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-text">
                  States
                </h3>
                <Stack direction="row" gap="md" align="center">
                  <Button disabled>Disabled</Button>
                  <Button isLoading>Loading</Button>
                  <Button fullWidth>Full Width</Button>
                </Stack>
              </div>
            </CardBody>
          </Card>
        </section>

        {/* Badge Section */}
        <section>
          <h2 className="text-2xl font-bold text-text mb-6">Badges</h2>

          <Card>
            <CardBody className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-text">
                  Variants
                </h3>
                <div className="flex flex-wrap gap-4 items-center">
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="danger">Danger</Badge>
                  <Badge variant="info">Info</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-text">
                  With Indicators
                </h3>
                <Stack direction="row" gap="md" align="center">
                  <Badge dot>Active</Badge>
                  <Badge variant="success" dot>
                    Confirmed
                  </Badge>
                  <Badge variant="warning" dot>
                    Pending
                  </Badge>
                </Stack>
              </div>
            </CardBody>
          </Card>
        </section>

        {/* Input Section */}
        <section>
          <h2 className="text-2xl font-bold text-text mb-6">Input Fields</h2>

          <Card>
            <CardBody className="space-y-6">
              <Input
                label="Email Address"
                placeholder="user@example.com"
                helperText="We&apos;ll never share your email"
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter password"
              />

              <Textarea
                label="Clinical Notes"
                placeholder="Enter patient notes..."
                rows={4}
              />

              <Select
                label="Patient Status"
                placeholder="Select status"
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'discharged', label: 'Discharged' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />

              <Input
                label="With Error"
                placeholder="This field has an error"
                error="This field is required"
              />
            </CardBody>
          </Card>
        </section>

        {/* Alert Section */}
        <section>
          <h2 className="text-2xl font-bold text-text mb-6">Alerts</h2>

          <Stack gap="md">
            <Alert variant="info" title="Information">
              This is an informational message
            </Alert>

            <Alert variant="success" title="Success">
              Operation completed successfully
            </Alert>

            <Alert variant="warning" title="Warning" dismissible>
              Please review before proceeding
            </Alert>

            <Alert variant="danger" title="Error">
              An error occurred during processing
            </Alert>
          </Stack>
        </section>

        {/* Card Section */}
        <section>
          <h2 className="text-2xl font-bold text-text mb-6">Cards</h2>

          <GridLayout columns={2} gap="md" responsive>
            <Card>
              <CardHeader
                title="Card Example 1"
                subtitle="This is a card component"
              />
              <CardBody>
                Cards are containers for grouped content with optional header
                and footer sections.
              </CardBody>
            </Card>

            <Card variant="elevated">
              <CardHeader title="Card Example 2" />
              <CardBody>
                Cards support different variants: default, elevated, and
                outlined.
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="With Actions"
                action={<Button size="sm" variant="ghost">Edit</Button>}
              />
              <CardBody>
                Cards can include action buttons in the header for quick
                interactions.
              </CardBody>
              <CardFooter>
                <Button variant="secondary" size="sm">
                  Cancel
                </Button>
                <Button size="sm">Save</Button>
              </CardFooter>
            </Card>

            <Card variant="outlined">
              <CardHeader title="Outlined Card" />
              <CardBody>
                The outlined variant creates a distinct visual hierarchy using
                a colored border.
              </CardBody>
            </Card>
          </GridLayout>
        </section>

        {/* Modal Section */}
        <section>
          <h2 className="text-2xl font-bold text-text mb-6">Modal</h2>

          <Card>
            <CardBody>
              <Button onClick={() => setIsModalOpen(true)}>
                Open Modal
              </Button>

              <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Modal Example"
                footer={
                  <Stack direction="row" justify="end" gap="md">
                    <Button
                      variant="secondary"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => setIsModalOpen(false)}>
                      Confirm
                    </Button>
                  </Stack>
                }
              >
                <p className="text-text-muted mb-4">
                  This is a modal dialog component. It can be used for focused
                  interactions and confirmations.
                </p>
                <Alert variant="info">
                  Modals can contain any content, including forms and other
                  components.
                </Alert>
              </Modal>
            </CardBody>
          </Card>
        </section>

        {/* Grid Layout Section */}
        <section>
          <h2 className="text-2xl font-bold text-text mb-6">Grid Layout</h2>

          <GridLayout columns={3} gap="md">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <Card key={num}>
                <CardBody className="text-center">
                  <div className="text-2xl font-bold text-primary mb-2">
                    {num}
                  </div>
                  <p className="text-text-muted">Grid Item</p>
                </CardBody>
              </Card>
            ))}
          </GridLayout>
        </section>

        {/* Color Palette Section */}
        <section>
          <h2 className="text-2xl font-bold text-text mb-6">Color Palette</h2>

          <GridLayout columns={3} gap="md" responsive>
            <Card>
              <CardBody>
                <div className="space-y-2">
                  <h3 className="font-semibold text-text">Primary Colors</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-primary-50" />
                      <span>Primary-50</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-primary-100" />
                      <span>Primary-100</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-primary-500" />
                      <span className="text-white">Primary-500</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="space-y-2">
                  <h3 className="font-semibold text-text">Status Colors</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-success" />
                      <span>Success</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-warning" />
                      <span>Warning</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-danger" />
                      <span className="text-white">Danger</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="space-y-2">
                  <h3 className="font-semibold text-text">Neutral Colors</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-surface-hover" />
                      <span>Surface-Hover</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded border border-border" />
                      <span>Border</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-text-muted" />
                      <span className="text-white">Text-Muted</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </GridLayout>
        </section>
      </Container>
    </div>
  );
}
