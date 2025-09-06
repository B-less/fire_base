
'use client';

import { useState } from 'react';
import type { Contact } from '@/lib/types';
import { ChatHeader } from './chat-header';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { SmartReplySuggestions } from './smart-reply-suggestions';
import { generateImage } from '@/ai/flows/image-generation-flow';
import { useToast } from '@/hooks/use-toast';

interface ChatPanelProps {
  contact: Contact;
  onSendMessage: (content: string, image?: string, isGenerating?: boolean) => void;
  onUpdateMessage: (messageId: number, content: string, image?: string, isGenerating?: boolean) => void;
  onDeleteMessage: (messageId: number, dbKey?: string) => void;
  onBack?: () => void;
  smartReplies: string[];
  setSmartReplies: (replies: string[]) => void;
  isLoading?: boolean;
}

export function ChatPanel({ contact, onSendMessage, onUpdateMessage, onDeleteMessage, onBack, smartReplies, setSmartReplies, isLoading = false }: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const { toast } = useToast();
  const isAIChat = contact.id === 'ai-assistant';

  const handleImagine = async (prompt: string, baseImage?: string) => {
    const tempMessageId = Date.now();
    // For both AI and real users, we add a temporary message which will be updated.
    // This provides optimistic UI.
    onSendMessage(`Generating image: "${prompt}"...`, baseImage, true);
    
    setInputText('');
    setSmartReplies([]);
    
    try {
      const result = await generateImage({ prompt, baseImage });
      onUpdateMessage(tempMessageId, prompt, result.imageUrl, false);
    } catch (error) {
      console.error("Error generating image:", error);
      onUpdateMessage(tempMessageId, `Failed to generate image: "${prompt}"`, undefined, false);
      toast({
        title: "Image Generation Failed",
        description: "Sorry, I couldn't create an image for that prompt. Please try another one.",
        variant: "destructive",
      });
    }
  }

  const handleSend = () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput) return;

    if (trimmedInput.startsWith('/imagine ')) {
      const prompt = trimmedInput.substring(9);
      handleImagine(prompt);
    } else {
        onSendMessage(trimmedInput);
    }

    setInputText('');
    setSmartReplies([]);
  };

  const handleSelectReply = (reply: string) => {
    onSendMessage(reply);
    setInputText('');
    setSmartReplies([]);
  };

  const handleSendImage = (url: string) => {
    // Check if the current input is an imagine command
    if (inputText.trim().startsWith('/imagine ')) {
       const prompt = inputText.trim().substring(9);
       handleImagine(prompt, url);
       setInputText('');
    } else {
      // Otherwise, send as a normal image message
      onSendMessage('', url);
    }
  }

  return (
    <div className="flex h-full flex-col bg-muted/30">
      <ChatHeader contact={contact} onBack={onBack} />
      <MessageList messages={contact.messages} contactAvatar={contact.avatar} onImagine={handleImagine} onDelete={onDeleteMessage} isLoading={isLoading} />
      <div className="p-4 pt-2">
        {!isAIChat && <SmartReplySuggestions suggestions={smartReplies} onSelectReply={handleSelectReply} />}
        <ChatInput
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onSend={handleSend}
          onImageSend={handleSendImage}
          isAIChat={isAIChat}
        />
      </div>
    </div>
  );
}
