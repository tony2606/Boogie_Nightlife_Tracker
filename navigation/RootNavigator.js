import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebaseConfig'; 

import AppNavigator from './AppNavigator';
import AuthNavigator from './AuthNavigator';

// ⬅️ NEW: Import the global background component
import GeofenceTracker from '../components/GeofenceTracker'; 

const RootNavigator = () => {
    const [initializing, setInitializing] = useState(true);
    const [user, setUser] = useState(null);

    // Handles user state changes
    useEffect(() => {
        const subscriber = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (initializing) setInitializing(false);
        });
        
        // Unsubscribe listener on cleanup
        return subscriber;
    }, []);

    if (initializing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {/* ⬅️ GEOTRACKER ADDED: This runs globally outside of the conditional navigator. */}
            <GeofenceTracker /> 
            
            {/* Conditional switch between the Auth (Login/Sign Up) and App (Main Screens) flows */}
            {user ? <AppNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default RootNavigator;