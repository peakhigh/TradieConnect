/**
 * Test data configuration.
 * Configure phone numbers for test users here.
 * These are used by the seed script and autofill.
 */
module.exports = {
  // Test customer
  customer: {
    phoneNumber: '0405724199',
    userId: 'L4uj8MTCfhWhoMpWWwj8y6LzcZs2', // Firebase Auth UID
    firstName: 'Sarah',
    lastName: 'Mitchell',
    email: 'sarah@test.com',
    postcode: '2026',
  },

  // Test tradie
  tradie: {
    phoneNumber: '0405726599',
    userId: 'tradie_test_001', // Replace with real Firebase Auth UID after signup
    firstName: 'Mike',
    lastName: 'Thompson',
    email: 'mike@test.com',
    businessName: "Mike's Plumbing & Gas",
    licenseNumber: 'PLB-2024-98765',
    trades: ['Plumbing', 'Gas Fitting', 'Hot Water Systems'],
    suburbs: ['2026', '2027', '2029', '2030', '2031'],
    walletBalance: 50.00,
    rating: 4.5,
    totalJobs: 12,
  },

  // Firestore emulator settings
  emulator: {
    host: 'localhost',
    firestorePort: 8080,
    useEmulator: true, // Set to false to seed production (careful!)
  },
};
