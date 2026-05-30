# Coding Standards

## TypeScript

- Strict mode. Always type props, API responses, and function returns.
- Use interfaces for object shapes, type aliases for unions/primitives.
- No `any` unless absolutely unavoidable (and add a comment explaining why).
- Prefer `async/await` with `try/catch` for all Firebase calls.

## Components

- Functional components with hooks only. No class components.
- Use Gluestack UI or components from `/app/components/UI/` — never introduce new UI libraries.
- Every component must work on iOS, Android, and Web.
- Accept theme props for customization. Support light and dark modes.
- Keep components generic and reusable across marketplace projects.

## File Naming

- Components: PascalCase (`RequestCard.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth.ts`)
- Services: camelCase (`explorerService.ts`)
- Types: PascalCase in `index.ts` files within type folders
- Screens: PascalCase with role prefix (`CustomerDashboard.tsx`, `TradieDashboard.tsx`)

## State Management

- Use Context API for global state (auth, user session, role).
- Keep component-local state with `useState`/`useReducer`.
- Don't over-lift state — keep it as close to where it's used as possible.

## Firebase Patterns

```typescript
// Reading data
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

// Calling Cloud Functions (for sensitive operations)
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';
const unlockRequest = httpsCallable(functions, 'unlockServiceRequest');
```

- Use Cloud Functions (callable) for: unlocks, payments, quotes, notifications.
- Use direct Firestore reads for: dashboards, history, profiles.
- Always handle loading and error states in UI.

## Styling

- NativeWind/Tailwind classes for layout and spacing.
- Gluestack UI components for interactive elements (buttons, inputs, modals).
- Styled Components for complex custom styling.
- Never use inline style objects for anything beyond one-off overrides.

## Error Handling

- Wrap all async operations in try/catch.
- Show user-friendly error messages via Toast component.
- Log errors to console in development.
- Never swallow errors silently.

## Platform-Specific Code

```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  // Web-specific logic
}
```

Only use when there's no cross-platform alternative. Document why it's needed.
