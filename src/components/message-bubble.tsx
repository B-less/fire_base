
'use client';

import { Check, CheckCheck, Bot, Sparkles, Image as ImageIcon, Trash2, MoreHorizontal, Download, Mic } from 'lucide-react';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { RobotIcon } from '@/app/robot-icon';


interface MessageBubbleProps {
  message: Message;
  contactAvatar: string;
  isFirstInGroup: boolean;
  onImagine: (prompt: string, baseImage: string) => void;
  onDelete: (dbKey?: string) => void;
}

const ReadStatusIcon = ({ status }: { status: Message['status'] }) => {
  if (status === 'read') {
    return <CheckCheck className="h-4 w-4 text-blue-500" />;
  }
  if (status === 'delivered') {
    return <CheckCheck className="h-4 w-4 text-muted-foreground" />;
  }
  return <Check className="h-4 w-4 text-muted-foreground" />;
};

const isAI = (sender: string) => sender === 'ai-assistant';

const formatTimestamp = (isoString: string) => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
         if (isNaN(date.getTime())) {
            throw new Error('Invalid date');
        }
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        }).format(date);
    } catch {
        console.error("Invalid timestamp format:", isoString);
        return '';
    }
}


export function MessageBubble({ message, contactAvatar, isFirstInGroup, onImagine, onDelete }: MessageBubbleProps) {
  const { user: currentUser } = useAuth();
  const isMyMessage = currentUser ? message.sender === currentUser.phoneNumber : false;
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [prompt, setPrompt] = useState("");

  const mediaUrl = message.audio || message.video || message.image;
  const isAudio = !!message.audio;
  const isVideo = !isAudio && !!message.video;

  const handleEditImage = (e: React.FormEvent) => {
    e.preventDefault();
    if(prompt.trim() && message.image) {
      onImagine(prompt, message.image);
      setIsPromptOpen(false);
      setPrompt("");
    }
  }

  const handleDelete = () => {
    onDelete(message.db_key);
    setIsDeleteConfirmOpen(false);
  }

  const handleDownload = () => {
    if (!mediaUrl) return;
    const link = document.createElement('a');
    link.href = mediaUrl;
    const mimeType = mediaUrl.match(/^data:([^;,]+)/)?.[1];
    const extension = mimeType?.split('/')[1] || (isAudio ? 'webm' : isVideo ? 'mp4' : 'png');
    link.download = `chirpchat-media-${message.id}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const senderIsAI = isAI(message.sender);
  const useCompactTextLayout = !!message.content && !mediaUrl && !message.isGenerating;
  const canBeDeleted = (isMyMessage || senderIsAI) && (message.content || mediaUrl) && !message.isGenerating;
  const canBeEdited = (isMyMessage || senderIsAI) && message.image && !isVideo && !message.isGenerating;
  const canBeDownloaded = mediaUrl && !message.isGenerating;

  return (
    <div
      className={cn(
        'flex items-end gap-2 message-in',
        isMyMessage ? 'justify-end' : 'justify-start'
      )}
    >
      {!isMyMessage && (
        <Avatar className={cn('h-8 w-8', !isFirstInGroup && 'invisible')}>
          <AvatarImage src={contactAvatar} alt="Contact" />
          <AvatarFallback>{senderIsAI ? <RobotIcon className="h-5 w-5" /> : 'C'}</AvatarFallback>
        </Avatar>
      )}
      <Card
        className={cn(
          'group relative w-fit max-w-[82%] p-0 shadow-md sm:max-w-[75%] lg:max-w-[68%]',
          isMyMessage
            ? 'rounded-br-none bg-primary text-primary-foreground'
            : 'rounded-bl-none bg-card text-card-foreground',
          message.isGenerating && 'bg-muted text-muted-foreground',
          senderIsAI && 'bg-secondary text-secondary-foreground rounded-bl-none'
        )}
      >
        <CardContent className={cn('relative px-3 py-2.5', useCompactTextLayout ? 'pb-6' : 'pb-2.5')}>
          {message.isGenerating && (
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm">Generating...</p>
            </div>
          )}
          {mediaUrl && (
            <div className="relative mb-2">
              {isAudio ? (
                <div className="rounded-md border bg-background/70 p-3 text-foreground shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Mic className="h-4 w-4" />
                    <span>Voice note</span>
                  </div>
                  <audio key={mediaUrl} src={mediaUrl} controls className="w-full min-w-[220px]" />
                </div>
              ) : isVideo ? (
                <div className="relative w-full aspect-video rounded-md bg-black flex items-center justify-center">
                    <video key={mediaUrl} src={mediaUrl} controls className="max-w-full max-h-full rounded-md" />
                </div>
              ) : (
                <Image
                  src={mediaUrl}
                  alt="Shared media"
                  width={300}
                  height={200}
                  className={cn("rounded-md object-cover", message.isGenerating && "opacity-50")}
                />
              )}
            </div>
          )}
          {message.content && (
            <div className={cn('flex items-start gap-2', useCompactTextLayout && 'pr-16')}>
               {(senderIsAI && !isMyMessage) && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
              <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
            </div>
          )}

          {!message.isGenerating && (canBeEdited || canBeDeleted || canBeDownloaded) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
                       canBeEdited && "bg-accent/80 text-accent-foreground shadow-md hover:bg-accent hover:shadow-lg hover:ring-2 hover:ring-accent/50 animate-pulse hover:animate-none",
                       !canBeEdited && isMyMessage && "bg-primary/50 hover:bg-primary/60 text-primary-foreground",
                       !isMyMessage && "bg-card/50 hover:bg-muted text-card-foreground"
                    )}
                  >
                     {canBeEdited ? <Sparkles className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {canBeDownloaded && (
                    <DropdownMenuItem onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      <span>Download</span>
                    </DropdownMenuItem>
                  )}
                  {canBeEdited && (
                    <DropdownMenuItem onClick={() => setIsPromptOpen(true)}>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      <span>Edit with AI</span>
                    </DropdownMenuItem>
                  )}
                  {(canBeDownloaded || canBeEdited) && canBeDeleted && <DropdownMenuSeparator />}
                  {canBeDeleted && (
                    <DropdownMenuItem onClick={() => setIsDeleteConfirmOpen(true)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

          {useCompactTextLayout ? (
            <div className="absolute bottom-2 right-3 flex items-center gap-1.5">
              <span className={cn('text-[11px]', isMyMessage ? 'text-primary-foreground/70' : 'text-muted-foreground', senderIsAI && 'text-secondary-foreground/70')}>
                {formatTimestamp(message.timestamp)}
              </span>
              {isMyMessage && <ReadStatusIcon status={message.status} />}
            </div>
          ) : (
            <div className="mt-1 flex items-center justify-end gap-2">
              <span className={cn('text-xs', isMyMessage && !message.isGenerating ? 'text-primary-foreground/70' : 'text-muted-foreground', senderIsAI && 'text-secondary-foreground/70')}>
                {formatTimestamp(message.timestamp)}
              </span>
              {isMyMessage && !message.isGenerating && <ReadStatusIcon status={message.status} />}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* AI Edit Image Dialog */}
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
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
