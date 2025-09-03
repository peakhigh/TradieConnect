# Reusability Framework for Multi-Project Architecture

## Core Principles

### 1. Cross-Platform Compatibility (MANDATORY)
- **ALL code must work on iOS native, Android native, and web**
- **ALL UI must be responsive and cross-platform**
- Use Platform.OS checks for platform-specific code
- Test on all three platforms before considering complete

### 2. UI Component Standards (MANDATORY)
- **ALWAYS use Gluestack UI or Styled Components**
- **NEVER use platform-specific UI libraries**
- Build reusable components in `/app/components/UI/`
- Components must accept theme props for customization
- Support both light and dark themes

### 3. Reusable Architecture (MANDATORY)
- **Design every component for reuse in other projects**
- **Abstract business logic from UI components**
- **Create generic patterns, not app-specific solutions**
- Document component APIs and usage examples

### 4. Backend Reusability (MANDATORY)
- **Build Firebase functions as reusable modules**
- **Create generic auth, chat, notification, and payment systems**
- **Use environment variables for app-specific configuration**
- **Design database schemas to be adaptable**

## Reusable Component Categories

### 🔐 Authentication Module
**Location**: `/app/modules/auth/`
**Components**:
- PhoneOTPLogin (universal phone auth)
- RoleSelector (customer/provider/admin)
- UserOnboarding (configurable steps)
- SessionManager (auth state management)

**Reusable Features**:
- Works with any Firebase project
- Configurable user roles
- Customizable onboarding flows
- Multi-language support

### 💬 Chat Module
**Location**: `/app/modules/chat/`
**Components**:
- ChatScreen (WhatsApp-like interface)
- MessageBubble (text, image, voice, file)
- ChatList (conversation list)
- TypingIndicator
- MessageStatus (sent, delivered, read)

**Reusable Features**:
- Real-time messaging via Firestore
- File upload integration
- Push notifications
- Message encryption support
- Offline message queuing

### 💰 Payment Module
**Location**: `/app/modules/payments/`
**Components**:
- WalletManager (credits, transactions)
- PaymentProcessor (Stripe, PayPal integration)
- TransactionHistory
- PricingDisplay
- UnlockSystem (configurable pricing)

**Reusable Features**:
- Multiple payment providers
- Configurable pricing models
- Transaction logging
- Refund handling
- Currency conversion

### 🔔 Notification Module
**Location**: `/app/modules/notifications/`
**Components**:
- PushNotificationManager
- InAppNotifications
- NotificationSettings
- NotificationHistory

**Reusable Features**:
- Firebase Cloud Messaging
- Local notifications
- Notification scheduling
- User preferences
- Deep linking support

### 📋 Form Module
**Location**: `/app/modules/forms/`
**Components**:
- DynamicForm (JSON-driven forms)
- FormField (text, select, date, file)
- FormValidation
- FormWizard (multi-step forms)
- FileUploader

**Reusable Features**:
- Schema-driven form generation
- Real-time validation
- File upload with progress
- Conditional field display
- Form state persistence

### 🔍 Filter Module
**Location**: `/app/modules/filters/`
**Components**:
- FilterDrawer (slide-in filters)
- FilterChips (active filter display)
- SearchBar (with autocomplete)
- SortOptions
- FilterPresets

**Reusable Features**:
- Configurable filter types
- Saved filter presets
- Search history
- Filter analytics
- Export/import filters

### 📱 Navigation Module
**Location**: `/app/modules/navigation/`
**Components**:
- RoleBasedNavigator
- TabNavigator (customizable tabs)
- DrawerNavigator
- StackNavigator
- DeepLinkHandler

**Reusable Features**:
- Role-based navigation
- Dynamic tab configuration
- Deep link routing
- Navigation analytics
- Breadcrumb support

### 📊 Data Module
**Location**: `/app/modules/data/`
**Components**:
- InfiniteScrollList
- DataTable
- SearchableList
- CacheManager
- SyncManager

**Reusable Features**:
- Progressive batch loading
- Offline data caching
- Real-time sync
- Search optimization
- Data export

## Backend Reusable Functions

### 🔐 Auth Functions
**Location**: `/functions/src/modules/auth/`
- `createUser` - Universal user creation
- `verifyPhone` - Phone number verification
- `assignRole` - Role-based permissions
- `updateProfile` - User profile management

### 💬 Chat Functions
**Location**: `/functions/src/modules/chat/`
- `sendMessage` - Message delivery
- `createConversation` - Chat initialization
- `markAsRead` - Message status updates
- `moderateContent` - Content filtering

### 💰 Payment Functions
**Location**: `/functions/src/modules/payments/`
- `processPayment` - Payment processing
- `updateWallet` - Wallet management
- `calculatePricing` - Dynamic pricing
- `generateInvoice` - Invoice creation

### 🔔 Notification Functions
**Location**: `/functions/src/modules/notifications/`
- `sendPushNotification` - Push notifications
- `scheduleNotification` - Scheduled notifications
- `updateNotificationSettings` - User preferences
- `trackNotificationMetrics` - Analytics

## Database Schema Patterns

### User Management
```typescript
// Reusable user schema
interface BaseUser {
  id: string;
  phone: string;
  email?: string;
  role: 'customer' | 'provider' | 'admin';
  profile: UserProfile;
  settings: UserSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Extendable profile
interface UserProfile {
  name: string;
  avatar?: string;
  location?: Location;
  // App-specific fields go here
  [key: string]: any;
}
```

