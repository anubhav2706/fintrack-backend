import admin from 'firebase-admin';
import { env } from './env';

/**
 * Firebase Admin SDK initialization for FCM (Firebase Cloud Messaging)
 * Handles push notifications for the FinTrack Pro app
 */

/**
 * Initialize Firebase Admin SDK
 * Should be called once during application startup
 */
export function initializeFirebase(): void {
  try {
    // Check if Firebase is already initialized
    if (!admin.apps.length) {
      const serviceAccount = {
        projectId: env.FIREBASE_PROJECT_ID,
        privateKey: env.FIREBASE_PRIVATE_KEY,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      
      console.log('✅ Firebase Admin SDK initialized successfully');
    } else {
      console.log('📱 Firebase Admin SDK already initialized');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

/**
 * Get Firebase messaging instance
 * @returns admin.messaging.Messaging
 */
export function getMessaging(): admin.messaging.Messaging {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin SDK not initialized. Call initializeFirebase() first.');
  }
  return admin.messaging();
}

/**
 * Send push notification to a specific device
 * @param token FCM token of the target device
 * @param payload Notification payload
 * @returns Promise<string> - Message ID
 */
export async function sendPushNotification(
  token: string,
  payload: {
    title: string;
    body: string;
    data?: Record<string, string>;
    imageUrl?: string;
  }
): Promise<string> {
  try {
    const messaging = getMessaging();
    
    const message: admin.messaging.Message = {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await messaging.send(message);
    console.log(`📱 Push notification sent successfully: ${response}`);
    return response;
  } catch (error) {
    console.error('❌ Failed to send push notification:', error);
    throw error;
  }
}

/**
 * Send push notification to multiple devices (multicast)
 * @param tokens Array of FCM tokens
 * @param payload Notification payload
 * @returns Promise<admin.messaging.BatchResponse>
 */
export async function sendMulticastNotification(
  tokens: string[],
  payload: {
    title: string;
    body: string;
    data?: Record<string, string>;
    imageUrl?: string;
  }
): Promise<admin.messaging.BatchResponse> {
  try {
    const messaging = getMessaging();
    
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await messaging.sendMulticast(message);
    console.log(`📱 Multicast notification sent: ${response.successCount} success, ${response.failureCount} failures`);
    return response;
  } catch (error) {
    console.error('❌ Failed to send multicast notification:', error);
    throw error;
  }
}

/**
 * Validate FCM token format
 * @param token FCM token to validate
 * @returns boolean - True if token format is valid
 */
export function validateFCMToken(token: string): boolean {
  // FCM tokens are typically 163 characters long for Android and vary for iOS
  // Basic validation: not empty, reasonable length, alphanumeric with some special chars
  return typeof token === 'string' && 
         token.length > 100 && 
         token.length < 500 && 
         /^[a-zA-Z0-9:_-]+$/.test(token);
}

/**
 * Subscribe devices to a topic
 * @param tokens Array of FCM tokens
 * @param topic Topic name
 * @returns Promise<any> - Topic management response
 */
export async function subscribeToTopic(
  tokens: string[],
  topic: string
): Promise<any> {
  try {
    const messaging = getMessaging();
    const response = await messaging.subscribeToTopic(tokens, topic);
    console.log(`📱 Subscribed ${response.successCount} devices to topic: ${topic}`);
    return response;
  } catch (error) {
    console.error('❌ Failed to subscribe to topic:', error);
    throw error;
  }
}

/**
 * Unsubscribe devices from a topic
 * @param tokens Array of FCM tokens
 * @param topic Topic name
 * @returns Promise<any> - Topic management response
 */
export async function unsubscribeFromTopic(
  tokens: string[],
  topic: string
): Promise<any> {
  try {
    const messaging = getMessaging();
    const response = await messaging.unsubscribeFromTopic(tokens, topic);
    console.log(`📱 Unsubscribed ${response.successCount} devices from topic: ${topic}`);
    return response;
  } catch (error) {
    console.error('❌ Failed to unsubscribe from topic:', error);
    throw error;
  }
}

/**
 * Send email placeholder - TODO: Implement proper email service
 * @param emailData Email data object
 * @returns Promise<void>
 */
export async function sendEmail(emailData: any): Promise<void> {
  console.log('📧 Email would be sent:', emailData);
  // TODO: Implement proper email sending with nodemailer
}
