// config/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    setPersistence, 
    browserLocalPersistence 
} from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';

// Set logging to debug for development/testing
setLogLevel('debug'); 

// 🛑 MANDATORY: Use the global variables provided by the environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
// Get the custom auth token provided by the environment
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null; 

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Services
const auth = getAuth(app);
const db = getFirestore(app);

// Use browserLocalPersistence to keep the session alive
setPersistence(auth, browserLocalPersistence);

/**
 * Initializes the Firebase Authentication state.
 * This function must be called on application startup (e.g., in App.js) to ensure the user
 * is authenticated before any Firestore operations begin.
 */
export const initializeAuth = async () => {
    try {
        if (initialAuthToken) {
            console.log("Authenticating with Custom Token...");
            // Use custom token if available
            await signInWithCustomToken(auth, initialAuthToken);
            console.log("Authentication successful with custom token.");
        } else {
            console.log("No custom token found. Signing in anonymously...");
            // Fallback to anonymous sign-in
            await signInAnonymously(auth);
            console.log("Anonymous sign-in successful.");
        }
    } catch (error) {
        console.error("Firebase authentication failed:", error);
    }
};

// Export services and the appId
export { db, auth, appId };