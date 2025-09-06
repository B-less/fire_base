
import { ArrowLeft, MoreVertical } from 'lucide-react';
import type { Contact } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  contact: Contact;
  onBack?: () => void;
}

export function ChatHeader({ contact, onBack }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b bg-card p-3 shadow-sm">
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Avatar className="h-10 w-10">
          <AvatarImage src={contact.avatar} alt={contact.name} data-ai-hint="person" />
          <AvatarFallback>{contact.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-foreground">{contact.name}</h2>
          <p className="text-sm text-muted-foreground">
            {contact.online ? 'Online' : `Last seen ${contact.lastMessageTime}`}
          </p>
        </div>
      </div>
      <Button variant="ghost" size="icon">
        <MoreVertical className="h-5 w-5 text-muted-foreground" />
      </Button>
    </div>
  );
}
