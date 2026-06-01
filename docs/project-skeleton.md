# Project Skeleton — Reusable Setup Guide

This documents everything we set up in TradieConnect that was derived from BuildOn's proven patterns. Use this as a checklist when starting a new React Native + Firebase project.

---

## 1. Core Stack

| Layer | Package | Version |
|-------|---------|---------|
| Framework | `expo` | 56+ |
| Runtime | `react-native` | 0.85+ |
| Language | TypeScript | 5.8 (strict) |
| Navigation | `@react-navigation/native` + custom sidebar/tabs | 7.x |
| State | React Context + `useReducer` | — |
| UI | Gluestack UI + NativeWind | — |
| Icons | `lucide-react-native` | — |
| Forms | `react-hook-form` | 7.x |
| Backend | Firebase (Auth, Firestore, Storage, Functions) | — |

---

## 2. Firebase Setup (Dual SDK)

### Web SDK (`app/services/firebase.ts`)
- Uses `firebase` JS SDK (web-only)
- Emulator connections via `EXPO_PUBLIC_LOCAL_*` env flags
- Re-exports all Firestore/Auth/Storage/Functions helpers
- Phone auth via reCAPTCHA on web

### Native SDK (`app/services/firebase.native.ts`)
- Uses `@react-native-firebase/*` packages
- Auto-initialized from `google-services.json` (Android) + `GoogleService-Info.plist` (iOS)
- Same API surface as web version (same exports)
- Platform-split via React Native's `.native.ts` file resolution
- Emulator host: `10.0.2.2` for Android emulator, `127.0.0.1` for iOS

### Packages Installed
```
@react-native-firebase/app
@react-native-firebase/auth
@react-native-firebase/firestore
@react-native-firebase/functions
@react-native-firebase/storage
@react-native-firebase/messaging
@react-native-firebase/crashlytics
@react-native-firebase/app-check
expo-build-properties
```

### app.json Plugins
```json
"plugins": [
  "@react-native-firebase/app",
  "@react-native-firebase/auth",
  "@react-native-firebase/crashlytics",
  "@react-native-firebase/app-check",
  ["expo-build-properties", {
    "ios": { "useFrameworks": "static" },
    "android": { "enableProguardInReleaseBuilds": true, "enableShrinkResourcesInReleaseBuilds": true }
  }],
  "expo-notifications",
  "expo-document-picker",
  ["expo-image-picker", { "photosPermission": "..." }]
]
```

---

## 3. Navigation (Hybrid — Web Sidebar + Mobile Tabs)

### Problem Solved
`@react-navigation/bottom-tabs` v7 is broken on web. We built a custom solution.

### Architecture
```
Web (≥768px):  WebSidebar (permanent left) + content area
Web (<768px):  Custom BottomTabBar + content area (no sidebar)
Mobile:        Custom BottomTabBar + content area
```

### Files Created
| File | Purpose |
|------|---------|
| `app/navigation/WebSidebar.tsx` | Permanent dark sidebar for web |
| `app/navigation/WebLayout.tsx` | Sidebar + content wrapper (responsive) |
| `app/navigation/BottomTabBar.tsx` | Custom bottom tabs (pure RN primitives) |
| `app/navigation/NavigationContext.tsx` | `useScreenNavigation()` hook for screen-to-screen nav |
| `app/navigation/CustomerTabs.tsx` | Customer layout (web sidebar or mobile tabs) |
| `app/navigation/TradieTabs.tsx` | Tradie layout (web sidebar or mobile tabs) |

### Key Pattern
Screens use `useScreenNavigation()` instead of React Navigation's `useNavigation()`:
```typescript
import { useScreenNavigation } from '../../navigation/NavigationContext';
const navigation = useScreenNavigation();
navigation.navigate('PostRequest');
```

---

## 4. Theme System (Swappable Palette)

### Files
| File | Purpose |
|------|---------|
| `app/theme/palette.ts` | **Single source of truth** — all colors defined here |
| `app/theme/theme.ts` | Consumes palette, adds spacing/fonts/shadows/etc. |

### To Change Theme
Edit only `palette.ts`. Everything else reads from it.

### Palette Structure
```typescript
export const palette = {
  primary, primaryDark, primaryLight,
  secondary, secondaryDark, secondaryLight,
  success, successLight, warning, warningLight, error, errorLight,
  background, surface, surfaceSecondary, surfaceTertiary,
  sidebarBg, sidebarSurface, sidebarBorder, sidebarText, sidebarTextActive, sidebarAccent,
  textPrimary, textSecondary, textTertiary, textInverse, textDisabled,
  borderLight, borderMedium, borderDark, borderFocus,
  statusActive, statusCompleted, statusPending, statusCancelled,
};
```

