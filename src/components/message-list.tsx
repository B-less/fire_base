
'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Message } from '@/lib/types';
import { MessageBubble } from './message-bubble';
import { Skeleton } from './ui/skeleton';

interface MessageListProps {
  messages: Message[];
  contactAvatar: string;
  onImagine: (prompt: string, baseImage: string) => void;
  onDelete: (messageId: number, dbKey?: string) => void;
  isLoading?: boolean;
}

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

export function MessageList({ messages, contactAvatar, onImagine, onDelete, isLoading = false }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  return (
    <ScrollArea className="flex-1" ref={scrollAreaRef}>
      {isLoading ? (
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
