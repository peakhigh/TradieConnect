#!/usr/bin/env node
/**
 * Seed script: Creates 100 service requests with quotes, chat rooms, and wallet transactions.
 * Links everything between the configured customer and tradie.
 *
 * Usage:
 *   node bin/data/seed.js
 *
 * Prerequisites:
 *   - Firebase emulators running: firebase emulators:start --only functions,firestore
 *   - .env file with Firebase config (run: cp .env.local .env)
 */

require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc, deleteDoc, query, where, getDocs, Timestamp, connectFirestoreEmulator } = require('firebase/firestore');
const config = require('./config');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to emulator if configured
if (config.emulator.useEmulator) {
  connectFirestoreEmulator(db, config.emulator.host, config.emulator.firestorePort);
  console.log(`🔌 Connected to Firestore emulator at ${config.emulator.host}:${config.emulator.firestorePort}`);
}

// --- Data generators ---
const TRADES = ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Tiling', 'Roofing', 'Landscaping', 'HVAC', 'Flooring', 'Fencing'];
const POSTCODES = ['2026', '2027', '2029', '2030', '2031', '2035', '2037', '2040', '2042', '2050'];
const URGENCY = ['low', 'medium', 'high'];
const DESCRIPTIONS = [
  'Kitchen tap is leaking badly, water pooling under cabinet',
  'Power outlet sparking in bedroom, need urgent fix',
  'Need custom shelving built in living room, 3 shelves',
  'Bathroom tiles cracked and need replacing, approx 5sqm',
  'Fence panels blown down in storm, need 3 panels replaced',
  'Air conditioning not cooling, making rattling noise',
  'Garden needs complete redesign, new lawn and plants',
  'Interior painting needed, 3 bedrooms and hallway',
  'Install 4 new LED downlights in kitchen',
  'Floorboards squeaking badly in hallway',
  'Hot water system not working, no hot water at all',
  'Deck boards rotting, need replacement of 10 boards',
  'Gutter cleaning and repair, some sections sagging',
  'Install new shower screen in main bathroom',
  'Tree removal in backyard, large eucalyptus',
  'Render repair on external wall, approx 3sqm',
  'Install ceiling fan in master bedroom',
  'Fix leaking roof, water coming in during rain',
  'Build pergola in backyard, 4x3 meters',
  'Replace old toilet with new dual flush',
];

