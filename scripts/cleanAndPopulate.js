require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, doc, writeBatch, Timestamp } = require('firebase/firestore');

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

// Trade types as arrays (some requests can have multiple trades)
const SINGLE_TRADES = [
  ['Plumbing'], ['Electrical'], ['Carpentry'], ['Painting'], ['Roofing'], 
  ['Flooring'], ['HVAC'], ['Landscaping'], ['Tiling'], ['Plastering'], 
  ['Handyman'], ['Cleaning'], ['Bricklaying'], ['Concreting']
];

const MULTI_TRADES = [
  ['Plumbing', 'Tiling'], ['Electrical', 'Painting'], ['Carpentry', 'Flooring'],
  ['HVAC', 'Electrical'], ['Landscaping', 'Fencing'], ['Bathroom Renovation', 'Plumbing', 'Tiling'],
  ['Kitchen Renovation', 'Electrical', 'Plumbing'], ['Roofing', 'Guttering']
];

const ALL_TRADE_COMBINATIONS = [...SINGLE_TRADES, ...MULTI_TRADES];

const suburbs = ['Bondi Beach', 'Manly', 'Surry Hills', 'Paddington', 'Newtown', 'Glebe', 'Balmain', 'Mosman'];
const postcodes = ['2026', '2095', '2010', '2021', '2042', '2037', '2041', '2088'];
const urgencyLevels = ['low', 'medium', 'high', 'urgent'];
const statuses = ['new', 'quoted', 'assigned', 'completed'];

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

async function deleteAllData() {
  console.log('🗑️  Deleting ALL existing data...');
  
  const collections = ['serviceRequests', 'quotes', 'unlockTransactions', 'requestIntelligence'];
  
  for (const collectionName of collections) {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      
      if (snapshot.docs.length === 0) {
        console.log(`No documents found in ${collectionName}`);
        continue;
      }

      // Delete in batches of 500 (Firestore limit)
      const batchSize = 500;
      const batches = [];
      
      for (let i = 0; i < snapshot.docs.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchDocs = snapshot.docs.slice(i, i + batchSize);
        
        batchDocs.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        batches.push(batch);
      }
      
      await Promise.all(batches.map(batch => batch.commit()));
      console.log(`✅ Deleted ${snapshot.docs.length} documents from ${collectionName}`);
      
    } catch (error) {
      console.error(`❌ Error deleting from ${collectionName}:`, error);
    }
  }
}

async function createServiceRequests() {
  console.log('📝 Creating service requests with tradeType arrays...');
  const requests = [];
  
  for (let i = 0; i < 50; i++) {
    const suburb = randomChoice(suburbs);
    const postcode = postcodes[suburbs.indexOf(suburb)];
    const createdAt = randomDate();
    
    const tradeType = randomChoice(ALL_TRADE_COMBINATIONS);
    const description = randomChoice(descriptions);
    
    // Create search keywords from trade types and description
    const searchKeywords = [
      ...tradeType.map(t => t.toLowerCase()),
      ...description.toLowerCase().split(/\s+/).filter(word => word.length > 2),
      postcode.toLowerCase()
    ];
    
    const request = {
      customerId: "L4uj8MTCfhWhoMpWWwj8y6LzcZs2",
      tradeType, // Now an array
      description,
      postcode,
      urgency: randomChoice(urgencyLevels),
      status: randomChoice(statuses),
      photos: Math.random() > 0.5 ? ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400'] : [],
      documents: Math.random() > 0.7 ? ['https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'] : [],
      voiceMessage: null,
      searchKeywords,
      notesWords: description.toLowerCase().split(/\s+/).filter(word => word.length > 0),
      tradeTypeLower: tradeType.map(t => t.toLowerCase()), // Array of lowercase trade types
      descriptionLower: description.toLowerCase(),
      mock: true,
      createdAt: Timestamp.fromDate(createdAt),
      updatedAt: Timestamp.fromDate(createdAt)
    };
    
    try {
      const docRef = await addDoc(collection(db, 'serviceRequests'), request);
      requests.push({ id: docRef.id, ...request });
      console.log(`Created service request ${i + 1}/50 - Trades: [${tradeType.join(', ')}]`);
    } catch (error) {
      console.error('Error creating service request:', error);
    }
  }
  
  return requests;
}

async function createQuotes(serviceRequests) {
  console.log('💰 Creating quotes...');
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
    
    console.log(`Created ${numQuotes} quotes for request ${request.id}`);
  }
  
  return requestQuotes;
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

  const competitionLevel = quotes.length < 3 ? 'low' : quotes.length < 7 ? 'medium' : 'high';
  const opportunityScore = Math.round(Math.min(100, Math.max(20, 
    (quotes.length < 5 ? 40 : 20) + (Math.random() * 30 + 20)
  )) * 100) / 100;
  const competitivePosition = quotes.length < 3 ? 'strong' : quotes.length < 7 ? 'moderate' : 'weak';
  const winProbability = Math.round(Math.max(0.2, Math.min(0.9, 
    (quotes.length < 3 ? 0.8 : quotes.length < 7 ? 0.6 : 0.4) + (Math.random() * 0.2 - 0.1)
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
  console.log('🧠 Creating request intelligence...');
  
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
    console.log('🚀 Starting clean and populate process...');
    
    // Step 1: Delete all existing data
    await deleteAllData();
    
    // Step 2: Create service requests with tradeType as arrays
    const serviceRequests = await createServiceRequests();
    
    // Step 3: Create quotes for service requests
    const requestQuotes = await createQuotes(serviceRequests);
    
    // Step 4: Create request intelligence
    await createRequestIntelligence(requestQuotes);
    
    console.log('✅ Clean and populate completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Service Requests: ${serviceRequests.length}`);
    console.log(`   - Total Quotes: ${Object.values(requestQuotes).flat().length}`);
    console.log(`   - Intelligence Records: ${Object.keys(requestQuotes).length}`);
    
  } catch (error) {
    console.error('❌ Error in clean and populate process:', error);
  }
}

main();