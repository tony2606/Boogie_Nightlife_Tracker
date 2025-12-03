// config/constants.js

// This file centralizes global constants for the application, 
// particularly Firestore collection paths.

// The __app_id is automatically provided by the Canvas environment.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Base collection names
const COLLECTION_NAMES = {
    // Public Data Collections
    VENUES: 'venues',
    REVIEWS: 'reviews',
    VIBE_REPORTS: 'vibe_reports',
    EVENTS: 'events',
    // Private User Data Collections
    FOLLOWING: 'following', // Stored under /users/{userId}
};

// --- Firestore Path Templates ---

// Path to all public data for the current app
const PUBLIC_DATA_BASE_PATH = `/artifacts/${appId}/public/data`;

// Path to all private user data for the current app
// Usage: `USER_DATA_BASE_PATH.replace('{userId}', userId)`
const USER_DATA_BASE_PATH = `/artifacts/${appId}/users/{userId}`;


// --- Full Public Collection Paths ---

// Note: These paths are used directly by the GeofenceTracker and various services
export const VENUES_COLLECTION_PATH = `${PUBLIC_DATA_BASE_PATH}/${COLLECTION_NAMES.VENUES}`;
export const REVIEWS_COLLECTION_PATH = `${PUBLIC_DATA_BASE_PATH}/${COLLECTION_NAMES.REVIEWS}`;
export const VIBE_REPORTS_COLLECTION_PATH = `${PUBLIC_DATA_BASE_PATH}/${COLLECTION_NAMES.VIBE_REPORTS}`;
export const EVENTS_COLLECTION_PATH = `${PUBLIC_DATA_BASE_PATH}/${COLLECTION_NAMES.EVENTS}`;


// --- Full Private Collection Path Generator ---

/**
 * Generates the specific collection path for a user's private data.
 * @param {string} userId - The current user's UID.
 * @param {string} collectionName - The collection name (e.g., 'following').
 * @returns {string} The full Firestore path.
 */
export const getUserCollectionPath = (userId, collectionName) => {
    if (!userId) {
        console.error("getUserCollectionPath called without userId.");
        // Fallback to a path that should fail safely if security rules are set correctly
        return `/invalid/path/${collectionName}`;
    }
    const userBasePath = USER_DATA_BASE_PATH.replace('{userId}', userId);
    return `${userBasePath}/${collectionName}`;
};

export default COLLECTION_NAMES;