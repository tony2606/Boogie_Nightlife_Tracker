// screens/HomeScreen.js
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { collection, getDocs } from 'firebase/firestore'; // Import Firestore functions
import { db } from '../config/firebaseConfig'; // Import our Firebase initialization
// NOTE: We no longer need to import local venues data

import VenueCard from '../components/VenueCard'; 
import FeaturedEventCard from '../components/FeaturedEventCard'; 
import featuredEvents from '../data/events'; 
import { Ionicons } from '@expo/vector-icons'; 
import { useNavigation } from '@react-navigation/native';


const HomeScreen = () => {
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  // 1. New State for dynamic data and loading status
  const [venues, setVenues] = useState([]); 
  const [loading, setLoading] = useState(true);

  // Set the "Suggest Venue" button in the header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('SuggestVenue')}
          style={{ marginRight: 15 }}
        >
          <Ionicons name="add-circle-outline" size={30} color="#007AFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // 2. Data Fetching Logic (runs once on load)
  useEffect(() => {
    const fetchVenues = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "venues")); // Reference the 'venues' collection
        const venuesList = querySnapshot.docs.map(doc => ({
          id: doc.id, // Firestore provides a unique ID
          ...doc.data() // Spread the rest of the venue data
        }));
        setVenues(venuesList);
      } catch (error) {
        console.error("Error fetching documents: ", error);
        // Fallback or error message could go here
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, []); // Empty dependency array ensures it runs only once

  // 3. Filtering logic remains the same, now filtering state 'venues'
  const filteredVenues = useMemo(() => {
    if (!searchTerm) {
      return venues;
    }
    const lowerCaseSearch = searchTerm.toLowerCase();
    
    return venues.filter(venue => 
      venue.name.toLowerCase().includes(lowerCaseSearch) ||
      venue.location.toLowerCase().includes(lowerCaseSearch) ||
      venue.description.toLowerCase().includes(lowerCaseSearch)
    );
  }, [searchTerm, venues]); // Depend on searchTerm AND venues

  const renderItem = ({ item }) => (
    <VenueCard venue={item} /> 
  );
  
  const ListHeader = () => (
    <View>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#777" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search venues, location, or vibe..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>
      
      {/* Featured Events Section */}
      {featuredEvents.length > 0 && (
        <View style={styles.featuredContainer}>
            <Text style={styles.featuredTitle}>Hot Tonight 🔥</Text>
            {featuredEvents.map(event => (
                <FeaturedEventCard key={event.id} event={event} />
            ))}
        </View>
      )}

      {/* Subtitle for the main venue list */}
      <Text style={styles.mainListTitle}>All Nightlife Spots</Text>

    </View>
  );
  
  // Show a loading spinner while fetching data
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Connecting to Boogie's Vibe Database...</Text>
      </View>
    );
  }

  // Show empty state if filtering results in no venues
  const showEmptyState = filteredVenues.length === 0 && !loading;

  return (
    <View style={styles.container}>
      {showEmptyState ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No venues match your search for "{searchTerm}"</Text>
        </View>
      ) : (
        <FlatList
          data={filteredVenues}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListHeaderComponent={ListHeader} 
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  searchContainer: {
    // ... (unchanged styles)
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20, 
  },
  featuredContainer: {
    paddingTop: 15,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginLeft: 10,
  },
  mainListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 10,
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  }
});

export default HomeScreen;