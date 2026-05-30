# Common Development Tasks

## Adding a New Feature Screen

1. Create screen in `/app/screens/{role}/NewScreen.tsx`
2. Add to tab navigator in `/app/navigation/{Role}Tabs.tsx`
3. Add web route in `AppNavigator.tsx` linking config
4. Use `Container` wrapper and `DashboardHeader` for consistent layout

## Adding a New Reusable Component

1. Create in `/app/components/UI/ComponentName.tsx`
2. Define props interface at top of file
3. Ensure cross-platform compatibility (test web + mobile)
4. Use Gluestack UI primitives or Styled Components
5. Support light/dark theme

## Adding a New Cloud Function

1. Define TypeScript interface for request data in `functions/src/index.ts`
2. Create the function with `functions.https.onCall()`
3. Always check `request.auth` first
4. Use `functions.https.HttpsError` for error responses
5. Deploy: `npm run deploy:functions`
6. Call from client: `httpsCallable(functions, 'functionName')`

## Adding a New Firestore Collection

1. Define the document interface in `/app/types/`
2. Add Firestore security rules in `firestore.rules`
3. Add composite indexes in `firestore.indexes.json` if needed
4. Deploy rules: `npm run deploy:rules`
5. Deploy indexes: `npm run deploy:indexes`

## Working with the Explorer

The Explorer screen (`/app/screens/tradie/ExplorerScreen.tsx`) uses:
- `explorerService.ts` for data fetching
- `requestIntelligence` collection for market data
- Progressive batch scrolling (10 per page, 50 per batch)
- Filter drawer from right side
- `ServiceRequestCard` component for each item

## Deploying Changes

```bash
# Full deploy (web app + functions)
npm run deploy

# Just the web app
npm run deploy:hosting

# Just Cloud Functions
npm run deploy:functions

# Just Firestore rules
npm run deploy:rules

# Everything
npm run deploy:all
```

## Running Locally

```bash
npm start        # Starts Expo dev server (uses .env.local)
npm run web      # Web only
npm run ios      # iOS simulator
npm run android  # Android emulator
```

## Populating Test Data

```bash
npm run populate-firestore   # Runs scripts/populateFirestore.js
```

## Debugging Tips

- `AppNavigator.tsx` has console.logs for auth state — check browser console
- Firebase emulator can be used for local development
- Check `.env.local` if Firebase calls fail (wrong project ID?)
- Web localStorage persists user session — clear it to force re-auth
