import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

// Cloud Functions
export const unlockServiceRequest = httpsCallable(functions, 'unlockServiceRequest');
export const submitQuote = httpsCallable(functions, 'submitQuote');
export const acceptQuote = httpsCallable(functions, 'acceptQuote');
export const rechargeWallet = httpsCallable(functions, 'rechargeWallet');
export const approveTradie = httpsCallable(functions, 'approveTradie');
export const processPayment = httpsCallable(functions, 'processPayment');

// API response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Unlock service request
export interface UnlockRequestData {
  serviceRequestId: string;
  tradieId: string;
}

// Submit quote
export interface QuoteSubmissionData {
  serviceRequestId: string;
  tradieId: string;
  amount: number;
  breakdown: {
    materials: number;
    labour: number;
  };
  estimatedStartDate: string;
  estimatedCompletionDate: string;
  notes: string;
}

// Accept quote
export interface AcceptQuoteData {
  quoteId: string;
  customerId: string;
  address: string;
  phoneNumber: string;
}

// Recharge wallet
export interface RechargeWalletData {
  amount: number;
  paymentMethod: string;
}

// Approve tradie
export interface ApproveTradieData {
  tradieId: string;
  approved: boolean;
  notes?: string;
}
