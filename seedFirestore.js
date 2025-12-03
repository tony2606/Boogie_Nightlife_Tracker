// seedFirestore.js

// 1. Import your Firebase Configuration and the data
import { db } from './config/firebaseConfig.js';
import firestoreVenueSeeds from './data/venues.js';
import { collection, addDoc } from 'firebase/firestore';

// Note: If you encounter 'ESM' errors when running this script, 
// you may need to use 'require' syntax instead:
// const { db } = require('./config/firebaseConfig.js'); 
// const firestoreVenueSeeds = require('./data/venues.js').default;


const seedDatabase = async () => {
    console.log("Starting database seeding process...");

    // Get a reference to the 'venues' collection
    const venuesCollectionRef = collection(db, 'venues');
    let successfulUploads = 0;

    for (const venue of firestoreVenueSeeds) {
        try {
            // 2. Add each venue object as a new document
            const docRef = await addDoc(venuesCollectionRef, venue);
            console.log(`Successfully added ${venue.name} with ID: ${docRef.id}`);
            successfulUploads++;
        } catch (error) {
            console.error(`Error adding venue ${venue.name}: `, error);
        }
    }

    console.log(`Database seeding complete! Total venues uploaded: ${successfulUploads}`);
    process.exit(0); // Exit the script after completion
};

seedDatabase();