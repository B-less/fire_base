
'use client';

import { useEffect } from 'react';
import { onMessageListener } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export function NotificationHandler() {
    const { toast } = useToast();

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            const unsubscribe = onMessageListener().then((payload: any) => {
                toast({
                    title: payload.notification.title,
                    description: payload.notification.body,
                });
            });
            return () => {
                // This is a simplified cleanup. In a real app, you might manage this listener differently.
                // The listener itself is a one-time promise resolver, so a new one is created on re-render if needed.
            };
        }
    }, [toast]);
    
    return null;
}
