
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, update } from "firebase/database";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { compressImage } from '@/lib/utils';
import type { User } from '@/lib/types';


export default function ProfileSetupPage() {
  const { user, login, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (loading) {
    return (
      <main className="flex h-screen w-full items-center justify-center bg-background p-4">
        <Loader2 className="h-10 w-10 animate-spin" />
      </main>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }
  
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
          description: "Could not process the image.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Update auth context with the new name
      await login(user.phoneNumber, trimmedName);
      
      toast({ title: "Profile created!", description: "Welcome to ChirpChat!" });
      router.push('/');
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({ title: "Save failed", description: "Could not save your profile.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flex h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Let&apos;s set up your name and profile picture.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative group">
                        <Avatar className="h-32 w-32 text-5xl">
                            <AvatarImage src={profilePicture ?? undefined} alt="Profile Picture" />
                            <AvatarFallback>
                                {isUploading ? <Loader2 className="h-12 w-12 animate-spin" /> : <UserIcon className="h-12 w-12 text-muted-foreground" />}
                            </AvatarFallback>
                        </Avatar>
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()} 
                            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white font-semibold"
                            disabled={isUploading}
                        >
                            {isUploading ? 'Uploading...' : 'Choose Photo'}
                        </button>
                         <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleProfilePictureChange}
                            className="hidden"
                            accept="image/*"
                            disabled={isUploading}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                        id="name"
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <Button type="submit" className="w-full" disabled={isSaving || isUploading}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSaving ? 'Saving...' : 'Continue to ChirpChat'}
                </Button>
            </form>
        </CardContent>
      </Card>
    </main>
  );
}
