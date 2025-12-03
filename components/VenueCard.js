import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native'; 
import { Ionicons } from '@expo/vector-icons'; 

// Import the follow service methods
import { 
    isUserFollowingVenue, 
    toggleFollow, 
    getAuthUserId 
} from '../services/followService'; 

// Helper function to map the numeric vibe score to a visual status and color
const getVibeStatus = (vibe) => {
    if (vibe >= 4.0) {
        return { status: 'Busy', color: '#D9534F', icon: 'flame' }; 
    } else if (vibe >= 3.0) {
        return { status: 'Normal', color: '#F0AD4E', icon: 'flash' }; 
    } else {
        return { status: 'Quiet', color: '#5CB85C', icon: 'moon' }; 
    }
};

const VenueCard = ({ venue }) => {
    const navigation = useNavigation(); 
    const vibeInfo = getVibeStatus(venue.vibe);
    
    // Updated State: Manage the favorite status retrieved from Firestore
    const [isFavorite, setIsFavorite] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Effect to check the initial follow status when the component mounts
    useEffect(() => {
        const checkFollowStatus = async () => {
            const userId = getAuthUserId();
            // Only proceed if we have a venue ID and a logged-in user ID
            if (venue.id && userId) {
                const status = await isUserFollowingVenue(userId, venue.id);
                setIsFavorite(status);
            }
            setIsLoading(false);
        };
        checkFollowStatus();
    }, [venue.id]);


    // Function to handle toggling the favorite status and updating Firestore
    const handleFavoriteToggle = async () => {
        const userId = getAuthUserId();
        if (!userId) {
            console.log("User not authenticated to follow venues.");
            // Optionally show a modal/alert that user must log in
            return;
        }

        // Optimistically update the UI
        const newStatus = !isFavorite;
        setIsFavorite(newStatus);
        
        try {
            // Call the service function to update Firestore
            await toggleFollow(userId, venue.id, newStatus);
        } catch (error) {
            console.error("Failed to toggle follow status:", error);
            // Revert the UI update if the Firestore write fails
            setIsFavorite(!newStatus);
        }
    };


    // Function to handle the main button press (Report Vibe)
    const handleReportPress = () => {
        navigation.navigate('ReportVibe', { venue: venue });
    };
    
    // Function to handle the name/header press (View Details)
    const handleDetailsPress = () => {
        navigation.navigate('Details', { venue: venue });
    }

    // Show a loading indicator while the initial follow status is being checked
    if (isLoading) {
        return (
            <View style={[styles.card, styles.loadingCard]}>
                <Text style={styles.loadingText}>Loading Vibe...</Text>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}> 
                <TouchableOpacity onPress={handleDetailsPress} style={styles.headerTitleContainer}>
                    <Text style={styles.name}>{venue.name}</Text>
                </TouchableOpacity>
                
                {/* Favorite Button (Now linked to followService) */}
                <TouchableOpacity 
                    onPress={handleFavoriteToggle}
                    style={styles.favoriteButton}
                    // Disable while loading, though the main card handles loading state
                    disabled={isLoading} 
                >
                    <Ionicons 
                        name={isFavorite ? 'star' : 'star-outline'} 
                        size={24} 
                        color={isFavorite ? '#FFC300' : '#888'} 
                    />
                </TouchableOpacity>
            </View>

            <Text style={styles.location}>{venue.location} • {venue.category}</Text>
            
            {/* Vibe Status Pill */}
            <View style={styles.vibePillContainer}>
                <View style={[styles.vibePill, { backgroundColor: vibeInfo.color }]}>
                    <Ionicons name={vibeInfo.icon} size={14} color="#fff" style={{ marginRight: 5 }} />
                    <Text style={styles.vibePillText}>{vibeInfo.status}</Text>
                </View>
            </View>

            {/* Primary Action Button (Report Vibe) */}
            <TouchableOpacity 
                style={styles.reportButton} 
                onPress={handleReportPress}
            >
                <Text style={styles.buttonText}>Report Vibe</Text>
            </TouchableOpacity>
            
            {/* Secondary Action Link (View Details) */}
            <TouchableOpacity 
                style={styles.viewDetailsLink} 
                onPress={handleDetailsPress} 
            >
                <Text style={styles.linkText}>View Full Details</Text>
            </TouchableOpacity>

        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 4,
    },
    loadingCard: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
    },
    loadingText: {
        color: '#666',
        fontStyle: 'italic',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
        paddingBottom: 5,
    },
    headerTitleContainer: {
        flex: 1, 
        paddingRight: 10,
    },
    favoriteButton: {
        padding: 5,
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    location: {
        fontSize: 14,
        color: '#555',
        marginBottom: 10,
    },
    vibePillContainer: {
        flexDirection: 'row',
        marginBottom: 10, 
    },
    vibePill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    vibePillText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    reportButton: {
        backgroundColor: '#34C759', 
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    viewDetailsLink: {
        marginTop: 10,
        alignItems: 'center',
    },
    linkText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    }
});

export default VenueCard;