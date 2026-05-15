'use client';

import {
  Check,
  CheckCheck,
  Bot,
  Sparkles,
  Trash2,
  Download,
  Mic,
  Copy,
  Share2,
  Pause,
  Play,
  Volume2,
  Loader2,
} from 'lucide-react';

import { motion } from 'framer-motion';
import Image from 'next/image';

import { cn } from '@/lib/utils';
import type { Message } from '@/lib/types';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';

import {
  Card,
  CardContent,
} from '@/components/ui/card';

import { Button } from './ui/button';

import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from './ui/popover';

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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';

import { Input } from './ui/input';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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

const ReadStatusIcon = ({
  status,
}: {
  status: Message['status'];
}) => {
  if (status === 'read') {
    return (
      <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
    );
  }

  if (status === 'delivered') {
    return (
      <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
    );
  }

  return (
    <Check className="h-3.5 w-3.5 text-muted-foreground" />
  );
};

const isAI = (sender: string) =>
  sender === 'ai-assistant';

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
    console.error(
      'Invalid timestamp format:',
      isoString
    );

    return '';
  }
};

const dataUrlToFile = (
  dataUrl: string,
  filename: string
) => {
  const [header, base64] = dataUrl.split(',');

  const mime =
    header.match(/data:(.*?);base64/)?.[1] ??
    'application/octet-stream';

  const binary = atob(base64);

  const bytes = new Uint8Array(binary.length);

  for (
    let index = 0;
    index < binary.length;
    index += 1
  ) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], filename, {
    type: mime,
  });
};

