import { initializeApp } from 'firebase/app';
import { 
    getFirestore, 
    collection, 
    query, 
    getDocs, 
    doc, 
    updateDoc, 
    increment,
    setLogLevel
} from 'firebase/firestore';
// IMPORTANT: Assuming these constants are defined in your project
import { getPublicCollectionPath, COLLECTION_NAMES } from '../config/constants'; 

// --- Firebase Initialization ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

let db;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    setLogLevel('error'); 
} catch (error) {
    console.error("Firebase initialization failed:", error);
}

/**
 * Fetches all approved venues from the public 'venues' collection.
 * Ensures data includes vibe_status and live_count fields.
 * @returns {Promise<{success: boolean, venues: Array, error: string?}>}
 */
export const fetchVenues = async () => {
    if (!db) {
        return { success: false, venues: [], error: 'Database not initialized.' };
    }
    try {
        // Use the public path for approved venue data
        const collectionPath = getPublicCollectionPath(COLLECTION_NAMES.VENUES);
        const q = query(collection(db, collectionPath));
        
        const querySnapshot = await getDocs(q);
        const venues = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Default new fields if they are missing from the database
            vibe_status: doc.data().vibe_status || 'Unknown', 
            live_count: doc.data().live_count || 0,
        }));

        return { success: true, venues: venues };
    } catch (e) {
        console.error("Error fetching venues: ", e);
        return { success: false, venues: [], error: e.message };
    }
};

/**
 * Updates a venue's vibe status and increments the live report count.
 * This is called when a user submits a 'Vibe Report'.
 * @param {string} venueId - The ID of the venue to update.
 * @param {string} newVibeStatus - The reported status ('Quiet', 'Normal', 'Busy').
 * @returns {Promise<boolean>} True if update was successful.
 */
export const updateVibeReport = async (venueId, newVibeStatus) => {
    if (!db || !venueId || !newVibeStatus) return false;

    try {
        const collectionPath = getPublicCollectionPath(COLLECTION_NAMES.VENUES);
        const venueDocRef = doc(db, collectionPath, venueId);

        await updateDoc(venueDocRef, {
            vibe_status: newVibeStatus,
            // Atomically increment the report count
            live_count: increment(1),
            lastVibeReportedAt: new Date(), 
        });

        console.log(`Vibe Report submitted for venue ${venueId}. Status: ${newVibeStatus}`);
        return true;
    } catch (e) {
        console.error("Error submitting vibe report: ", e);
        return false;
    }
};