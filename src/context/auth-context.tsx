
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { getFCMToken, db } from '@/lib/firebase';
import { ref, set, onValue, off, serverTimestamp, onDisconnect } from 'firebase/database';


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

  const setupNotifications = async (user: User) => {
    try {
      const token = await getFCMToken();
      if (token && user?.phoneNumber) {
        // Save the token to the user's profile in the database
        const tokenRef = ref(db, `users/${user.phoneNumber}/fcmToken`);
        await set(tokenRef, token);
        console.log('FCM token saved to database for user:', user.phoneNumber);
      }
    } catch (error) {
      console.error('Could not set up notifications:', error);
    }
  };
  
  useEffect(() => {
    if (user?.phoneNumber) {
      setupNotifications(user);

      // Setup presence system
      const userStatusRef = ref(db, `users/${user.phoneNumber}/status`);
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

      return () => {
        off(connectedRef, 'value', listener);
        set(userStatusRef, isOffline); // Set offline when component unmounts (e.g., logout)
      };
    }
  }, [user]);


  const login = (phoneNumber: string, name: string) => {
    try {
      const userData = { phoneNumber, name };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      // Notifications and presence are handled by useEffect
      router.push('/');
    } catch (error) {
      console.error("Could not set user in localStorage", error);
    }
  };

  const logout = () => {
    try {
      if (user?.phoneNumber) {
         const userStatusRef = ref(db, `users/${user.phoneNumber}/status`);
         set(userStatusRef, { online: false, lastSeen: serverTimestamp() });
         const tokenRef = ref(db, `users/${user.phoneNumber}/fcmToken`);
         set(tokenRef, null); // Clear token on logout
         console.log('FCM token removed from database for user:', user.phoneNumber);
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
