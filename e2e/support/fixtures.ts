/**
 * Known fixture data for the seeded E2E dataset (Tradie).
 * Mirrors bin/data/config.js (test users) and bin/data/seed.js (collections).
 *
 * Run order to produce the dataset (against the emulator):
 *   1. npm run e2e:emulators   (leave running)
 *   2. npm run e2e:seed        (Firestore docs via Admin SDK)
 *
 * Phone-OTP: the Auth emulator is configured with test phone numbers mapped to a
 * fixed code. Configure these on the emulator (see e2e/README.md) so specs can
 * complete the OTP step deterministically.
 */
export const E2E_OTP = '123456'; // fixed test code configured on the Auth emulator

export const USERS = {
  customer: { uid: 'L4uj8MTCfhWhoMpWWwj8y6LzcZs2', phone: '0405724199', e164: '+61405724199', userType: 'customer' },
  tradie: { uid: 'tradie_test_001', phone: '0405726599', e164: '+61405726599', userType: 'tradie' },
} as const;

export const SEEDED = {
  collections: ['serviceRequests', 'quotes', 'walletTransactions', 'chatRooms', 'notifications', 'ratings'],
  approxServiceRequests: 100,
} as const;

/** A fresh phone number for signup tests (Auth-emulator test numbers only). */
export function freshPhone() {
  const n = String(Math.floor(400000000 + Math.random() * 99999999)).slice(0, 9);
  return { phone: `0${n}`, e164: `+61${n}` };
}
