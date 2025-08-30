// Migration script to add searchKeywords to existing service requests
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

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

async function migrateSearchKeywords() {
  try {
    console.log('Starting migration...');
    
    const querySnapshot = await getDocs(collection(db, 'serviceRequests'));
    let updated = 0;
    
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      
      // Skip if already has searchKeywords
      if (data.searchKeywords) {
        console.log(`Skipping ${docSnapshot.id} - already has searchKeywords`);
        continue;
      }
      
      const tradeType = data.tradeType || '';
      const description = data.description || '';
      const postcode = data.postcode || '';
      
      // Create searchKeywords array
      const searchKeywords = [
        ...tradeType.toLowerCase().split(/[\s,]+/).filter(word => word.length > 2),
        ...description.toLowerCase().split(/\s+/).filter(word => word.length > 2),
        postcode.toLowerCase()
      ].filter((word, index, arr) => arr.indexOf(word) === index && word.length > 0);
      
      // Update document
      await updateDoc(doc(db, 'serviceRequests', docSnapshot.id), {
        searchKeywords
      });
      
      updated++;
      console.log(`Updated ${docSnapshot.id} with ${searchKeywords.length} keywords:`, searchKeywords);
    }
    
    console.log(`Migration complete! Updated ${updated} documents.`);
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateSearchKeywords();