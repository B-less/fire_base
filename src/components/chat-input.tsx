
'use client';

import { Paperclip, SendHorizontal, Video, ImageIcon, Mic, Square } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
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
import { ToastAction } from '@/components/ui/toast';
import { getMedianPermissionStatus, isMedianApp, openMedianAppSettings } from '@/lib/median';


interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: (type: 'text' | 'image' | 'video') => void;
  onFileSelect: (url: string) => void;
  hasPendingMedia?: boolean;
  isAIChat?: boolean;
  onTypingChange: (isTyping: boolean) => void;
}

export function ChatInput({ value, onChange, onSend, onFileSelect, hasPendingMedia = false, isAIChat = false, onTypingChange }: ChatInputProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);
  const [waveFrame, setWaveFrame] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);
  const { toast } = useToast();

  const stopAudioStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        recorderRef.current.ondataavailable = null;
        recorderRef.current.onstop = null;
        if (recorderRef.current.state !== 'inactive') {
          recorderRef.current.stop();
        }
        recorderRef.current = null;
      }
      audioChunksRef.current = [];
      stopAudioStream();
    };
  }, []);

  useEffect(() => {
    if (!isRecording) {
      recordingStartedAtRef.current = null;
      setRecordingElapsedMs(0);
      setWaveFrame(0);
      return;
    }

    recordingStartedAtRef.current = Date.now();
    setRecordingElapsedMs(0);
    setWaveFrame(0);

    const interval = window.setInterval(() => {
      const startedAt = recordingStartedAtRef.current ?? Date.now();
      setRecordingElapsedMs(Date.now() - startedAt);
      setWaveFrame((previous) => previous + 1);
    }, 150);

    return () => window.clearInterval(interval);
  }, [isRecording]);

  const formatRecordingTime = (elapsedMs: number) => {
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const waveHeights = Array.from({ length: 14 }, (_, index) => {
    const phase = (waveFrame + index * 2) % 12;
    return 8 + Math.abs(6 - phase) * 2.5;
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    onTypingChange(true);
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend('text');
      onTypingChange(false);
    }
  };

  const handleSendClick = (type: 'text' | 'image' | 'video') => {
      onSend(type);
      onTypingChange(false);
  }
  
  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  }

  const handleAudioRecordClick = async () => {
    if (isRecording) {
      recorderRef.current?.stop();
      return;
    }

    if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      toast({
        title: "Voice Notes Unavailable",
        description: "This device does not support in-browser audio recording.",
        variant: "destructive",
      });
      return;
    }

    onTypingChange(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const preferredMimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ];
      const supportedMimeType = preferredMimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType));
      const recorder = supportedMimeType ? new MediaRecorder(stream, { mimeType: supportedMimeType }) : new MediaRecorder(stream);

      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || supportedMimeType || 'audio/webm',
        });

        recorderRef.current = null;
        audioChunksRef.current = [];
        stopAudioStream();
        setIsRecording(false);

        if (!audioBlob.size) {
          return;
        }

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          const dataUrl = loadEvent.target?.result as string;
          onFileSelect(dataUrl);
        };
        reader.onerror = () => {
          toast({
            title: "Voice Note Error",
            description: "We recorded the audio, but couldn't prepare it for sending.",
            variant: "destructive",
          });
        };
        reader.readAsDataURL(audioBlob);
      };
      recorder.onerror = () => {
        recorderRef.current = null;
        audioChunksRef.current = [];
        stopAudioStream();
        setIsRecording(false);
        toast({
          title: "Recording Failed",
          description: "We couldn't record your voice note. Please try again.",
          variant: "destructive",
        });
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting audio recording:", error);
      const medianPermissionStatus = isMedianApp()
        ? await getMedianPermissionStatus(['Microphone'])
        : {};
      const microphoneBlocked = medianPermissionStatus.Microphone === 'denied';

      stopAudioStream();
      setIsRecording(false);
      toast({
        title: microphoneBlocked ? "Microphone Permission Blocked" : "Microphone Access Needed",
        description: microphoneBlocked
          ? "Microphone access is denied in the Median app. Open app settings and allow microphone permission."
          : "Please allow microphone access to record a voice note.",
        action: microphoneBlocked ? (
          <ToastAction altText="Open app settings" onClick={openMedianAppSettings}>
            Settings
          </ToastAction>
        ) : undefined,
        variant: "destructive",
      });
    }
  };

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


  const placeholder = isAIChat
    ? "Ask me to generate an image or video..."
    : "Type a message...";

  return (
    <div className="relative flex flex-col rounded-[1.5rem] border bg-card/95 p-1.5 shadow-sm backdrop-blur">
       {isAIChat && (
        <div className="mb-1.5 flex justify-center gap-1.5 px-1">
            <Button variant="outline" size="sm" className="h-8 rounded-full px-3 text-xs" onClick={() => handleSendClick('image')} disabled={!value.trim()}>
                <ImageIcon className="mr-2 h-4 w-4" /> Generate Image
            </Button>
            <Button variant="outline" size="sm" className="h-8 rounded-full px-3 text-xs" onClick={() => handleSendClick('video')} disabled={!value.trim()}>
                <Video className="mr-2 h-4 w-4" /> Generate Video
            </Button>
        </div>
       )}
      {isRecording && (
        <div className="mb-1.5 flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-3 py-2">
          <div className="flex items-center gap-2 text-sm font-medium text-destructive">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
            <span>Recording</span>
          </div>
          <div className="flex flex-1 items-end gap-1">
            {waveHeights.map((height, index) => (
              <span
                key={index}
                className="w-1 rounded-full bg-primary/80 transition-all duration-150"
                style={{ height: `${height}px` }}
              />
            ))}
          </div>
          <span className="font-mono text-sm tabular-nums text-foreground">
            {formatRecordingTime(recordingElapsedMs)}
          </span>
        </div>
      )}
      <div className="relative flex items-center">
        <Textarea
          placeholder={placeholder}
          className="min-h-[42px] resize-none border-0 bg-transparent px-3 py-2 pr-28 text-[15px] leading-5 shadow-none focus-visible:ring-0"
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          onBlur={() => onTypingChange(false)}
          rows={1}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,audio/*"
          disabled={isUploading || isRecording}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {!isAIChat && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={handleImageUploadClick} disabled={isUploading || isRecording}>
                    {isUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share Media</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={handleAudioRecordClick}
                    disabled={isUploading}
                  >
                    {isRecording ? (
                      <Square className="h-3.5 w-3.5 text-destructive" />
                    ) : (
                      <Mic className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isRecording ? 'Stop Recording' : 'Record Voice Note'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => handleSendClick('text')}
            disabled={(!value.trim() && !hasPendingMedia && !isAIChat) || isRecording}
          >
              <SendHorizontal className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
