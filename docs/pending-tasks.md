# Pending Tasks

> **For the full, current build plan** (chat room-per-quote, notifications/push, root-level intelligence, tradie reporting/insights, contacts list, mock-data tooling) see **`tasks.md`**. This file remains the running backlog of BuildOn-derived patterns we still want to port.

## From BuildOn — Components & UI Patterns

- [ ] **CollapsibleControls** — Expandable/collapsible filter sections with animation (for Explorer filter drawer)
- [ ] **ChatFilterBar** — Filter bar for chat rooms (all/unread/by project)
- [ ] **Gifted Chat integration** — `react-native-gifted-chat` with custom message bubbles, file attachments for customer-tradie messaging
- [ ] **Unread badges on nav** — Real-time unread count badge on sidebar/tab items (NotificationsBadge)
- [ ] **PendingInvitationsBanner** — Dismissable banner pattern (use for "Low wallet balance" warnings etc.)
- [ ] **Per-component skeleton loaders** — Custom skeleton shapes per card type (not just generic)

## From BuildOn — Backend Patterns

- [ ] **Document Written Event Emitter** — Single Firestore trigger that routes ALL collection writes to action handlers (cleaner than individual triggers)
- [ ] **Server-side `getDocs` callable** — Cloud Function that runs queries server-side with App Check (more secure for sensitive data)
- [ ] **SMS integration (MSG91)** — Send app invite SMS to unregistered tradies
- [ ] **Notification deduplication** — Check if unread notification with same `userId + type + itemId` exists before creating (prevents spam)
- [ ] **Systematic search index** — `createSearchFields()` generates `_lower` + `_tokens` for full-text search

## From BuildOn — Dev Workflow

- [ ] **E2E tests (Playwright + Maestro)** — Automated browser + mobile testing
- [ ] **Landing page** — Separate Vite + Tailwind static marketing site
- [ ] **EAS Build scripts** — `build-android-apk`, `build-ios-ipa` with local builds (for app store submission)
- [ ] **EXPO_PUBLIC_AUTOFILL** — Auto-fill forms in dev mode (skip typing phone numbers etc.)
- [ ] **Mock file uploads** — Wire `EXPO_PUBLIC_USE_MOCKS` flag into PostRequestScreen to skip real Storage uploads in dev

## Infrastructure — Already Done ✅

- [x] Error Boundary
- [x] Path aliases (`@/`)
- [x] useSave hook (generic CRUD)
- [x] useFetchDocs hook (generic query with pagination + real-time)
- [x] Feature flags (`USE_MOCKS`, `SKIP_CAPTCHA`, `AUTOFILL`, `SKIP_TOASTS`)
- [x] Firebase error mapping
- [x] Utility hooks (useIsMobile, useAppState, useToast)
- [x] Utility functions (formatNumber, formatCurrency, formatTimeAgo, etc.)
- [x] Validation layer
- [x] App Check placeholder (ready to enable)
- [x] useFileUpload hook
- [x] Web sidebar navigation
- [x] Custom bottom tab bar (cross-platform)
- [x] Firebase emulator setup
- [x] Modular Cloud Functions (onCreate, unlock, submitQuote, acceptQuote, etc.)
- [x] Unlock confirmation modal
- [x] Submit Quote screen
- [x] Intelligence algorithm (docs + implementation)
- [x] Cross-project steering docs
