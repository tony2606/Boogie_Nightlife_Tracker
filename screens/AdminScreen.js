import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    ActivityIndicator, 
    TouchableOpacity, 
    Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { 
    fetchFlaggedContent, 
    approveContent, 
    deleteContent, 
    deleteVibeReport 
} from '../services/moderationService';

// --- Individual Moderation Card Component ---
const ModerationCard = ({ item, onAction }) => {
    const isReview = item.type === 'Review';
    const submittedDate = item.submittedAt.toLocaleDateString();

    const handleApprove = () => onAction(item.id, item.type, 'Approve', item.venueId);
    const handleDelete = () => onAction(item.id, item.type, 'Delete', item.venueId);

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.itemType}>
                    <Ionicons 
                        name={isReview ? 'star-half-outline' : 'warning-outline'} 
                        size={16} 
                        color={isReview ? '#FFD700' : '#FF6347'} 
                    /> 
                    {item.type} Flagged
                </Text>
                <Text style={styles.submittedDate}>Submitted: {submittedDate}</Text>
            </View>

            <Text style={styles.venueName}>Venue: {item.venueName}</Text>
            
            <View style={styles.contentBlock}>
                <Text style={styles.contentLabel}>
                    {isReview ? `Review by ${item.reviewerName}:` : 'Report Content:'}
                </Text>
                <Text style={styles.contentBody}>{item.content}</Text>
                {isReview && <Text style={styles.reviewRating}>Rating: {item.rating} / 5</Text>}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
                {/* Approve is only valid for Reviews (Vibe Reports are just deleted) */}
                {isReview && (
                    <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={handleApprove}>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Approve</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};


// --- Main Admin Screen Component ---
const AdminScreen = () => {
    const isFocused = useIsFocused();
    const [flaggedContent, setFlaggedContent] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Function to load all content flagged for review
    const loadFlaggedContent = useCallback(async () => {
        setIsLoading(true);
        const items = await fetchFlaggedContent();
        setFlaggedContent(items);
        setIsLoading(false);
    }, []);

    // Load data whenever the screen is focused
    useEffect(() => {
        if (isFocused) {
            loadFlaggedContent();
        }
    }, [isFocused, loadFlaggedContent]);


    // Handler for Approve/Delete actions
    const handleAction = async (itemId, itemType, action, venueId) => {
        let success = false;
        setIsLoading(true);

        if (action === 'Approve') {
            success = await approveContent(itemId);
        } else if (action === 'Delete') {
            if (itemType === 'VibeReport') {
                // Use dedicated function to delete report and reset venue vibe status
                success = await deleteVibeReport(itemId, venueId);
            } else {
                // Use generic delete for Review (recalculation needed but skipped here)
                success = await deleteContent(itemId, itemType); 
            }
        }

        if (success) {
            Alert.alert('Success', `${itemType} successfully ${action}d.`);
            // Remove the item from the local list instantly
            setFlaggedContent(prev => prev.filter(item => item.id !== itemId));
        } else {
            Alert.alert('Error', `Failed to ${action} ${itemType}.`);
        }
        setIsLoading(false);
    };


    if (isLoading && flaggedContent.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6347" />
                <Text style={{ marginTop: 10 }}>Loading flagged content...</Text>
            </View>
        );
    }


    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Content Moderation Queue</Text>
                <Text style={styles.subtitle}>
                    {flaggedContent.length} items requiring review.
                </Text>
            </View>
            
            <FlatList
                data={flaggedContent}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <ModerationCard item={item} onAction={handleAction} />}
                contentContainerStyle={styles.listContent}
                refreshing={isLoading}
                onRefresh={loadFlaggedContent}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="happy-outline" size={50} color="#3CB371" />
                        <Text style={styles.emptyText}>Queue Clear! All content is clean.</Text>
                    </View>
                )}
            />
        </View>
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
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#FF6347',
        marginTop: 5,
        fontWeight: '500',
    },
    listContent: {
        padding: 10,
    },
    card: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderLeftWidth: 5,
        borderLeftColor: '#FF6347',
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    itemType: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#555',
    },
    submittedDate: {
        fontSize: 12,
        color: '#888',
    },
    venueName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    contentBlock: {
        marginVertical: 10,
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 5,
    },
    contentLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 5,
    },
    contentBody: {
        fontSize: 16,
        color: '#333',
    },
    reviewRating: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFD700',
        marginTop: 5,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8,
        width: '48%',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    approveButton: {
        backgroundColor: '#3CB371', // Green for Approve
    },
    deleteButton: {
        backgroundColor: '#FF6347', // Red for Delete
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#777',
        marginTop: 10,
    }
});

export default AdminScreen;