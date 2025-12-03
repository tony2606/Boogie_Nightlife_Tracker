// data/venues.js
// This data simulates what will be stored in your Firestore 'venues' collection.

const firestoreVenueSeeds = [
  {
    id: 'KszYnZDgXFs1RRJbUvsf',
    name: 'Pabloz',
    location: 'Borrowdale',
    category: 'Nightclub',
    vibe: 4.5, // Current Vibe Score
    description: 'The premier spot for a high-energy, late-night experience.',
    hours: 'Open 10:00 PM - 4:00 AM',
    
    // ⬅️ NEW: Required for automatic Vibe tracking (Geofencing)
    latitude: -17.7667,  // Placeholder coordinate (e.g., Harare lat/long)
    longitude: 31.0258, // Placeholder coordinate
    geofenceRadius: 150, // Radius in meters for detection
    live_count: 5, // The simulated number of active users currently at the venue
  },
  {
    id: 'XgkCT9onA2xL8a6qG9MA',
    name: 'The Smoke House',
    location: 'Sam Levy’s Village',
    category: 'Restaurant & Bar',
    vibe: 3.8,
    description: 'Great food and a sophisticated bar scene, perfect for a chill evening.',
    hours: 'Open 11:00 AM - 1:00 AM',
    
    // ⬅️ NEW: Required for Geofencing
    latitude: -17.7690,
    longitude: 31.0220,
    geofenceRadius: 100,
    live_count: 2,
  },
  {
    id: 'tF8iMd0QhaHOFGToSrjC',
    name: 'The Usual Place',
    location: 'Chisipite',
    category: 'Sports Bar',
    vibe: 4.2,
    description: 'The go-to spot for watching the big game and enjoying a cold drink with friends.',
    hours: 'Open 4:00 PM - 2:00 AM',
    
    // ⬅️ NEW: Required for Geofencing
    latitude: -17.7705,
    longitude: 31.0235,
    geofenceRadius: 120,
    live_count: 7,
  },
  {
    id: 'wW1QLOIKgn7JJNulLFWU',
    name: 'Tin Roof',
    location: 'Arcturus Road',
    category: 'Club & Live Music',
    vibe: 3.5,
    description: 'Known for its live music events and unpretentious, friendly atmosphere.',
    hours: 'Open 8:00 PM - 3:00 AM',
    
    // ⬅️ NEW: Required for Geofencing
    latitude: -17.7720,
    longitude: 31.0250,
    geofenceRadius: 150,
    live_count: 3,
  },
];

export default firestoreVenueSeeds; // Export the array with the new name