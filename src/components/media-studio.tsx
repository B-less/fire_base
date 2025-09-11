
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { Input } from './ui/input';
import { Loader2, Sparkles, Send, X } from 'lucide-react';
import type { GenerateImageInput, GenerateImageOutput } from '@/ai/flows/image-generation-flow';
import type { GenerateVideoInput, GenerateVideoOutput } from '@/ai/flows/video-generation-flow';

interface MediaStudioProps {
  mediaUrl: string;
  onClose: () => void;
  onSend: (mediaUrl: string) => void;
  generateImage: (input: Omit<GenerateImageInput, 'userId'>) => Promise<GenerateImageOutput>;
  generateVideo: (input: Omit<GenerateVideoInput, 'userId'>) => Promise<GenerateVideoOutput>;
}

export function MediaStudio({ mediaUrl, onClose, onSend, generateImage, generateVideo }: MediaStudioProps) {
  const [editedMediaUrl, setEditedMediaUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const isVideo = mediaUrl.startsWith('data:video');
  const displayUrl = editedMediaUrl || mediaUrl;

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    
    try {
      if (isVideo) {
        const result = await generateVideo({ prompt, baseMedia: displayUrl });
        setEditedMediaUrl(result.videoUrl);
      } else {
        const result = await generateImage({ prompt, baseImage: displayUrl });
        setEditedMediaUrl(result.imageUrl);
      }
    } catch (error) {
      console.error("AI generation failed:", error);
      // You might want to show a toast here
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSend = () => {
    onSend(displayUrl);
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Media Studio</DialogTitle>
          <DialogDescription>
            Use AI to edit your {isVideo ? 'video' : 'image'}. Describe the changes you want to make.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
            <div className="relative w-full aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
                {isVideo ? (
                    <video key={displayUrl} src={displayUrl} controls className="w-full h-full object-contain" />
                ) : (
                    <Image src={displayUrl} alt="Media preview" layout="fill" objectFit="contain" />
                )}
                {isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <p>AI is working its magic...</p>
                    </div>
                )}
            </div>
            
            <div className="flex flex-col space-y-4">
                <div className="space-y-2">
                    <label htmlFor="prompt" className="text-sm font-medium">Edit Prompt</label>
                    <Input 
                        id="prompt"
                        placeholder={isVideo ? "e.g. 'Make this black and white'" : "e.g. 'Add a cat in the foreground'"}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <Button onClick={handleGenerate} disabled={isLoading || !prompt.trim()}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {isLoading ? 'Generating...' : 'Apply AI Edit'}
                </Button>

                <div className="flex-grow"></div>
                
                 <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSend} disabled={isLoading}>
                       <Send className="mr-2 h-4 w-4" />
                       Send
                    </Button>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

    