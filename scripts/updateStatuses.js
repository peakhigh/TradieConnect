require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

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

async function updateStatuses() {
  console.log('Updating service request statuses to "active"...');
  
  const snapshot = await getDocs(collection(db, 'serviceRequests'));
  
  for (const docSnapshot of snapshot.docs) {
    await updateDoc(doc(db, 'serviceRequests', docSnapshot.id), {
      status: 'active'
    });
    console.log(`Updated request ${docSnapshot.id} to active`);
  }
  
  console.log(`✅ Updated ${snapshot.docs.length} service requests to active status`);
}

updateStatuses();