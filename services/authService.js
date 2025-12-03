// services/authService.js
import { auth } from '../config/firebaseConfig';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    updateProfile,
    GoogleAuthProvider,
    signInWithCredential,
} from 'firebase/auth';

/**
 * Handles user registration with email, password, and sets a display name.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @param {string} name - User's desired display name.
 */
export const registerUser = async (email, password, name) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Set the user's display name immediately after creation
        await updateProfile(user, {
            displayName: name,
        });

        console.log("User registered and profile updated:", user.uid);
        return { success: true, user };
    } catch (error) {
        console.error("Registration failed:", error.code, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Handles user login with email and password.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 */
export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log("User logged in:", user.uid);
        return { success: true, user };
    } catch (error) {
        console.error("Login failed:", error.code, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Handles user logout.
 */
export const logoutUser = async () => {
    try {
        await signOut(auth);
        console.log("User logged out successfully.");
        return { success: true };
    } catch (error) {
        console.error("Logout failed:", error.message);
        return { success: false, error: error.message };
    }
};


/**
 * Signs in user using a Google ID token obtained from a mobile SDK (e.g., Expo).
 * NOTE: This assumes you have already run the native Google sign-in flow and obtained the ID token.
 * @param {string} idToken - The ID token provided by the Google sign-in client.
 */
export const signInWithGoogleToken = async (idToken) => {
    try {
        if (!idToken) {
            throw new Error("Google ID token is required for sign-in.");
        }
        
        // 1. Build the Firebase credential from the Google ID token
        const googleCredential = GoogleAuthProvider.credential(idToken);

        // 2. Sign the user in with the credential
        const userCredential = await signInWithCredential(auth, googleCredential);
        
        console.log("Signed in with Google:", userCredential.user.uid);
        return { success: true, user: userCredential.user };

    } catch (error) {
        // Firebase specific errors from signInWithCredential might be useful to log
        console.error("Google Sign-In failed:", error.message, error.code);
        return { success: false, error: error.message };
    }
};