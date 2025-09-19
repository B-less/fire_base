
'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Message, User } from '@/lib/types';
import { MessageBubble } from './message-bubble';
import { Skeleton } from './ui/skeleton';
import { db } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';

interface MessageListProps {
  messages: Message[];
  contactId: string;
  onImagine: (prompt: string, baseImage: string) => void;
  onDelete: (dbKey?: string) => void;
  isLoading?: boolean;
}

const AI_CONTACT_ID = 'ai-assistant';

function MessageListSkeleton() {
    return (
        <div className="p-4 space-y-4">
            <div className="flex items-end gap-2 justify-start">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-10 w-48 rounded-lg" />
            </div>
             <div className="flex items-end gap-2 justify-end">
                <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
             <div className="flex items-end gap-2 justify-start">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-14 w-64 rounded-lg" />
            </div>
            <div className="flex items-end gap-2 justify-end">
                <Skeleton className="h-10 w-40 rounded-lg" />
            </div>
             <div className="flex items-end gap-2 justify-end">
                <Skeleton className="h-12 w-24 rounded-lg" />
            </div>
        </div>
    )
}

export function MessageList({ messages, contactId, onImagine, onDelete, isLoading = false }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [contactUser, setContactUser] = useState<User | null>(null);
  const [isContactLoading, setIsContactLoading] = useState(true);

  const isAiAssistant = contactId === AI_CONTACT_ID;

  useEffect(() => {
    if (isAiAssistant || !contactId) {
        setIsContactLoading(false);
        return;
    }

    setIsContactLoading(true);
    const userRef = ref(db, `users/${contactId}`);
    const listener = onValue(userRef, (snapshot) => {
        if(snapshot.exists()) {
            setContactUser({ ...snapshot.val(), phoneNumber: contactId });
        }
        setIsContactLoading(false);
    });

    return () => off(userRef, 'value', listener);
  }, [contactId, isAiAssistant]);

  const contactAvatar = useMemo(() => {
      if (isAiAssistant) return '/robot-icon.svg';
      return contactUser?.profilePicture || `https://picsum.photos/seed/${contactId}/100/100`;
  }, [contactUser, contactId, isAiAssistant]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const combinedLoading = isLoading || (isContactLoading && !isAiAssistant);

  return (
    <ScrollArea className="flex-1" ref={scrollAreaRef}>
      {combinedLoading ? (
        <MessageListSkeleton />
      ) : (
        <div className="p-4 space-y-4">
            {messages.map((message, index) => (
            <MessageBubble
                key={`${message.db_key || message.id}-${index}`}
                message={message}
                contactAvatar={contactAvatar}
                isFirstInGroup={index === 0 || messages[index - 1].sender !== message.sender}
                onImagine={onImagine}
                onDelete={onDelete}
            />
            ))}
        </div>
      )}
    </ScrollArea>
  );
}

    