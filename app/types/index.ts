import { ServiceRequestStatus } from './serviceRequestStatus';

export type { ServiceRequestStatus };

export interface User {
  id: string;
  phoneNumber?: string;
  userType: 'customer' | 'tradie' | 'admin';
  // Common profile fields (present on customer & tradie user docs)
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  address?: string;
  postcode?: string;
  fcmToken?: string | null;
  webPushToken?: string | null;
  // Tradie-only fields (optional on the base type for convenience)
  businessName?: string;
  licenseNumber?: string;
  walletBalance?: number;
  rating?: number;
  totalJobs?: number;
  onboardingCompleted?: boolean;
  interestedTrades?: string[];
  interestedSuburbs?: string[];
  isApproved?: boolean;
  createdAt?: Date | any;
  updatedAt?: Date | any;
}

export interface Customer extends User {
  userType: 'customer';
  firstName: string;
  lastName: string;
  email?: string;
  address?: string;
}

export interface Tradie extends User {
  userType: 'tradie';
  firstName: string;
  lastName: string;
  businessName?: string;
  licenseNumber: string;
  insuranceDetails: InsuranceDetails;
  interestedSuburbs: string[];
  interestedTrades: string[];
  rating: number;
  totalJobs: number;
  walletBalance: number;
  isApproved: boolean;
}

export interface InsuranceDetails {
  provider: string;
  policyNumber: string;
  expiryDate: Date;
  coverageAmount: number;
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  customer?: Customer; // Not embedded on the Firestore doc; populated client-side when needed
  trades: string[];
  tradeType?: string; // Legacy field for backward compatibility
  description: string;
  voiceMessage?: string;
  photos: string[];
  documents?: string[];
  postcode?: string;
  suburb?: string;
  urgency: 'low' | 'medium' | 'high';
  status: ServiceRequestStatus;
  // Set once a quote is accepted
  acceptedQuoteId?: string;
  customerAddress?: string;
  customerPhone?: string;
  createdAt: Date;
  updatedAt: Date;
  budget?: {
    min: number;
    max: number;
  };
  budgetMin?: number;
  budgetMax?: number;
  preferredDates?: {
    earliest: Date;
    latest: Date;
  };
  // Computed search fields
  searchKeywords?: string[];
  notesWords?: string[];
  searchText?: string;
  tradeTypeLower?: string;
  descriptionLower?: string;
}

export interface Quote {
  id: string;
  serviceRequestId: string;
  tradieId: string;
  tradieName?: string;
  tradieRating?: number;
  tradie?: Tradie; // Optional: populated client-side, not stored on the quote doc
  // Runtime price fields (as stored in Firestore)
  totalPrice?: number;
  materialsCost?: number;
  laborCost?: number;
  timelineDays?: number;
  // Legacy aggregate shape (kept for backward compatibility)
  amount?: number;
  breakdown?: {
    materials: number;
    labour: number;
  };
  estimatedStartDate?: Date | null;
  estimatedCompletionDate?: Date | null;
  notes?: string;
  status: 'unlocked' | 'quoted' | 'pending' | 'accepted' | 'rejected';
  quotedAt?: Date;
  acceptedAt?: Date | null;
  createdAt: Date;
}

/** @deprecated Chat uses ChatMessage in services/chatService.ts. Kept for legacy references. */
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  serviceRequestId?: string;
  quoteId?: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface UnlockTransaction {
  id: string;
  tradieId: string;
  serviceRequestId: string;
  amount: number;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'recharge' | 'unlock' | 'bonus' | 'refund';
  amount: number;
  description: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
}
