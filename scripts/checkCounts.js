require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function checkCounts() {
  try {
    console.log('📊 Checking collection counts...\n');
    
    // Check serviceRequests
    const requestsSnapshot = await getDocs(collection(db, 'serviceRequests'));
    console.log(`🔵 serviceRequests: ${requestsSnapshot.docs.length}`);
    
    // Check quotes
    const quotesSnapshot = await getDocs(collection(db, 'quotes'));
    console.log(`🟡 quotes: ${quotesSnapshot.docs.length}`);
    
    // Check requestIntelligence
    const intelligenceSnapshot = await getDocs(collection(db, 'requestIntelligence'));
    console.log(`🟢 requestIntelligence: ${intelligenceSnapshot.docs.length}`);
    
    console.log('\n✅ Count check completed!');
    
  } catch (error) {
    console.error('❌ Error checking counts:', error);
  }
}

checkCounts();