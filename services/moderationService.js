import { db } from '../config/firebaseConfig';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    deleteDoc, 
    updateDoc, 
    getDoc 
} from 'firebase/firestore';
import { 
    REVIEWS_COLLECTION_PATH, 
    VIBE_REPORTS_COLLECTION_PATH, 
    VENUES_COLLECTION_PATH 
} from '../config/constants'; // Use constants

/**
 * Fetches all content (reviews and vibe reports) that have been flagged for moderation.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of flagged items.
 */
export const fetchFlaggedContent = async () => {
    const flaggedItems = [];

    // --- 1. Fetch Flagged Reviews ---
    try {
        const reviewsQuery = query(collection(db, REVIEWS_COLLECTION_PATH), where('isFlagged', '==', true));
        const reviewSnapshot = await getDocs(reviewsQuery);

        reviewSnapshot.forEach(doc => {
            const data = doc.data();
            flaggedItems.push({
                id: doc.id,
                type: 'Review',
                content: data.comment,
                venueId: data.venueId,
                venueName: data.venueName,
                reviewerName: data.reviewerName,
                submittedAt: data.submittedAt.toDate(),
                rating: data.rating,
                flaggedByUserId: data.flaggedByUserId,
            });
        });
    } catch (error) {
        console.error("Error fetching flagged reviews:", error);
    }

    // --- 2. Fetch Flagged Vibe Reports ---
    try {
        const reportsQuery = query(collection(db, VIBE_REPORTS_COLLECTION_PATH), where('isFlagged', '==', true));
        const reportSnapshot = await getDocs(reportsQuery);

        reportSnapshot.forEach(doc => {
            const data = doc.data();
            flaggedItems.push({
                id: doc.id,
                type: 'VibeReport',
                content: data.vibe, 
                venueId: data.venueId,
                venueName: data.venueName,
                reporterId: data.reporterId,
                submittedAt: data.submittedAt.toDate(),
            });
        });
    } catch (error) {
        console.error("Error fetching flagged vibe reports:", error);
    }

    flaggedItems.sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime());
    return flaggedItems;
};

/**
 * Approves and unflags content (for reviews).
 * @param {string} itemId - The ID of the review document.
 * @returns {Promise<boolean>} True if successful.
 */
export const approveContent = async (itemId) => {
    try {
        const docRef = doc(db, REVIEWS_COLLECTION_PATH, itemId);
        await updateDoc(docRef, {
            isFlagged: false,
            moderatedAt: new Date(),
        });
        return true;
    } catch (error) {
        console.error("Error approving content:", error);
        return false;
    }
};

/**
 * Deletes flagged content.
 * @param {string} itemId - The ID of the item document.
 * @param {string} itemType - 'Review' or 'VibeReport'.
 * @returns {Promise<boolean>} True if successful.
 */
export const deleteContent = async (itemId, itemType) => {
    try {
        const collectionPath = itemType === 'Review' ? REVIEWS_COLLECTION_PATH : VIBE_REPORTS_COLLECTION_PATH;
        const docRef = doc(db, collectionPath, itemId);
        await deleteDoc(docRef);
        
        // Note: For reviews, rating recalculation needs to happen separately.
        
        return true;
    } catch (error) {
        console.error(`Error deleting ${itemType}:`, error);
        return false;
    }
};

/**
 * Deletes a Vibe Report and potentially resets the venue's vibe status.
 * @param {string} reportId - The ID of the VibeReport document.
 * @param {string} venueId - The ID of the venue.
 * @returns {Promise<boolean>} True if successful.
 */
export const deleteVibeReport = async (reportId, venueId) => {
    try {
        // 1. Delete the report itself
        const reportDocRef = doc(db, VIBE_REPORTS_COLLECTION_PATH, reportId);
        await deleteDoc(reportDocRef);
        
        // 2. Reset venue status. 
        // Note: A more complex solution would query remaining reports. Resetting is simpler.
        const venueDocRef = doc(db, VENUES_COLLECTION_PATH, venueId);
        const venueSnap = await getDoc(venueDocRef);

        if (venueSnap.exists()) {
             await updateDoc(venueDocRef, {
                vibe_status: 'Normal', // Resetting to a default safe status
            });
        }
        
        return true;
    } catch (error) {
        console.error("Error deleting Vibe Report and resetting venue status:", error);
        return false;
    }
};