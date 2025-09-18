
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, query, limitToLast, off } from 'firebase/database';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from './ui/button';
import { Megaphone, X } from 'lucide-react';
import type { BroadcastMessage } from '@/lib/types';
import { cn } from '@/lib/utils';


export function BroadcastBanner() {
  const [broadcast, setBroadcast] = useState<BroadcastMessage | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const broadcastsRef = query(ref(db, 'broadcasts'), limitToLast(1));

    const listener = onValue(broadcastsRef, (snapshot) => {
      if (snapshot.exists()) {
        const broadcastsData = snapshot.val();
        const broadcastKey = Object.keys(broadcastsData)[0];
        const latestBroadcast = { id: broadcastKey, ...broadcastsData[broadcastKey]};
        
        // Check if this broadcast has been dismissed before
        const dismissed = localStorage.getItem(`dismissed_broadcast_${latestBroadcast.id}`);
        if (!dismissed) {
          setBroadcast(latestBroadcast);
          setIsVisible(true);
        }
      }
    });

    return () => {
      off(broadcastsRef, 'value', listener);
    };
  }, []);

  const handleDismiss = () => {
    if (broadcast) {
      localStorage.setItem(`dismissed_broadcast_${broadcast.id}`, 'true');
    }
    setIsVisible(false);
  };

  if (!broadcast || !isVisible) {
    return null;
  }

  return (
    <div className={cn("p-2", !isVisible && "hidden")}>
        <Alert className="flex items-center justify-between bg-primary/10 border-primary/30 text-primary-foreground">
           <div className="flex items-center gap-3">
             <Megaphone className="h-5 w-5 text-primary flex-shrink-0" />
             <AlertDescription className="text-sm text-primary">{broadcast.message}</AlertDescription>
           </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary/80 hover:text-primary hover:bg-primary/20" onClick={handleDismiss}>
                <X className="h-4 w-4" />
                <span className="sr-only">Dismiss</span>
            </Button>
        </Alert>
    </div>
  );
}

    