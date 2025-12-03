// services/vibeService.js
import { db, auth } from '../config/firebaseConfig';
import { 
    doc, 
    runTransaction, 
    increment 
} from 'firebase/firestore';
import { VIBE_REPORTS_COLLECTION_PATH, VENUES_COLLECTION_PATH } from '../config/constants';
import { getAuthUserId } from './followService'; // Reusing the user ID getter

// Map of user choices to the actual live count adjustment (delta)
const VIBE_ADJUSTMENTS = {
    'busy': 1,
    'normal': 0, // Manual reports for 'Normal' don't change the count, only the report metadata
    'quiet': -1,
};

// --- Helper to get the full public path for Vibe Reports ---
// Vibe reports are stored publicly so they can be aggregated easily.
const getVibeReportCollectionPath = () => {
    // VIBE_REPORTS_COLLECTION_PATH already includes the public path: 
    // /artifacts/{appId}/public/data/vibe_reports
    return VIBE_REPORTS_COLLECTION_PATH;
};


/**
 * Submits a manual vibe report and updates the venue's live count atomically.
 * @param {string} venueId The ID of the venue.
 * @param {string} venueName The name of the venue (for logging/metadata).
 * @param {string} vibeStatus The user-reported status ('busy', 'normal', or 'quiet').
 * @returns {Promise<void>}
 */
export const submitVibeReport = async (venueId, venueName, vibeStatus) => {
    const userId = getAuthUserId();
    if (!userId) {
        throw new Error("User must be authenticated to submit a vibe report.");
    }
    
    // Determine the live count adjustment
    const incrementValue = VIBE_ADJUSTMENTS[vibeStatus.toLowerCase()] || 0;
    
    // 1. References
    const venueRef = doc(db, VENUES_COLLECTION_PATH, venueId);
    
    // NOTE: For simplicity, we are *not* saving a document in the vibe_reports collection 
    // in this transaction, but are directly updating the venue's live_count. 
    // In a production app, we would save a report document for history.

    try {
        await runTransaction(db, async (transaction) => {
            // Read the current state of the document
            const venueDoc = await transaction.get(venueRef);

            if (!venueDoc.exists()) {
                console.warn(`Venue document with ID ${venueId} does not exist!`);
                return;
            }

            // Calculate the simulated new count 
            const currentCount = venueDoc.data().live_count || 0;
            // Ensure the new count never goes below zero
            const newCountSimulated = Math.max(0, currentCount + incrementValue); 
            
            // Apply the live_count increment/decrement securely
            transaction.update(venueRef, { 
                live_count: increment(incrementValue),
                // Optional: Update metadata about the last manual report
                last_reported_vibe: vibeStatus,
                last_reported_by_user: userId,
                last_reported_at: new Date().toISOString()
            });

            // 🚀 VIBE CALCULATION (Same logic as GeofenceTracker.js)
            let calculatedVibeStatus;
            let vibeScore; 
            
            if (newCountSimulated > 20) {
                calculatedVibeStatus = 'Busy';
                vibeScore = 4.0;
            } else if (newCountSimulated >= 10) {
                calculatedVibeStatus = 'Normal';
                vibeScore = 3.0;
            } else {
                calculatedVibeStatus = 'Quiet';
                vibeScore = 2.0;
            }

            // 🌟 CRITICAL: Update the 'vibe_status' and 'vibe' score field based on the transaction result
            transaction.update(venueRef, { 
                vibe_status: calculatedVibeStatus,
                vibe: vibeScore 
            });

            console.log(`[VIBE REPORT SUCCESS] ${venueName} report (${vibeStatus}). New count: ${newCountSimulated}. Vibe: ${calculatedVibeStatus}`);
            
        });
    } catch (e) {
        console.error("Firestore Transaction for Vibe Report Failed: ", e);
        throw new Error("Failed to submit vibe report. Please try again.");
    }
};