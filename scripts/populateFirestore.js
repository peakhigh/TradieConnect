require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, Timestamp } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

console.log('Firebase Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample photos and documents (reuse same URLs to save storage)
const SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
];

const SAMPLE_DOCUMENTS = [
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  'https://file-examples.com/storage/fe68c1b7d4c2b4c6e8c8b8c/2017/10/file_example_DOC_10kB.doc'
];

// Sample data generators
const trades = ['plumbing', 'electrical', 'carpentry', 'painting', 'tiling', 'roofing', 'landscaping'];
const suburbs = ['Bondi Beach', 'Manly', 'Surry Hills', 'Paddington', 'Newtown', 'Glebe', 'Balmain', 'Mosman'];
const postcodes = ['2026', '2095', '2010', '2021', '2042', '2037', '2041', '2088'];
const urgencyLevels = ['low', 'medium', 'high', 'urgent'];
const statuses = ['open', 'quoted', 'assigned'];

const descriptions = [
  'Kitchen tap is leaking and needs urgent repair',
  'Power outlet not working in bedroom',
  'Need custom shelving built in living room',
  'Bathroom tiles need replacing',
  'Fence repair needed after storm damage',
  'Air conditioning unit making strange noises',
  'Garden landscaping for new home',
  'Painting interior walls and ceiling',
  'Installing new light fixtures',
  'Fixing squeaky floorboards'
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(days = 7) {
  const now = new Date();
  const past = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

async function createServiceRequests() {
  console.log('Creating service requests...');
  const requests = [];
  
  for (let i = 0; i < 50; i++) {
    const suburb = randomChoice(suburbs);
    const postcode = postcodes[suburbs.indexOf(suburb)];
    const createdAt = randomDate();
    
    const tradeType = randomChoice(trades);
    const description = randomChoice(descriptions);
    
    const request = {
      customerId: `customer_${randomNumber(1, 20)}`,
      tradeType,
      description,
      postcode,
      urgency: randomChoice(urgencyLevels),
      status: randomChoice(statuses),
      photos: Math.random() > 0.5 ? [randomChoice(SAMPLE_PHOTOS)] : [],
      documents: Math.random() > 0.7 ? [randomChoice(SAMPLE_DOCUMENTS)] : [],
      voiceMessage: null,
      searchKeywords: [
        tradeType.toLowerCase(),
        ...description.toLowerCase().split(/\s+/).filter(word => word.length > 0),
        postcode.toLowerCase()
      ],
      notesWords: description.toLowerCase().split(/\s+/).filter(word => word.length > 0),
      tradeTypeLower: tradeType.toLowerCase(),
      descriptionLower: description.toLowerCase(),
      mock: true,
      createdAt: Timestamp.fromDate(createdAt),
      updatedAt: Timestamp.fromDate(createdAt)
    };
    
    try {
      const docRef = await addDoc(collection(db, 'serviceRequests'), request);
      requests.push({ id: docRef.id, ...request });
      console.log(`Created service request ${i + 1}/50`);
    } catch (error) {
      console.error('Error creating service request:', error);
    }
  }
  
  return requests;
}

async function createQuotes(serviceRequests) {
  console.log('Creating quotes...');
  const requestQuotes = {};
  
  for (const request of serviceRequests) {
    const numQuotes = randomNumber(1, 12);
    requestQuotes[request.id] = [];
    
    for (let i = 0; i < numQuotes; i++) {
      const materialsCost = randomNumber(50, 500);
      const laborCost = randomNumber(100, 800);
      const totalPrice = materialsCost + laborCost;
      const requestCreatedAt = request.createdAt.toDate();
      
      const quote = {
        requestId: request.id,
        tradieId: `tradie_${randomNumber(1, 30)}`,
        totalPrice,
        materialsCost,
        laborCost,
        timelineDays: randomNumber(1, 14),
        proposedStartDate: Timestamp.fromDate(new Date(requestCreatedAt.getTime() + randomNumber(1, 7) * 24 * 60 * 60 * 1000)),
        status: 'pending',
        mock: true,
        createdAt: Timestamp.fromDate(new Date(requestCreatedAt.getTime() + randomNumber(1, 48) * 60 * 60 * 1000)),
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      try {
        await addDoc(collection(db, 'quotes'), quote);
        requestQuotes[request.id].push(quote);
      } catch (error) {
        console.error('Error creating quote:', error);
      }
    }
    
    console.log(`Created quotes for request ${request.id}`);
  }
  
  return requestQuotes;
}

async function cleanMockData() {
  console.log('🧹 Cleaning existing mock data...');
  
  const collections = ['serviceRequests', 'quotes', 'unlockTransactions', 'requestIntelligence'];
  
  for (const collectionName of collections) {
    try {
      const q = query(collection(db, collectionName), where('mock', '==', true));
      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      console.log(`Deleted ${snapshot.docs.length} mock records from ${collectionName}`);
    } catch (error) {
      console.error(`Error cleaning ${collectionName}:`, error);
    }
  }
}

function calculateIntelligence(quotes) {
  if (quotes.length === 0) {
    return {
      totalQuotes: 0,
      priceRange: { min: 0, max: 0, average: 0 },
      timelineRange: { minDays: 0, maxDays: 0, averageDays: 0 },
      breakdown: {
        materials: { min: 0, max: 0, average: 0 },
        labor: { min: 0, max: 0, average: 0 }
      },
      competitionLevel: 'low',
      opportunityScore: 80,
      competitivePosition: 'strong',
      recommendedPriceRange: { min: 0, max: 0, optimal: 0 },
      winProbability: 0.8,
      marketTrends: { priceDirection: 'stable', demandLevel: 'low' },
      lastQuoteAt: Timestamp.now()
    };
  }

  const prices = quotes.map(q => q.totalPrice);
  const timelines = quotes.map(q => q.timelineDays);
  const materials = quotes.map(q => q.materialsCost);
  const labor = quotes.map(q => q.laborCost);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length * 100) / 100;
  const priceSpread = maxPrice - minPrice;

  const competitionLevel = quotes.length < 3 ? 'low' : quotes.length < 7 ? 'medium' : 'high';
  const opportunityScore = Math.round(Math.min(100, Math.max(20, 
    (priceSpread > 200 ? 30 : 0) + 
    (quotes.length < 5 ? 40 : 20) + 
    (Math.random() * 30 + 20)
  )) * 100) / 100;
  const competitivePosition = quotes.length < 3 ? 'strong' : quotes.length < 7 ? 'moderate' : 'weak';
  const winProbability = Math.round(Math.max(0.2, Math.min(0.9, 
    (quotes.length < 3 ? 0.8 : quotes.length < 7 ? 0.6 : 0.4) + 
    (Math.random() * 0.2 - 0.1)
  )) * 100) / 100;

  return {
    totalQuotes: quotes.length,
    priceRange: {
      min: Math.round(minPrice * 100) / 100,
      max: Math.round(maxPrice * 100) / 100,
      average: avgPrice
    },
    timelineRange: {
      minDays: Math.min(...timelines),
      maxDays: Math.max(...timelines),
      averageDays: Math.round(timelines.reduce((a, b) => a + b, 0) / timelines.length * 10) / 10
    },
    breakdown: {
      materials: {
        min: Math.round(Math.min(...materials) * 100) / 100,
        max: Math.round(Math.max(...materials) * 100) / 100,
        average: Math.round(materials.reduce((a, b) => a + b, 0) / materials.length * 100) / 100
      },
      labor: {
        min: Math.round(Math.min(...labor) * 100) / 100,
        max: Math.round(Math.max(...labor) * 100) / 100,
        average: Math.round(labor.reduce((a, b) => a + b, 0) / labor.length * 100) / 100
      }
    },
    competitionLevel,
    opportunityScore,
    competitivePosition,
    recommendedPriceRange: {
      min: Math.round(avgPrice * 0.9 * 100) / 100,
      max: Math.round(avgPrice * 1.1 * 100) / 100,
      optimal: Math.round(avgPrice * 0.95 * 100) / 100
    },
    winProbability,
    marketTrends: {
      priceDirection: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down',
      demandLevel: quotes.length > 7 ? 'high' : quotes.length > 3 ? 'medium' : 'low'
    },
    lastQuoteAt: quotes.reduce((latest, quote) => 
      quote.createdAt.toMillis() > latest.toMillis() ? quote.createdAt : latest, 
      quotes[0].createdAt
    )
  };
}

async function createRequestIntelligence(requestQuotes) {
  console.log('Creating request intelligence...');
  
  for (const [requestId, quotes] of Object.entries(requestQuotes)) {
    const intelligence = calculateIntelligence(quotes);
    
    const intelligenceData = {
      requestId,
      ...intelligence,
      mock: true,
      updatedAt: Timestamp.now()
    };
    
    try {
      await addDoc(collection(db, 'requestIntelligence'), intelligenceData);
      console.log(`Created intelligence for request ${requestId}`);
    } catch (error) {
      console.error('Error creating intelligence:', error);
    }
  }
}

async function main() {
  try {
    console.log('Starting Firestore population...');
    
    // Clean existing mock data first
    await cleanMockData();
    
    // Create service requests
    const serviceRequests = await createServiceRequests();
    
    // Create quotes for service requests
    const requestQuotes = await createQuotes(serviceRequests);
    
    // Create request intelligence
    await createRequestIntelligence(requestQuotes);
    
    console.log('✅ Firestore population completed successfully!');
    
  } catch (error) {
    console.error('❌ Error populating Firestore:', error);
  }
}

main();