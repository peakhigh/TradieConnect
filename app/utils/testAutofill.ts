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
  },
  tradie: {
    firstName: 'Mike',
    lastName: 'Thompson',
    phone: '0498765432',
    email: 'mike@test.com',
    businessName: "Mike's Plumbing & Gas",
    licenseNumber: 'PLB-2024-98765',
    trades: ['Plumbing', 'Gas Fitting'],
    suburbs: ['2026', '2027', '2029'],
  },
  serviceRequest: {
    trades: ['Plumbing'],
    description: 'Kitchen sink is leaking badly under the cabinet. Water pooling on the floor.',
    postcode: '2026',
    urgency: 'high' as const,
  },
  quote: {
    materialsCost: '80',
    laborCost: '200',
    totalPrice: '280',
    timelineDays: '1',
    notes: 'Can come tomorrow morning. Will check for water damage.',
  },
};

export function isAutofillEnabled(): boolean {
  return featureFlags.autofill;
}

export function getAutofillData(formType: keyof typeof TEST_DATA) {
  if (!featureFlags.autofill) return null;
  return TEST_DATA[formType] || null;
}
