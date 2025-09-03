/**
 * Reusable authentication types for marketplace applications
 */

export interface User {
  id: string;
  phone: string;
  email?: string;
  role: UserRole;
  profile: UserProfile;
  settings: UserSettings;
  verification: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'customer' | 'provider' | 'admin';

export interface UserProfile {
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  location?: Location;
  // Extensible for app-specific fields
  [key: string]: any;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface UserSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  preferences: UserPreferences;
}

export interface NotificationSettings {
  push: boolean;
  email: boolean;
  sms: boolean;
  inApp: boolean;
  types: { [key: string]: boolean };
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'contacts';
  showLocation: boolean;
  showPhone: boolean;
  showEmail: boolean;
}

export interface UserPreferences {
  language: string;
  currency: string;
  theme: 'light' | 'dark' | 'system';
  units: 'metric' | 'imperial';
}

export interface VerificationStatus {
  phone: boolean;
  email: boolean;
  identity: boolean;
  business?: boolean;
  background?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  phone: string;
  countryCode: string;
}

export interface OTPVerification {
  phone: string;
  code: string;
  verificationId: string;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

export interface OnboardingData {
  role: UserRole;
  profile: Partial<UserProfile>;
  businessInfo?: BusinessInfo;
  verification?: VerificationDocuments;
}

export interface BusinessInfo {
  businessName: string;
  abn?: string;
  licenseNumber?: string;
  insuranceNumber?: string;
  businessType: string;
  yearsInBusiness: number;
  services: string[];
  serviceAreas: string[];
}

export interface VerificationDocuments {
  license?: DocumentUpload;
  insurance?: DocumentUpload;
  identity?: DocumentUpload;
}

export interface DocumentUpload {
  url: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: Date;
  reviewedAt?: Date;
  reviewNotes?: string;
}