
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import type { User } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, set, onValue, off, serverTimestamp, onDisconnect, update } from 'firebase/database';
import { getMessaging, getToken } from 'firebase/messaging';
import { vapidKey } from '@/lib/firebase-env';
import { isMedianApp, loginMedianPushUser, logoutMedianPushUser, requestMedianPushRegistration } from '@/lib/median';
import { encodePushTokenKey } from '@/lib/push';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sessionToken: string | null;
  login: (phoneNumber: string, name: string, sessionToken?: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'chirpchat_user';
const PUSH_TOKEN_STORAGE_KEY = 'chirpchat_push_token';

type StoredAuthUser = {
  phoneNumber: string;
  name: string;
  sessionToken?: string | null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        try {
          const parsedUser = JSON.parse(storedUser) as StoredAuthUser;
          setUser({
            phoneNumber: parsedUser.phoneNumber,
            name: parsedUser.name,
          });
          setSessionToken(parsedUser.sessionToken ?? null);
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
    
    // Register Service Worker for PWA, but not inside native wrappers.
    if ('serviceWorker' in navigator && typeof window.median === 'undefined' && !Capacitor.isNativePlatform()) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        }).catch(error => {
          console.log('Service Worker registration failed:', error);
        });
      });
    }

  }, []);
  
  useEffect(() => {
    if (user) {
      const userStatusRef = ref(db, `users/${user.phoneNumber}/status`);
      const userRef = ref(db, `users/${user.phoneNumber}`);
      const listenerHandles: Array<{ remove: () => Promise<void> }> = [];

      const isOnline = {
        online: true,
        lastSeen: serverTimestamp(),
      };
      const isOffline = {
        online: false,
        lastSeen: serverTimestamp(),
      };
      
      const connectedRef = ref(db, '.info/connected');

      const persistFcmToken = async (token: string, platform: string) => {
        if (!token) {
          return;
        }

        localStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
        await update(userRef, {
          fcmToken: token,
          [`fcmTokens/${encodePushTokenKey(token)}`]: {
            token,
            platform,
            updatedAt: serverTimestamp(),
          },
          pushProvider: 'fcm',
          oneSignalExternalId: null,
          oneSignalId: null,
          oneSignalSubscriptionId: null,
        });
      };
      
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
          } else if (Capacitor.isNativePlatform()) {
            let permissionStatus = await PushNotifications.checkPermissions();
            if (permissionStatus.receive === 'prompt') {
              permissionStatus = await PushNotifications.requestPermissions();
            }

            if (permissionStatus.receive !== 'granted') {
              console.log('Push notification permission was not granted on native app.');
              return;
            }

            listenerHandles.push(
              await PushNotifications.addListener('registration', (token) => {
                void persistFcmToken(token.value, Capacitor.getPlatform());
              })
            );

            listenerHandles.push(
              await PushNotifications.addListener('registrationError', (error) => {
                console.error('Native push registration failed:', error);
              })
            );

            listenerHandles.push(
              await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
                const senderPhoneNumber =
                  event.notification.data?.senderPhoneNumber ||
                  event.notification.data?.contactId;

                if (typeof senderPhoneNumber === 'string' && senderPhoneNumber) {
                  router.push(`/?contact=${encodeURIComponent(senderPhoneNumber)}`);
                } else {
                  router.push('/');
                }
              })
            );

            await PushNotifications.register();
          } else {
            // Fallback for standard web browsers
            const messaging = getMessaging();
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              const currentToken = await getToken(messaging, { vapidKey });
              if (currentToken) {
                await persistFcmToken(currentToken, 'web');
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
        listenerHandles.forEach((handle) => {
          void handle.remove();
        });
        off(connectedRef, 'value', listener);
      };
    }
  }, [user, router]);


  const login = (phoneNumber: string, name: string, nextSessionToken?: string | null) => {
    try {
      const userData: StoredAuthUser = {
        phoneNumber,
        name,
        sessionToken: nextSessionToken ?? sessionToken ?? null,
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      setUser({ phoneNumber, name });
      setSessionToken(userData.sessionToken ?? null);
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

         const storedPushToken = localStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
         if (storedPushToken) {
          await update(ref(db, `users/${user.phoneNumber}`), {
            [`fcmTokens/${encodePushTokenKey(storedPushToken)}`]: null,
          });
          localStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
         }

         if (isMedianApp()) {
          await logoutMedianPushUser();
         }
      }
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      setSessionToken(null);
      router.push('/login');
    } catch (error) {
      console.error("Could not remove user from localStorage", error);
    }
  };

  const value = { user, loading, sessionToken, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
