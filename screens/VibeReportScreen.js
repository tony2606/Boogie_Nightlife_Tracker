import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { updateVibeReport } from '../services/venueService'; 

// Define the available Vibe options
const vibeOptions = [
    { key: 'Quiet', label: 'Quiet (Plenty of space)', icon: 'moon-outline', color: '#1E90FF' },
    { key: 'Normal', label: 'Normal (Comfortable)', icon: 'water-outline', color: '#3CB371' },
    { key: 'Busy', label: 'Busy (Getting crowded)', icon: 'flash-outline', color: '#FF4500' },
];

const VibeReportScreen = ({ navigation }) => {
    const route = useRoute();
    // Get the parameters passed from DetailsScreen (venueId and venueName)
    const { venueId, venueName } = route.params;

    const [selectedVibe, setSelectedVibe] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Handles the submission of the selected Vibe Report.
     */
    const handleSubmit = async () => {
        if (!selectedVibe) {
            // Using Alert instead of custom modal for brevity, though a custom UI is preferred
            // in a real app running in an iframe.
            Alert.alert('Selection Required', 'Please select one of the current vibe statuses before submitting.');
            return;
        }

        setIsSubmitting(true);
        
        // Call the service function to update the venue in Firestore
        const success = await updateVibeReport(venueId, selectedVibe);

        setIsSubmitting(false);

        if (success) {
            Alert.alert(
                'Thank You!', 
                `Your Vibe Report for ${venueName} has been submitted.`,
                [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]
            );
        } else {
            Alert.alert('Error', 'Failed to submit the Vibe Report. Please try again.');
        }
    };

    const VibeOptionCard = ({ vibe }) => (
        <TouchableOpacity
            style={[
                styles.card,
                selectedVibe === vibe.key && { borderColor: vibe.color, borderWidth: 3, backgroundColor: '#e6f7ff' } // Highlight when selected
            ]}
            onPress={() => setSelectedVibe(vibe.key)}
            disabled={isSubmitting}
        >
            <Ionicons name={vibe.icon} size={40} color={vibe.color} />
            <Text style={[styles.cardTitle, { color: vibe.color }]}>{vibe.key}</Text>
            <Text style={styles.cardLabel}>{vibe.label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Report the Current Vibe</Text>
            <Text style={styles.venueNameText}>{venueName}</Text>
            <Text style={styles.subtitle}>Help others by sharing the current crowd level.</Text>
            
            <View style={styles.optionsContainer}>
                {vibeOptions.map(vibe => (
                    <VibeOptionCard key={vibe.key} vibe={vibe} />
                ))}
            </View>

            <TouchableOpacity
                style={[
                    styles.submitButton, 
                    !selectedVibe && styles.disabledButton // Visually disable if no selection
                ]}
                onPress={handleSubmit}
                disabled={!selectedVibe || isSubmitting}
            >
                {isSubmitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <Text style={styles.submitButtonText}>Submit Vibe Report</Text>
                )}
            </TouchableOpacity>
            
            <TouchableOpacity 
                onPress={() => navigation.goBack()}
                style={styles.cancelButton}
                disabled={isSubmitting}
            >
                <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f9f9f9',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
        textAlign: 'center',
    },
    venueNameText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FF6347',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#777',
        marginBottom: 30,
        textAlign: 'center',
    },
    optionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 40,
    },
    card: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        marginHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center',
        height: 150,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 5,
    },
    cardLabel: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginTop: 5,
    },
    submitButton: {
        backgroundColor: '#FF6347',
        padding: 15,
        borderRadius: 10,
        width: '80%',
        alignItems: 'center',
        marginBottom: 15,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    cancelButton: {
        padding: 10,
    },
    cancelButtonText: {
        color: '#1E90FF',
        fontSize: 16,
    }
});

export default VibeReportScreen;