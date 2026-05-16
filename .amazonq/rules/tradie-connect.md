# qdeveloper-rules.yaml

project:
  name: TradieConnect
  type: react-native-expo-metro
  description: >
    A React Native + Expo + Metro application for Web, iOS and Android,
    connecting customers and tradies with a micro-payment unlock model 
    for service requests. Includes customer, tradie, and admin modules.

standards:
  languages:
    - typescript # use TS everywhere (frontend & backend)
  frontend:
    framework: react-native
    build: expo + metro
    ui-libraries:
      - glue-stack-ui
      - tailwindcss/nativewind
      - styled-components
    styling:
      - must work on web, iOS and Android (responsive & cross-platform)
      - prefer reusable UI components from /app/components/UI
    navigation:
      - react-navigation
      - use bottom tabs + stack navigation
    state-management:
      - context-api (for auth, session, user role)
      - redux optional if needed for complex state
  backend:
    provider: firebase
    services:
      - firebase-auth (with phone/OTP login)
      - firestore (main database)
      - firebase-storage (for images)
      - firebase-cloud-functions (for secure/complex APIs)
      - firebase-messaging (for notifications)
    rules:
      - secure reads/writes with Firestore security rules
      - use callable functions for sensitive ops (unlock, payments, quotes)
  code-style:
    - follow Airbnb TypeScript linting
    - use functional components with hooks
    - always type props and API responses
    - modularize by feature: (customer/, tradie/, admin/)
    - async/await with try/catch for Firebase calls
    - wrap platform-specific code with Platform.OS checks

app-modules:
  customer:
    - login/signup with mobile OTP
    - post service request (trade type, voice/text desc, photos)
    - dashboard:
        - active requests (with interests, quote range, dates)
        - filters, sort, accept, chat, view messages
        - unread messages counter
    - history of past requests + tradie details
  tradie:
    - login/signup with mobile OTP
    - onboarding: license, business, insurance, trades, suburbs
    - service request explorer:
        - search, filters, sort, pagination
        - unlock requests for $0.50 each
        - unlock multiple requests → total daily charge
        - recharge wallet (min $5) or spend credits
        - bonus credits (e.g. $10 signup)
    - dashboard:
        - active requests count
        - new messages count
        - stats by suburb/trade
    - history of jobs
  admin:
    - user management (approve tradies, view customers)
    - accounts management (tradie credits, payments, recharges)
    - money management (revenue, payouts, transactions)

payments:
  - model: micro-payment
  - unlock-cost: 0.50 AUD
  - recharge-minimum: 5 AUD
  - signup-bonus: 10 AUD

data-model:
  - ServiceRequest:
      id, customerId, trades[], suburb, description, photos[], status, createdAt
  - Quote:
      id, requestId, tradieId, price, breakdown, proposedDate, status, createdAt
  - Chat:
      id, requestId, customerId, tradieId, message, type, createdAt
  - Wallet:
      tradieId, balance, transactions[]
  - Rating:
      id, requestId, tradieId, customerId, score, reviewText, createdAt

non-functional:
  - responsive design (must work web, iOS, Android)
  - scalability: indexed queries in Firestore
  - security: Firestore rules per role
  - logging: cloud functions must log unlock/payment ops
  - notifications: push for new requests, messages, quotes

file-structure:
  - /app/screens
      - /Customer (Login, Dashboard, PostRequest, History)
      - /Tradie (Login, Dashboard, Explorer, History)
      - /Admin (Dashboard, Accounts, Money)
  - /app/components/UI (gluestack + custom reusable components)
  - /app/context (AuthContext, UserContext)
  - /app/services
      - firebase.ts (config + exports for auth, firestore, storage, functions)
      - api.ts (wrappers for Cloud Functions)
  - App.tsx (navigation setup: stack + tab navigators)

navigation:
  - CustomerLogin → CustomerTabs
      - Dashboard
      - PostRequest
      - History
  - TradieLogin → TradieTabs
      - Dashboard
      - Explorer
      - History
  - AdminDashboard → dummy sub-screens

setup:
  - create placeholders for all screens (just Text + Button initially)
  - configure Firebase in /app/services/firebase.ts
  - use env vars for Firebase config (placeholder values)
  - enable React Navigation with bottom tabs + stack navigation
  - integrate Tailwind/NativeWind + Gluestack UI
  - scaffold AuthContext for login/session management
  - implement progressive batch infinite scrolling for ExplorerScreen
  - use pre-computed market intelligence via Cloud Functions

