import { db } from '../config/firebaseConfig';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    serverTimestamp,
    runTransaction,
    getDoc,
} from 'firebase/firestore';
import { 
    REVIEWS_COLLECTION_PATH, 
    VENUES_COLLECTION_PATH 
} from '../config/constants';

// --- Helper Functions ---

/**
 * Recalculates the average rating and count for a venue based on all its reviews 
 * and updates the venue document within a Firestore transaction.
 * @param {string} venueId - The ID of the venue to update.
 */
const calculateAndUpdateVenueRating = async (venueId) => {
    try {
        // Run the recalculation in a transaction to ensure atomicity
        await runTransaction(db, async (transaction) => {
            const reviewsQuery = query(collection(db, REVIEWS_COLLECTION_PATH), where('venueId', '==', venueId));
            const reviewsSnapshot = await transaction.get(reviewsQuery);

            let totalRating = 0;
            let reviewCount = 0;

            reviewsSnapshot.forEach((doc) => {
                const data = doc.data();
                // Only count reviews that are NOT flagged for moderation
                if (!data.isFlagged) { 
                    totalRating += data.rating;
                    reviewCount++;
                }
            });

            const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;
            
            // Reference to the venue document
            const venueDocRef = doc(db, VENUES_COLLECTION_PATH, venueId);
            
            // Update the venue document with the new aggregate data
            transaction.update(venueDocRef, {
                averageRating: averageRating,
                reviewCount: reviewCount,
            });
        });
        
        console.log(`Rating updated for venue ${venueId}. Avg: ${venueId}`);
        return true;

    } catch (e) {
        console.error("Transaction failed during rating update: ", e);
        return false;
    }
};

// --- Core Service Functions ---

/**
 * Fetches all reviews for a specific venue.
 * @param {string} venueId - The ID of the venue.
 * @returns {Promise<object>} An object containing success status and the reviews array or error.
 */
export const fetchReviews = async (venueId) => {
    try {
        const q = query(collection(db, REVIEWS_COLLECTION_PATH), where('venueId', '==', venueId));
        const querySnapshot = await getDocs(q);

        const reviews = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Convert Firestore Timestamp to Date object for consistent use in React components
            const submittedAt = data.submittedAt ? data.submittedAt.toDate() : new Date();

            return {
                id: doc.id,
                ...data,
                submittedAt: submittedAt, 
            };
        });

        return { success: true, reviews };
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Submits a new review or updates an existing one.
 * @param {object} reviewData - Contains venueId, rating, comment, reviewerId, reviewerName, and optional reviewId (for editing).
 * @returns {Promise<boolean>} True if successful.
 */
export const submitReview = async ({ venueId, rating, comment, reviewerId, reviewerName, reviewId, venueName }) => {
    if (!venueId || !reviewerId || !rating) {
        console.error("Missing required review data.");
        return false;
    }

    try {
        const reviewRef = reviewId 
            ? doc(db, REVIEWS_COLLECTION_PATH, reviewId)
            : collection(db, REVIEWS_COLLECTION_PATH);

        const data = {
            venueId,
            venueName,
            rating,
            comment,
            reviewerId,
            reviewerName,
            isFlagged: false, // Ensures new/edited reviews start unflagged
            submittedAt: serverTimestamp(),
        };

        if (reviewId) {
            // Update existing review
            await updateDoc(reviewRef, data);
        } else {
            // Add new review
            await addDoc(reviewRef, data);
        }

        // IMPORTANT: Recalculate and update the venue's average rating after submission/edit
        await calculateAndUpdateVenueRating(venueId);
        
        return true;
    } catch (error) {
        console.error("Error submitting review:", error);
        return false;
    }
};

/**
 * Deletes a review and updates the venue's average rating.
 * @param {string} reviewId - The ID of the review document to delete.
 * @param {string} venueId - The ID of the venue associated with the review.
 * @returns {Promise<boolean>} True if successful.
 */
export const deleteReview = async (reviewId, venueId) => {
    if (!reviewId || !venueId) {
        console.error("Missing IDs for review deletion.");
        return false;
    }
    
    try {
        const reviewDocRef = doc(db, REVIEWS_COLLECTION_PATH, reviewId);
        await deleteDoc(reviewDocRef);
        
        // IMPORTANT: Recalculate and update the venue's average rating after deletion
        await calculateAndUpdateVenueRating(venueId);

        return true;
    } catch (error) {
        console.error("Error deleting review:", error);
        return false;
    }
};

/**
 * Flags a review for moderation.
 * @param {string} reviewId - The ID of the review.
 * @param {string} flaggerId - The UID of the user flagging the review.
 * @returns {Promise<boolean>} True if successful.
 */
export const flagReview = async (reviewId, flaggerId) => {
    try {
        const reviewDocRef = doc(db, REVIEWS_COLLECTION_PATH, reviewId);
        await updateDoc(reviewDocRef, {
            isFlagged: true,
            flaggedByUserId: flaggerId,
            flaggedAt: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error("Error flagging review:", error);
        return false;
    }
};