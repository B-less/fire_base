
'use client';

import { useState } from 'react';
import type { Contact } from '@/lib/types';
import { ChatHeader } from './chat-header';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { SmartReplySuggestions } from './smart-reply-suggestions';
import { generateImage } from '@/ai/flows/image-generation-flow';
import { generateVideo } from '@/ai/flows/video-generation-flow';
import { useToast } from '@/hooks/use-toast';
import { MediaStudio } from './media-studio';
import type { ThenableReference } from 'firebase/database';

interface ChatPanelProps {
  contact: Contact;
  onSendMessage: (content: string, image?: string, isGenerating?: boolean) => ThenableReference | undefined;
  onUpdateMessage: (dbKey: string, content: string, image?: string, isGenerating?: boolean) => void;
  onDeleteMessage: (messageId: number, dbKey?: string) => void;
  onBack: () => void;
  smartReplies: string[];
  setSmartReplies: (replies: string[]) => void;
  isLoading?: boolean;
}

export function ChatPanel({ contact, onSendMessage, onUpdateMessage, onDeleteMessage, onBack, smartReplies, setSmartReplies, isLoading = false }: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const [mediaFile, setMediaFile] = useState<string | null>(null);
  const { toast } = useToast();
  const isAIChat = contact.id === 'ai-assistant';

  const handleImagine = async (prompt: string, baseImage?: string) => {
    setInputText('');
    setSmartReplies([]);
    
    // First, send a message to the database that is in a "generating" state.
    // This returns a reference with the key of the new message.
    const messageRef = onSendMessage(`Generating image: "${prompt}"...`, baseImage, true);
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
      const result = await generateImage({ prompt, baseImage });
      // Now, update the message in the database with the generated image.
      onUpdateMessage(messageDbKey, prompt, result.imageUrl, false);
    } catch (error) {
      console.error("Error generating image:", error);
      // Update the message to show the error.
      onUpdateMessage(messageDbKey, `Failed to generate image: "${prompt}"`, undefined, false);
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
      const result = await generateVideo({ prompt, baseMedia });
      onUpdateMessage(messageDbKey, prompt, result.videoUrl, false);
    } catch (error) {
      console.error("Error generating video:", error);
      onUpdateMessage(messageDbKey, `Failed to generate video: "${prompt}"`, undefined, false);
      toast({
        title: "Video Generation Failed",
        description: "Sorry, I couldn't create a video for that prompt. Please try another one.",
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
    } else if (trimmedInput.startsWith('/video ')) {
        const prompt = trimmedInput.substring(7);
        handleVideoGenerate(prompt);
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

  const handleFileSelect = (url: string) => {
    if (inputText.trim().startsWith('/imagine ')) {
       const prompt = inputText.trim().substring(9);
       handleImagine(prompt, url);
       setInputText('');
    } else if (inputText.trim().startsWith('/video ')) {
        const prompt = inputText.trim().substring(7);
        handleVideoGenerate(prompt, url);
        setInputText('');
    } else {
      setMediaFile(url);
    }
  }
  
  const handleStudioSend = (mediaUrl: string) => {
    onSendMessage('', mediaUrl);
    setMediaFile(null);
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
          onFileSelect={handleFileSelect}
          isAIChat={isAIChat}
        />
      </div>
      {mediaFile && (
        <MediaStudio 
            mediaUrl={mediaFile}
            onClose={() => setMediaFile(null)}
            onSend={handleStudioSend}
            generateImage={generateImage}
            generateVideo={generateVideo}
        />
      )}
    </div>
  );
}

    
