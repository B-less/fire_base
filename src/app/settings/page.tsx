'use client';

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User as UserIcon, LogOut, ArrowLeft, Sparkles, Moon, Sun, Bell, Mic, ExternalLink, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, update, get } from "firebase/database";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { compressImage } from '@/lib/utils';
import { generateImage } from '@/ai/flows/image-generation-flow';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import type { MedianPermissionState } from '@/lib/median';
import { getMedianPermissionStatus, getMedianPushInfo, isMedianApp, openMedianAppSettings, requestMedianPushRegistration } from '@/lib/median';
import type { User } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SettingsPageProps {
    onBack: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const { user, login, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshingMedianState, setIsRefreshingMedianState] = useState(false);
  const [microphonePermission, setMicrophonePermission] = useState<MedianPermissionState>('unknown');
  const [notificationPermission, setNotificationPermission] = useState<MedianPermissionState>('unknown');
  const [oneSignalSubscriptionId, setOneSignalSubscriptionId] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();
  const runningInMedian = isMedianApp();

  // Fetch full user data on component mount
  useEffect(() => {
    if (user?.phoneNumber) {
      const userRef = ref(db, `users/${user.phoneNumber}`);
      get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setName(userData.name || '');
          setProfilePicture(userData.profilePicture || null);
        }
      });
    }
  }, [user?.phoneNumber]);

  const refreshMedianState = useCallback(async () => {
    if (!runningInMedian) {
      return;
    }

    setIsRefreshingMedianState(true);

    try {
      const permissions = await getMedianPermissionStatus(['Microphone', 'Notifications']);
      setMicrophonePermission(permissions.Microphone ?? 'unknown');
      setNotificationPermission(permissions.Notifications ?? 'unknown');

      const pushInfo = await getMedianPushInfo();
      setOneSignalSubscriptionId(pushInfo?.subscription?.id ?? null);
    } catch (error) {
      console.error('Failed to refresh Median state:', error);
    } finally {
      setIsRefreshingMedianState(false);
    }
  }, [runningInMedian]);

  useEffect(() => {
    void refreshMedianState();
  }, [refreshMedianState]);

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const compressedImage = await compressImage(file);
        setProfilePicture(compressedImage);
      } catch (error) {
        console.error("Error compressing image:", error);
        toast({
          title: "Image Error",
          description: "Could not process the selected image. Please try another one.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    const trimmedName = name.trim();

    if (!trimmedName) {
      toast({ title: "Name is required", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    try {
      const userRef = ref(db, `users/${user.phoneNumber}`);
      const updates: Partial<Pick<User, 'name' | 'profilePicture'>> = { name: trimmedName };
      if (profilePicture) {
        updates.profilePicture = profilePicture;
      }
      
      await update(userRef, updates);

      // Update auth context
      login(user.phoneNumber, trimmedName);
      
      toast({ title: "Settings saved successfully!" });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({ title: "Save failed", description: "Could not save your settings. Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAIPictureGeneration = async (prompt: string) => {
    if(!prompt || !user) return;
    setIsUploading(true);
    try {
        const result = await generateImage({ prompt, userId: user.phoneNumber });
        setProfilePicture(result.imageUrl);
    } catch(error) {
        console.error("Error generating AI profile picture:", error);
        toast({ title: "AI Generation Failed", description: "Could not generate an image from that prompt.", variant: "destructive" });
    } finally {
        setIsUploading(false);
    }
  }

  const handleEnableMedianNotifications = async () => {
    try {
      await requestMedianPushRegistration();
      await refreshMedianState();
      toast({
        title: 'Notifications Requested',
        description: 'If Android shows a push prompt, allow it to enable native notifications in the Median app.',
      });
    } catch (error) {
      console.error('Failed to request Median notifications:', error);
      toast({
        title: 'Could Not Enable Notifications',
        description: 'Please try again, or open app settings to review notification permission.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-4 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Profile Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Profile</h2>
          <div className="flex items-center gap-6">
            <div className="relative group">
                <Avatar className="h-24 w-24 text-4xl">
                    <AvatarImage src={profilePicture ?? undefined} alt="Profile Picture" />
                    <AvatarFallback>
                        {isUploading ? <Loader2 className="h-10 w-10 animate-spin" /> : <UserIcon className="h-10 w-10 text-muted-foreground" />}
                    </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-white text-xs font-semibold" disabled={isUploading}>Change</button>
                </div>
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleProfilePictureChange}
                    className="hidden"
                    accept="image/*"
                    disabled={isUploading}
                />
            </div>
            
            <div className="space-y-2 flex-1">
                <Label htmlFor="name">Full Name</Label>
                <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                 <GenerateAIPictureDialog onGenerate={handleAIPictureGeneration} isLoading={isUploading}/>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Appearance</h2>
            <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-2">
                    {theme === 'dark' ? <Moon/> : <Sun/>}
                    <Label htmlFor="dark-mode-switch">Dark Mode</Label>
                </div>
                <Switch 
                    id="dark-mode-switch"
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
            </div>
        </div>

        {runningInMedian && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Median App</h2>
              <Button variant="outline" size="sm" onClick={refreshMedianState} disabled={isRefreshingMedianState}>
                {isRefreshingMedianState ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh
              </Button>
            </div>

            <PermissionCard
              icon={<Mic className="h-4 w-4" />}
              title="Microphone"
              description="Voice notes in the wrapper use the native WebRTC microphone permission."
              status={microphonePermission}
              actionLabel="Open App Settings"
              actionIcon={<ExternalLink className="mr-2 h-4 w-4" />}
              onAction={openMedianAppSettings}
            />

            <PermissionCard
              icon={<Bell className="h-4 w-4" />}
              title="Push Notifications"
              description={oneSignalSubscriptionId
                ? `Push is linked to this device. Subscription ID: ${oneSignalSubscriptionId}`
                : 'Enable native push so the wrapper can receive chat notifications.'}
              status={notificationPermission}
              actionLabel="Enable Notifications"
              actionIcon={<Bell className="mr-2 h-4 w-4" />}
              onAction={handleEnableMedianNotifications}
              secondaryActionLabel="App Settings"
              onSecondaryAction={openMedianAppSettings}
            />
          </div>
        )}

        {/* Account Section */}
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Account</h2>
             <Button variant="outline" onClick={logout} className="w-full sm:w-auto">
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
            </Button>
        </div>
      </div>
      
      <footer className="p-4 border-t mt-auto">
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving || isUploading}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
      </footer>
    </div>
  );
}


function GenerateAIPictureDialog({ onGenerate, isLoading }: { onGenerate: (prompt: string) => void, isLoading: boolean }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');

  const handleGenerateClick = () => {
    onGenerate(prompt);
    setOpen(false);
    setPrompt('');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs justify-start p-0 h-auto" disabled={isLoading}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate with AI
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Profile Picture</DialogTitle>
          <DialogDescription>
            Describe the profile picture you want to create. Be creative!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
            <Label htmlFor="ai-prompt">Prompt</Label>
            <Input 
                id="ai-prompt"
                placeholder="e.g., A watercolor painting of a fox reading a book"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
            />
        </div>
        <DialogFooter>
          <Button onClick={handleGenerateClick} disabled={!prompt.trim() || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PermissionCard({
  icon,
  title,
  description,
  status,
  actionLabel,
  actionIcon,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  status: MedianPermissionState;
  actionLabel: string;
  actionIcon?: ReactNode;
  onAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}) {
  const statusTone = status === 'granted'
    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    : status === 'denied'
      ? 'bg-destructive/10 text-destructive'
      : 'bg-muted text-muted-foreground';

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-medium">
            {icon}
            <span>{title}</span>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusTone}`}>
          {status}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionIcon}
          {actionLabel}
        </Button>
        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="ghost" size="sm" onClick={onSecondaryAction}>
            <ExternalLink className="mr-2 h-4 w-4" />
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
