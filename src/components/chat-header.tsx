
'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, MoreVertical, Phone, User as UserIcon, Loader2 } from 'lucide-react';
import type { Contact, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from 'date-fns';
import { db } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { useAuth } from '@/context/auth-context';


interface ChatHeaderProps {
  contactId: string;
  onBack: () => void;
}

const AI_CONTACT_ID = 'ai-assistant';

export function ChatHeader({ contactId, onBack }: ChatHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [contactUser, setContactUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user: currentUser } = useAuth();
  
  const isAiAssistant = contactId === AI_CONTACT_ID;

  useEffect(() => {
    if (isAiAssistant || !contactId) {
        setIsLoading(false);
        return;
    };

    setIsLoading(true);
    const userRef = ref(db, `users/${contactId}`);
    const listener = onValue(userRef, (snapshot) => {
        if(snapshot.exists()) {
            setContactUser({ ...snapshot.val(), phoneNumber: contactId });
        }
        setIsLoading(false);
    });

    return () => off(userRef, 'value', listener);
  }, [contactId, isAiAssistant]);
  
  
  const contact: Contact | null = useMemo(() => {
    if (isAiAssistant) {
        return {
            id: AI_CONTACT_ID,
            name: 'AI Assistant',
            avatar: 'https://picsum.photos/seed/ai-robot-abstract-art/100/100',
            online: true,
            lastMessage: '',
            lastMessageTime: '',
            unreadCount: 0,
        }
    }
    if (!contactUser) return null;

    return {
        id: contactUser.phoneNumber,
        name: contactUser.name,
        avatar: contactUser.profilePicture || `https://picsum.photos/seed/${contactId}/100/100`,
        online: contactUser.status?.online || false,
        lastSeen: contactUser.status?.lastSeen,
        lastMessage: '', // Not needed for header
        lastMessageTime: '', // Not needed for header
        unreadCount: 0,
    }
  }, [contactUser, contactId, isAiAssistant]);


  if (isLoading) {
    return (
       <div className="flex items-center justify-between border-b bg-card p-3 shadow-sm">
         <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                </div>
                <div>
                    <div className="h-4 w-24 rounded-md bg-muted animate-pulse mb-1" />
                    <div className="h-3 w-16 rounded-md bg-muted animate-pulse" />
                </div>
            </div>
         </div>
         <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
       </div>
    )
  }

  if (!contact) {
    // Render a minimal state if contact not found after loading
    return (
       <div className="flex items-center justify-between border-b bg-card p-3 shadow-sm">
         <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <p className="text-muted-foreground">Chat not found</p>
         </div>
       </div>
    )
  }
  
  const lastSeenText = () => {
    if(contact.online) return 'Online';
    if(isAiAssistant) return 'Always available';
    if(contact.lastSeen && typeof contact.lastSeen === 'number') {
        return `Last seen ${formatDistanceToNow(new Date(contact.lastSeen), { addSuffix: true })}`;
    }
    return 'Last seen recently';
  }

  return (
    <div className="flex items-center justify-between border-b bg-card p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-3 text-left" disabled={isAiAssistant}>
              <div className="relative flex-shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={contact.avatar} alt={contact.name} data-ai-hint="person" />
                  <AvatarFallback>{contact.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                {contact.online && <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-card" />}
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{contact.name}</h2>
                <p className="text-sm text-muted-foreground">
                   {contact.isTyping ? <span className="italic text-primary">typing...</span> : lastSeenText()}
                </p>
              </div>
            </button>
          </DialogTrigger>
          {!isAiAssistant && (
            <DialogContent>
              <DialogHeader className="items-center text-center">
                 <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={contact.avatar} alt={contact.name} data-ai-hint="person" />
                    <AvatarFallback className="text-4xl">{contact.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <DialogTitle className="text-2xl">{contact.name}</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="text-base font-medium">{contact.id}</p>
                    </div>
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>

      </div>
      <Button variant="ghost" size="icon">
        <MoreVertical className="h-5 w-5 text-muted-foreground" />
      </Button>
    </div>
  );
}
