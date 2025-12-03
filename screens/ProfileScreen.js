import { db, auth } from '../config/firebaseConfig'; // ⬅️ IMPORT 'auth'
import { collection, addDoc } from 'firebase/firestore';

/**
 * Submits a new venue suggestion to the 'suggested_venues' collection.
 * This function handles initial data storage before admin approval.
 * @param {object} venueData - The user's input data ({name, location, category}).
 */
export const submitSuggestedVenue = async (venueData) => {
    // ⬅️ CRUCIAL: Get current authenticated user
    const user = auth.currentUser;
    if (!user) {
        console.error("Venue suggestion failed: User not authenticated.");
        return false;
    }

    try {
        const suggestionsCollectionRef = collection(db, 'suggested_venues');

        const submission = {
            ...venueData,
            status: 'Pending Review',
            submittedAt: new Date().getTime(),
            // ⬅️ Use real user credentials
            submittedByUserId: user.uid,
            submittedByUserName: user.displayName || user.email,
        };

        const docRef = await addDoc(suggestionsCollectionRef, submission);
        
        console.log("Venue suggestion successfully added with ID: ", docRef.id);
        
        return true; // Success
    } catch (e) {
        console.error("Error submitting suggested venue: ", e);
        return false; // Failure
    }
};