function random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomNum(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomDate(daysBack = 30) {
  const now = Date.now();
  return new Date(now - Math.random() * daysBack * 24 * 60 * 60 * 1000);
}

// --- Main seed function ---
async function seed() {
  console.log('🌱 Starting seed...\n');

  // 1. Create/update test users
  console.log('👤 Creating test users...');
  await setDoc(doc(db, 'users', config.customer.userId), {
    id: config.customer.userId,
    phoneNumber: config.customer.phoneNumber,
    userType: 'customer',
    firstName: config.customer.firstName,
    lastName: config.customer.lastName,
    email: config.customer.email,
    postcode: config.customer.postcode,
    status: 'active',
    onboardingCompleted: true,
    createdAt: Timestamp.fromDate(new Date('2025-01-01')),
    updatedAt: Timestamp.now(),
  });

  await setDoc(doc(db, 'users', config.tradie.userId), {
    id: config.tradie.userId,
    phoneNumber: config.tradie.phoneNumber,
    userType: 'tradie',
    firstName: config.tradie.firstName,
    lastName: config.tradie.lastName,
    email: config.tradie.email,
    businessName: config.tradie.businessName,
    licenseNumber: config.tradie.licenseNumber,
    interestedTrades: config.tradie.trades,
    interestedSuburbs: config.tradie.suburbs,
    walletBalance: config.tradie.walletBalance,
    rating: config.tradie.rating,
    totalJobs: config.tradie.totalJobs,
    onboardingCompleted: true,
    status: 'active',
    createdAt: Timestamp.fromDate(new Date('2025-01-01')),
    updatedAt: Timestamp.now(),
  });
  console.log('  ✅ Customer:', config.customer.firstName, config.customer.lastName);
  console.log('  ✅ Tradie:', config.tradie.firstName, config.tradie.lastName);

  // 2. Create 100 service requests with flat intel_* fields
  console.log('\n📋 Creating 100 service requests...');
  const requests = [];

  for (let i = 0; i < 100; i++) {
    const trade = random(TRADES);
    const postcode = random(POSTCODES);
    const description = random(DESCRIPTIONS);
    const urgency = random(URGENCY);
    const createdAt = randomDate(90); // 90-day spread for reporting trends
    const numQuotes = randomNum(0, 8);

    // Generate mock quote data for intelligence
    const prices = Array.from({ length: numQuotes }, () => randomNum(150, 1500));
    const timelines = Array.from({ length: numQuotes }, () => randomNum(1, 14));
    const materials = prices.map(p => Math.round(p * 0.35));
    const labor = prices.map((p, idx) => p - materials[idx]);

    const avgPrice = numQuotes > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / numQuotes) : 0;
    const priceGap = numQuotes > 0 ? Math.max(...prices) - Math.min(...prices) : 0;

    const requestData = {
      customerId: config.customer.userId,
      trades: [trade],
      tradesLower: [trade.toLowerCase()],
      description,
      descriptionLower: description.toLowerCase(),
      postcode,
      urgency,
      status: 'new',
      photos: [],
      documents: [],
      voiceMessage: null,
      budgetMin: 0,
      budgetMax: randomNum(200, 2000),
      searchKeywords: [trade.toLowerCase(), postcode, ...description.toLowerCase().split(/\s+/)],

      // Flat intel_* fields
      intel_totalQuotes: numQuotes,
      intel_totalUnlocks: randomNum(numQuotes, numQuotes + 5),
      intel_priceMin: numQuotes > 0 ? Math.min(...prices) : 0,
      intel_priceMax: numQuotes > 0 ? Math.max(...prices) : 0,
      intel_priceAverage: avgPrice,
      intel_timelineMinDays: numQuotes > 0 ? Math.min(...timelines) : 0,
      intel_timelineMaxDays: numQuotes > 0 ? Math.max(...timelines) : 0,
      intel_timelineAvgDays: numQuotes > 0 ? Math.round(timelines.reduce((a, b) => a + b, 0) / numQuotes * 10) / 10 : 0,
      intel_materialsMin: numQuotes > 0 ? Math.min(...materials) : 0,
      intel_materialsMax: numQuotes > 0 ? Math.max(...materials) : 0,
      intel_materialsAvg: numQuotes > 0 ? Math.round(materials.reduce((a, b) => a + b, 0) / numQuotes) : 0,
      intel_laborMin: numQuotes > 0 ? Math.min(...labor) : 0,
      intel_laborMax: numQuotes > 0 ? Math.max(...labor) : 0,
      intel_laborAvg: numQuotes > 0 ? Math.round(labor.reduce((a, b) => a + b, 0) / numQuotes) : 0,
      intel_competitionLevel: numQuotes < 3 ? 'low' : numQuotes < 7 ? 'medium' : 'high',
      intel_opportunityScore: Math.round(Math.max(20, Math.min(95, 90 - numQuotes * 8 + Math.random() * 20))),
      intel_competitivePosition: numQuotes < 3 ? 'strong' : numQuotes < 7 ? 'moderate' : 'weak',
      intel_recommendedPriceMin: Math.round(avgPrice * 0.9),
      intel_recommendedPriceMax: Math.round(avgPrice * 1.1),
      intel_recommendedPriceOptimal: Math.round(avgPrice * 0.95),
      intel_winProbability: numQuotes < 3 ? 0.75 : numQuotes < 5 ? 0.55 : numQuotes < 7 ? 0.4 : 0.25,
      intel_priceGap: priceGap,
      intel_priceGapCategory: priceGap > 200 ? 'large' : priceGap > 100 ? 'medium' : 'small',
      intel_priceDirection: random(['up', 'down', 'stable']),
      intel_demandLevel: numQuotes > 7 ? 'high' : numQuotes > 3 ? 'medium' : 'low',
      intel_lastQuoteAt: numQuotes > 0 ? Timestamp.fromDate(randomDate(7)) : null,
      intel_updatedAt: Timestamp.now(),

      mock: true,
      createdAt: Timestamp.fromDate(createdAt),
      updatedAt: Timestamp.fromDate(createdAt),
    };

    const docRef = await addDoc(collection(db, 'serviceRequests'), requestData);
    requests.push({ id: docRef.id, ...requestData });

    if ((i + 1) % 20 === 0) console.log(`  Created ${i + 1}/100 requests`);
  }
  console.log('  ✅ 100 service requests created');

  // 3. Create quotes (some unlocked, some quoted) linked to tradie
  console.log('\n💬 Creating quotes for tradie...');
  let quotesCreated = 0;

  for (let i = 0; i < 30; i++) {
    const request = requests[i];
    const status = i < 10 ? 'unlocked' : i < 25 ? 'quoted' : 'accepted';
    const totalPrice = randomNum(200, 1200);
    const materialsCost = Math.round(totalPrice * 0.35);
    const laborCost = totalPrice - materialsCost;

    const quoteData = {
      tradieId: config.tradie.userId,
      serviceRequestId: request.id,
      status,
      unlockAmount: 0.50,
      unlockedAt: Timestamp.fromDate(randomDate(14)),
      totalPrice: status !== 'unlocked' ? totalPrice : null,
      materialsCost: status !== 'unlocked' ? materialsCost : null,
      laborCost: status !== 'unlocked' ? laborCost : null,
      timelineDays: status !== 'unlocked' ? randomNum(1, 10) : null,
      estimatedStartDate: status !== 'unlocked' ? Timestamp.fromDate(randomDate(-7)) : null,
      estimatedCompletionDate: null,
      notes: status !== 'unlocked' ? random(['Can start next week', 'Available immediately', 'Need to inspect first', 'Materials included']) : null,
      quotedAt: status !== 'unlocked' ? Timestamp.fromDate(randomDate(10)) : null,
      acceptedAt: status === 'accepted' ? Timestamp.fromDate(randomDate(5)) : null,
      tradieName: `${config.tradie.firstName} ${config.tradie.lastName}`,
      tradieRating: config.tradie.rating,
      mock: true,
      createdAt: Timestamp.fromDate(randomDate(14)),
    };

    await addDoc(collection(db, 'quotes'), quoteData);
    quotesCreated++;

    // Keep the parent request status consistent with its quotes so the
    // customer's dashboard sections (Active Jobs, etc.) reflect reality.
    if (status === 'accepted') {
      await setDoc(doc(db, 'serviceRequests', request.id), {
        status: 'assigned',
        acceptedQuoteId: 'seed',
        customerAddress: '12 Test St, Bondi NSW',
        customerPhone: config.customer.phoneNumber,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } else if (status === 'quoted') {
      await setDoc(doc(db, 'serviceRequests', request.id), {
        status: 'quoted',
        updatedAt: Timestamp.now(),
      }, { merge: true });
    }
  }
  console.log(`  ✅ ${quotesCreated} quotes created (10 unlocked, 15 quoted, 5 accepted)`);

  // 4. Create wallet transactions for tradie
  console.log('\n💰 Creating wallet transactions...');
  const txTypes = [
    { type: 'bonus', amount: 10, description: 'Signup bonus' },
    { type: 'recharge', amount: 20, description: 'Wallet recharge via card' },
    { type: 'recharge', amount: 10, description: 'Wallet recharge via card' },
  ];

  // Add unlock transactions
  for (let i = 0; i < 30; i++) {
    txTypes.push({ type: 'unlock', amount: -0.50, description: `Unlocked: ${requests[i].trades[0]} in ${requests[i].postcode}` });
  }

  for (const tx of txTypes) {
    await addDoc(collection(db, 'walletTransactions'), {
      userId: config.tradie.userId,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      status: 'completed',
      mock: true,
      createdAt: Timestamp.fromDate(randomDate(30)),
    });
  }
  console.log(`  ✅ ${txTypes.length} wallet transactions created`);

  // 5. Create a few chat rooms
  console.log('\n💬 Creating chat rooms...');
  for (let i = 10; i < 15; i++) {
    const request = requests[i];
    const quotePrice = randomNum(200, 800);
    const roomStatus = i < 12 ? 'pending' : i < 14 ? 'accepted' : 'rejected';
    const chatRoomRef = await addDoc(collection(db, 'chatRooms'), {
      serviceRequestId: request.id,
      quoteId: `quote_${i}`,
      customerId: config.customer.userId,
      customerName: `${config.customer.firstName} ${config.customer.lastName}`,
      tradieId: config.tradie.userId,
      tradieName: `${config.tradie.firstName} ${config.tradie.lastName}`,
      trades: request.trades,
      suburb: request.postcode,
      quoteStatus: roomStatus,
      participants: [config.customer.userId, config.tradie.userId],
      status: 'active',
      lastMessage: `Quote: $${quotePrice} for ${request.trades[0]}`,
      lastMessageType: 'quote',
      lastMessageAt: Timestamp.fromDate(randomDate(7)),
      unreadByCustomer: randomNum(0, 3),
      unreadByTradie: 0,
      mock: true,
      createdAt: Timestamp.fromDate(randomDate(14)),
    });

    // Add a quote message
    await addDoc(collection(db, 'chatRooms', chatRoomRef.id, 'messages'), {
      type: 'quote',
      text: `Quote: $${quotePrice} for ${request.trades[0]}`,
      senderId: config.tradie.userId,
      senderName: config.tradie.firstName,
      receiverId: config.customer.userId,
      receiverName: config.customer.firstName,
      quoteData: {
        quoteId: `quote_${i}`,
        totalPrice: quotePrice,
        materialsCost: randomNum(50, 300),
        laborCost: randomNum(100, 500),
        timelineDays: randomNum(1, 7),
        notes: 'Test quote from seed script',
        tradieName: `${config.tradie.firstName} ${config.tradie.lastName}`,
        tradieRating: config.tradie.rating,
        trades: request.trades,
        postcode: request.postcode,
        status: roomStatus,
      },
      mock: true,
      createdAt: Timestamp.fromDate(randomDate(14)),
    });

    // Add a couple of text messages so the window isn't empty.
    await addDoc(collection(db, 'chatRooms', chatRoomRef.id, 'messages'), {
      type: 'text',
      text: 'Hi, are you available next week?',
      senderId: config.customer.userId,
      senderName: config.customer.firstName,
      receiverId: config.tradie.userId,
      receiverName: config.tradie.firstName,
      mock: true,
      createdAt: Timestamp.fromDate(randomDate(6)),
    });

    // Add a system message
    await addDoc(collection(db, 'chatRooms', chatRoomRef.id, 'messages'), {
      type: 'system',
      text: `${config.tradie.firstName} submitted a quote`,
      senderId: 'system',
      senderName: 'System',
      mock: true,
      createdAt: Timestamp.fromDate(randomDate(14)),
    });
  }
  console.log('  ✅ 5 chat rooms created with messages');

  // 6. Create notifications (mix of read/unread + types) for both users
  console.log('\n🔔 Creating notifications...');
  const notifications = [
    { userId: config.customer.userId, title: 'New Quote Received', message: 'You received a $450 quote for your Plumbing request', type: 'new_quote', read: false },
    { userId: config.customer.userId, title: 'New Quote Received', message: 'You received a $620 quote for your Electrical request', type: 'new_quote', read: false },
    { userId: config.customer.userId, title: 'Message from Mike', message: 'Hi, are you available next week?', type: 'chat_message', goto: 'chatscreen', read: false },
    { userId: config.customer.userId, title: 'Job Completed', message: 'Your Tiling job has been marked complete', type: 'job_completed', read: true },
    { userId: config.tradie.userId, title: 'Quote Accepted!', message: 'Your $780 quote has been accepted. Customer details shared.', type: 'quote_accepted', goto: 'chatscreen', read: false },
    { userId: config.tradie.userId, title: 'Quote Declined', message: 'Your $300 quote for the Painting request was declined.', type: 'quote_rejected', read: true },
    { userId: config.tradie.userId, title: 'Wallet Recharged', message: '$20.00 added to your wallet', type: 'wallet', goto: 'wallet', read: true },
  ];
  for (const n of notifications) {
    await addDoc(collection(db, 'notifications'), {
      ...n,
      goto: n.goto || '',
      itemId: '',
      mock: true,
      createdAt: Timestamp.fromDate(randomDate(10)),
    });
  }
  console.log(`  ✅ ${notifications.length} notifications created`);

  // 7. Compute reporting rollups from the seeded requests + quotes.
  console.log('\n📊 Building reporting rollups...');
  await buildReportingRollups(requests);

  console.log('\n🎉 Seed complete! Data ready for testing.');
  console.log(`\n📊 Summary:`);
  console.log(`   Users: 2 (1 customer, 1 tradie)`);
  console.log(`   Service Requests: 100`);
  console.log(`   Quotes: 30 (10 unlocked, 15 quoted, 5 accepted)`);
  console.log(`   Wallet Transactions: ${txTypes.length}`);
  console.log(`   Chat Rooms: 5`);
  console.log(`   Notifications: ${notifications.length}`);
  process.exit(0);
}

// --- Reporting rollups builder ---
const PERIOD = 'all';
function suburbKeyOf(suburb, postcode) {
  const s = (suburb || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const p = (postcode || '').trim().toLowerCase();
  if (s && p) return `${s}-${p}`;
  return s || p || 'unknown';
}
function tradeKeyOf(trade) {
  return (trade || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
}
function competitionFromAvgQuotes(a) { return a < 3 ? 'low' : a < 7 ? 'medium' : 'high'; }
function demandFromRequests(req, unlocks) { const i = req + unlocks; return i > 40 ? 'high' : i > 12 ? 'medium' : 'low'; }

async function buildReportingRollups(requests) {
  const blank = () => ({ requestCount: 0, activeRequestCount: 0, completedCount: 0, quoteCount: 0, unlockCount: 0, totalQuotedValue: 0, acceptedValue: 0 });
  const suburbTrade = {}, suburb = {}, trade = {};
  const ensure = (map, key, seed) => { if (!map[key]) map[key] = { ...blank(), ...seed }; return map[key]; };

  for (const r of requests) {
    const sKey = suburbKeyOf(r.suburb, r.postcode);
    const trades = (r.trades && r.trades.length ? r.trades : ['unknown']);
    const isActive = r.status === 'new' || r.status === 'quoted';
    const isCompleted = r.status === 'completed';
    // Derive value figures from the request's intel_* (seeded).
    const quoteCount = r.intel_totalQuotes || 0;
    const unlockCount = r.intel_totalUnlocks || 0;
    const avgPrice = r.intel_priceAverage || 0;
    const totalQuoted = avgPrice * quoteCount;
    const acceptedValue = r.status === 'assigned' || r.status === 'completed' ? avgPrice : 0;

    const sAcc = ensure(suburb, sKey, { suburb: r.suburb || r.postcode || 'Unknown', postcode: r.postcode, state: '' });
    sAcc.requestCount += 1; if (isActive) sAcc.activeRequestCount += 1; if (isCompleted) sAcc.completedCount += 1;
    sAcc.quoteCount += quoteCount; sAcc.unlockCount += unlockCount; sAcc.totalQuotedValue += totalQuoted; sAcc.acceptedValue += acceptedValue;

    for (const t of trades) {
      const tKey = tradeKeyOf(t);
      const stAcc = ensure(suburbTrade, `${sKey}__${tKey}`, { suburb: r.suburb || r.postcode || 'Unknown', postcode: r.postcode, state: '', trade: t });
      stAcc.requestCount += 1; if (isActive) stAcc.activeRequestCount += 1; if (isCompleted) stAcc.completedCount += 1;
      stAcc.quoteCount += quoteCount; stAcc.unlockCount += unlockCount; stAcc.totalQuotedValue += totalQuoted; stAcc.acceptedValue += acceptedValue;

      const tAcc = ensure(trade, tKey, { trade: t });
      tAcc.requestCount += 1; if (isActive) tAcc.activeRequestCount += 1; if (isCompleted) tAcc.completedCount += 1;
      tAcc.quoteCount += quoteCount; tAcc.unlockCount += unlockCount; tAcc.totalQuotedValue += totalQuoted; tAcc.acceptedValue += acceptedValue;
    }
  }

  const derive = (a) => {
    const avgQuoteValue = a.quoteCount > 0 ? Math.round(a.totalQuotedValue / a.quoteCount) : 0;
    const avgQuotesPerRequest = a.requestCount > 0 ? Math.round((a.quoteCount / a.requestCount) * 10) / 10 : 0;
    return {
      avgQuoteValue,
      avgAcceptedValue: a.completedCount > 0 ? Math.round(a.acceptedValue / a.completedCount) : 0,
      avgQuotesPerRequest,
      competitionLevel: competitionFromAvgQuotes(avgQuotesPerRequest),
      demandLevel: demandFromRequests(a.requestCount, a.unlockCount),
    };
  };

  let count = 0;
  for (const [key, a] of Object.entries(suburbTrade)) {
    const [sKey, tKey] = key.split('__');
    await setDoc(doc(db, 'suburbTradeStats', `${sKey}__${tKey}__${PERIOD}`), {
      suburbKey: sKey, suburb: a.suburb, postcode: a.postcode || '', state: '', tradeKey: tKey, trade: a.trade, period: PERIOD,
      requestCount: a.requestCount, activeRequestCount: a.activeRequestCount, completedCount: a.completedCount,
      quoteCount: a.quoteCount, unlockCount: a.unlockCount, totalQuotedValue: Math.round(a.totalQuotedValue), acceptedValue: Math.round(a.acceptedValue),
      ...derive(a), mock: true, updatedAt: Timestamp.now(),
    }); count++;
  }
  for (const [sKey, a] of Object.entries(suburb)) {
    await setDoc(doc(db, 'suburbStats', `${sKey}__${PERIOD}`), {
      suburbKey: sKey, suburb: a.suburb, postcode: a.postcode || '', state: '', period: PERIOD,
      requestCount: a.requestCount, activeRequestCount: a.activeRequestCount, completedCount: a.completedCount,
      quoteCount: a.quoteCount, unlockCount: a.unlockCount, totalQuotedValue: Math.round(a.totalQuotedValue), acceptedValue: Math.round(a.acceptedValue),
      ...derive(a), mock: true, updatedAt: Timestamp.now(),
    }); count++;
  }
  for (const [tKey, a] of Object.entries(trade)) {
    await setDoc(doc(db, 'tradeStats', `${tKey}__${PERIOD}`), {
      tradeKey: tKey, trade: a.trade, period: PERIOD,
      requestCount: a.requestCount, activeRequestCount: a.activeRequestCount, completedCount: a.completedCount,
      quoteCount: a.quoteCount, unlockCount: a.unlockCount, totalQuotedValue: Math.round(a.totalQuotedValue), acceptedValue: Math.round(a.acceptedValue),
      ...derive(a), mock: true, updatedAt: Timestamp.now(),
    }); count++;
  }

  // Suburb adjacency: link the seed postcodes so "nearby suburbs" works.
  const allPostcodes = ['2026', '2027', '2029', '2030', '2031', '2035', '2037', '2040', '2042', '2050'];
  for (const pc of allPostcodes) {
    const sKey = suburbKeyOf('', pc);
    const neighbors = allPostcodes
      .filter((o) => o !== pc)
      .map((o) => ({ suburbKey: suburbKeyOf('', o), suburb: o, postcode: o, distanceKm: Math.abs(parseInt(o) - parseInt(pc)) / 5 }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 6);
    await setDoc(doc(db, 'suburbAdjacency', sKey), {
      suburb: pc, postcode: pc, state: 'NSW', neighbors, mock: true, updatedAt: Timestamp.now(),
    });
  }

  console.log(`  ✅ ${count} rollup docs + ${allPostcodes.length} adjacency docs created`);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});