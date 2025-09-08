import { Paperclip, SendHorizontal, Sparkles, Video } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';
import { compressImage } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onFileSelect: (url: string) => void;
  isAIChat?: boolean;
}

export function ChatInput({ value, onChange, onSend, onFileSelect, isAIChat = false }: ChatInputProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };
  
  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        if (file.type.startsWith('image/')) {
          const compressedDataUrl = await compressImage(file);
          onFileSelect(compressedDataUrl);
        } else {
          // For non-image files (like videos), read as data URL without compression
          const reader = new FileReader();
          reader.onload = (loadEvent) => {
            const dataUrl = loadEvent.target?.result as string;
            onFileSelect(dataUrl);
          };
          reader.readAsDataURL(file);
        }
      } catch (error) {
        console.error("Error processing file:", error);
        toast({
          title: "File Error",
          description: "Could not process the selected file. Please try another one.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
    // Reset file input value to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  const isImagineCommand = value.trim().startsWith('/imagine ');
  const isVideoCommand = value.trim().startsWith('/video ');
  const isAICommand = isImagineCommand || isVideoCommand;

  const placeholder = isAIChat
    ? "Ask the AI anything..."
    : "Type a message or use /imagine or /video...";

  return (
    <div className="relative rounded-lg border bg-card p-2 shadow-sm">
      <Textarea
        placeholder={placeholder}
        className="min-h-[48px] resize-none border-0 bg-transparent p-2 pr-20 shadow-none focus-visible:ring-0"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        rows={1}
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*"
        disabled={isUploading}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleImageUploadClick} disabled={isUploading || isAIChat}>
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share Media</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button
          size="icon"
          className="h-8 w-8"
          onClick={onSend}
          disabled={!value.trim() || isUploading}
        >
          {isImagineCommand && <Sparkles className="h-4 w-4" />}
          {isVideoCommand && <Video className="h-4 w-4" />}
          {!isAICommand && <SendHorizontal className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
