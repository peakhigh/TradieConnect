---
inclusion: fileMatch
fileMatchPattern: "app/navigation/**,app/screens/**"
---

# Navigation Structure

## Flow

```
Unauthenticated:
  HomeScreen (/) → UserTypeSelection (/select) → Login (/login) → Signup (/signup)

Customer (authenticated):
  CustomerTabs:
    Dashboard (/dashboard)
    PostRequest (/post-request)
    History (/history)
    Profile (/profile)

Tradie (authenticated, onboarding incomplete):
  TradieOnboardingScreen

Tradie (authenticated, onboarding complete):
  TradieTabs:
    Dashboard (/tradie/dashboard)
    Explorer (/tradie/explorer)
    History (/tradie/history)
    Profile (/tradie/profile)

Admin (authenticated):
  AdminDashboard (/admin)
```

## How It Works

`AppNavigator.tsx` checks:
1. `loading` → show `LoadingScreen`
2. `!user` → show auth stack (Home, UserTypeSelection, Login, Signup)
3. `user.userType === 'customer'` → show `CustomerTabs`
4. `user.userType === 'tradie'` + `!onboardingCompleted` → show `TradieOnboardingScreen`
5. `user.userType === 'tradie'` + `onboardingCompleted` → show `TradieTabs`
6. `user.userType === 'admin'` → show `AdminDashboard`

## Web Deep Linking

On web, React Navigation uses URL-based linking:
- Prefixes: `http://localhost:8081`, `https://tradie-mate-f852a.web.app`
- Routes map to URL paths as shown above

## Adding a New Screen

1. Create the screen file in the appropriate role folder (`/app/screens/customer/`, etc.)
2. Add it to the relevant Tab navigator (`CustomerTabs.tsx` or `TradieTabs.tsx`)
3. If it's a modal/stack screen, add to the Stack navigator within the tabs
4. Update the linking config in `AppNavigator.tsx` for web URLs
5. Use `headerShown: false` — screens manage their own headers via `DashboardHeader`

## Auth Context

Navigation depends on `useAuth()` from `AuthContext`:
- `user` — current user object (null if logged out)
- `user.userType` — determines which tab navigator to show
- `user.onboardingCompleted` — gates tradie access
- `loading` — true while checking auth state
- `signOut()` — logs out and redirects to `/` on web
