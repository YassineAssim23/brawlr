// webapp/frontend/lib/firebaseClient.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore'; 

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Debug: Check if environment variables are loaded
console.log('Firebase Config Check:', {
  apiKey: firebaseConfig.apiKey ? '✓ Loaded' : '✗ Missing',
  authDomain: firebaseConfig.authDomain ? '✓ Loaded' : '✗ Missing',
  projectId: firebaseConfig.projectId ? '✓ Loaded' : '✗ Missing',
  storageBucket: firebaseConfig.storageBucket ? '✓ Loaded' : '✗ Missing',
  messagingSenderId: firebaseConfig.messagingSenderId ? '✓ Loaded' : '✗ Missing',
  appId: firebaseConfig.appId ? '✓ Loaded' : '✗ Missing'
});

// Validate that all required config values are present
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Firebase configuration is incomplete. Check your .env file and restart the dev server.');
  throw new Error('Firebase configuration error: Missing required environment variables');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Fetches the top 10 scores from the Firestore leaderboard.
 */
export async function getLeaderboardData() {
  const q = query(
    collection(db, "leaderboard"), 
    orderBy("score", "desc"), 
    orderBy("timestamp", "asc"), 
    limit(10) 
  );

  try {
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            username: data.username || 'Anonymous',
            score: data.score || 0,
            timestamp: data.timestamp ? data.timestamp.toDate().toLocaleString() : 'N/A'
        };
    });
  } catch (error) {
    console.error("Error fetching leaderboard: ", error);
    return [];
  }
}