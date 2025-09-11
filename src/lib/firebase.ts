
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getMessaging, onMessage } from "firebase/messaging";
import { getAuth } from "firebase/auth";
import { firebaseConfig } from "./firebase-env";


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);
const auth = getAuth(app);

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

export { db, auth, onMessageListener };
