import { db } from '../config/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

/**
 * Adds a new featured event to the 'featured_events' collection.
 * This simulates the backend logic for a paying premium venue.
 * * @param {object} eventData - Details of the event.
 */
export const addFeaturedEvent = async (eventData) => {
    try {
        const eventsCollectionRef = collection(db, 'featured_events');
        
        const newEvent = {
            ...eventData,
            timestamp: new Date().getTime(), // Record creation time
            isActive: true, // Used to toggle visibility (future feature)
        };
        
        const docRef = await addDoc(eventsCollectionRef, newEvent);
        
        console.log("Featured Event successfully added with ID: ", docRef.id);
        
        return docRef.id;
    } catch (e) {
        console.error("Error adding featured event: ", e);
        return null;
    }
};

// Example Event Structure for reference:
/*
{
    venueId: 'KszYnZDgXFs1RRJbUvsf',
    venueName: 'Pabloz',
    title: 'Harare Mega Rave ft. DJ Shaker',
    date: 'Friday, Nov 28',
    time: '22:00',
    description: 'The biggest party of the month with international headliners!',
    cost: 'ZWL $5',
    imageUrl: 'https://placehold.co/600x400',
}
*/