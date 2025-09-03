# TradieConnect - Compact Development Rules

## Tech Stack
- **Frontend**: React Native + Expo + Metro (iOS/Android/Web)
- **UI**: Gluestack UI + NativeWind + Styled Components
- **Backend**: Firebase (Auth, Firestore, Functions, Storage, Messaging)
- **Language**: TypeScript everywhere
- **Navigation**: React Navigation (Stack + Tabs)

## Core Principles
1. **Cross-platform mandatory** - ALL code must work on iOS build, Android build, Web, Web responsive
2. **Reusable components** - Build for multi-project use in `/app/components/UI/`
3. **Configuration-driven** - Use env vars and config objects, not hardcoded values
4. **Role-based architecture** - Customer, Tradie, Admin modules

## App Structure
```
/app/
├── screens/
│   ├── customer/ (Login, Dashboard, PostRequest, History)
│   ├── tradie/ (Login, Dashboard, Explorer, History)  
│   └── admin/ (Dashboard, Users, Analytics)
├── components/UI/ (reusable cross-platform components)
├── services/ (Firebase APIs)
└── types/ (TypeScript interfaces)
```

## Key Features
- **Authentication**: Phone OTP via Firebase Auth
- **Explorer**: Service requests with filters, infinite scroll, unlock system ($0.50)
- **Chat**: Real-time messaging via Firestore
- **Payments**: Wallet system with Stripe integration
- **Market Intelligence**: Pre-computed via Cloud Functions (not real-time calc)

## Data Model
- **ServiceRequest**: id, customerId, trades[], suburb, description, photos[], status
- **Quote**: id, requestId, tradieId, price, timeline, status
- **User**: id, phone, role, profile, wallet
- **Chat**: id, participants[], messages[]

## UI Standards
- Use Gluestack UI components only
- Support light/dark themes
- Responsive design (works on all screen sizes)
- Platform.OS checks only when absolutely necessary

## Performance Rules
- Infinite scroll: 10 items → auto-load to 50 → "Load More" button → repeat
- Pre-compute market intelligence via Cloud Functions
- Cache data locally with offline support
- Optimize Firestore reads (use indexes, batch operations)

## Security
- Firestore rules per role
- Input validation in Cloud Functions
- Rate limiting on sensitive operations
- No credentials in code (use env vars)

## Development
- TypeScript strict mode
- Functional components with hooks
- Error handling with try/catch
- Logging via secureLog/secureError
- Test on all 3 platforms before completion