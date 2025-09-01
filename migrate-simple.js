const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: "tradie-mate-f852a",
  // Add your service account key here or use environment variables
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "tradie-mate-f852a"
});

const db = admin.firestore();

async function migrateSearchKeywords() {
  try {
    console.log('Starting migration...');
    
    const snapshot = await db.collection('serviceRequests').get();
    let updated = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      if (data.searchKeywords) {
        console.log(`Skipping ${doc.id} - already has searchKeywords`);
        continue;
      }
      
      const tradeType = data.tradeType || '';
      const description = data.description || '';
      const postcode = data.postcode || '';
      
      const searchKeywords = [
        ...tradeType.toLowerCase().split(/[\s,]+/).filter(word => word.length > 0),
        ...description.toLowerCase().split(/\s+/).filter(word => word.length > 0),
        tradeType.toLowerCase(),
        description.toLowerCase(),
        postcode.toLowerCase()
      ].filter((word, index, arr) => arr.indexOf(word) === index && word.length > 0);
      
      await doc.ref.update({ searchKeywords });
      
      updated++;
      console.log(`Updated ${doc.id} with keywords:`, searchKeywords);
    }
    
    console.log(`Migration complete! Updated ${updated} documents.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateSearchKeywords();