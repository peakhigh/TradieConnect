---
inclusion: fileMatch
fileMatchPattern: "app/components/**"
---

# UI Component Guidelines

## Common Components (`/app/commonComponents/`)

Reusable components shared across marketplace projects (TradieConnect, BuildOn, Educator, TripsNTrucks). These are borrowed from sibling projects and enhanced.

| Component | Purpose |
|-----------|---------|
| `FileUpload` | Cross-platform file upload with camera, gallery, document picker, progress, and size validation |
| `FileList` | Displays uploaded files with remove button and file size |

## Available Components (`/app/components/UI/`)

| Component | Purpose |
|-----------|---------|
| `Button` | Primary action button |
| `SimpleButton` | Lightweight button variant |
| `Input` | Text input field |
| `Container` | Screen wrapper with safe area |
| `DashboardHeader` | Header for dashboard screens |
| `SearchBar` | Search input with icon |
| `FilterDrawer` | Right-sliding filter panel |
| `FilterTags` | Active filter chips |
| `RequestCard` | Service request summary card |
| `RequestDetailsDrawer` | Full request details overlay |
| `StatusBadge` | Colored status indicator |
| `StatCard` | Metric display card |
| `Toast` | Notification toast |
| `EmptyState` | Empty list placeholder |
| `Skeleton` / `SkeletonLoader` | Loading placeholders |
| `Pagination` | Page navigation |
| `DatePicker` / `SimpleDatePicker` | Date selection |
| `FileUpload` | File/image upload |
| `ImageViewer` / `PhotoModal` | Image display |
| `ThumbnailImage` | Small image preview |
| `AudioPlayer` | Voice message playback |
| `RadioGroup` | Radio button group |
| `AddressForm` | Address input form |
| `TradeSelector` | Trade type picker |
| `HelpDrawer` | Help/info panel |
| `MessageNotification` | Unread message indicator |
| `StatusHelpModal` | Status explanation modal |
| `ProjectLoader` | Full-screen loading state |
| `ResultsHeader` | Results count + sort controls |

## Explorer Components (`/app/components/explorer/`)

| Component | Purpose |
|-----------|---------|
| `ServiceRequestCard` | Request card with intelligence data |
| `DataFilters` | Data-driven filter controls |
| `FilterDrawer` | Explorer-specific filter drawer |
| `IntelligenceFilters` | Market intelligence filter options |

## Rules for New Components

1. Place in `/app/components/UI/` if generic, `/app/components/explorer/` if explorer-specific.
2. Use Gluestack UI primitives or Styled Components — no new UI libraries.
3. Must work on iOS, Android, and Web without platform checks.
4. Accept a `style` or `className` prop for external customization.
5. Type all props with a dedicated interface.
6. Support both light and dark themes via theme config.
7. Include accessibility props (`accessibilityLabel`, `accessibilityRole`).
8. Keep business logic out — use hooks or services for data fetching.

## Pattern: Loading States

Always show skeleton loaders while data is fetching:

```tsx
if (loading) return <SkeletonLoader count={5} />;
if (error) return <EmptyState message="Something went wrong" />;
if (data.length === 0) return <EmptyState message="No results found" />;
```

## Pattern: Filter Drawer

Filters always slide from the right. Use the `FilterDrawer` component:

```tsx
<FilterDrawer
  visible={showFilters}
  onClose={() => setShowFilters(false)}
  filters={activeFilters}
  onApply={handleApplyFilters}
/>
```
