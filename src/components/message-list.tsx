'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Message } from '@/lib/types';
import { MessageBubble } from './message-bubble';

interface MessageListProps {
  messages: Message[];
  contactAvatar: string;
  onImagine: (prompt: string, baseImage: string) => void;
}

export function MessageList({ messages, contactAvatar, onImagine }: MessageListProps) {
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
      <div className="p-4 space-y-4">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            contactAvatar={contactAvatar}
            isFirstInGroup={index === 0 || messages[index - 1].sender !== message.sender}
            onImagine={onImagine}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
