# Page Redesign Checklist - Use This for Remaining Pages

Copy this template and follow step-by-step for each remaining page:

## ✅ Checklist for [PAGE_NAME]

### 1. Update Imports
```tsx
// DELETE these imports:
- import { DataTable } from "@/components/ui/data-table";
- import { motion } from "motion/react";
- import { Filter, Search, X } from "lucide-react"; // if unused after changes

// ADD these imports:
+ import { EnterpriseDataTable } from "@/components/ui/enterprise-data-table";
+ import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
```
**Checklist**: ☐ Imports updated

### 2. Remove Unused State
```tsx
// DELETE if you added them for the old UI:
- const [filterText, setFilterText] = useState("");
- const [filterOpen, setFilterOpen] = useState(false);
- const [selectedRole, setSelectedRole] = useState("");

// KEEP these:
+ const [deletingId, setDeletingId] = useState<string | null>(null);
+ const [selectedItems, setSelectedItems] = useState<...[]>([]);
```
**Checklist**: ☐ Unused state removed

### 3. Replace Page Return Statement
```tsx
// OLD (before):
return (
  <div className="p-6 space-y-5 max-w-6xl mx-auto w-full">
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
      {/* complex header with inline buttons and filters */}
    </motion.div>
    <motion.div initial={{ opacity: 0, y: 12 }}>
      <DataTable columns={columns} data={filteredData} />
    </motion.div>
  </div>
);

// NEW (after):
return (
  <div className="flex flex-col min-h-screen">
    <PageHeader
      title={t("[page].title")}
      subtitle={t("[page].description")}
      actions={
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-hover transition-colors text-sm font-medium">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <Can roles={["ADMIN"]}>
            <button className="flex items-center gap-2 px-3 py-2 bg-primary text-white hover:bg-primary rounded-lg transition-colors text-sm font-medium">
              <Plus className="w-4 h-4" />
              <span>{t("[page].addNew")}</span>
            </button>
          </Can>
        </div>
      }
    />

    <PageContent>
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-text-muted animate-spin" />
        </div>
      ) : (
        <EnterpriseDataTable
          columns={columns}
          data={data}
          pageSize={20}
          searchKey="fieldName"
          searchPlaceholder={t("common.filterPlaceholder")}
        />
      )}
    </PageContent>
  </div>
);
```
**Checklist**: ☐ Return statement replaced

### 4. Update Color Styles
```tsx
// OLD (before):
const ROLE_STYLES = {
  ADMIN: { bg: "bg-purple-100", text: "text-purple-700", label: "Admin" },
  DOCTOR: { bg: "bg-blue-100", text: "text-blue-700", label: "Doctor" },
};

// NEW (after):
const ROLE_STYLES = {
  ADMIN: { bg: "bg-primary-50", text: "text-primary", label: "Admin" },
  DOCTOR: { bg: "bg-info-50", text: "text-info", label: "Doctor" },
};
```

**Color Mapping**:
- Primary tasks → `bg-primary-50`, `text-primary`
- Positive actions → `bg-success-50`, `text-success`
- Warnings → `bg-warning-50`, `text-warning`
- Errors/Delete → `bg-danger-50`, `text-danger`
- Info/Secondary → `bg-info-50`, `text-info`
- Neutral/Muted → `bg-surface-hover`, `text-text-muted`

**Checklist**: ☐ Colors updated to design tokens

### 5. Test in Browser
- ☐ Page loads without errors
- ☐ Data displays in table
- ☐ Search/filter works if provided
- ☐ Action buttons (Edit, Delete, Add) work
- ☐ Dark mode toggles correctly
- ☐ Mobile view is responsive
- ☐ Sidebar navigation works

### 6. Run Build
```bash
npm run build
```
- ☐ No TypeScript errors
- ☐ No warnings about unused imports
- ☐ Build completes in under 15 seconds

### 7. Final Checks
- ☐ Removed all `motion` animations from this file
- ☐ No old filter UI remains
- ☐ All buttons follow new pattern (flex gap-2 wrapper)
- ☐ All color classes use design tokens
- ☐ Loading state uses Loader2 from lucide-react
- ☐ Page header uses new PageHeader component
- ☐ Content is wrapped in PageContent

---

## Common Patterns

### Add Button Group (in PageHeader actions)
```tsx
actions={
  <div className="flex gap-2">
    {/* Your buttons here */}
  </div>
}
```

### Primary Button (CTA)
```tsx
<button className="flex items-center gap-2 px-3 py-2 bg-primary text-white hover:bg-primary rounded-lg transition-colors text-sm font-medium">
  <Icon className="w-4 h-4" />
  <span>Label</span>
</button>
```

### Secondary Button (Regular action)
```tsx
<button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-hover transition-colors text-sm font-medium">
  <Icon className="w-4 h-4" />
  <span>Label</span>
</button>
```

### Status Badge
```tsx
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[status-50] text-[status]">
  Status Label
</span>
```

### Loading State
```tsx
{isLoading ? (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 text-text-muted animate-spin" />
  </div>
) : (
  <EnterpriseDataTable {...props} />
)}
```

---

## Pages Remaining

1. **Payments** - `/src/app/payments/page.tsx`
2. **Wards** - `/src/app/wards/page.tsx`
3. **Lab** (Orders) - `/src/app/lab/page.tsx`
4. **Laboratories** (Management) - `/src/app/laboratories/page.tsx`
5. **Assignments** - `/src/app/assignments/page.tsx`

## Time Estimate
- **Per page**: 10-15 minutes (following this checklist)
- **Total remaining**: 1-2 hours
- **Difficulty**: Low (template-based)

---

**Pro Tip**: Use the Patients page (`src/app/patients/page.tsx`) as a reference - it's the most complete modern example. Copy its structure and adapt the data/columns!
