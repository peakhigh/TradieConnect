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

const CUSTOMER_ID = "L4uj8MTCfhWhoMpWWwj8y6LzcZs2";

async function updateCustomerIds() {
  console.log('Updating all service requests to use customer ID:', CUSTOMER_ID);
  
  const snapshot = await getDocs(collection(db, 'serviceRequests'));
  
  for (const docSnapshot of snapshot.docs) {
    await updateDoc(doc(db, 'serviceRequests', docSnapshot.id), {
      customerId: CUSTOMER_ID
    });
    console.log(`Updated request ${docSnapshot.id}`);
  }
  
  console.log(`✅ Updated ${snapshot.docs.length} service requests`);
}

updateCustomerIds();