---

## 5. Custom Hooks (from BuildOn)

| Hook | File | Purpose |
|------|------|---------|
| `useSave` | `app/hooks/useSave.ts` | Generic Firestore CRUD (add/update/delete) with auto-timestamps, `createdBy`/`updatedBy` |
| `useFetchDocs` | `app/hooks/useFetchDocs.ts` | Generic Firestore query with pagination, real-time subscriptions, total count |
| `useBEFetchDocs` | `app/hooks/useBEFetchDocs.ts` | Server-side queries via Cloud Functions (more secure) |
| `useFileUpload` | `app/hooks/useFileUpload.ts` | File upload with progress tracking, mock support |
| `useIsMobile` | `app/hooks/useIsMobile.ts` | Responsive breakpoint detection |
| `useAppState` | `app/hooks/useAppState.ts` | Detect app foreground/background transitions |
| `useToast` | `app/hooks/useToast.ts` | Toast notifications (alert-based, feature-flag aware) |
| `useMobileNotifications` | `app/hooks/useMobileNotifications.ts` | Push notification lifecycle (permission, token, handlers) |

---

## 6. Utility Functions

| File | Contents |
|------|----------|
| `app/utils/helpers.ts` | `isWeb()`, `isDev()`, `isMobileOrWebMobile()`, `formatNumber()`, `formatCurrency()`, `formatMobileNumber()`, `formatTimeAgo()`, `truncate()` |
| `app/utils/featureFlags.ts` | `useMocks`, `skipCaptcha`, `autofill`, `skipToasts` |
| `app/utils/firebaseErrors.ts` | `parseFirebaseError()` — maps error codes to user-friendly messages |
| `app/utils/validation.ts` | `validateRequired()`, `validateMinLength()`, `validatePhone()`, `validatePostcode()`, `validateAmount()` |
| `app/utils/platform.ts` | `isWebDesktop` |

---

## 7. Error Boundary

| File | Purpose |
|------|---------|
| `app/components/ErrorBoundary.tsx` | Wraps entire app, catches unhandled errors, shows fallback UI |

Uses `react-error-boundary` package. Wrapped in `App.tsx`:
```tsx
<AppErrorBoundary>
  <AuthProvider>
    <UserProvider>
      <AppNavigator />
    </UserProvider>
  </AuthProvider>
</AppErrorBoundary>
```

---

## 8. Auth Context (useReducer pattern)

| File | Pattern |
|------|---------|
| `app/context/AuthContext.tsx` | `useReducer` with typed actions |

### Actions
- `AUTH_IS_READY` — Firebase auth state resolved
- `LOGIN` — User logged in
- `LOGOUT` — User logged out
- `SET_USER` — Update user data
- `SHOW_SUCCESS` / `CLEAR_SUCCESS` — Success messages

### Features
- Web localStorage persistence
- `refreshUser()` to re-fetch from Firestore
- `dispatch` exposed for custom state transitions
- `logout` alias for `signOut`

---

## 9. Cloud Functions (Modular Backend)

### Structure
```
functions/src/
  index.ts                          → Clean entry point (imports + re-exports)
  modules/
    requests/
      intelligence.ts               → recalculateIntelligence() shared helper
      onCreate.ts                   → Firestore trigger: init intel_* defaults
      unlock.ts                     → Callable: deduct wallet, create quote doc
      submitQuote.ts                → Callable: update quote, recalculate intel
      acceptQuote.ts                → Callable: accept/reject lifecycle
      complete.ts                   → Callable: mark complete + rate
    payments/
      rechargeWallet.ts             → Callable: add funds
    notifications/
      sendPush.ts                   → Callable: FCM push
```

### Key Pattern
- `admin.initializeApp()` only in `index.ts`
- Each module imports `admin` and gets `db = admin.firestore()`
- Use `FieldValue`, `Timestamp` from `firebase-admin/firestore` (not `admin.firestore.FieldValue`)

---

## 10. Path Aliases

| File | Change |
|------|--------|
| `babel.config.js` | `module-resolver` plugin with `@` → `./` |
| `tsconfig.json` | `baseUrl: "."`, `paths: { "@/*": ["./*"] }` |

Usage: `import { useAuth } from '@/app/context/AuthContext'`

---

## 11. EAS Build

| File | Purpose |
|------|---------|
| `eas.json` | Build profiles (development, preview, production) |

