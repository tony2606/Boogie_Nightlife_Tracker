import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fetchReviews, deleteReview } from '../services/reviewService'; // Import deleteReview
import { auth } from '../config/firebaseConfig'; // Import auth to get current user

const DetailsScreen = ({ navigation }) => {
    const route = useRoute();
    const { venue } = route.params;
    const isFocused = useIsFocused();
    
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentUserUid, setCurrentUserUid] = useState(null);

    useEffect(() => {
        // Set the current user UID when the component mounts or auth changes
        const user = auth.currentUser;
        if (user) {
            setCurrentUserUid(user.uid);
        } else {
            setCurrentUserUid(null);
        }
    }, [isFocused]); // Re-run on focus in case user logs out/in

    const loadReviews = async () => {
        setIsLoading(true);
        const result = await fetchReviews(venue.id);
        if (result.success) {
            setReviews(result.reviews);
        } else {
            Alert.alert("Error", result.error || "Failed to load reviews.");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (isFocused) {
            loadReviews();
        }
    }, [isFocused]);

    const handleEditReview = (review) => {
        navigation.navigate('SubmitReview', {
            venueId: venue.id,
            venueName: venue.name,
            editReview: review, // Pass the entire review object for editing
        });
    };

    const handleDeleteReview = (reviewId) => {
        Alert.alert(
            "Confirm Deletion",
            "Are you sure you want to permanently delete your review? This action is irreversible.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        setIsLoading(true);
                        const success = await deleteReview(reviewId);
                        if (success) {
                            Alert.alert("Deleted", "Your review has been successfully removed.");
                            loadReviews(); // Refresh the reviews list
                            // Note: Venue List needs to be updated too, but that happens when the list screen is refocused
                        } else {
                            Alert.alert("Error", "Failed to delete review. Please try again.");
                        }
                        setIsLoading(false);
                    } 
                },
            ]
        );
    };

    const renderVibeIcon = (status) => {
        let iconName, color;
        switch (status) {
            case 'Busy':
                iconName = 'flash';
                color = '#FF4500'; 
                break;
            case 'Normal':
                iconName = 'water';
                color = '#3CB371'; 
                break;
            case 'Quiet':
                iconName = 'moon';
                color = '#1E90FF'; 
                break;
            default:
                iconName = 'help-circle-outline';
                color = '#808080'; 
        }
        return <Ionicons name={iconName} size={24} color={color} style={styles.vibeIcon} />;
    };

    const renderReviewItem = (review) => {
        const isUserReview = currentUserUid && review.reviewerId === currentUserUid;

        return (
            <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                    {isUserReview && (
                        <View style={styles.reviewActions}>
                            <TouchableOpacity onPress={() => handleEditReview(review)} style={styles.actionButton}>
                                <Ionicons name="create-outline" size={20} color="#007AFF" />
                                <Text style={styles.actionButtonText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteReview(review.id)} style={[styles.actionButton, styles.deleteButton]}>
                                <Ionicons name="trash-outline" size={20} color="#FF6347" />
                                <Text style={[styles.actionButtonText, { color: '#FF6347' }]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
                <View style={styles.ratingRow}>
                    {[...Array(review.rating)].map((_, i) => (
                        <Ionicons key={`star-filled-${i}`} name="star" size={16} color="#FFD700" />
                    ))}
                    {[...Array(5 - review.rating)].map((_, i) => (
                        <Ionicons key={`star-outline-${i}`} name="star-outline" size={16} color="#FFD700" />
                    ))}
                    <Text style={styles.reviewDate}>
                        {review.submittedAt.toLocaleDateString()}
                    </Text>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6347" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Venue Header Info */}
            <View style={styles.header}>
                <Text style={styles.venueName}>{venue.name}</Text>
                <Text style={styles.venueLocation}>{venue.location} • {venue.category}</Text>
                
                <View style={styles.statusRow}>
                    {renderVibeIcon(venue.vibe_status)}
                    <Text style={styles.vibeStatusText}>
                        {venue.vibe_status || 'Status Unknown'}
                    </Text>
                </View>

                <View style={styles.ratingSummary}>
                    <Ionicons name="star" size={20} color="#FFD700" />
                    <Text style={styles.averageRatingText}>
                        {venue.averageRating ? venue.averageRating.toFixed(1) : 'No Rating'} 
                        <Text style={styles.reviewCountText}> ({venue.reviewCount || 0} reviews)</Text>
                    </Text>
                </View>

                <TouchableOpacity 
                    style={styles.reviewButton} 
                    onPress={() => navigation.navigate('SubmitReview', { venueId: venue.id, venueName: venue.name })}
                >
                    <Ionicons name="star-outline" size={20} color="#fff" />
                    <Text style={styles.reviewButtonText}>Write a Review</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.reviewButton, styles.reportButton]} 
                    onPress={() => navigation.navigate('ReportVibe', { venueId: venue.id })}
                >
                    <Ionicons name="megaphone-outline" size={20} color="#fff" />
                    <Text style={styles.reviewButtonText}>Report Current Vibe</Text>
                </TouchableOpacity>

            </View>

            {/* Reviews Section */}
            <View style={styles.reviewsSection}>
                <Text style={styles.sectionTitle}>User Reviews</Text>
                {reviews.length === 0 ? (
                    <Text style={styles.noReviewsText}>Be the first to leave a review!</Text>
                ) : (
                    reviews.map(renderReviewItem)
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f7',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#fff',
        padding: 20,
        marginBottom: 10,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    venueName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    venueLocation: {
        fontSize: 16,
        color: '#777',
        marginBottom: 15,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    vibeIcon: {
        marginRight: 5,
    },
    vibeStatusText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    ratingSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    averageRatingText: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 5,
        color: '#555',
    },
    reviewCountText: {
        fontSize: 14,
        fontWeight: '400',
        color: '#888',
    },
    reviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3CB371', // Green for Review
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    reportButton: {
        backgroundColor: '#FF6347', // Red-Orange for Report
    },
    reviewButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    reviewsSection: {
        padding: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    noReviewsText: {
        fontSize: 16,
        color: '#777',
        textAlign: 'center',
        marginTop: 10,
    },
    reviewCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderLeftWidth: 5,
        borderLeftColor: '#1E90FF', // Distinct border for reviews
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    reviewerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    reviewActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 15,
        paddingVertical: 2,
    },
    actionButtonText: {
        fontSize: 14,
        marginLeft: 4,
        color: '#007AFF',
    },
    deleteButton: {
        // No extra styling needed here, colors handled in text/icon
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    reviewDate: {
        fontSize: 12,
        color: '#999',
        marginLeft: 10,
    },
    reviewComment: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    }
});

export default DetailsScreen;