#!/usr/bin/env node
/**
 * Cleanup script: removes only seed data (docs tagged `mock: true`) created by
 * bin/data/seed.js. It NEVER touches real user-created data.
 *
 * Usage:
 *   node bin/data/clean.js            # clean the configured (emulator) target
 *   node bin/data/clean.js --force    # allow cleaning a non-allowlisted project
 *
 * Safety:
 *   - Only deletes documents where `mock == true`.
 *   - Refuses to run against a projectId not in config.cleanup.allowedProjectIds
 *     unless `--force` is passed (emulator runs are always allowed).
 *
 * Prerequisites:
 *   - .env file with Firebase config (run: cp .env.local .env)
 *   - Firebase emulators running if config.emulator.useEmulator is true
 */

require('dotenv').config();
const { initializeApp } = require('firebase/app');
const {
  getFirestore, collection, query, where, getDocs, deleteDoc,
  connectFirestoreEmulator,
} = require('firebase/firestore');
const config = require('./config');

const FORCE = process.argv.includes('--force');

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

if (config.emulator.useEmulator) {
  connectFirestoreEmulator(db, config.emulator.host, config.emulator.firestorePort);
  console.log(`🔌 Connected to Firestore emulator at ${config.emulator.host}:${config.emulator.firestorePort}`);
}

function assertSafeTarget() {
  // Emulator is always safe.
  if (config.emulator.useEmulator) return;

  const projectId = firebaseConfig.projectId;
  const allowed = config.cleanup.allowedProjectIds.includes(projectId);
  if (!allowed && !FORCE) {
    console.error(
      `\n❌ Refusing to clean project "${projectId}" — it is not in the allowlist ` +
      `(${config.cleanup.allowedProjectIds.join(', ') || 'none'}).\n` +
      `   If you are absolutely sure, re-run with --force.\n`
    );
    process.exit(1);
  }
  if (!allowed && FORCE) {
    console.warn(`⚠️  --force set: cleaning non-allowlisted project "${projectId}".`);
  }
}

async function deleteMockDocs(collectionName) {
  // Only delete docs tagged as seed data.
  const q = query(collection(db, collectionName), where('mock', '==', true));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    console.log(`  • ${collectionName}: nothing to delete`);
    return 0;
  }

  let count = 0;
  for (const docSnap of snapshot.docs) {
    // chatRooms have a messages subcollection — delete those first.
    if (collectionName === 'chatRooms') {
      const msgs = await getDocs(collection(db, 'chatRooms', docSnap.id, 'messages'));
      for (const m of msgs.docs) {
        await deleteDoc(m.ref);
      }
    }
    await deleteDoc(docSnap.ref);
    count++;
  }
  console.log(`  ✅ ${collectionName}: deleted ${count} seed docs`);
  return count;
}

async function clean() {
  assertSafeTarget();

  console.log('\n🧹 Cleaning seed data (mock == true only)...\n');
  let total = 0;
  for (const name of config.cleanup.collections) {
    try {
      total += await deleteMockDocs(name);
    } catch (err) {
      console.error(`  ❌ Error cleaning ${name}:`, err.message);
    }
  }

  console.log(`\n🎉 Cleanup complete. Removed ${total} seed documents.`);
  console.log('   (Real user data was not touched.)');
  process.exit(0);
}

clean().catch((err) => {
  console.error('❌ Cleanup failed:', err);
  process.exit(1);
});
