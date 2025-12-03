import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Linking, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const DetailsScreen = ({ navigation }) => {
    const route = useRoute();
    const { venue } = route.params;

    // Determine the color and icon for the Vibe Status
    const { color: vibeColor, icon: vibeIcon } = useMemo(() => {
        switch (venue.vibe_status) {
            case 'Busy':
                return { color: '#FF4500', icon: 'flash' }; // Red-Orange for Busy
            case 'Normal':
                return { color: '#3CB371', icon: 'water' }; // Medium Sea Green for Normal
            case 'Quiet':
                return { color: '#1E90FF', icon: 'moon' }; // Dodger Blue for Quiet
            default:
                return { color: '#999', icon: 'help-circle' }; // Gray for Unknown
        }
    }, [venue.vibe_status]);

    // Format the date for when the last report was made
    const lastReportDate = useMemo(() => {
        if (venue.lastVibeReportedAt && venue.lastVibeReportedAt.toDate) {
            return venue.lastVibeReportedAt.toDate().toLocaleString();
        }
        return 'Never Reported';
    }, [venue.lastVibeReportedAt]);

    // Handler for external links
    const openLink = useCallback((url) => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    }, []);

    // --- NEW: Navigation to Vibe Report Screen ---
    const handleReportVibe = () => {
        navigation.navigate('VibeReport', { 
            venueId: venue.id, 
            venueName: venue.name 
        });
    };
    // ---------------------------------------------

    return (
        <ScrollView style={styles.container}>
            {/* Venue Image (using a placeholder for compliance) */}
            <Image
                source={{ uri: `https://placehold.co/600x300/FF6347/FFFFFF?text=${encodeURIComponent(venue.name)}` }}
                style={styles.image}
                onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
            />

            <View style={styles.content}>
                <Text style={styles.title}>{venue.name}</Text>
                
                {/* Vibe Status Card */}
                <View style={[styles.vibeCard, { borderColor: vibeColor }]}>
                    <Ionicons name={vibeIcon} size={28} color={vibeColor} style={{ marginRight: 10 }} />
                    <View>
                        <Text style={styles.vibeStatusLabel}>Current Vibe Status</Text>
                        <Text style={[styles.vibeStatusText, { color: vibeColor }]}>
                            {venue.vibe_status}
                        </Text>
                    </View>
                </View>

                {/* Live Report Stats */}
                <View style={styles.reportStats}>
                    <Text style={styles.reportText}>
                        <Ionicons name="people-circle-outline" size={16} color="#4A90E2" /> Total Vibe Reports: <Text style={styles.statValue}>{venue.live_count || 0}</Text>
                    </Text>
                    <Text style={styles.reportText}>
                        <Ionicons name="time-outline" size={16} color="#4A90E2" /> Last Reported: <Text style={styles.statValue}>{lastReportDate}</Text>
                    </Text>
                </View>

                {/* --- NEW: Report Vibe Button --- */}
                <TouchableOpacity style={styles.reportButton} onPress={handleReportVibe}>
                    <Ionicons name="chatbox-ellipses-outline" size={24} color="#fff" />
                    <Text style={styles.reportButtonText}>Report Current Vibe</Text>
                </TouchableOpacity>
                {/* ---------------------------------- */}


                {/* General Information */}
                <Text style={styles.sectionTitle}>Information</Text>
                <Text style={styles.addressText}>
                    <Ionicons name="location-outline" size={16} color="#777" /> {venue.address}
                </Text>
                <Text style={styles.description}>{venue.description}</Text>

                {/* External Links */}
                <Text style={styles.sectionTitle}>Contact & Links</Text>
                {venue.website && (
                    <TouchableOpacity style={styles.linkButton} onPress={() => openLink(venue.website)}>
                        <Ionicons name="globe-outline" size={20} color="#FF6347" />
                        <Text style={styles.linkText}>Website</Text>
                    </TouchableOpacity>
                )}
                {venue.phone && (
                    <TouchableOpacity style={styles.linkButton} onPress={() => openLink(`tel:${venue.phone}`)}>
                        <Ionicons name="call-outline" size={20} color="#FF6347" />
                        <Text style={styles.linkText}>Call: {venue.phone}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    image: {
        width: '100%',
        height: 250,
        resizeMode: 'cover',
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    // Vibe Card Styles
    vibeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 15,
        borderWidth: 2,
        marginBottom: 20,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
    },
    vibeStatusLabel: {
        fontSize: 14,
        color: '#777',
        fontWeight: '600',
    },
    vibeStatusText: {
        fontSize: 22,
        fontWeight: '900',
    },
    // Report Stats Styles
    reportStats: {
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    reportText: {
        fontSize: 14,
        color: '#555',
        marginBottom: 5,
    },
    statValue: {
        fontWeight: 'bold',
        color: '#333',
    },
    // Report Button Styles (NEW)
    reportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF6347',
        padding: 15,
        borderRadius: 10,
        marginBottom: 25,
        shadowColor: '#FF6347',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    reportButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    // General Info Styles
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginTop: 10,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 5,
    },
    addressText: {
        fontSize: 16,
        color: '#555',
        marginBottom: 15,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: '#444',
        marginBottom: 20,
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    linkText: {
        fontSize: 16,
        color: '#FF6347',
        marginLeft: 10,
        textDecorationLine: 'underline',
    },
});

export default DetailsScreen;