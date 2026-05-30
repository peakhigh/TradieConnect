# Cross-Project Ecosystem

## Active Projects

This workspace is part of a multi-project ecosystem. All three projects share the same core stack and design patterns.

| Project | Path | Maturity | Purpose |
|---------|------|----------|---------|
| TradieConnect | `/Users/tbk/Documents/Projects/tradie-app` | Active development | Tradie marketplace |
| BuildOn | `/Users/tbk/Documents/Projects/buildon` | Most mature | Construction/building platform |
| Educator | `/Users/tbk/Documents/Projects/educator` | Active development | Education platform |

## Shared Tech Stack (All Projects)

- React Native + Expo (cross-platform: iOS, Android, Web)
- TypeScript (strict)
- Firebase (Auth, Firestore, Storage, Cloud Functions)
- Gluestack UI + NativeWind
- React Navigation

## Platform Requirement

All code written for any of these projects **must work on iOS, Android, and Web** from a single codebase. No exceptions.

## Reusability Guidelines

### When to look at sibling projects

Before building something new, check if BuildOn or Educator already has a working implementation. BuildOn is the most mature project and should be the first reference.

### Reusable Components (copy/adapt from sibling projects)

- `FileUpload` — file/document upload with preview
- `Login` / `SignupScreen` — phone OTP auth flow
- `Profile` — user profile screen and edit forms
- `ImageViewer` / `PhotoModal` — image display and gallery
- `AudioPlayer` — voice message playback
- `DatePicker` — cross-platform date selection
- `AddressForm` — address input with validation
- `Toast` — notification toasts
- `SearchBar` — search with debounce
- `Pagination` — list pagination controls
- `FilterDrawer` — slide-in filter panel
- `EmptyState` — empty list placeholders
- `SkeletonLoader` — loading state placeholders

### Reusable Patterns (reference from sibling projects)

- Firebase Auth setup (phone OTP + reCAPTCHA for web)
- Cloud Function structure (callable functions with auth checks)
- Firestore service patterns (CRUD with error handling)
- Push notification setup (FCM token management)
- Wallet/payment flows
- Chat/messaging implementation
- Navigation structure (Stack + Bottom Tabs)
- Context API patterns (Auth, User)

### How to Reuse

1. Check BuildOn first (`/Users/tbk/Documents/Projects/buildon`) — it's the most mature
2. Check Educator second (`/Users/tbk/Documents/Projects/educator`)
3. Copy the component/pattern into this project
4. Adapt naming, types, and business logic to fit TradieConnect
5. Ensure it works on all three platforms (iOS, Android, Web)

## Cross-Project Conventions

- Same file naming conventions across all projects
- Same folder structure patterns (`/app/components/UI/`, `/app/modules/`, etc.)
- Same error handling patterns (try/catch + Toast)
- Same Firebase patterns (Cloud Functions for sensitive ops, direct reads for display)
- Same styling approach (Gluestack UI + NativeWind)