const formatAudioTime = (seconds: number) => {
  const safeSeconds = Number.isFinite(seconds)
    ? Math.max(0, Math.floor(seconds))
    : 0;

  const minutes = Math.floor(safeSeconds / 60);

  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`;
};

function VoiceNotePlayer({
  src,
  isMyMessage,
}: {
  src: string;
  isMyMessage: boolean;
}) {
  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [duration, setDuration] =
    useState(0);

  const [currentTime, setCurrentTime] =
    useState(0);

  const progressPercent =
    duration > 0
      ? Math.min(
          (currentTime / duration) * 100,
          100
        )
      : 0;

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

    audio.addEventListener(
      'loadedmetadata',
      handleLoadedMetadata
    );

    audio.addEventListener(
      'timeupdate',
      handleTimeUpdate
    );

    audio.addEventListener(
      'ended',
      handleEnded
    );

    audio.addEventListener(
      'pause',
      handlePause
    );

    audio.addEventListener(
      'play',
      handlePlay
    );

    return () => {
      audio.pause();
      audio.src = '';

      audio.removeEventListener(
        'loadedmetadata',
        handleLoadedMetadata
      );

      audio.removeEventListener(
        'timeupdate',
        handleTimeUpdate
      );

      audio.removeEventListener(
        'ended',
        handleEnded
      );

      audio.removeEventListener(
        'pause',
        handlePause
      );

      audio.removeEventListener(
        'play',
        handlePlay
      );
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

  const handleSeek = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const audio = audioRef.current;

    if (!audio) return;

    const nextTime = Number(event.target.value);

    audio.currentTime = nextTime;

    setCurrentTime(nextTime);
  };

  return (
    <div className="w-full min-w-[13rem]">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        className="hidden"
      />

      <div className="mb-1.5 flex items-center gap-2 text-[13px] font-medium opacity-85">
        <Mic className="h-3.5 w-3.5" />
        <span>Voice note</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Play voice note"
          onClick={togglePlayback}
          className={cn(
            'h-8 w-8 rounded-full border border-current/10',
            isMyMessage
              ? 'hover:bg-primary-foreground/15'
              : 'hover:bg-muted'
          )}
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current" />
          )}
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="relative flex-1">
            <div
              className={cn(
                'h-1.5 rounded-full',
                isMyMessage
                  ? 'bg-primary-foreground/20'
                  : 'bg-muted-foreground/15'
              )}
            />

            <div
              className="absolute left-0 top-0 h-1.5 rounded-full bg-sky-500"
              style={{
                width: `${progressPercent}%`,
              }}
            />

            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-background bg-sky-500 shadow-sm"
              style={{
                left: `clamp(0rem, calc(${progressPercent}% - 0.4375rem), calc(100% - 0.875rem))`,
              }}
            />

            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(
                currentTime,
                duration || 0
              )}
              onChange={handleSeek}
              className="absolute inset-0 h-3.5 w-full cursor-pointer opacity-0"
            />
          </div>

          <span className="w-9 text-right text-[11px] tabular-nums opacity-80">
            {formatAudioTime(
              isPlaying ? currentTime : duration
            )}
          </span>
        </div>

        <Volume2 className="h-3.5 w-3.5 opacity-70" />
      </div>
    </div>
  );
}

export function MessageBubble({
  message,
  contactAvatar,
  isFirstInGroup,
  onImagine,
  onDelete,
}: MessageBubbleProps) {
  const { user: currentUser } = useAuth();

  const { toast } = useToast();

  const isMyMessage = currentUser
    ? message.sender ===
      currentUser.phoneNumber
    : false;

  const senderIsAI = isAI(message.sender);

  const [isPromptOpen, setIsPromptOpen] =
    useState(false);

  const [
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
  ] = useState(false);

  const [isActionsOpen, setIsActionsOpen] =
    useState(false);

  const [
    isMediaViewerOpen,
    setIsMediaViewerOpen,
  ] = useState(false);

  const [prompt, setPrompt] = useState('');
  const [
    imageOrientation,
    setImageOrientation,
  ] = useState<
    'portrait' | 'landscape' | 'square'
  >('landscape');

  const longPressTimerRef =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  const mediaUrl =
    message.audio ||
    message.video ||
    message.image;

  const isAudio = !!message.audio;

  const isVideo =
    !isAudio && !!message.video;

  const hasVisualMedia =
    !isAudio && !!mediaUrl;

  const formattedTime = useMemo(
    () =>
      formatTimestamp(message.timestamp),
    [message.timestamp]
  );

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(
          longPressTimerRef.current
        );
      }
    };
  }, []);

  useEffect(() => {
    if (!message.image) {
      setImageOrientation('landscape');

      return;
    }

    let isMounted = true;
    const probe = new window.Image();

    probe.onload = () => {
      if (!isMounted) return;

      const { naturalWidth, naturalHeight } =
        probe;

      if (!naturalWidth || !naturalHeight) {
        setImageOrientation('landscape');

        return;
      }

      const ratio =
        naturalWidth / naturalHeight;

      if (ratio < 0.92) {
        setImageOrientation('portrait');
      } else if (ratio > 1.08) {
        setImageOrientation('landscape');
      } else {
        setImageOrientation('square');
      }
    };

    probe.onerror = () => {
      if (isMounted) {
        setImageOrientation('landscape');
      }
    };

    probe.src = message.image;

    return () => {
      isMounted = false;
      probe.onload = null;
      probe.onerror = null;
    };
  }, [message.image]);

  const handleEditImage = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      prompt.trim() &&
      message.image
    ) {
      onImagine(prompt, message.image);

      setIsPromptOpen(false);

      setPrompt('');
    }
  };

  const handleDelete = () => {
    onDelete(message.db_key);

    setIsDeleteConfirmOpen(false);

    setIsActionsOpen(false);
  };

  const handleDownload = () => {
    if (!mediaUrl) return;

    const mimeType =
      mediaUrl.match(/^data:([^;,]+)/)?.[1];

    const extension =
      mimeType?.split('/')[1] ||
      (isAudio
        ? 'webm'
        : isVideo
        ? 'mp4'
        : 'png');

    const file = dataUrlToFile(
      mediaUrl,
      `chirpchat-media-${message.id}.${extension}`
    );

    const url =
      URL.createObjectURL(file);

    const link =
      document.createElement('a');

    link.href = url;

    link.download = file.name;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setIsActionsOpen(false);
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(
        longPressTimerRef.current
      );

      longPressTimerRef.current = null;
    }
  };

  const openActions = () => {
    clearLongPressTimer();

    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    setIsActionsOpen(true);
  };

  const handlePointerDown = () => {
    clearLongPressTimer();

    longPressTimerRef.current =
      setTimeout(() => {
        openActions();
      }, 450);
  };

  const handleCopy = async () => {
    if (!message.content) return;

    try {
      await navigator.clipboard.writeText(
        message.content
      );

      toast({
        title: 'Message copied',
      });

      setIsActionsOpen(false);

    } catch {
      toast({
        title: 'Copy failed',
        description:
          'We could not copy this message.',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    try {
      const shareText =
        message.content ||
        'Shared from ChirpChat';

      if (navigator.share) {
        await navigator.share({
          title: 'ChirpChat',
          text: shareText,
          url: mediaUrl || undefined,
        });
      }

      setIsActionsOpen(false);

    } catch {}
  };

  const useCompactTextLayout =
    !!message.content &&
    !mediaUrl &&
    !message.isGenerating;

  const useCompactMetaLayout =
    useCompactTextLayout || isAudio;

  const visualMediaWidthClass = hasVisualMedia
    ? isVideo
      ? isMyMessage
        ? 'w-[15rem] sm:w-[16.5rem] md:w-[17.5rem]'
        : 'w-[min(16.5rem,calc(100vw-6.5rem))] max-w-[82vw] sm:w-[18rem] md:w-[19rem]'
      : imageOrientation === 'portrait'
        ? isMyMessage
          ? 'w-[min(12.75rem,calc(100vw-10rem))] max-w-[68vw] sm:w-[14rem] md:w-[14.75rem]'
          : 'w-[min(13.5rem,calc(100vw-9rem))] max-w-[72vw] sm:w-[14.75rem] md:w-[15.5rem]'
        : imageOrientation === 'square'
          ? isMyMessage
            ? 'w-[min(14rem,calc(100vw-9rem))] max-w-[72vw] sm:w-[15.75rem] md:w-[16.75rem]'
            : 'w-[min(15rem,calc(100vw-8rem))] max-w-[76vw] sm:w-[16.5rem] md:w-[17.5rem]'
          : isMyMessage
            ? 'w-[min(15.5rem,calc(100vw-7.5rem))] max-w-[78vw] sm:w-[17.25rem] md:w-[18.25rem]'
            : 'w-[min(16.5rem,calc(100vw-6.5rem))] max-w-[82vw] sm:w-[18rem] md:w-[19rem]'
    : '';

  const bubbleWidthClass = isAudio
    ? 'w-[15rem] max-w-[15rem] sm:w-[16rem] sm:max-w-[16rem]'
    : hasVisualMedia
    ? visualMediaWidthClass
    : useCompactTextLayout
    ? 'max-w-[15rem] sm:max-w-[17rem] lg:max-w-[19rem]'
    : 'max-w-[70%] sm:max-w-[62%] lg:max-w-[55%]';

  const imageSizes =
    imageOrientation === 'portrait'
      ? isMyMessage
        ? '(max-width: 640px) 68vw, (max-width: 768px) 14rem, 14.75rem'
        : '(max-width: 640px) 72vw, (max-width: 768px) 14.75rem, 15.5rem'
      : imageOrientation === 'square'
        ? isMyMessage
          ? '(max-width: 640px) 72vw, (max-width: 768px) 15.75rem, 16.75rem'
          : '(max-width: 640px) 76vw, (max-width: 768px) 16.5rem, 17.5rem'
        : isMyMessage
          ? '(max-width: 640px) 78vw, (max-width: 768px) 17.25rem, 18.25rem'
          : '(max-width: 640px) 82vw, (max-width: 768px) 18rem, 19rem';

  const canBeDeleted =
    (isMyMessage || senderIsAI) &&
    (message.content || mediaUrl) &&
    !message.isGenerating;

  const canBeEdited =
    (isMyMessage || senderIsAI) &&
    message.image &&
    !isVideo &&
    !message.isGenerating;

  const canBeDownloaded =
    mediaUrl &&
    !message.isGenerating;

  const canBeCopied =
    !!message.content &&
    !message.isGenerating;

  const canBeShared =
    (!!message.content ||
      !!mediaUrl) &&
    !message.isGenerating;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
        scale: 0.98,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.18,
      }}
      className={cn(
        'flex items-end gap-2 message-in',
        isMyMessage
          ? 'justify-end'
          : 'justify-start'
      )}
    >
      {!isMyMessage && (
        <Avatar
          className={cn(
            'h-8 w-8',
            !isFirstInGroup &&
              'invisible'
          )}
        >
          <AvatarImage
            src={contactAvatar}
            alt="Contact"
          />

          <AvatarFallback>
            {senderIsAI ? (
              <RobotIcon className="h-5 w-5" />
            ) : (
              'C'
            )}
          </AvatarFallback>
        </Avatar>
      )}

      <Popover
        open={isActionsOpen}
        onOpenChange={setIsActionsOpen}
      >
        <PopoverAnchor asChild>
          <div className="relative">
            <Card
              onPointerDown={
                message.isGenerating
                  ? undefined
                  : handlePointerDown
              }
              onPointerUp={
                clearLongPressTimer
              }
              onPointerLeave={
                clearLongPressTimer
              }
              onPointerCancel={
                clearLongPressTimer
              }
              className={cn(
                'group relative w-fit border-transparent p-0 shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-200',
                bubbleWidthClass,
                isMyMessage
                  ? 'rounded-2xl rounded-br-md bg-card text-card-foreground'
                  : 'rounded-2xl rounded-bl-md bg-primary text-primary-foreground',
                message.isGenerating &&
                  'bg-muted text-muted-foreground',
                senderIsAI &&
                  'rounded-2xl rounded-bl-md bg-secondary text-secondary-foreground',
                isActionsOpen &&
                  'scale-[1.01] ring-2 ring-primary/25 ring-offset-2 ring-offset-background'
              )}
            >
              <CardContent
                className={cn(
                  'relative px-2.5 py-1.5',
                  useCompactMetaLayout
                    ? 'pb-5'
                    : 'pb-2'
                )}
              >
                {message.isGenerating && (
                  <div className="mb-2 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />

                    <p className="text-sm">
                      Generating...
                    </p>
                  </div>
                )}

                {mediaUrl && (
                  <div className="relative mb-2">
                    {isAudio ? (
                      <VoiceNotePlayer
                        src={mediaUrl}
                        isMyMessage={
                          isMyMessage
                        }
                      />
                    ) : isVideo ? (
                      <button
                        type="button"
                        aria-label="Open media"
                        onClick={() =>
                          setIsMediaViewerOpen(
                            true
                          )
                        }
                        className="relative block w-full overflow-hidden rounded-[1.1rem] bg-black"
                      >
                        <div className="relative aspect-video w-full">
                          <video
                            key={mediaUrl}
                            src={mediaUrl}
                            muted
                            playsInline
                            preload="metadata"
                            crossOrigin="anonymous"
                            className="h-full w-full object-cover"
                          />

                          <div className="absolute inset-0 bg-black/20" />

                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white shadow-lg">
                              <Play className="h-5 w-5 fill-current" />
                            </span>
                          </div>
                        </div>
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label="Open media"
                        onClick={() =>
                          setIsMediaViewerOpen(
                            true
                          )
                        }
                        className="block w-full overflow-hidden rounded-[1.1rem]"
                      >
                        <Image
                          src={mediaUrl}
                          alt="Shared media"
                          width={720}
                          height={720}
                          loading="lazy"
                          sizes={imageSizes}
                          className={cn(
                            'h-auto max-h-[min(50vh,23rem)] w-full rounded-[1.1rem] object-cover sm:max-h-[min(54vh,25rem)]',
                            message.isGenerating &&
                              'opacity-50'
                          )}
                        />
                      </button>
                    )}
                  </div>
                )}

                {message.content && (
                  <div
                    className={cn(
                      'flex items-start gap-1.5',
                      useCompactTextLayout &&
                        'pr-12'
                    )}
                  >
                    {senderIsAI &&
                      !isMyMessage && (
                        <Bot className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      )}

                    <p className="whitespace-pre-wrap break-words text-sm leading-[1.32] [overflow-wrap:anywhere] sm:text-[14.5px]">
                      {message.content}
                    </p>
                  </div>
                )}

                {useCompactMetaLayout ? (
                  <div className="absolute bottom-1.5 right-2 flex items-center gap-1">
                    <span className="text-[10px] opacity-70">
                      {formattedTime}
                    </span>

                    {isMyMessage && (
                      <ReadStatusIcon
                        status={
                          message.status
                        }
                      />
                    )}
                  </div>
                ) : (
                  <div className="mt-1 flex items-center justify-end gap-2">
                    <span className="text-xs opacity-70">
                      {formattedTime}
                    </span>

                    {isMyMessage && (
                      <ReadStatusIcon
                        status={
                          message.status
                        }
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </PopoverAnchor>

        {!message.isGenerating &&
          (canBeCopied ||
            canBeShared ||
            canBeEdited ||
            canBeDeleted ||
            canBeDownloaded) && (
            <PopoverContent
              side="top"
              align={
                isMyMessage
                  ? 'end'
                  : 'start'
              }
              className="w-44 rounded-2xl border bg-popover/98 p-1.5 shadow-xl backdrop-blur"
            >
              <div className="space-y-0.5">
                {canBeCopied && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </button>
                )}

                {canBeShared && (
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </button>
                )}

                {canBeDownloaded && (
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                )}

                {canBeEdited && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPromptOpen(
                        true
                      );

                      setIsActionsOpen(
                        false
                      );
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>
                      Edit with AI
                    </span>
                  </button>
                )}

                {canBeDeleted && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleteConfirmOpen(
                        true
                      );

                      setIsActionsOpen(
                        false
                      );
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </PopoverContent>
          )}
      </Popover>

      <Dialog
        open={isPromptOpen}
        onOpenChange={setIsPromptOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Image with AI
            </DialogTitle>

            <DialogDescription>
              Describe the changes
              you want to make to the
              image.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleEditImage}
            className="space-y-4"
          >
            <Input
              placeholder="e.g. Make it a sunny day"
              value={prompt}
              onChange={(e) =>
                setPrompt(
                  e.target.value
                )
              }
            />

            <Button
              type="submit"
              className="w-full"
              disabled={!prompt.trim()}
            >
              Generate
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteConfirmOpen}
        onOpenChange={
          setIsDeleteConfirmOpen
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you absolutely sure?
            </AlertDialogTitle>

            <AlertDialogDescription>
              This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={isMediaViewerOpen}
        onOpenChange={
          setIsMediaViewerOpen
        }
      >
        <DialogContent className="max-w-[min(100vw-1rem,56rem)] border-0 bg-black/95 p-0 text-white shadow-2xl sm:rounded-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {isVideo
                ? 'Video viewer'
                : 'Image viewer'}
            </DialogTitle>

            <DialogDescription>
              Opens the shared media
              in a larger view.
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-[14rem] max-h-[85vh] items-center justify-center p-2 sm:p-4">
            {isVideo &&
            mediaUrl ? (
              <video
                key={`${mediaUrl}-viewer`}
                src={mediaUrl}
                controls
                autoPlay
                playsInline
                className="max-h-[80vh] w-auto max-w-full rounded-xl bg-black"
              />
            ) : mediaUrl ? (
              <Image
                src={mediaUrl}
                alt="Shared media"
                width={1400}
                height={1400}
                className="max-h-[80vh] h-auto w-auto max-w-full rounded-xl object-contain"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
