import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { submitSuggestedVenue } from '../services/suggestVenueService'; 
// NOTE: Make sure you have installed '@react-native-picker/picker' 
// If not installed, run: expo install @react-native-picker/picker
import { Picker } from '@react-native-picker/picker';

const CATEGORIES = [
    'Nightclub',
    'Bar',
    'Restaurant/Lounge',
    'Cafe/Hangout Spot',
    'Other'
];

const SuggestedVenueScreen = () => {
    const navigation = useNavigation();
    
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim() || !location.trim()) {
            Alert.alert("Missing Information", "Please enter both the venue name and its general location.");
            return;
        }

        setIsSubmitting(true);
        
        const venueData = {
            name: name.trim(),
            location: location.trim(),
            category: category,
        };

        const success = await submitSuggestedVenue(venueData);
        
        setIsSubmitting(false);

        if (success) {
            Alert.alert(
                "Thank You! 🎉", 
                "Your venue suggestion has been submitted for review by our team. We appreciate your help!",
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        } else {
            Alert.alert("Error", "Could not submit suggestion. Please check your connection and try again.");
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Suggest a New Harare Vibe Spot</Text>
            <Text style={styles.subtitle}>Help us expand the list! Your submission will be reviewed by our team.</Text>

            <Text style={styles.label}>Venue Name *</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g., The Chill Spot Cafe"
                value={name}
                onChangeText={setName}
            />

            <Text style={styles.label}>General Location *</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g., Borrowdale, Sam Levy's Village, or exact address"
                value={location}
                onChangeText={setLocation}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={category}
                    onValueChange={(itemValue) => setCategory(itemValue)}
                    style={styles.picker}
                >
                    {CATEGORIES.map(cat => (
                        <Picker.Item key={cat} label={cat} value={cat} />
                    ))}
                </Picker>
            </View>

            <Button
                title={isSubmitting ? "Submitting..." : "Submit Venue Suggestion"}
                onPress={handleSubmit}
                disabled={isSubmitting || !name.trim() || !location.trim()}
                color="#FF6347"
            />
            <View style={{ height: 50 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#777',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
        marginTop: 15,
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#fff',
        padding: Platform.OS === 'ios' ? 15 : 10, 
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: 16,
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        overflow: 'hidden',
        marginBottom: 20,
        // Conditional styling to make the Picker visible/functional across platforms
        height: Platform.OS === 'android' ? 50 : undefined, 
        justifyContent: Platform.OS === 'android' ? 'center' : undefined,
    },
    picker: {
        width: '100%',
    },
});

export default SuggestedVenueScreen;