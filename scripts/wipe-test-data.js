#!/usr/bin/env node
/**
 * One-off local script to wipe ALL test data from the live garage-revolutions
 * Firebase project: every Firestore collection this app writes to, every file
 * under Storage's `garages/` prefix, and (only if you opt in) every Firebase
 * Auth user.
 *
 * This is NOT run by Claude/CI. You run it yourself, locally, with your own
 * service account credentials — nobody else's code touches your live data.
 *
 * ─── One-time setup ──────────────────────────────────────────────────────
 * 1. Firebase Console → Project Settings → Service Accounts → your
 *    "garage-revolutions" project → "Generate new private key". Save the
 *    downloaded JSON file somewhere OUTSIDE this repo (never commit it).
 * 2. In this `scripts/` folder: `npm init -y && npm install firebase-admin`
 *    (this creates a scripts/node_modules + scripts/package.json that are
 *    intentionally separate from the app's own package.json).
 * 3. Run it:
 *      GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your-key.json" node wipe-test-data.js
 *    Add `WIPE_AUTH_USERS=true` in front of that command only if you also
 *    want every Firebase Auth user account deleted (see the warning below).
 *
 * ─── What this does NOT do ───────────────────────────────────────────────
 * It does not touch firestore.rules/storage.rules (that's the separate
 * GitHub Actions deploy job), and it does not touch GitHub Pages hosting.
 */

const admin = require('firebase-admin');

const PROJECT_ID = 'garage-revolutions';
const STORAGE_BUCKET = 'garage-revolutions.firebasestorage.app';

// Every top-level collection this app writes to, plus any known
// subcollections that live under a parent document (deleted by prefix via
// the recursive delete helper below, so nested docs are never orphaned).
const TOP_LEVEL_COLLECTIONS = [
    'users',
    'customers',
    'vehicles',
    'jobCards',       // + subcollection: statusHistory
    'parts',          // + subcollection: stockMovements
    'suppliers',
    'serviceCatalog',
    'invoices',       // + subcollection: payments
    'quotations',
    'activityLogs',
];

// garages/main and everything nested under it (staffInvites, counters, any
// future garage-scoped subcollection) — deleted as one recursive tree so the
// app's ensureGarageExists() cleanly recreates a blank garage on next login.
const GARAGE_DOC_PATH = 'garages/main';

async function main() {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.error('Set GOOGLE_APPLICATION_CREDENTIALS to the path of your service account JSON key first.');
        process.exit(1);
    }

    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: PROJECT_ID,
        storageBucket: STORAGE_BUCKET,
    });

    const db = admin.firestore();
    const bucket = admin.storage().bucket();

    console.log(`Wiping Firestore data for project "${PROJECT_ID}"...`);
    for (const collectionName of TOP_LEVEL_COLLECTIONS) {
        await deleteCollectionRecursively(db, db.collection(collectionName));
        console.log(`  ✓ ${collectionName}`);
    }

    console.log(`Wiping ${GARAGE_DOC_PATH} (and its subcollections)...`);
    await db.recursiveDelete(db.doc(GARAGE_DOC_PATH));
    console.log('  ✓ garages/main');

    console.log('Wiping uploaded branding files in Storage (garages/ prefix)...');
    await bucket.deleteFiles({ prefix: 'garages/' });
    console.log('  ✓ Storage files under garages/');

    if (process.env.WIPE_AUTH_USERS === 'true') {
        console.log('WIPE_AUTH_USERS=true — deleting every Firebase Auth user...');
        await deleteAllAuthUsers();
        console.log('  ✓ Firebase Auth users deleted. The very next registration becomes the new owner.');
    } else {
        console.log('Skipping Firebase Auth users (set WIPE_AUTH_USERS=true to also delete them).');
        console.log('Note: with Firestore wiped but Auth users kept, existing accounts will fail to log in');
        console.log('(their users/{uid} profile doc is gone) until you either delete them from the');
        console.log('Firebase Console → Authentication tab, or re-run with WIPE_AUTH_USERS=true.');
    }

    console.log('Done.');
}

async function deleteCollectionRecursively(db, collectionRef, batchSize = 200) {
    const snapshot = await collectionRef.limit(batchSize).get();
    if (snapshot.empty) return;

    for (const doc of snapshot.docs) {
        await db.recursiveDelete(doc.ref);
    }

    // Keep paging until the collection is empty.
    await deleteCollectionRecursively(db, collectionRef, batchSize);
}

async function deleteAllAuthUsers() {
    let pageToken = undefined;
    do {
        const result = await admin.auth().listUsers(1000, pageToken);
        const uids = result.users.map(u => u.uid);
        if (uids.length > 0) {
            await admin.auth().deleteUsers(uids);
        }
        pageToken = result.pageToken;
    } while (pageToken);
}

main().catch(err => {
    console.error('Wipe failed:', err);
    process.exit(1);
});
