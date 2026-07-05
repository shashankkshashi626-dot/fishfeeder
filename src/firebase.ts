import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration from environment
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if actual configuration exists
const isRealFirebase = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY" &&
  firebaseConfig.apiKey.length > 5;

let app;
let auth: any;
let db: any;

if (isRealFirebase) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("[Firebase] Successfully initialized real production Firebase.");
  } catch (error) {
    console.error("[Firebase] Error initializing Firebase, using mock fallback:", error);
    setupMockFirebase();
  }
} else {
  console.log("[Firebase] VITE_FIREBASE_API_KEY is not set. Using local Mock Firebase.");
  setupMockFirebase();
}

function setupMockFirebase() {
  // Simple mock instances using localStorage
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback: (user: any) => void) => {
      // Load user session from localStorage
      const session = localStorage.getItem("mock_user_session");
      const user = session ? JSON.parse(session) : null;
      auth.currentUser = user;
      
      // Async trigger to simulate network call
      setTimeout(() => callback(user), 300);
      
      // Return unsubscribe handler
      return () => {};
    }
  };

  db = {
    // Firestore-like interfaces
    collection: (path: string) => {
      return {
        doc: (docId: string) => {
          return {
            get: async () => {
              const data = localStorage.getItem(`mock_db_${path}_${docId}`);
              return {
                exists: () => !!data,
                data: () => data ? JSON.parse(data) : null,
              };
            },
            set: async (value: any, options?: any) => {
              let finalVal = value;
              if (options?.merge) {
                const existing = localStorage.getItem(`mock_db_${path}_${docId}`);
                if (existing) {
                  finalVal = { ...JSON.parse(existing), ...value };
                }
              }
              localStorage.setItem(`mock_db_${path}_${docId}`, JSON.stringify(finalVal));
              return {};
            },
            update: async (value: any) => {
              const existing = localStorage.getItem(`mock_db_${path}_${docId}`);
              const finalVal = existing ? { ...JSON.parse(existing), ...value } : value;
              localStorage.setItem(`mock_db_${path}_${docId}`, JSON.stringify(finalVal));
              return {};
            },
            delete: async () => {
              localStorage.removeItem(`mock_db_${path}_${docId}`);
              return {};
            }
          };
        }
      };
    }
  };
}

export { auth, db, isRealFirebase };
