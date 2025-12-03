import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { registerUser } from '../services/authService';

const SignUpScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignUp = async () => {
        if (!name || !email || !password) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }

        setIsLoading(true);
        const result = await registerUser(email, password, name);
        setIsLoading(false);

        if (result.success) {
            // User is automatically logged in; Auth Navigator will handle the switch
        } else {
            // Firebase error messages are usually good enough for display
            Alert.alert("Registration Failed", result.error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to Boogie!</Text>
            <Text style={styles.subtitle}>Sign up to join the Harare Vibe community.</Text>

            <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
            />
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
                placeholder="Password (min 6 characters)"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <Button
                title={isLoading ? "Registering..." : "Sign Up"}
                onPress={handleSignUp}
                disabled={isLoading}
                color="#007AFF"
            />
            
            <TouchableOpacity 
                style={styles.link} 
                onPress={() => navigation.navigate('Login')}
            >
                <Text style={styles.linkText}>Already have an account? Log In</Text>
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
        color: '#007AFF',
        fontSize: 16,
    },
});

export default SignUpScreen;