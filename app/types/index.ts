export interface User {
  id: string;
  phoneNumber: string;
  userType: 'customer' | 'tradie' | 'admin';
  createdAt: Date;
  updatedAt: Date;
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
  customer: Customer;
  trades: string[];
  tradeType?: string; // Legacy field for backward compatibility
  description: string;
  voiceMessage?: string;
  photos: string[];
  documents?: string[];
  postcode?: string;
  suburb?: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'active' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  budget?: {
    min: number;
    max: number;
  };
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
  tradie: Tradie;
  amount: number;
  breakdown: {
    materials: number;
    labour: number;
  };
  estimatedStartDate: Date;
  estimatedCompletionDate: Date;
  notes: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  serviceRequestId?: string;
  quoteId?: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
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
