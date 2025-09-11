
'use client';

import { useEffect } from 'react';
import { onMessageListener } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export function NotificationHandler() {
    const { toast } = useToast();

    useEffect(() => {
        // We only want to listen for messages if we are in a browser context
        // and notifications are supported.
        if (typeof window !== 'undefined' && "Notification" in window) {
            onMessageListener()
            .then((payload: any) => {
                if(payload){
                    toast({
                        title: payload.notification.title,
                        description: payload.notification.body,
                    });
                }
            })
            .catch(err => console.log('failed to listen for message', err));
        }
    }, [toast]);
    
    return null;
}
