
'use client';

import { useState } from 'react';
import type { Contact, Message } from '@/lib/types';
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
  messages: Message[];
  onSendMessage: (content: string, media?: string, isGenerating?: boolean) => ThenableReference | undefined;
  onUpdateMessage: (dbKey: string, content: string, media?: string, isGenerating?: boolean) => void;
  onDeleteMessage: (messageId: number, dbKey?: string) => void;
  onBack: () => void;
  smartReplies: string[];
  setSmartReplies: (replies: string[]) => void;
  isLoading?: boolean;
  onTypingChange: (isTyping: boolean) => void;
}

export function ChatPanel({ 
  contact, 
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
  const isAIChat = contact.id === 'ai-assistant';

  const handleImagine = async (prompt: string, baseImage?: string) => {
    setInputText('');
    setSmartReplies([]);
    
    // First, send a message to the database that is in a "generating" state.
    // This returns a reference with the key of the new message.
    let messageRef: ThenableReference | undefined;
    if (isAIChat) {
      onSendMessage(`Generating image: "${prompt}"...`, baseImage, true)
    } else {
      messageRef = onSendMessage(`Generating image: "${prompt}"...`, baseImage, true);
      if (!messageRef || !messageRef.key) {
          toast({
              title: "Error",
              description: "Could not send message. Please try again.",
              variant: "destructive",
          });
          return;
      }
    }
    const messageDbKey = messageRef?.key;
    
    try {
      const result = await generateImage({ prompt, baseImage });
      if(messageDbKey) {
        onUpdateMessage(messageDbKey, prompt, result.imageUrl, false);
      } else if (isAIChat) {
        onSendMessage(prompt, result.imageUrl, false);
      }
    } catch (error) {
      console.error("Error generating image:", error);
      const failMessage = `Failed to generate image for prompt: "${prompt}"`;
      if(messageDbKey){
         onUpdateMessage(messageDbKey, failMessage, baseImage, false);
      } else if (isAIChat) {
        // Find the "generating" message and replace it with a failure message.
        onSendMessage(failMessage, undefined, false);
      }
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
    
    let messageRef: ThenableReference | undefined;
    if (isAIChat) {
      onSendMessage(`Generating video: "${prompt}"...`, baseMedia, true)
    } else {
       messageRef = onSendMessage(`Generating video: "${prompt}"...`, baseMedia, true);
       if (!messageRef || !messageRef.key) {
        toast({
            title: "Error",
            description: "Could not send message. Please try again.",
            variant: "destructive",
        });
        return;
      }
    }
    const messageDbKey = messageRef?.key;
    
    try {
      const result = await generateVideo({ prompt, baseMedia });
      if(messageDbKey) {
        onUpdateMessage(messageDbKey, prompt, result.videoUrl, false);
      } else if (isAIChat) {
        onSendMessage(prompt, result.videoUrl, false);
      }
    } catch (error) {
      console.error("Error generating video:", error);
      const failMessage = `Failed to generate video for prompt: "${prompt}"`;
      if(messageDbKey){
        onUpdateMessage(messageDbKey, failMessage, baseMedia, false);
      } else if (isAIChat) {
        onSendMessage(failMessage, undefined, false);
      }
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
        onSendMessage(trimmedInput, mediaFile);
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
    // This is for regular file sharing, not generation
    setMediaFile(url);
  }
  
  const handleStudioSend = (mediaUrl: string) => {
    onSendMessage(inputText, mediaUrl);
    setInputText('');
    setMediaFile(null);
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    onTypingChange(e.target.value.length > 0);
  }


  return (
    <div className="flex h-full flex-col bg-muted/30">
      <ChatHeader contact={contact} onBack={onBack} />
      <MessageList messages={messages} contactAvatar={contact.avatar} onImagine={handleImagine} onDelete={onDeleteMessage} isLoading={isLoading} />
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
            generateImage={generateImage}
            generateVideo={generateVideo}
        />
      )}
    </div>
  );
}

    