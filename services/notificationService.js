import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { db } from '../config/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

// Set the notification handler for foreground notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Collection name where we store user tokens
const NOTIFICATION_TOKENS_COLLECTION = 'user_push_tokens';

/**
 * Registers the device for push notifications and saves the token to Firestore.
 * @param {string} userId - The authenticated user's ID.
 */
export async function registerForPushNotificationsAsync(userId) {
    if (!userId) {
        console.warn("Cannot register for notifications: User ID is missing.");
        return;
    }

    let token;
    
    // 1. Check/Request Permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification! User needs to enable permissions.');
        return;
    }

    // 2. Get the Push Token
    try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log("Expo Push Token:", token);
    } catch (e) {
        console.error("Error fetching Expo Push Token:", e);
        return;
    }

    // 3. Save the Token to Firestore
    if (token) {
        try {
            // Store the token in a dedicated collection, using the UID as the document ID
            const tokenRef = doc(db, NOTIFICATION_TOKENS_COLLECTION, userId);
            
            await setDoc(tokenRef, {
                token: token,
                userId: userId,
                platform: Platform.OS,
                timestamp: new Date().getTime(),
            }, { merge: true }); // Use merge to prevent overwriting other data if it exists

            console.log("Push token saved to Firestore for user:", userId);

        } catch (e) {
            console.error("Error saving push token to Firestore:", e);
        }
    }

    // Mandatory: Configure for Android channels
    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    return token;
}

/**
 * Mocks the server-side logic to send a notification when a venue status changes.
 * NOTE: In a real app, this would be a Cloud Function or server-side service.
 * We are calling it from the client side ONLY for demonstration purposes.
 * @param {string} title - Notification title.
 * @param {string} body - Notification body text.
 */
export async function mockSendVibeNotification(title, body) {
    // 1. For a real server, you would query Firestore for tokens associated with
    //    users who are currently near the venue or have followed it.
    // 2. Then, you would use the 'expo-server-sdk' (or similar) to post to the
    //    Expo API with the list of target tokens.
    
    // For local testing, we will just send a local notification immediately.
    Notifications.scheduleNotificationAsync({
        content: {
            title: title || "Vibe Alert! 🚨",
            body: body || "A venue near you just got busy!",
            data: { venueId: 'venue_id_for_testing' },
            sound: 'default'
        },
        trigger: { seconds: 2 }, // Schedule to appear in 2 seconds
    });
    
    console.log("Local notification mocked and scheduled.");
}