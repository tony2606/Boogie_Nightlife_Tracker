import { db } from '../config/firebaseConfig';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { getUserCollectionPath, COLLECTION_NAMES } from '../config/constants'; // Import constants

/**
 * Gets the reference path for a specific follow document.
 * Follows are stored privately under the user's path.
 * Path: /artifacts/{appId}/users/{userId}/following/{venueId}
 * @param {string} userId - The ID of the user.
 * @param {string} venueId - The ID of the venue (used as document ID).
 * @returns {object} Firestore Document Reference
 */
const getFollowDocRef = (userId, venueId) => {
    // Use the constants to generate the path
    const collectionPath = getUserCollectionPath(userId, COLLECTION_NAMES.FOLLOWING);
    return doc(db, collectionPath, venueId);
};

/**
 * Checks if a user is currently following a specific venue.
 * @param {string} userId - The ID of the user.
 * @param {string} venueId - The ID of the venue.
 * @returns {Promise<boolean>} True if the user is following the venue, false otherwise.
 */
export const isFollowing = async (userId, venueId) => {
    if (!userId || !venueId) return false;
    try {
        const followDocRef = getFollowDocRef(userId, venueId);
        const docSnap = await getDoc(followDocRef);
        return docSnap.exists();
    } catch (error) {
        console.error("Error checking follow status:", error);
        return false;
    }
};

/**
 * Toggles the follow status for a venue.
 * @param {string} userId - The ID of the user.
 * @param {string} venueId - The ID of the venue.
 * @param {boolean} currentlyFollowing - The current follow state.
 * @returns {Promise<boolean>} True if the toggle operation was successful.
 */
export const toggleFollow = async (userId, venueId, currentlyFollowing) => {
    if (!userId || !venueId) return false;
    try {
        const followDocRef = getFollowDocRef(userId, venueId);

        if (currentlyFollowing) {
            // Unfollow: Delete the document
            await deleteDoc(followDocRef);
        } else {
            // Follow: Create a new document. We store the venueId as the doc ID for easy lookup.
            await setDoc(followDocRef, {
                venueId: venueId,
                followedAt: serverTimestamp(),
            });
        }
        return true;
    } catch (error) {
        console.error("Error toggling follow status:", error);
        return false;
    }
};