ai-rules:
  - always generate TypeScript code
  - ensure generated code compiles with Expo
  - when creating components, default to Gluestack UI or /app/components/UI
  - create screens as placeholders if logic not yet implemented
  - always include role-based navigation flow (Customer, Tradie, Admin)
  - prefer modular + reusable architecture

reusability-rules:
  cross-platform-mandatory:
    - ALL code must work on iOS native, Android native, and web
    - ALL UI must be responsive and cross-platform compatible
    - use Platform.OS checks for platform-specific code only when absolutely necessary
    - test on all three platforms before considering feature complete
  
  ui-component-standards:
    - ALWAYS use Gluestack UI or Styled Components for UI elements
    - NEVER use platform-specific UI libraries (no react-native-elements, native-base, etc)
    - build reusable components in /app/components/UI/ that work across projects
    - components must accept theme props for customization
    - support both light and dark themes
    - ensure components are accessible (screen readers, keyboard navigation)
  
  reusable-architecture:
    - design every component for reuse in other marketplace projects
    - abstract business logic from UI components using hooks and services
    - create generic patterns, not TradieConnect-specific solutions
    - use configuration objects to customize behavior instead of hardcoding
    - document component APIs with TypeScript interfaces and usage examples
  
  backend-reusability:
    - build Firebase Cloud Functions as reusable modules in /functions/src/modules/
    - create generic auth, chat, notification, and payment systems
    - use environment variables for app-specific configuration
    - design Firestore schemas to be adaptable across different marketplace types
    - implement security rules as templates that can be customized
  
  module-structure:
    - organize code by feature modules: /app/modules/auth/, /app/modules/chat/, etc
    - each module should be self-contained and exportable
    - include module-specific types, hooks, components, and services
    - provide clear module APIs for integration
    - maintain backward compatibility when updating modules

architecture-decisions:
  market-intelligence:
    approach: "compute on quote creation (option 2)"
    rationale: "90% cost reduction ($0.13 vs $1.32 per 1M page loads) with 20x performance improvement (100-200ms vs 2-5s)"
    detailed-approach:
      problem: "calculating market intelligence on every page load is expensive and slow"
      rejected-options:
        - "option-1: compute on page load - 220 reads per page, 2-5s load time"
        - "option-3: compute every 15 minutes - unnecessary overhead, stale data"
      chosen-solution:
        - "Firebase Cloud Functions trigger on quote create/update/delete events"
        - "aggregate quotes → calculate intelligence → store in requestIntelligence collection"
        - "page load: simple read from pre-computed data (11 reads vs 220 reads)"
      cost-breakdown:
        - "current: 10 requests × 20 quotes = 200+ reads = $1.32/1M loads"
        - "optimized: 10 requests + 1 batch read = 11 reads = $0.13/1M loads"
      performance: "from 2-5 seconds to 100-200ms load time"
    implementation:
      - "onQuoteCreated/Updated/Deleted Cloud Functions"
      - "requestIntelligence collection with pre-computed data"
      - "real-time updates when quotes change"
    benefits:
      - real-time accuracy
      - fast page loads
      - 90% cost reduction
      - scalable architecture
  
  infinite-scrolling:
    pattern: "progressive batch loading with user control"
    detailed-behavior:
      initial: "load 10 items on screen open"
      auto-scroll: "user scrolls → load 10 more → continue until 50 items in batch"
      user-control: "after 50 items, show 'Load More Items' button, stop auto-loading"
      batch-reset: "user clicks button → reset counter → load next 10 → resume auto-scroll"
      cycle: "items 1-50 → button → items 51-100 → button → repeat until done"
    rationale:
      - "smooth scrolling within batches"
      - "prevents mindless infinite scrolling"
      - "user control over data consumption"
      - "limits memory usage and costs"
    technical-details:
      page-size: 10
      batch-size: 50
      state-tracking: "itemsLoadedInCurrentBatch counter"
      scroll-trigger: "onEndReached only if counter < 50 and no button shown"
      button-logic: "appears when batch reaches 50 items and hasMore = true"
    
  data-architecture:
    collections:
      - serviceRequests: basic request data
      - quotes: individual tradie quotes
      - requestIntelligence: pre-computed market intelligence (quotes aggregation + intelligence)
      - unlockTransactions: tradie unlock records
    intelligence-updates: "real-time via Cloud Functions on quote changes"
    caching-strategy: "pre-computed intelligence stored in separate collection"
    
  ui-patterns:
    explorer-screen:
      - "filter drawer slides from right (not inline panel)"
      - "scroll-to-top button appears after 500px scroll"
      - "progressive batch infinite scrolling"
      - "market intelligence displayed on all request cards"
