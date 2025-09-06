import { Check, CheckCheck, Bot, Sparkles, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';


interface MessageBubbleProps {
  message: Message;
  contactAvatar: string;
  isFirstInGroup: boolean;
  onImagine: (prompt: string, baseImage: string) => void;
}

const ReadStatusIcon = ({ status }: { status: Message['status'] }) => {
  if (status === 'read') {
    return <CheckCheck className="h-4 w-4 text-primary" />;
  }
  if (status === 'delivered') {
    return <CheckCheck className="h-4 w-4 text-muted-foreground" />;
  }
  return <Check className="h-4 w-4 text-muted-foreground" />;
};

const isAI = (sender: string) => sender === 'ai-assistant';

export function MessageBubble({ message, contactAvatar, isFirstInGroup, onImagine }: MessageBubbleProps) {
  const { user: currentUser } = useAuth();
  const isMyMessage = message.sender === currentUser;
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [prompt, setPrompt] = useState("");

  const handleEditImage = (e: React.FormEvent) => {
    e.preventDefault();
    if(prompt.trim() && message.image) {
      onImagine(prompt, message.image);
      setIsPromptOpen(false);
      setPrompt("");
    }
  }

  const senderIsAI = isAI(message.sender);

  return (
    <div
      className={cn(
        'flex items-end gap-2 message-in',
        isMyMessage ? 'justify-end' : 'justify-start'
      )}
    >
      {!isMyMessage && (
        <Avatar className={cn('h-8 w-8', !isFirstInGroup && 'invisible')}>
          <AvatarImage src={contactAvatar} alt="Contact" data-ai-hint={senderIsAI ? "robot abstract" : "person"} />
          <AvatarFallback>{senderIsAI ? <Bot className="h-4 w-4" /> : 'C'}</AvatarFallback>
        </Avatar>
      )}
      <Card
        className={cn(
          'max-w-xs md:max-w-md lg:max-w-lg p-0 shadow-md group relative',
          isMyMessage
            ? 'rounded-br-none bg-primary text-primary-foreground'
            : 'rounded-bl-none bg-card text-card-foreground',
          message.isGenerating && 'bg-muted text-muted-foreground',
          senderIsAI && 'bg-secondary text-secondary-foreground rounded-bl-none'
        )}
      >
        <CardContent className="p-3">
          {message.isGenerating && (
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm">Generating...</p>
            </div>
          )}
          {message.image && (
            <div className="relative">
              <Image
                src={message.image}
                alt="Shared media"
                width={300}
                height={200}
                className={cn("rounded-md mb-2 object-cover", message.isGenerating && "opacity-50")}
                data-ai-hint="abstract landscape"
              />
              {!message.isGenerating && isMyMessage && (
                <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setIsPromptOpen(true)}>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      <span>Edit with AI</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                 <Dialog open={isPromptOpen} onOpenChange={setIsPromptOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Image with AI</DialogTitle>
                        <DialogDescription>
                          Describe the changes you want to make to the image.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleEditImage} className="space-y-4">
                        <Input 
                          placeholder="e.g. 'Make it a sunny day'" 
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                        />
                        <Button type="submit" className="w-full" disabled={!prompt.trim()}>Generate</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          )}
          {message.content && (
            <div className="flex items-start gap-2">
               {(message.content.startsWith('/imagine ') || senderIsAI) && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
              <p className="whitespace-pre-wrap break-words">{message.content.startsWith('/imagine ') ? message.content.substring(9) : message.content}</p>
            </div>
          )}
          <div className="mt-1 flex items-center justify-end gap-2">
            <span className={cn('text-xs', isMyMessage && !message.isGenerating ? 'text-primary-foreground/70' : 'text-muted-foreground', senderIsAI && 'text-secondary-foreground/70')}>
              {message.timestamp}
            </span>
            {isMyMessage && !message.isGenerating && <ReadStatusIcon status={message.status} />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
