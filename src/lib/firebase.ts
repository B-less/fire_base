
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);
const auth = getAuth(app);

const getFCMToken = async () => {
    try {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            const messaging = getMessaging(app);
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const token = await getToken(messaging, { vapidKey: "BM2jc26u4cps59zJPnXqUeHApp7e0EuMT3na9c1uY2nmq3QI3SSs8HTDXJ_EKxEn6daDDhjT9IJjeYgAo0AD1Us" });
                console.log('FCM Token:', token);
                return token;
            } else {
                console.log('Notification permission not granted.');
                return null;
            }
        }
        return null;
    } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
        return null;
    }
};

const onMessageListener = () =>
  new Promise((resolve) => {
     if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const messaging = getMessaging(app);
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
     }
  });

export { db, auth, getFCMToken, onMessageListener };
