require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample data
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
  'Fence repair needed after storm damage'
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

function calculateIntelligence(quotes) {
  if (quotes.length === 0) {
    return {
      totalQuotes: 0,
      priceRange: { min: 0, max: 0, average: 0 },
      timelineRange: { minDays: 0, maxDays: 0, averageDays: 0 },
      breakdown: { materials: { min: 0, max: 0, average: 0 }, labor: { min: 0, max: 0, average: 0 } },
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

  return {
    totalQuotes: quotes.length,
    priceRange: { min: Math.round(minPrice * 100) / 100, max: Math.round(maxPrice * 100) / 100, average: avgPrice },
    timelineRange: { minDays: Math.min(...timelines), maxDays: Math.max(...timelines), averageDays: Math.round(timelines.reduce((a, b) => a + b, 0) / timelines.length * 10) / 10 },
    breakdown: {
      materials: { min: Math.round(Math.min(...materials) * 100) / 100, max: Math.round(Math.max(...materials) * 100) / 100, average: Math.round(materials.reduce((a, b) => a + b, 0) / materials.length * 100) / 100 },
      labor: { min: Math.round(Math.min(...labor) * 100) / 100, max: Math.round(Math.max(...labor) * 100) / 100, average: Math.round(labor.reduce((a, b) => a + b, 0) / labor.length * 100) / 100 }
    },
    competitionLevel: quotes.length < 3 ? 'low' : quotes.length < 7 ? 'medium' : 'high',
    opportunityScore: Math.round(Math.min(100, Math.max(20, (quotes.length < 5 ? 40 : 20) + (Math.random() * 30 + 20))) * 100) / 100,
    competitivePosition: quotes.length < 3 ? 'strong' : quotes.length < 7 ? 'moderate' : 'weak',
    recommendedPriceRange: { min: Math.round(avgPrice * 0.9 * 100) / 100, max: Math.round(avgPrice * 1.1 * 100) / 100, optimal: Math.round(avgPrice * 0.95 * 100) / 100 },
    winProbability: Math.round(Math.max(0.2, Math.min(0.9, (quotes.length < 3 ? 0.8 : quotes.length < 7 ? 0.6 : 0.4) + (Math.random() * 0.2 - 0.1))) * 100) / 100,
    marketTrends: { priceDirection: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down', demandLevel: quotes.length > 7 ? 'high' : quotes.length > 3 ? 'medium' : 'low' },
    lastQuoteAt: quotes.reduce((latest, quote) => quote.createdAt.toMillis() > latest.toMillis() ? quote.createdAt : latest, quotes[0].createdAt)
  };
}

async function addMoreData() {
  console.log('Adding 50 more service requests...');
  
  for (let i = 0; i < 50; i++) {
    const suburb = randomChoice(suburbs);
    const postcode = postcodes[suburbs.indexOf(suburb)];
    const createdAt = randomDate();
    const tradeType = randomChoice(trades);
    const description = randomChoice(descriptions);
    
    // Create service request
    const request = {
      customerId: `customer_${randomNumber(1, 20)}`,
      tradeType,
      description,
      postcode,
      urgency: randomChoice(urgencyLevels),
      status: randomChoice(statuses),
      photos: [],
      documents: [],
      voiceMessage: null,
      searchKeywords: [tradeType.toLowerCase(), postcode.toLowerCase()],
      notesWords: description.toLowerCase().split(/\s+/).filter(word => word.length > 0),
      tradeTypeLower: tradeType.toLowerCase(),
      descriptionLower: description.toLowerCase(),
      mock: true,
      createdAt: Timestamp.fromDate(createdAt),
      updatedAt: Timestamp.fromDate(createdAt)
    };
    
    const requestRef = await addDoc(collection(db, 'serviceRequests'), request);
    console.log(`Created request ${i + 1}/50: ${requestRef.id}`);
    
    // Create quotes for this request
    const numQuotes = randomNumber(1, 12);
    const quotes = [];
    
    for (let j = 0; j < numQuotes; j++) {
      const materialsCost = randomNumber(50, 500);
      const laborCost = randomNumber(100, 800);
      const totalPrice = materialsCost + laborCost;
      
      const quote = {
        requestId: requestRef.id,
        tradieId: `tradie_${randomNumber(1, 30)}`,
        totalPrice,
        materialsCost,
        laborCost,
        timelineDays: randomNumber(1, 14),
        proposedStartDate: Timestamp.fromDate(new Date(createdAt.getTime() + randomNumber(1, 7) * 24 * 60 * 60 * 1000)),
        status: 'pending',
        mock: true,
        createdAt: Timestamp.fromDate(new Date(createdAt.getTime() + randomNumber(1, 48) * 60 * 60 * 1000)),
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      await addDoc(collection(db, 'quotes'), quote);
      quotes.push(quote);
    }
    
    // Create intelligence for this request
    const intelligence = calculateIntelligence(quotes);
    const intelligenceData = {
      requestId: requestRef.id,
      ...intelligence,
      mock: true,
      updatedAt: Timestamp.now()
    };
    
    await addDoc(collection(db, 'requestIntelligence'), intelligenceData);
  }
  
  console.log('✅ Added 50 more requests with quotes and intelligence!');
}

addMoreData();