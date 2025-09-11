
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getAuth } from "firebase/auth";
import { firebaseConfig, vapidKey } from "./firebase-env";


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);
const auth = getAuth(app);

const getFCMToken = async () => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && "Notification" in window) {
        try {
            const messaging = getMessaging(app);
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const token = await getToken(messaging, { vapidKey: vapidKey });
                console.log('FCM Token:', token);
                return token;
            } else {
                console.log('Notification permission not granted.');
                return null;
            }
        } catch (error) {
            console.error('An error occurred while retrieving token. ', error);
            return null;
        }
    }
    return null;
};

const onMessageListener = () =>
  new Promise((resolve) => {
     if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        try {
            const messaging = getMessaging(app);
            onMessage(messaging, (payload) => {
                resolve(payload);
            });
        } catch (error) {
            console.error('An error occurred while setting up message listener. ', error);
            resolve(null);
        }
     } else {
         resolve(null);
     }
  });

export { db, auth, getFCMToken, onMessageListener };
