const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } = require('firebase/firestore');

// Firebase config (use your project config)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample data with embedded intelligence
const sampleRequests = [
  {
    customerId: 'customer_1',
    trades: ['plumbing'],
    suburb: 'Bondi',
    postcode: '2026',
    description: 'Kitchen sink is leaking and needs urgent repair. Water is dripping constantly.',
    photos: ['https://example.com/photo1.jpg'],
    urgency: 'high',
    status: 'open',
    budget: { min: 200, max: 500 },
    intelligence: {
      totalQuotes: 3,
      priceRange: { min: 180, max: 450, average: 315 },
      timelineRange: { minDays: 1, maxDays: 3, averageDays: 2 },
      breakdown: {
        materials: { min: 50, max: 120, average: 85 },
        labor: { min: 130, max: 330, average: 230 }
      },
      competitionLevel: 'medium',
      opportunityScore: 75,
      competitivePosition: 'moderate',
      recommendedPriceRange: { min: 284, max: 347, optimal: 299 },
      winProbability: 0.65,
      marketTrends: { priceDirection: 'stable', demandLevel: 'medium' },
      lastQuoteAt: new Date()
    }
  },
  {
    customerId: 'customer_2',
    trades: ['electrical'],
    suburb: 'Surry Hills',
    postcode: '2010',
    description: 'Need to install new power outlets in home office. 3 double outlets required.',
    photos: [],
    urgency: 'medium',
    status: 'open',
    budget: { min: 300, max: 800 },
    intelligence: {
      totalQuotes: 1,
      priceRange: { min: 420, max: 420, average: 420 },
      timelineRange: { minDays: 2, maxDays: 2, averageDays: 2 },
      breakdown: {
        materials: { min: 120, max: 120, average: 120 },
        labor: { min: 300, max: 300, average: 300 }
      },
      competitionLevel: 'low',
      opportunityScore: 85,
      competitivePosition: 'strong',
      recommendedPriceRange: { min: 378, max: 462, optimal: 399 },
      winProbability: 0.8,
      marketTrends: { priceDirection: 'up', demandLevel: 'low' },
      lastQuoteAt: new Date()
    }
  },
  {
    customerId: 'customer_3',
    trades: ['carpentry'],
    suburb: 'Paddington',
    postcode: '2021',
    description: 'Custom built-in wardrobe for master bedroom. Measurements: 3m wide x 2.4m high.',
    photos: ['https://example.com/photo2.jpg', 'https://example.com/photo3.jpg'],
    urgency: 'low',
    status: 'open',
    budget: { min: 1500, max: 3000 },
    intelligence: {
      totalQuotes: 5,
      priceRange: { min: 1800, max: 2800, average: 2300 },
      timelineRange: { minDays: 7, maxDays: 14, averageDays: 10 },
      breakdown: {
        materials: { min: 600, max: 1000, average: 800 },
        labor: { min: 1200, max: 1800, average: 1500 }
      },
      competitionLevel: 'medium',
      opportunityScore: 60,
      competitivePosition: 'moderate',
      recommendedPriceRange: { min: 2070, max: 2530, optimal: 2185 },
      winProbability: 0.55,
      marketTrends: { priceDirection: 'stable', demandLevel: 'medium' },
      lastQuoteAt: new Date()
    }
  },
  {
    customerId: 'customer_4',
    trades: ['painting'],
    suburb: 'Newtown',
    postcode: '2042',
    description: 'Interior painting for 2-bedroom apartment. All walls and ceilings.',
    photos: [],
    urgency: 'medium',
    status: 'open',
    budget: { min: 800, max: 1500 },
    intelligence: {
      totalQuotes: 0,
      priceRange: { min: 0, max: 0, average: 0 },
      timelineRange: { minDays: 0, maxDays: 0, averageDays: 0 },
      breakdown: {
        materials: { min: 0, max: 0, average: 0 },
        labor: { min: 0, max: 0, average: 0 }
      },
      competitionLevel: 'low',
      opportunityScore: 90,
      competitivePosition: 'strong',
      recommendedPriceRange: { min: 0, max: 0, optimal: 0 },
      winProbability: 0.9,
      marketTrends: { priceDirection: 'stable', demandLevel: 'low' },
      lastQuoteAt: new Date()
    }
  },
  {
    customerId: 'customer_5',
    trades: ['tiling'],
    suburb: 'Manly',
    postcode: '2095',
    description: 'Bathroom renovation - floor and wall tiling. Approx 15 sqm total.',
    photos: ['https://example.com/photo4.jpg'],
    urgency: 'high',
    status: 'open',
    budget: { min: 1200, max: 2500 },
    intelligence: {
      totalQuotes: 7,
      priceRange: { min: 1400, max: 2200, average: 1800 },
      timelineRange: { minDays: 3, maxDays: 7, averageDays: 5 },
      breakdown: {
        materials: { min: 400, max: 800, average: 600 },
        labor: { min: 1000, max: 1400, average: 1200 }
      },
      competitionLevel: 'high',
      opportunityScore: 45,
      competitivePosition: 'weak',
      recommendedPriceRange: { min: 1620, max: 1980, optimal: 1710 },
      winProbability: 0.35,
      marketTrends: { priceDirection: 'down', demandLevel: 'high' },
      lastQuoteAt: new Date()
    }
  }
];

async function clearCollection(collectionName) {
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    const deletePromises = snapshot.docs.map(docSnapshot => 
      deleteDoc(doc(db, collectionName, docSnapshot.id))
    );
    await Promise.all(deletePromises);
    console.log(`✅ Cleared ${snapshot.docs.length} documents from ${collectionName}`);
  } catch (error) {
    console.log(`⚠️  Collection ${collectionName} might not exist or is already empty`);
  }
}

async function clearAndPopulateData() {
  try {
    console.log('🗑️  Clearing existing data...');
    
    // Clear collections
    await clearCollection('serviceRequests');
    await clearCollection('requestIntelligence');
    await clearCollection('quotes');
    await clearCollection('unlockTransactions');
    
    console.log('📝 Populating new data...');
    
    // Add new service requests with embedded intelligence
    for (let i = 0; i < sampleRequests.length; i++) {
      const request = sampleRequests[i];
      await addDoc(collection(db, 'serviceRequests'), {
        ...request,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    console.log(`✅ Added ${sampleRequests.length} service requests with embedded intelligence`);
    console.log('🎉 Data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during data migration:', error);
  }
}

clearAndPopulateData();