import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

export const firebaseConfig = {
    apiKey: "AIzaSyDpxfRZAuwASYlV5CQcVr7W2Snrl6umLPs",
    authDomain: "garage-revolutions.firebaseapp.com",
    projectId: "garage-revolutions",
    storageBucket: "garage-revolutions.firebasestorage.app",
    messagingSenderId: "840141881950",
    appId: "1:840141881950:web:854e1209124e7544e42acf"
};

export const isFirebaseConfigured =
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID" &&
    firebaseConfig.apiKey !== "YOUR_API_KEY";

let firestoreDb: Firestore | null = null;
let firebaseAuth: Auth | null = null;

if (isFirebaseConfigured) {
    try {
        const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        firestoreDb = getFirestore(firebaseApp);
        firebaseAuth = getAuth(firebaseApp);
    } catch (error) {
        console.error("Failed to initialize Firebase:", error);
    }
}

export { firestoreDb as db, firebaseAuth as auth };
