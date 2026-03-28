
'use client';

import { Check, CheckCheck, Bot, Sparkles, Trash2, Download, Mic, Copy, Share2, MoreHorizontal, Pause, Play, Volume2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from './ui/button';
import { Popover, PopoverAnchor, PopoverContent } from './ui/popover';
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
import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
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
    return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
  }
  if (status === 'delivered') {
    return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
  }
  return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
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

const dataUrlToFile = (dataUrl: string, filename: string) => {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/data:(.*?);base64/)?.[1] ?? 'application/octet-stream';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], filename, { type: mime });
}

const formatAudioTime = (seconds: number) => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

function VoiceNotePlayer({ src, isMyMessage }: { src: string; isMyMessage: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const progressPercent = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, [src]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      return;
    }

    try {
      await audio.play();
    } catch {
      setIsPlaying(false);
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const nextTime = Number(event.target.value);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  return (
    <div className="w-[12.5rem] sm:w-[13.5rem]">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      <div className="mb-1.5 flex items-center gap-2 text-[13px] font-medium opacity-85">
        <Mic className="h-3.5 w-3.5" />
        <span>Voice note</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={togglePlayback}
          className={cn(
            'h-8 w-8 rounded-full border border-current/10',
            isMyMessage ? 'hover:bg-primary-foreground/15' : 'hover:bg-muted'
          )}
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="relative flex-1">
            <div className={cn('h-1.5 rounded-full', isMyMessage ? 'bg-primary-foreground/20' : 'bg-muted-foreground/15')} />
            <div
              className="absolute left-0 top-0 h-1.5 rounded-full bg-sky-500"
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-background bg-sky-500 shadow-sm"
              style={{ left: `calc(${progressPercent}% - 0.4375rem)` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(currentTime, duration || 0)}
              onChange={handleSeek}
              className="absolute inset-0 h-3.5 w-full cursor-pointer opacity-0"
            />
          </div>
          <span className="w-9 text-right text-[11px] tabular-nums opacity-80">
            {formatAudioTime(isPlaying ? currentTime : duration)}
          </span>
        </div>
        <Volume2 className="h-3.5 w-3.5 opacity-70" />
      </div>
    </div>
  );
}


export function MessageBubble({ message, contactAvatar, isFirstInGroup, onImagine, onDelete }: MessageBubbleProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const isMyMessage = currentUser ? message.sender === currentUser.phoneNumber : false;
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mediaUrl = message.audio || message.video || message.image;
  const isAudio = !!message.audio;
  const isVideo = !isAudio && !!message.video;

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

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
    setIsActionsOpen(false);
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
    setIsActionsOpen(false);
  }

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const openActions = () => {
    clearLongPressTimer();
    navigator.vibrate?.(10);
    setIsActionsOpen(true);
  };

  const handlePointerDown = () => {
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      openActions();
    }, 450);
  };

  const handleCopy = async () => {
    if (!message.content) return;
    try {
      await navigator.clipboard.writeText(message.content);
      toast({ title: 'Message copied' });
      setIsActionsOpen(false);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'We could not copy this message.',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    try {
      const shareText = message.content || 'Shared from ChirpChat';
      if (navigator.share) {
        if (mediaUrl?.startsWith('data:')) {
          const mimeType = mediaUrl.match(/^data:([^;,]+)/)?.[1];
          const extension = mimeType?.split('/')[1] || (isAudio ? 'webm' : isVideo ? 'mp4' : 'png');
          const file = dataUrlToFile(mediaUrl, `chirpchat-media-${message.id}.${extension}`);

          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({
              text: message.content || undefined,
              files: [file],
            });
          } else {
            await navigator.share({ text: shareText });
          }
        } else {
          await navigator.share({ text: shareText, url: mediaUrl || undefined });
        }
      } else {
        await navigator.clipboard.writeText(mediaUrl || shareText);
        toast({ title: 'Content copied to share' });
      }
      setIsActionsOpen(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      toast({
        title: 'Share failed',
        description: 'We could not share this message right now.',
        variant: 'destructive',
      });
    }
  };

  const senderIsAI = isAI(message.sender);
  const useCompactTextLayout = !!message.content && !mediaUrl && !message.isGenerating;
  const useCompactMetaLayout = useCompactTextLayout || isAudio;
  const bubbleWidthClass = isAudio
    ? 'w-[15rem] max-w-[15rem] sm:w-[16rem] sm:max-w-[16rem]'
    : useCompactTextLayout
      ? 'max-w-[15rem] sm:max-w-[17rem] lg:max-w-[19rem]'
      : 'max-w-[70%] sm:max-w-[62%] lg:max-w-[55%]';
  const canBeDeleted = (isMyMessage || senderIsAI) && (message.content || mediaUrl) && !message.isGenerating;
  const canBeEdited = (isMyMessage || senderIsAI) && message.image && !isVideo && !message.isGenerating;
  const canBeDownloaded = mediaUrl && !message.isGenerating;
  const canBeCopied = !!message.content && !message.isGenerating;
  const canBeShared = (!!message.content || !!mediaUrl) && !message.isGenerating;

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
      <Popover open={isActionsOpen} onOpenChange={setIsActionsOpen}>
        <PopoverAnchor asChild>
          <div className="relative">
            <Card
              onPointerDown={message.isGenerating ? undefined : handlePointerDown}
              onPointerUp={clearLongPressTimer}
              onPointerLeave={clearLongPressTimer}
              onPointerCancel={clearLongPressTimer}
              onContextMenu={
                message.isGenerating
                  ? undefined
                  : (event) => {
                      event.preventDefault();
                      openActions();
                    }
              }
              className={cn(
                'group relative w-fit border-transparent p-0 shadow-[0_8px_22px_rgba(15,23,42,0.16)] transition-all duration-200 dark:shadow-[0_10px_24px_rgba(0,0,0,0.35)]',
                bubbleWidthClass,
                isMyMessage
                  ? 'rounded-2xl rounded-br-md bg-primary text-primary-foreground'
                  : 'rounded-2xl rounded-bl-md bg-card text-card-foreground',
                message.isGenerating && 'bg-muted text-muted-foreground',
                senderIsAI && 'rounded-2xl rounded-bl-md bg-secondary text-secondary-foreground',
                isActionsOpen && 'scale-[1.01] ring-2 ring-primary/25 ring-offset-2 ring-offset-background'
              )}
            >
              <CardContent className={cn('relative px-2.5 py-1.5', useCompactMetaLayout ? 'pb-5' : 'pb-2')}>
                {message.isGenerating && (
                  <div className="mb-2 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm">Generating...</p>
                  </div>
                )}
                {mediaUrl && (
                  <div className="relative mb-2">
                    {isAudio ? (
                      <VoiceNotePlayer src={mediaUrl} isMyMessage={isMyMessage} />
                    ) : isVideo ? (
                      <div className="relative flex aspect-video w-full items-center justify-center rounded-xl bg-black">
                          <video key={mediaUrl} src={mediaUrl} controls className="max-h-full max-w-full rounded-xl" />
                      </div>
                    ) : (
                      <Image
                        src={mediaUrl}
                        alt="Shared media"
                        width={300}
                        height={200}
                        className={cn("rounded-xl object-cover", message.isGenerating && "opacity-50")}
                      />
                    )}
                  </div>
                )}
                {message.content && (
                  <div className={cn('flex items-start gap-1.5', useCompactTextLayout && 'pr-12')}>
                    {(senderIsAI && !isMyMessage) && <Bot className="mt-0.5 h-4 w-4 flex-shrink-0" />}
                    <p className="whitespace-pre-wrap break-words text-sm leading-[1.32] [overflow-wrap:anywhere] sm:text-[14.5px]">
                      {message.content}
                    </p>
                  </div>
                )}

                {!message.isGenerating && (canBeCopied || canBeShared || canBeEdited || canBeDeleted || canBeDownloaded) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsActionsOpen((open) => !open);
                    }}
                    className={cn(
                      'absolute right-1.5 top-1.5 h-6 w-6 rounded-full opacity-0 transition-opacity group-hover:opacity-100',
                      isMyMessage ? 'text-primary-foreground/80 hover:bg-primary/70 hover:text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                )}

                {useCompactMetaLayout ? (
                  <div className="absolute bottom-1.5 right-2 flex items-center gap-1">
                    <span className={cn('text-[10px]', isMyMessage ? 'text-primary-foreground/70' : 'text-muted-foreground', senderIsAI && 'text-secondary-foreground/70')}>
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
          </div>
        </PopoverAnchor>

        {!message.isGenerating && (canBeCopied || canBeShared || canBeEdited || canBeDeleted || canBeDownloaded) && (
          <PopoverContent
            side="top"
            align={isMyMessage ? 'end' : 'start'}
            className="w-44 rounded-2xl border bg-popover/98 p-1.5 shadow-xl backdrop-blur"
          >
            <div className="space-y-0.5">
              {canBeCopied && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </button>
              )}
              {canBeShared && (
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>
              )}
              {canBeDownloaded && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
              )}
              {canBeEdited && (
                <button
                  type="button"
                  onClick={() => {
                    setIsPromptOpen(true);
                    setIsActionsOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Edit with AI</span>
                </button>
              )}
              {canBeDeleted && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteConfirmOpen(true);
                    setIsActionsOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </PopoverContent>
        )}
      </Popover>
      
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
