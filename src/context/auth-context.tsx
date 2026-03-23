
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import { ref, set, onValue, off, serverTimestamp, onDisconnect, update, get } from 'firebase/database';
import { getMessaging, getToken } from 'firebase/messaging';
import { onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';
import { vapidKey } from '@/lib/firebase-env';
import { isMedianApp, loginMedianPushUser, logoutMedianPushUser, requestMedianPushRegistration } from '@/lib/median';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phoneNumber: string, name: string, customToken?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'chirpchat_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Register Service Worker for PWA, but NOT if inside Median wrapper
    if ('serviceWorker' in navigator && typeof window.median === 'undefined') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        }).catch(error => {
          console.log('Service Worker registration failed:', error);
        });
      });
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
        const parsedStoredUser =
          storedUser && storedUser !== 'undefined' && storedUser !== 'null'
            ? (JSON.parse(storedUser) as User)
            : null;

        if (!firebaseUser) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setUser(null);
          return;
        }

        if (parsedStoredUser?.phoneNumber === firebaseUser.uid) {
          setUser(parsedStoredUser);
          return;
        }

        const userSnapshot = await get(ref(db, `users/${firebaseUser.uid}`));
        if (userSnapshot.exists()) {
          const userData = { ...(userSnapshot.val() as Omit<User, 'phoneNumber'>), phoneNumber: firebaseUser.uid };
          localStorage.setItem(
            AUTH_STORAGE_KEY,
            JSON.stringify({ phoneNumber: userData.phoneNumber, name: userData.name })
          );
          setUser(userData);
          return;
        }

        localStorage.removeItem(AUTH_STORAGE_KEY);
        setUser(null);
      } catch (error) {
        console.error('Could not restore the authenticated user', error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);
  
  useEffect(() => {
    if (user) {
      const userStatusRef = ref(db, `users/${user.phoneNumber}/status`);
      const userRef = ref(db, `users/${user.phoneNumber}`);

      const isOnline = {
        online: true,
        lastSeen: serverTimestamp(),
      };
      const isOffline = {
        online: false,
        lastSeen: serverTimestamp(),
      };
      
      const connectedRef = ref(db, '.info/connected');
      
      const listener = onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
          onDisconnect(userStatusRef).set(isOffline).then(() => {
             set(userStatusRef, isOnline);
          });
        }
      });
      
      // Request notification permission and get FCM token
      const requestNotificationPermission = async () => {
        try {
          if (isMedianApp()) {
            await requestMedianPushRegistration();
            const oneSignalInfo = await loginMedianPushUser(user.phoneNumber);

            await update(userRef, {
              pushProvider: 'median-onesignal',
              oneSignalExternalId: user.phoneNumber,
              oneSignalId: oneSignalInfo?.oneSignalId ?? null,
              oneSignalSubscriptionId: oneSignalInfo?.subscription?.id ?? null,
              fcmToken: null,
            });
          } else {
            // Fallback for standard web browsers
            const messaging = getMessaging();
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              const currentToken = await getToken(messaging, { vapidKey });
              if (currentToken) {
                await update(userRef, {
                  fcmToken: currentToken,
                  pushProvider: 'fcm',
                  oneSignalExternalId: null,
                  oneSignalId: null,
                  oneSignalSubscriptionId: null,
                });
              } else {
                console.log('No registration token available. Request permission to generate one.');
              }
            }
          }
        } catch (error) {
          console.error('An error occurred while retrieving token. ', error);
        }
      }
      
      requestNotificationPermission();

      return () => {
        if (user?.phoneNumber) {
            const userStatusOnUnmountRef = ref(db, `users/${user.phoneNumber}/status`);
            set(userStatusOnUnmountRef, isOffline);
        }
        off(connectedRef, 'value', listener);
      };
    }
  }, [user]);


  const login = async (phoneNumber: string, name: string, customToken?: string) => {
    try {
      if (customToken) {
        await signInWithCustomToken(auth, customToken);
      }
      const userData = { phoneNumber, name };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      router.push('/');
    } catch (error) {
      console.error("Could not set user in localStorage", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (user?.phoneNumber) {
         const userStatusRef = ref(db, `users/${user.phoneNumber}/status`);
         await set(userStatusRef, { online: false, lastSeen: serverTimestamp() });

         if (isMedianApp()) {
          await logoutMedianPushUser();
         }
      }
      await signOut(auth);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error("Could not remove user from localStorage", error);
    }
  };

  const value = { user, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