### Request/Response Pattern
```typescript
// Generic request schema
interface BaseRequest {
  id: string;
  customerId: string;
  category: string;
  subcategory?: string;
  description: string;
  attachments: string[];
  location: Location;
  status: RequestStatus;
  pricing?: PricingInfo;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Generic response schema
interface BaseResponse {
  id: string;
  requestId: string;
  providerId: string;
  price: number;
  description: string;
  timeline: string;
  status: ResponseStatus;
  createdAt: Timestamp;
}
```

### Chat Schema
```typescript
interface Conversation {
  id: string;
  participants: string[];
  type: 'direct' | 'group';
  metadata: ConversationMetadata;
  lastMessage?: Message;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: MessageContent;
  type: 'text' | 'image' | 'file' | 'voice';
  status: 'sent' | 'delivered' | 'read';
  createdAt: Timestamp;
}
```

## Configuration-Driven Customization

### App Configuration
```typescript
// /app/config/appConfig.ts
interface AppConfig {
  name: string;
  theme: ThemeConfig;
  features: FeatureFlags;
  pricing: PricingConfig;
  roles: RoleConfig[];
  navigation: NavigationConfig;
}

// Example for TradieConnect
const tradieConnectConfig: AppConfig = {
  name: 'TradieConnect',
  theme: { primary: '#007AFF', secondary: '#34C759' },
  features: { 
    unlockSystem: true, 
    voiceMessages: true,
    ratings: true 
  },
  pricing: { 
    unlockCost: 0.50, 
    currency: 'AUD',
    minimumRecharge: 5.00 
  },
  roles: [
    { name: 'customer', permissions: ['post_request', 'chat'] },
    { name: 'tradie', permissions: ['view_requests', 'unlock', 'quote'] },
    { name: 'admin', permissions: ['manage_users', 'view_analytics'] }
  ]
};
```

### Feature Flags
```typescript
interface FeatureFlags {
  unlockSystem: boolean;
  voiceMessages: boolean;
  videoChat: boolean;
  ratings: boolean;
  subscriptions: boolean;
  multiLanguage: boolean;
  darkMode: boolean;
  analytics: boolean;
}
```

## Development Guidelines

### 1. Component Creation Checklist
- [ ] Works on iOS, Android, and web
- [ ] Uses Gluestack UI or Styled Components
- [ ] Accepts configuration props
- [ ] Includes TypeScript interfaces
- [ ] Has usage documentation
- [ ] Includes error handling
- [ ] Supports theming
- [ ] Has loading states

### 2. Function Creation Checklist
- [ ] Environment variable configuration
- [ ] Input validation and sanitization
- [ ] Error handling and logging
- [ ] Rate limiting
- [ ] Security rules compliance
- [ ] Performance optimization
- [ ] Documentation with examples

### 3. Testing Requirements
- [ ] Unit tests for logic
- [ ] Integration tests for Firebase
- [ ] Cross-platform UI tests
- [ ] Performance benchmarks
- [ ] Security vulnerability scans

## Project Template Structure

```
marketplace-template/
├── app/
│   ├── modules/           # Reusable modules
│   │   ├── auth/
│   │   ├── chat/
│   │   ├── payments/
│   │   ├── notifications/
│   │   ├── forms/
│   │   ├── filters/
│   │   └── navigation/
│   ├── config/            # App-specific configuration
│   ├── screens/           # App-specific screens
│   └── components/        # App-specific components
├── functions/
│   └── src/
│       └── modules/       # Reusable backend modules
├── shared/                # Shared types and utilities
└── docs/                  # Documentation and examples
```

## Migration Strategy

### Phase 1: Extract Core Modules
1. Extract auth system to `/app/modules/auth/`
2. Extract chat system to `/app/modules/chat/`
3. Extract payment system to `/app/modules/payments/`
4. Extract notification system to `/app/modules/notifications/`

### Phase 2: Create Generic Components
1. Convert UI components to accept configuration
2. Add theme support to all components
3. Create component documentation
4. Add TypeScript interfaces

### Phase 3: Backend Modularization
1. Extract Firebase functions to modules
2. Add environment variable configuration
3. Create reusable security rules
4. Document API contracts

### Phase 4: Template Creation
1. Create project template repository
2. Add configuration-driven setup
3. Create deployment scripts
4. Add comprehensive documentation

## Future Project Implementation

### New Project Setup (5-minute process)
1. Clone marketplace template
2. Update app configuration file
3. Configure Firebase project
4. Customize theme and branding
5. Deploy and test

### Estimated Development Time Savings
- **Authentication**: 2 weeks → 2 hours
- **Chat System**: 3 weeks → 1 day
- **Payment Integration**: 2 weeks → 1 day
- **Push Notifications**: 1 week → 2 hours
- **UI Components**: 4 weeks → 1 week
- **Total**: 12 weeks → 2 weeks (83% time savings)

## Success Metrics

### Code Reusability
- 80%+ code reuse across projects
- 90%+ UI component reuse
- 95%+ backend function reuse

### Development Speed
- New project setup: < 1 day
- MVP development: < 2 weeks
- Production deployment: < 1 month

### Quality Assurance
- Zero platform-specific bugs
- 100% cross-platform compatibility
- Consistent user experience across apps