import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Replace these placeholders with your actual Firebase config keys
// to enable synchronization across multiple devices.
export const firebaseConfig = {
    apiKey: "AIzaSyDpxfRZAuwASYlV5CQcVr7W2Snrl6umLPs",
    authDomain: "garage-revolutions.firebaseapp.com",
    projectId: "garage-revolutions",
    storageBucket: "garage-revolutions.firebasestorage.app",
    messagingSenderId: "840141881950",
    appId: "1:840141881950:web:854e1209124e7544e42acf"
};

// Check if credentials are local defaults to fallback gracefully to localStorage if not setup
export const isFirebaseConfigured =
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID" &&
    firebaseConfig.apiKey !== "YOUR_API_KEY";

let firebaseApp = null;
let firestoreDb: Firestore | null = null;

if (isFirebaseConfigured) {
    try {
        firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        firestoreDb = getFirestore(firebaseApp);
    } catch (error) {
        console.error("Failed to initialize Firebase:", error);
        firebaseApp = null;
        firestoreDb = null;
    }
} else {
    console.log("Firebase is not configured. Falling back to browser LocalStorage mode.");
}

export { firebaseApp, firestoreDb as db };
