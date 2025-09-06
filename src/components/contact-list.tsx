
'use client';

import { useState } from 'react';
import { Search, Plus, LogOut } from 'lucide-react';
import type { Contact } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/context/auth-context';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';


interface ContactListProps {
  contacts: Contact[];
  activeContactId: string | null;
  onSelectContact: (id: string) => void;
  onAddContact: (name: string) => void;
}

function AddContactDialog({ onAddContact, children }: { onAddContact: (name: string) => void, children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAddContact(name.trim());
      setName('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Chat</DialogTitle>
            <DialogDescription>
              Enter the name of the person you want to chat with.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!name.trim()}>Start Chat</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EmptyContactList({ onAddContact }: { onAddContact: (name: string) => void }) {
  return (
    <div className='flex flex-col h-full items-center justify-center p-4 text-center'>
      <div className='flex flex-col items-center gap-4'>
        <AddContactDialog onAddContact={onAddContact}>
          <button className='flex items-center justify-center w-24 h-24 bg-background rounded-full border-4 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors group'>
            <Plus className='w-12 h-12 text-muted-foreground/40 group-hover:text-primary/60 transition-colors' />
          </button>
        </AddContactDialog>
        <p className="text-muted-foreground max-w-xs">No chats yet. Click the plus to add a new contact and start messaging!</p>
      </div>
    </div>
  )
}

export function ContactList({ contacts, activeContactId, onSelectContact, onAddContact }: ContactListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { logout } = useAuth();

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col border-r bg-card">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">ChirpChat</h1>
          <div className="flex items-center gap-1">
             <AddContactDialog onAddContact={onAddContact}>
                <Button variant="ghost" size="icon">
                   <Plus className="h-5 w-5" />
                </Button>
             </AddContactDialog>
            <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={logout}>
                        <LogOut className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Log out</p>
                  </TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {contacts.length === 0 ? <EmptyContactList onAddContact={onAddContact} /> : (
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => onSelectContact(contact.id)}
                  className={cn(
                    'flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50',
                    activeContactId === contact.id && 'bg-muted'
                  )}
                >
                  <Avatar className="relative h-12 w-12">
                    <AvatarImage src={contact.avatar} alt={contact.name} data-ai-hint="person" />
                    <AvatarFallback>{contact.name.charAt(0).toUpperCase()}</AvatarFallback>
                    {contact.online && (
                      <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-card bg-accent ring-1 ring-accent" />
                    )}
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <p className="truncate font-semibold text-foreground">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.lastMessageTime}</p>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm text-muted-foreground">{contact.lastMessage}</p>
                      {contact.unreadCount > 0 && (
                        <Badge variant="default" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full p-0">
                          {contact.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No contacts found.
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
