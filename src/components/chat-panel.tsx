'use client';

import { useState } from 'react';
import type { Contact } from '@/lib/types';
import { ChatHeader } from './chat-header';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { SmartReplySuggestions } from './smart-reply-suggestions';

interface ChatPanelProps {
  contact: Contact;
  onSendMessage: (content: string, image?: string) => void;
  onBack?: () => void;
  smartReplies: string[];
  setSmartReplies: (replies: string[]) => void;
}

export function ChatPanel({ contact, onSendMessage, onBack, smartReplies, setSmartReplies }: ChatPanelProps) {
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
      setSmartReplies([]);
    }
  };

  const handleSelectReply = (reply: string) => {
    onSendMessage(reply);
    setInputText('');
    setSmartReplies([]);
  };

  return (
    <div className="flex h-full flex-col bg-muted/30">
      <ChatHeader contact={contact} onBack={onBack} />
      <MessageList messages={contact.messages} contactAvatar={contact.avatar} />
      <div className="p-4 pt-2">
        <SmartReplySuggestions suggestions={smartReplies} onSelectReply={handleSelectReply} />
        <ChatInput
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onSend={handleSend}
          onImageSend={(url) => onSendMessage('', url)}
        />
      </div>
    </div>
  );
}
