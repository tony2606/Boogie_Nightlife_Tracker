import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { auth, initializeAuth, db } from '../config/firebaseConfig';
import { signInWithCustomToken, onAuthStateChanged, signInAnonymously } from 'firebase/auth';

// Screens
import VenueListScreen from '../screens/VenueListScreen';
import DetailsScreen from '../screens/DetailsScreen';
import SubmitReviewScreen from '../screens/SubmitReviewScreen';
import ReportVibeScreen from '../screens/ReportVibeScreen';
import AdminScreen from '../screens/AdminScreen';

// --- Configuration ---

// Hardcoded Admin UIDs (Replace with your actual admin UIDs)
// For demonstration, the first user logged in will be granted "admin" access 
// if their UID matches one of these. 
// NOTE: In a production app, roles should be checked via Firestore/Custom Claims.
const ADMIN_USER_IDS = [
    // Add known admin UIDs here for testing. Example: 'your-first-admin-uid', 'another-admin-uid'
]; 

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

/**
 * Ensures Firebase Auth is initialized and handles initial authentication.
 * This is called once at the start.
 */
const initializeAppAuth = async () => {
    try {
        initializeAuth(db); // Ensure auth is initialized

        const initialToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
        
        if (initialToken) {
            // Use the provided custom token for sign-in
            const userCredential = await signInWithCustomToken(auth, initialToken);
            const userId = userCredential.user.uid;
            
            // Add the first user's UID to the admin list for easy testing in the Canvas environment
            if (ADMIN_USER_IDS.length === 0) {
                ADMIN_USER_IDS.push(userId);
                console.log(`Initial user UID (${userId}) added to temporary ADMIN_USER_IDS list.`);
            }

        } else {
            // Fallback: Sign in anonymously if no token is provided (for security rule compliance)
            await signInAnonymously(auth);
        }
    } catch (error) {
        console.error("Firebase initial sign-in error:", error);
    }
};

// Stack Navigator for Venue Details Flow
const VenueStack = () => (
    <Stack.Navigator 
        screenOptions={{ 
            headerStyle: { backgroundColor: '#FF6347' }, 
            headerTintColor: '#fff' 
        }}
    >
        <Stack.Screen 
            name="VenueList" 
            component={VenueListScreen} 
            options={{ title: 'Boogie Nightlife Tracker' }} 
        />
        <Stack.Screen 
            name="Details" 
            component={DetailsScreen} 
            options={({ route }) => ({ title: route.params.venue.name })} 
        />
        <Stack.Screen 
            name="SubmitReview" 
            component={SubmitReviewScreen} 
            options={{ title: 'Review Venue' }} 
        />
        <Stack.Screen 
            name="ReportVibe" 
            component={ReportVibeScreen} 
            options={{ title: 'Report Current Vibe' }} 
        />
    </Stack.Navigator>
);

const AppNavigator = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // 1. Run initial authentication setup
        initializeAppAuth();

        // 2. Set up the auth state listener
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            
            if (currentUser) {
                // Check if the current user is an admin
                const isUserAdmin = ADMIN_USER_IDS.includes(currentUser.uid);
                setIsAdmin(isUserAdmin);
                console.log(`User ${currentUser.uid} status: Admin=${isUserAdmin}`);
            } else {
                setIsAdmin(false);
            }
            setIsLoading(false);
        });

        return unsubscribe; // Cleanup listener on unmount
    }, []);

    if (isLoading) {
        // Simple loading screen while Auth state is determined
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f7' }}>
                <ActivityIndicator size="large" color="#FF6347" />
                <Text style={{ marginTop: 10, color: '#333' }}>Loading App...</Text>
            </View>
        );
    }

    // Main Tab Navigator
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    headerShown: false, // Hide header on tabs since stack handles it
                    tabBarActiveTintColor: '#FF6347',
                    tabBarInactiveTintColor: 'gray',
                    tabBarStyle: {
                        backgroundColor: '#fff',
                        borderTopWidth: 1,
                        borderTopColor: '#e0e0e0',
                        paddingBottom: 5,
                    },
                    tabBarIcon: ({ color, size }) => {
                        let iconName;
                        if (route.name === 'Home') {
                            iconName = 'map-outline';
                        } else if (route.name === 'Admin') {
                            iconName = 'shield-checkmark-outline';
                        }
                        return <Ionicons name={iconName} size={size} color={color} />;
                    },
                })}
            >
                <Tab.Screen 
                    name="Home" 
                    component={VenueStack} 
                    options={{ title: 'Venues' }} 
                />
                
                {/* Dynamically render Admin Tab only if user is Admin */}
                {isAdmin && (
                    <Tab.Screen 
                        name="Admin" 
                        component={AdminScreen} 
                        options={{ title: 'Moderation' }} 
                    />
                )}
                
            </Tab.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;