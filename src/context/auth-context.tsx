
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, set, onValue, off, serverTimestamp, onDisconnect, update } from 'firebase/database';
import { getMessaging, getToken } from 'firebase/messaging';
import { vapidKey } from '@/lib/firebase-env';

// For Median.co integration
declare global {
  interface Window {
    median: any;
  }
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phoneNumber: string, name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'chirpchat_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        try {
          setUser(JSON.parse(storedUser));
        } catch (jsonError) {
          console.error("Failed to parse user from localStorage", jsonError);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch (error)
    {
      console.error("Could not access localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (user?.phoneNumber) {
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
          // Check if running inside Median.co wrapper
          if (window.median && window.median.android && window.median.android.fcm) {
             window.median.android.fcm.getRegistrationId(async (token: string) => {
                if (token) {
                  console.log("Median FCM Token:", token);
                  await update(userRef, { fcmToken: token });
                }
             });
          } else {
            // Fallback for standard web browsers
            const messaging = getMessaging();
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              const currentToken = await getToken(messaging, { vapidKey });
              if (currentToken) {
                await update(userRef, { fcmToken: currentToken });
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
  }, [user?.phoneNumber]);


  const login = (phoneNumber: string, name: string) => {
    try {
      const userData = { phoneNumber, name };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      router.push('/');
    } catch (error) {
      console.error("Could not set user in localStorage", error);
    }
  };

  const logout = async () => {
    try {
      if (user?.phoneNumber) {
         const userStatusRef = ref(db, `users/${user.phoneNumber}/status`);
         await set(userStatusRef, { online: false, lastSeen: serverTimestamp() });
      }
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
