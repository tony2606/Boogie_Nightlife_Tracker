import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { loginUser, signInWithGoogleToken } from '../services/authService';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Ionicons } from '@expo/vector-icons';

// IMPORTANT: This line is required to handle the web browser closing after auth
WebBrowser.maybeCompleteAuthSession();

// Replace with your actual Google Web Client ID
// You must get this from the Google Cloud Console (or Firebase Authentication -> Google provider setup)
// You need a Web Client ID, not an Android or iOS one, for Expo to work correctly.
const GOOGLE_WEB_CLIENT_ID = "YOUR_GOOGLE_WEB_CLIENT_ID_HERE"; 

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    // ⬅️ Expo Google Auth Setup
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: GOOGLE_WEB_CLIENT_ID,
    });

    // ⬅️ Effect to handle the Google response
    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            if (id_token) {
                handleGoogleSignIn(id_token);
            } else {
                Alert.alert("Error", "Could not retrieve Google ID token.");
                setGoogleLoading(false);
            }
        } else if (response?.type === 'error') {
            Alert.alert("Google Sign-In Failed", "Please try again.");
            setGoogleLoading(false);
        }
    }, [response]);


    // ⬅️ Service function to complete Firebase sign-in
    const handleGoogleSignIn = async (idToken) => {
        setGoogleLoading(true);
        const result = await signInWithGoogleToken(idToken);
        setGoogleLoading(false);

        if (!result.success) {
            Alert.alert("Firebase Error", result.error);
        }
        // If successful, the RootNavigator handles the app transition
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter your email and password.");
            return;
        }

        setIsLoading(true);
        const result = await loginUser(email, password);
        setIsLoading(false);

        if (!result.success) {
            Alert.alert("Login Failed", result.error);
        }
    };
    
    // ⬅️ Function to initiate the Google OAuth flow
    const handleGoogleButtonPress = () => {
        setGoogleLoading(true);
        promptAsync();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Log In</Text>
            <Text style={styles.subtitle}>Access the real-time Vibe Tracker.</Text>

            {/* --- Google Sign-In Button --- */}
            <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: '#DB4437' }]} // Google red
                onPress={handleGoogleButtonPress}
                disabled={!request || googleLoading || isLoading}
            >
                {googleLoading ? (
                    <Text style={styles.socialButtonText}>Loading...</Text>
                ) : (
                    <>
                        <Ionicons name="logo-google" size={24} color="#fff" />
                        <Text style={styles.socialButtonText}>Sign In with Google</Text>
                    </>
                )}
            </TouchableOpacity>

            <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
            </View>

            {/* --- Email/Password Form --- */}
            <TextInput
                style={styles.input}
                placeholder="Email Address"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <Button
                title={isLoading ? "Logging In..." : "Log In"}
                onPress={handleLogin}
                disabled={isLoading || googleLoading}
                color="#FF6347"
            />
            
            <TouchableOpacity 
                style={styles.link} 
                onPress={() => navigation.navigate('SignUp')}
                disabled={isLoading || googleLoading}
            >
                <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 30,
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
        color: '#777',
    },
    // ⬅️ NEW: Social Button Styling
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        elevation: 2,
    },
    socialButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    // ⬅️ NEW: Divider Styling
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#ccc',
    },
    dividerText: {
        width: 30,
        textAlign: 'center',
        color: '#888',
        fontSize: 14,
    },
    // Existing styles
    input: {
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        fontSize: 16,
    },
    link: {
        marginTop: 20,
        alignItems: 'center',
    },
    linkText: {
        color: '#FF6347',
        fontSize: 16,
    },
});

export default LoginScreen;