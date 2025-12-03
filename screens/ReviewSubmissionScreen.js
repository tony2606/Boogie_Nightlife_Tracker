import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { submitReview } from '../services/reviewService';

const ReviewSubmissionScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { venueId, venueName } = route.params; // ⬅️ Extract venueName
    
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRatingPress = (newRating) => {
        setRating(newRating);
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert("Missing Rating", "Please select a star rating.");
            return;
        }

        setIsSubmitting(true);
        // ⬅️ Pass venueName to the service function
        const result = await submitReview(venueId, venueName, rating, comment.trim());
        setIsSubmitting(false);

        if (result.success) {
            Alert.alert(
                "Review Submitted! ⭐",
                `Thank you for rating ${venueName}.`,
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        } else {
            // Display the specific error from the service (e.g., duplicate review error)
            Alert.alert("Submission Failed", result.error || "Could not submit review. Please try again.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Review {venueName}</Text>
            <Text style={styles.subtitle}>Rate your experience at this venue.</Text>

            {/* Star Rating Section */}
            <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => handleRatingPress(star)} disabled={isSubmitting}>
                        <Ionicons
                            name={rating >= star ? 'star' : 'star-outline'}
                            size={48}
                            color="#FFD700"
                        />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Comment Section */}
            <Text style={styles.label}>Your Feedback (Optional)</Text>
            <TextInput
                style={styles.commentInput}
                placeholder="Share your thoughts on the vibe, service, or music..."
                multiline
                numberOfLines={4}
                value={comment}
                onChangeText={setComment}
                editable={!isSubmitting}
            />

            <Button
                title={isSubmitting ? "Submitting..." : "Submit Review"}
                onPress={handleSubmit}
                disabled={isSubmitting || rating === 0}
                color="#FF6347"
            />
            
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 25,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#777',
        marginBottom: 30,
        textAlign: 'center',
    },
    ratingContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 30,
        paddingHorizontal: 10,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
        marginBottom: 8,
    },
    commentInput: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 15,
        textAlignVertical: 'top',
        minHeight: 120,
        fontSize: 16,
        marginBottom: 25,
    },
    cancelButton: {
        marginTop: 15,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#777',
        fontSize: 16,
    }
});

export default ReviewSubmissionScreen;