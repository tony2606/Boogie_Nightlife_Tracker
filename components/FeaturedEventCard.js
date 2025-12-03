// components/FeaturedEventCard.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Import the service function to fetch venue details from Firestore
import { getVenueDetails } from '../services/venueService'; 

const FeaturedEventCard = ({ event }) => {
    const navigation = useNavigation();
    
    // State to hold the venue details fetched from Firestore
    const [venue, setVenue] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Effect to fetch the specific venue data 
    useEffect(() => {
        const fetchVenue = async () => {
            if (event.venueId) {
                try {
                    const venueData = await getVenueDetails(event.venueId);
                    setVenue(venueData);
                } catch (error) {
                    console.error("Failed to fetch venue details for featured event:", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };

        fetchVenue();
    }, [event.venueId]); // Re-run if the event's venueId changes


    // Show loading or nothing if essential data is missing/loading
    if (isLoading) {
        return (
            <View style={[styles.card, styles.loadingCard]}>
                <Text style={styles.loadingText}>Loading Featured Event Details...</Text>
            </View>
        );
    }
    
    // Fallback if the venue isn't found
    if (!venue) return null;


    const handlePress = () => {
        // Navigate to the Details screen of the associated venue, passing the live venue data
        navigation.navigate('Details', { venue: venue });
    };

    return (
        <TouchableOpacity style={styles.card} onPress={handlePress}>
            <View style={styles.premiumTag}>
                <Text style={styles.premiumText}>✨ FEATURED EVENT</Text>
            </View>

            <Text style={styles.title}>{event.title}</Text>
            
            <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#666" />
                {/* Display live venue name and location */}
                <Text style={styles.venueName}>{venue.name} - {venue.location}</Text> 
            </View>

            <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.dateTime}>{event.date} @ {event.time}</Text>
            </View>
            
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginHorizontal: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#FFC300', // Highlight color for premium status
        shadowColor: '#FFC300',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
    loadingCard: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 100,
        marginHorizontal: 10,
        marginBottom: 15,
    },
    loadingText: {
        color: '#666',
        fontStyle: 'italic',
    },
    premiumTag: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFC300',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 5,
        marginBottom: 10,
    },
    premiumText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    venueName: {
        fontSize: 15,
        color: '#555',
        marginLeft: 5,
        fontWeight: '600',
    },
    dateTime: {
        fontSize: 15,
        color: '#555',
        marginLeft: 5,
    },
});

export default FeaturedEventCard;