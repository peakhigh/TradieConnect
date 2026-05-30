# Tech Stack & Architecture

## Core Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.79 + Expo 53 |
| Language | TypeScript 5.8 (strict, everywhere) |
| Navigation | React Navigation 7 (Stack + Bottom Tabs) |
| State | React Context API (AuthContext, UserContext) |
| UI | Gluestack UI + NativeWind (Tailwind) + Styled Components |
| Icons | Lucide React Native |
| Forms | React Hook Form |
| Backend | Firebase (Auth, Firestore, Storage, Cloud Functions) |
| Hosting | Firebase Hosting |

## Platform Targets

All code must work on iOS, Android, and Web from a single codebase. Use `Platform.OS` checks only when absolutely necessary.

## Project Structure

```
/app
  /components/UI/       → Reusable UI components (30+)
  /components/explorer/ → Explorer-specific components
  /config/              → appConfig.ts, trades.ts
  /context/             → AuthContext, UserContext
  /hooks/               → Custom hooks
  /modules/             → Feature modules (auth, chat, data, filters, forms)
  /navigation/          → AppNavigator, CustomerTabs, TradieTabs
  /screens/
    /admin/             → AdminDashboard
    /auth/              → LoginScreen, SignupScreen
    /customer/          → Dashboard, PostRequest, History, Profile, Messages
    /tradie/            → Dashboard, Explorer, History, Profile, Onboarding
  /services/            → firebase.ts, api.ts, explorerService.ts
  /types/               → TypeScript type definitions
/functions/src/         → Firebase Cloud Functions
  /modules/             → auth, chat, notifications, payments
```

## Key Dependencies

- `expo-av` — audio/video playback (voice messages)
- `expo-image-picker` — photo capture for service requests
- `expo-document-picker` — file uploads
- `expo-notifications` — push notifications
- `react-native-ui-datepicker` — date selection
- `react-native-gesture-handler` — swipe/gesture interactions

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Dev server (copies .env.local → .env first) |
| `npm run web` | Web dev server |
| `npm run deploy` | Build web + deploy hosting & functions |
| `npm run deploy:functions` | Deploy Cloud Functions only |
| `npm run deploy:rules` | Deploy Firestore rules + Storage rules |
| `npm run deploy:all` | Full deploy (hosting + functions + rules) |
