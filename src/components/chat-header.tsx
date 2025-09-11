
'use client';

import { useState } from 'react';
import { ArrowLeft, MoreVertical, Phone } from 'lucide-react';
import type { Contact } from '@/lib/types';
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

interface ChatHeaderProps {
  contact: Contact;
  onBack: () => void;
}

export function ChatHeader({ contact, onBack }: ChatHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isAiAssistant = contact.id === 'ai-assistant';
  
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
                   {lastSeenText()}
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
