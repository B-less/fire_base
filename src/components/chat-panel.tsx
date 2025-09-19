
'use client';

import { useState } from 'react';
import type { Contact, Message, User } from '@/lib/types';
import { ChatHeader } from './chat-header';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { SmartReplySuggestions } from './smart-reply-suggestions';
import { generateImage } from '@/ai/flows/image-generation-flow';
import { generateVideo } from '@/ai/flows/video-generation-flow';
import { useToast } from '@/hooks/use-toast';
import { MediaStudio } from './media-studio';
import type { ThenableReference } from 'firebase/database';
import { useAuth } from '@/context/auth-context';

interface ChatPanelProps {
  contactId: string;
  messages: Message[];
  onSendMessage: (content: string, media?: string, isGenerating?: boolean) => ThenableReference | undefined;
  onUpdateMessage: (dbKey: string, content: string, media?: string, isGenerating?: boolean) => void;
  onDeleteMessage: (dbKey?: string) => void;
  onBack: () => void;
  smartReplies: string[];
  setSmartReplies: (replies: string[]) => void;
  isLoading?: boolean;
  onTypingChange: (isTyping: boolean) => void;
}

export function ChatPanel({ 
  contactId,
  messages, 
  onSendMessage, 
  onUpdateMessage, 
  onDeleteMessage, 
  onBack, 
  smartReplies, 
  setSmartReplies, 
  isLoading = false, 
  onTypingChange 
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const [mediaFile, setMediaFile] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAIChat = contactId === 'ai-assistant';

  const handleImagine = async (prompt: string, baseImage?: string) => {
    setInputText('');
    setSmartReplies([]);
    
    // Create a temporary message and update it
    const messageRef = onSendMessage(`Generating image: "${prompt}"...`, baseImage, true)
    if (!messageRef || !messageRef.key) {
        toast({
            title: "Error",
            description: "Could not send message. Please try again.",
            variant: "destructive",
        });
        return;
    }
    
    const messageDbKey = messageRef.key;
    
    try {
      const result = await generateImage({ prompt, baseImage, userId: user?.phoneNumber });
      onUpdateMessage(messageDbKey, prompt, result.imageUrl, false);
    } catch (error) {
      console.error("Error generating image:", error);
      const failMessage = `Failed to generate image for prompt: "${prompt}"`;
      onUpdateMessage(messageDbKey, failMessage, baseImage, false);
      toast({
        title: "Image Generation Failed",
        description: "Sorry, I couldn't create an image for that prompt. Please try another one.",
        variant: "destructive",
      });
    }
  }

  const handleVideoGenerate = async (prompt: string, baseMedia?: string) => {
    setInputText('');
    setSmartReplies([]);
    
    // For regular chats, create a temp message
    const messageRef = onSendMessage(`Generating video: "${prompt}"...`, baseMedia, true);
    if (!messageRef || !messageRef.key) {
      toast({
          title: "Error",
          description: "Could not send message. Please try again.",
          variant: "destructive",
      });
      return;
    }
    
    const messageDbKey = messageRef.key;
    
    try {
      const result = await generateVideo({ prompt, baseMedia, userId: user?.phoneNumber });
      onUpdateMessage(messageDbKey, prompt, result.videoUrl, false);
    } catch (error) {
      console.error("Error generating video:", error);
      const failMessage = `Failed to generate video for prompt: "${prompt}"`;
      onUpdateMessage(messageDbKey, failMessage, baseMedia, false);
      toast({
        title: "Video Generation Failed",
        description: "Sorry, I couldn't create a video for that prompt. Please try another one.",
        variant: "destructive",
      });
    }
  }

  const handleSend = (type: 'text' | 'image' | 'video' = 'text') => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput && type === 'text' && !mediaFile) return;


    if (isAIChat) {
      if (type === 'image') {
        handleImagine(trimmedInput);
      } else if (type === 'video') {
        handleVideoGenerate(trimmedInput);
      } else {
        onSendMessage(trimmedInput);
      }
    } else {
       if (mediaFile) {
        // Optimistic UI: send with isGenerating: true for user-to-user media
        onSendMessage(trimmedInput, mediaFile, true);
      } else {
        onSendMessage(trimmedInput);
      }
    }
    
    setInputText('');
    setSmartReplies([]);
    setMediaFile(null);
  };

  const handleSelectReply = (reply: string) => {
    onSendMessage(reply);
    setInputText('');
    setSmartReplies([]);
  };

  const handleFileSelect = (url: string) => {
    setMediaFile(url);
  }
  
  const handleStudioSend = (mediaUrl: string) => {
    // Optimistic UI for media sent from the studio
    onSendMessage(inputText, mediaUrl, true);
    setInputText('');
    setMediaFile(null);
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    onTypingChange(e.target.value.length > 0);
  }

  return (
    <div className="flex h-full flex-col bg-muted/30">
      <ChatHeader contactId={contactId} onBack={onBack} />
      <MessageList messages={messages} contactId={contactId} onImagine={handleImagine} onDelete={onDeleteMessage} isLoading={isLoading} />
      <div className="p-4 pt-2">
        {!isAIChat && smartReplies.length > 0 && <SmartReplySuggestions suggestions={smartReplies} onSelectReply={handleSelectReply} />}
        <ChatInput
          value={inputText}
          onChange={handleTextChange}
          onSend={handleSend}
          onFileSelect={handleFileSelect}
          isAIChat={isAIChat}
          onTypingChange={onTypingChange}
        />
      </div>
      {mediaFile && (
        <MediaStudio 
            mediaUrl={mediaFile}
            onClose={() => setMediaFile(null)}
            onSend={handleStudioSend}
            generateImage={(input) => generateImage({...input, userId: user?.phoneNumber})}
            generateVideo={(input) => generateVideo({...input, userId: user?.phoneNumber})}
        />
      )}
    </div>
  );
}
