import { featureFlags } from './featureFlags';

/**
 * Test autofill helper.
 * When EXPO_PUBLIC_AUTOFILL=true, returns test data for forms.
 * In production, returns null.
 */

const TEST_DATA = {
  customer: {
    firstName: 'Sarah',
    lastName: 'Mitchell',
    phone: '0412345678',
    email: 'sarah@test.com',
    postcode: '2026',
    address: '42 Bondi Road, Bondi NSW 2026',
  },
  tradie: {
    firstName: 'Mike',
    lastName: 'Thompson',
    phone: '0498765432',
    email: 'mike@mikesplumbing.com.au',
    businessName: "Mike's Plumbing & Gas",
    licenseNumber: 'PLB-2024-98765',
    trades: ['Plumbing', 'Gas Fitting', 'Hot Water Systems'],
    suburbs: ['2026', '2027', '2029', '2030', '2031'],
    insuranceProvider: 'Tradies Insurance Co',
    insurancePolicyNumber: 'TIC-2024-55432',
  },
  serviceRequest: {
    trades: ['Plumbing'],
    description: 'Kitchen sink is leaking badly under the cabinet. Water pooling on the floor. Need urgent fix before it damages the floorboards.',
    postcode: '2026',
    urgency: 'high' as const,
  },
  quote: {
    materialsCost: '80',
    laborCost: '200',
    totalPrice: '280',
    timelineDays: '1',
    estimatedStartDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Can come tomorrow morning. Will check for any water damage to subfloor while I\'m there. Parts included in materials cost.',
  },
  onboarding: {
    tradie: {
      firstName: 'Mike',
      lastName: 'Thompson',
      email: 'mike@mikesplumbing.com.au',
      businessName: "Mike's Plumbing & Gas",
      licenseNumber: 'PLB-2024-98765',
      trades: ['Plumbing', 'Gas Fitting', 'Hot Water Systems'],
      suburbs: ['2026', '2027', '2029', '2030', '2031'],
    },
    customer: {
      firstName: 'Sarah',
      lastName: 'Mitchell',
      email: 'sarah@test.com',
      postcode: '2026',
    },
  },
};

export function isAutofillEnabled(): boolean {
  return featureFlags.autofill;
}

export function getAutofillData(formType: keyof typeof TEST_DATA) {
  if (!featureFlags.autofill) return null;
  return TEST_DATA[formType] || null;
}

export function getOnboardingData(role: 'tradie' | 'customer') {
  if (!featureFlags.autofill) return null;
  return TEST_DATA.onboarding[role] || null;
}
