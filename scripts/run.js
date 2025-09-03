require('dotenv').config();
const { populateFirestore } = require('./populateFirestore');

async function run() {
  console.log('🚀 Starting Firebase population...');
  
  if (!process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID) {
    console.error('❌ Firebase config not found. Please check your .env file.');
    return;
  }
  
  try {
    await populateFirestore();
    console.log('✅ Population completed successfully!');
  } catch (error) {
    console.error('❌ Population failed:', error);
  }
}

run();