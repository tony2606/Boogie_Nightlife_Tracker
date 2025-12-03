import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';

// 1. --- FIRESTORE IMPORTS & CONSTANTS ---
import { db } from '../config/firebaseConfig'; 
import { doc, runTransaction, increment, collection, getDocs } from 'firebase/firestore';
import { VENUES_COLLECTION_PATH } from '../config/constants'; // Use centralized path constant
// ---------------------------------

// We will use a state variable to store the live venue data fetched from Firestore
let liveGeofenceData = []; 

// The minimum distance (in meters) the user must move before a new check is triggered
const LOCATION_UPDATE_INTERVAL = 100; 

// Global state to track the ID of the venue the user was last inside
let lastVenueId = null;

// Function to fetch the geofence data (ID, coordinates, radius) from Firestore
const fetchGeofenceData = async () => {
    try {
        const q = collection(db, VENUES_COLLECTION_PATH);
        const snapshot = await getDocs(q);
        
        liveGeofenceData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                latitude: data.latitude,
                longitude: data.longitude,
                geofenceRadius: data.geofenceRadius || 50, // Default radius if not defined
            };
        });
        console.log(`Fetched ${liveGeofenceData.length} venues for geofencing.`);
    } catch (error) {
        console.error("Error fetching geofence data:", error);
    }
}


// --- CRITICALLY UPDATED: Firestore Transaction Function with correct path and Vibe Status update ---
const updateLiveCountInDB = async (venueId, venueName, incrementValue) => {
    // 1. Use the centralized constant for the venue reference path
    const venueRef = doc(db, VENUES_COLLECTION_PATH, venueId);

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
                live_count: increment(incrementValue) 
            });

            // 🚀 VIBE CALCULATION (Thresholds from the proposal)
            let vibeStatus;
            let vibeScore; // Assuming score from 1-5 for better sorting/filtering
            
            if (newCountSimulated > 20) {
                vibeStatus = 'Busy';
                vibeScore = 4.0;
            } else if (newCountSimulated >= 10) {
                vibeStatus = 'Normal';
                vibeScore = 3.0;
            } else {
                vibeStatus = 'Quiet';
                vibeScore = 2.0;
            }

            // 🌟 CRITICAL FIX: Update the 'vibe_status' and 'vibe' score field in the DB
            transaction.update(venueRef, { 
                vibe_status: vibeStatus,
                vibe: vibeScore // Store the score for use in VenueCard/VenueList sorting
            });

            console.log(`[FIRESTORE SUCCESS] ${venueName} count updated. New count: ${newCountSimulated}. Vibe: ${vibeStatus}`);
            
        });
    } catch (e) {
        console.error("Firestore Transaction Failed: ", e);
    }
};
// ------------------------------------------------------------


// Standard Haversine distance utility function (no change needed)
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Distance in meters
};

const GeofenceTracker = () => {
    const [locationStatus, setLocationStatus] = useState('Checking Permissions...');
    
    useEffect(() => {
        const startTracking = async () => {
            // Fetch the latest geofence data from Firestore on startup
            await fetchGeofenceData(); 

            // 1. Request Foreground AND Background Location Permissions
            let { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
            let { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

            if (foregroundStatus !== 'granted' || backgroundStatus !== 'granted') {
                setLocationStatus('Location permission denied. Both Foreground and Background are required.');
                Alert.alert(
                    "Permission Required", 
                    "Boogie needs 'Always Allow' location access to automatically track Vibe status in the background."
                );
                return;
            }
            
            setLocationStatus('All permissions granted. Starting continuous monitoring...');

            // 2. Start Continuous Location Monitoring (Foreground/Active)
            const subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Balanced,
                    distanceInterval: LOCATION_UPDATE_INTERVAL, 
                },
                (location) => {
                    const userLat = location.coords.latitude;
                    const userLon = location.coords.longitude;
                    
                    let currentVenue = null; 

                    // Loop through the live-fetched venue data for geofence check
                    liveGeofenceData.forEach(venue => {
                        if (!venue.id) {
                            console.error(`Venue ${venue.name} is missing its Firestore ID!`);
                            return; 
                        }
                        
                        const distance = getDistance(userLat, userLon, venue.latitude, venue.longitude);

                        if (distance < venue.geofenceRadius) {
                            currentVenue = venue; // Store the venue object
                        }
                    });
                    
                    // 3. Handle Geofence Transitions (ENTER and EXIT)
                    if (currentVenue && currentVenue.id !== lastVenueId) {
                        // User ENTERED a venue
                        setLocationStatus(`Vibe Check: ENTERED ${currentVenue.name}! Auto-reporting Vibe!`);
                        updateLiveCountInDB(currentVenue.id, currentVenue.name, 1); 
                        lastVenueId = currentVenue.id; // Store the ID for exit check

                    } else if (!currentVenue && lastVenueId) {
                        // User EXITING the previously tracked venue
                        setLocationStatus(`Vibe Check: EXITED. Stop reporting Vibe.`); 
                        // Note: The venue name is not available easily here, so we use a placeholder for logging
                        updateLiveCountInDB(lastVenueId, "Exited Venue", -1); 
                        lastVenueId = null; 
                    }
                    
                    if (!currentVenue && !lastVenueId) {
                        setLocationStatus('All permissions granted. Monitoring...');
                    }
                }
            );

            // 4. Cleanup function
            return () => {
                subscription.remove();
            };
        };

        startTracking();
    }, []); 

    return (
        <View style={styles.container}>
            <Text style={styles.statusText}>
                ⚠️ **Geofence Tracker Status:** {locationStatus}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
        backgroundColor: '#FFE5E5', 
        borderBottomWidth: 1,
        borderBottomColor: '#FF6347',
    },
    statusText: {
        fontSize: 12,
        color: '#FF6347',
        textAlign: 'center',
    }
});

export default GeofenceTracker;