### Scripts
```json
"build:android": "eas build -p android --profile preview --local",
"build:ios": "eas build -p ios --profile preview --local",
"run:android": "npx expo run:android",
"run:ios": "npx expo run:ios"
```

---

## 12. Environment Variables

### .env.local Structure
```bash
# Firebase config
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Emulator flags
EXPO_PUBLIC_LOCAL_FUNCTIONS=true
EXPO_PUBLIC_LOCAL_FIRESTORE=true
EXPO_PUBLIC_LOCAL_STORAGE=false
# EXPO_PUBLIC_LOCAL_AUTH=true

# Feature flags
EXPO_PUBLIC_USE_MOCKS=false
EXPO_PUBLIC_SKIP_CAPTCHA=true
EXPO_PUBLIC_AUTOFILL=false
EXPO_PUBLIC_SKIP_TOASTS=false
```

---

## 13. Copied from BuildOn (All Done ✅)

| Item | File | Status |
|------|------|--------|
| NativeWind metro config | `metro.config.js` + `global.css` | ✅ |
| NativeWind babel config | `babel.config.js` (presets updated) | ✅ |
| `cn()` utility | `app/utils/cn.ts` | ✅ |
| Query builder | `app/services/queryBuilder.ts` | ✅ |
| `runCloudFunction()` | `app/services/cloudFunctions.ts` | ✅ |
| Crashlytics helper | `app/services/crashlytics.ts` | ✅ |
| Storage helpers | `app/services/storageHelpers.ts` | ✅ |
| `useBECount` | `app/hooks/useBECount.ts` | ✅ |
| `useQuery` | `app/hooks/useQuery.ts` | ✅ |
| CSV export | `app/utils/csvExport.ts` | ✅ |
| Test autofill | `app/utils/testAutofill.ts` | ✅ |
| Timestamp formatters | `app/utils/helpers.ts` (appended) | ✅ |

### Only remaining from BuildOn (not copied):
- `getDefaultOwnership.js` — ACL-based, not needed for TradieConnect
- Platform-split `useFileUpload.native.ts` — current single-file version works, optimize later
- Gluestack individual packages — current monolithic package works fine

---

## 14. Project Config Files

| File | Purpose |
|------|---------|
| `firestore.rules` | Firestore security rules |
| `storage.rules` | Storage security rules |
| `firestore.indexes.json` | Composite indexes |
| `firebase.json` | Firebase project config (hosting, functions, emulators) |
| `.firebaserc` | Firebase project alias |
| `app/config/appConfig.ts` | Configuration-driven app settings (pricing, features, roles) |
| `app/config/trades.ts` | Trade types list (100+ trades) |
| `scripts/populateFirestore.js` | Seed test data |
| `.kiro/steering/*.md` | AI steering docs (coding standards, architecture, etc.) |

---

## 15. Deploy Scripts

```json
"deploy": "npm run build:web && firebase deploy --only hosting,functions",
"deploy:functions": "firebase deploy --only functions",
"deploy:hosting": "npm run build:web && firebase deploy --only hosting",
"deploy:rules": "firebase deploy --only firestore:rules,storage",
"deploy:indexes": "firebase deploy --only firestore:indexes",
"deploy:all": "npm run build:web && firebase deploy"
```

---

## 16. Checklist for New Projects

1. [ ] `npx create-expo-app` with TypeScript template
2. [ ] Install Firebase packages (web + native)
3. [ ] Create `firebase.ts` (web) + `firebase.native.ts` (native)
4. [ ] Set up `app.json` with plugins
5. [ ] Create `palette.ts` + `theme.ts`
6. [ ] Create `AuthContext.tsx` with useReducer
7. [ ] Create custom hooks (`useSave`, `useFetchDocs`, `useFileUpload`, etc.)
8. [ ] Create utility files (`helpers.ts`, `featureFlags.ts`, `firebaseErrors.ts`, `validation.ts`)
9. [ ] Create `ErrorBoundary.tsx` and wrap in `App.tsx`
10. [ ] Set up navigation (WebSidebar + BottomTabBar + NavigationContext)
11. [ ] Set up path aliases (`babel.config.js` + `tsconfig.json`)
12. [ ] Create `.env.local` with Firebase config + feature flags
13. [ ] Create `eas.json` for native builds
14. [ ] Create Cloud Functions structure (`functions/src/modules/`)
15. [ ] Download `google-services.json` + `GoogleService-Info.plist` from Firebase Console
16. [ ] Test: `npx expo start --web`, `npx expo run:android`, `npx expo run:ios`
