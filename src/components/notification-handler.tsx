
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
                // Not a real unsubscribe, but fulfills the need for a cleanup function.
                // The listener itself is a one-time promise resolver.
            };
        }
    }, [toast]);
    
    return null;
}
