/**
 * Configuration-driven app setup for maximum reusability across marketplace projects
 * This file defines the structure and default values for app configuration
 */

export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface PricingConfig {
  currency: string;
  unlockCost?: number;
  minimumRecharge?: number;
  subscriptionPlans?: SubscriptionPlan[];
  commissionRate?: number;
  paymentMethods: PaymentMethod[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'wallet' | 'bank' | 'crypto';
  enabled: boolean;
}

export interface RoleConfig {
  name: string;
  displayName: string;
  permissions: string[];
  onboardingSteps: OnboardingStep[];
  navigationTabs: NavigationTab[];
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
  required: boolean;
}

export interface NavigationTab {
  id: string;
  name: string;
  icon: string;
  screen: string;
  badge?: boolean;
}

export interface FeatureFlags {
  // Authentication features
  phoneAuth: boolean;
  emailAuth: boolean;
  socialAuth: boolean;
  biometricAuth: boolean;
  
  // Communication features
  chat: boolean;
  voiceMessages: boolean;
  videoChat: boolean;
  fileSharing: boolean;
  
  // Payment features
  unlockSystem: boolean;
  subscriptions: boolean;
  tips: boolean;
  escrow: boolean;
  
  // Social features
  ratings: boolean;
  reviews: boolean;
  favorites: boolean;
  referrals: boolean;
  
  // Platform features
  multiLanguage: boolean;
  darkMode: boolean;
  analytics: boolean;
  pushNotifications: boolean;
  
  // Admin features
  userManagement: boolean;
  contentModeration: boolean;
  analytics: boolean;
  reporting: boolean;
}

export interface NotificationConfig {
  types: NotificationType[];
  channels: NotificationChannel[];
  defaultSettings: NotificationSettings;
}

export interface NotificationType {
  id: string;
  name: string;
  description: string;
  category: 'system' | 'social' | 'marketing' | 'transactional';
  defaultEnabled: boolean;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'push' | 'email' | 'sms' | 'in-app';
  enabled: boolean;
}

export interface NotificationSettings {
  push: boolean;
  email: boolean;
  sms: boolean;
  inApp: boolean;
  quiet_hours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export interface AppConfig {
  // Basic app information
  name: string;
  version: string;
  description: string;
  
  // Visual configuration
  theme: {
    light: ThemeConfig;
    dark: ThemeConfig;
  };
  
  // Feature toggles
  features: FeatureFlags;
  
  // Business model configuration
  pricing: PricingConfig;
  
  // User roles and permissions
  roles: RoleConfig[];
  
  // Notification system
  notifications: NotificationConfig;
  
  // API configuration
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  
  // Firebase configuration (will be loaded from environment)
  firebase: {
    projectId: string;
    region: string;
  };
  
  // App-specific settings
  settings: {
    defaultLocation?: {
      latitude: number;
      longitude: number;
      radius: number;
    };
    supportedLanguages: string[];
    defaultLanguage: string;
    maxFileSize: number;
    allowedFileTypes: string[];
  };
}

// Default configuration for TradieConnect
export const defaultAppConfig: AppConfig = {
  name: 'TradieConnect',
  version: '1.0.0',
  description: 'Connect customers with trusted tradies',
  
  theme: {
    light: {
      primary: '#007AFF',
      secondary: '#34C759',
      accent: '#FF9500',
      background: '#FFFFFF',
      surface: '#F2F2F7',
      text: '#000000',
      textSecondary: '#6D6D80',
      error: '#FF3B30',
      warning: '#FF9500',
      success: '#34C759',
      info: '#007AFF',
    },
    dark: {
      primary: '#0A84FF',
      secondary: '#30D158',
      accent: '#FF9F0A',
      background: '#000000',
      surface: '#1C1C1E',
      text: '#FFFFFF',
      textSecondary: '#8E8E93',
      error: '#FF453A',
      warning: '#FF9F0A',
      success: '#30D158',
      info: '#64D2FF',
    },
  },
  
  features: {
    // Authentication
    phoneAuth: true,
    emailAuth: false,
    socialAuth: false,
    biometricAuth: true,
    
    // Communication
    chat: true,
    voiceMessages: true,
    videoChat: false,
    fileSharing: true,
    
    // Payments
    unlockSystem: true,
    subscriptions: false,
    tips: false,
    escrow: false,
    
    // Social
    ratings: true,
    reviews: true,
    favorites: true,
    referrals: true,
    
    // Platform
    multiLanguage: false,
    darkMode: true,
    analytics: true,
    pushNotifications: true,
    
    // Admin
    userManagement: true,
    contentModeration: true,
    reporting: true,
  },
  
  pricing: {
    currency: 'AUD',
    unlockCost: 0.50,
    minimumRecharge: 5.00,
    commissionRate: 0.05, // 5%
    paymentMethods: [
      { id: 'card', name: 'Credit/Debit Card', type: 'card', enabled: true },
      { id: 'paypal', name: 'PayPal', type: 'wallet', enabled: true },
      { id: 'apple_pay', name: 'Apple Pay', type: 'wallet', enabled: true },
      { id: 'google_pay', name: 'Google Pay', type: 'wallet', enabled: true },
    ],
  },
  
  roles: [
    {
      name: 'customer',
      displayName: 'Customer',
      permissions: ['post_request', 'chat', 'rate', 'pay'],
      onboardingSteps: [
        {
          id: 'profile',
          title: 'Complete Profile',
          description: 'Add your basic information',
          component: 'ProfileSetup',
          required: true,
        },
        {
          id: 'location',
          title: 'Set Location',
          description: 'Help us find tradies near you',
          component: 'LocationSetup',
          required: true,
        },
      ],
      navigationTabs: [
        { id: 'dashboard', name: 'Dashboard', icon: 'home', screen: 'CustomerDashboard' },
        { id: 'post', name: 'Post Job', icon: 'plus', screen: 'PostRequest' },
        { id: 'history', name: 'History', icon: 'clock', screen: 'RequestHistory' },
        { id: 'profile', name: 'Profile', icon: 'user', screen: 'Profile' },
      ],
    },
    {
      name: 'tradie',
      displayName: 'Tradie',
      permissions: ['view_requests', 'unlock', 'quote', 'chat'],
      onboardingSteps: [
        {
          id: 'profile',
          title: 'Business Profile',
          description: 'Tell customers about your business',
          component: 'BusinessProfileSetup',
          required: true,
        },
        {
          id: 'verification',
          title: 'Verification',
          description: 'Upload license and insurance documents',
          component: 'VerificationSetup',
          required: true,
        },
        {
          id: 'services',
          title: 'Services',
          description: 'Select the services you offer',
          component: 'ServicesSetup',
          required: true,
        },
        {
          id: 'areas',
          title: 'Service Areas',
          description: 'Choose your service locations',
          component: 'ServiceAreasSetup',
          required: true,
        },
      ],
      navigationTabs: [
        { id: 'dashboard', name: 'Dashboard', icon: 'home', screen: 'TradieDashboard' },
        { id: 'explorer', name: 'Jobs', icon: 'search', screen: 'ServiceRequestExplorer', badge: true },
        { id: 'quotes', name: 'Quotes', icon: 'file-text', screen: 'QuoteManagement' },
        { id: 'wallet', name: 'Wallet', icon: 'credit-card', screen: 'WalletScreen' },
        { id: 'profile', name: 'Profile', icon: 'user', screen: 'Profile' },
      ],
    },
    {
      name: 'admin',
      displayName: 'Administrator',
      permissions: ['manage_users', 'view_analytics', 'moderate_content', 'manage_payments'],
      onboardingSteps: [],
      navigationTabs: [
        { id: 'dashboard', name: 'Dashboard', icon: 'home', screen: 'AdminDashboard' },
        { id: 'users', name: 'Users', icon: 'users', screen: 'UserManagement' },
        { id: 'analytics', name: 'Analytics', icon: 'bar-chart', screen: 'Analytics' },
        { id: 'settings', name: 'Settings', icon: 'settings', screen: 'AdminSettings' },
      ],
    },
  ],
  
  notifications: {
    types: [
      {
        id: 'new_request',
        name: 'New Service Request',
        description: 'When a new service request is posted in your area',
        category: 'system',
        defaultEnabled: true,
      },
      {
        id: 'new_quote',
        name: 'New Quote Received',
        description: 'When a tradie submits a quote for your request',
        category: 'system',
        defaultEnabled: true,
      },
      {
        id: 'message_received',
        name: 'New Message',
        description: 'When you receive a new chat message',
        category: 'social',
        defaultEnabled: true,
      },
      {
        id: 'payment_received',
        name: 'Payment Received',
        description: 'When you receive a payment',
        category: 'transactional',
        defaultEnabled: true,
      },
    ],
    channels: [
      { id: 'push', name: 'Push Notifications', type: 'push', enabled: true },
      { id: 'email', name: 'Email', type: 'email', enabled: true },
      { id: 'sms', name: 'SMS', type: 'sms', enabled: false },
      { id: 'in_app', name: 'In-App', type: 'in-app', enabled: true },
    ],
    defaultSettings: {
      push: true,
      email: true,
      sms: false,
      inApp: true,
      quiet_hours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
      },
    },
  },
  
  api: {
    baseUrl: 'https://us-central1-tradie-mate-f852a.cloudfunctions.net',
    timeout: 30000,
    retryAttempts: 3,
  },
  
  firebase: {
    projectId: 'tradie-mate-f852a',
    region: 'us-central1',
  },
  
  settings: {
    defaultLocation: {
      latitude: -33.8688,
      longitude: 151.2093,
      radius: 50, // km
    },
    supportedLanguages: ['en'],
    defaultLanguage: 'en',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  },
};

// Configuration loader with environment overrides
export const loadAppConfig = (): AppConfig => {
  const config = { ...defaultAppConfig };
  
  // Override with environment variables if available
  if (process.env.EXPO_PUBLIC_APP_NAME) {
    config.name = process.env.EXPO_PUBLIC_APP_NAME;
  }
  
  if (process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID) {
    config.firebase.projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  }
  
  // Add more environment overrides as needed
  
  return config;
};

// Global app configuration instance
export const appConfig = loadAppConfig();