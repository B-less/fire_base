
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Bot, Settings, Loader2, MoreVertical, Trash2 } from 'lucide-react';
import type { Contact, User } from '@/lib/types';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/context/auth-context';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { countries } from '@/lib/countries';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/lib/firebase';
import { ref, get, child } from 'firebase/database';
import { Skeleton } from './ui/skeleton';
import { AdminDashboard } from './admin-dashboard';


// IMPORTANT: Change this to your actual phone number with the country code to be the admin.
const ADMIN_PHONE_NUMBER = '+16505551234'; 
const ADMIN_SECRET_CODE = '!admin';

const AI_CONTACT_ID = 'ai-assistant';


interface ContactListProps {
  contacts: Contact[];
  activeContactId: string | null;
  onSelectContact: (id: string) => void;
  onAddContact: (user: User) => void;
  onDeleteContact: (id: string) => void;
  isLoading: boolean;
}

function AddContactDialog({ onAddContact, children }: { onAddContact: (user: User) => void, children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState(countries.find(c => c.code === 'US')!);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const handleCountryChange = (value: string) => {
    const selectedCountry = countries.find(c => c.code === value);
    if (selectedCountry) {
      setCountry(selectedCountry);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || !currentUser) return;
    setIsLoading(true);

    const fullPhoneNumber = `${country.dial_code}${phoneNumber}`;

    if (fullPhoneNumber === currentUser.phoneNumber) {
        toast({
            title: "Cannot Add Yourself",
            description: "You cannot start a chat with your own phone number.",
            variant: "destructive"
        });
        setIsLoading(false);
        return;
    }

    try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, `users/${fullPhoneNumber.trim()}`));

        if (snapshot.exists()) {
            const userData = snapshot.val();
            onAddContact({ ...userData, phoneNumber: fullPhoneNumber.trim()});
            setPhoneNumber('');
            setOpen(false);
        } else {
            toast({
                title: "User Not Found",
                description: "No user is registered with this phone number.",
                variant: "destructive"
            });
        }
    } catch (error) {
        toast({
            title: "Error",
            description: "An error occurred while searching for the user.",
            variant: "destructive"
        });
        console.error(error);
    } finally {
        setIsLoading(false);
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
              Enter the phone number of the person you want to chat with.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                 <Select value={country.code} onValueChange={handleCountryChange}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue>
                        <span className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span>{country.dial_code}</span>
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          <span className="flex items-center gap-2">
                            <span>{c.flag}</span>
                            <span>{c.name} ({c.dial_code})</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter a number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1"
                  autoComplete="off"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!phoneNumber.trim() || isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Searching..." : "Start Chat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EmptyContactList({ onAddContact }: { onAddContact: (user: User) => void }) {
  return (
    <div className='flex flex-col h-full items-center justify-center p-4 text-center'>
      <div className='flex flex-col items-center gap-4'>
        <AddContactDialog onAddContact={onAddContact}>
          <button className='flex items-center justify-center w-24 h-24 bg-background rounded-full border-4 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors group'>
            <Plus className='w-12 h-12 text-muted-foreground/40 group-hover:text-primary/60 transition-colors' />
          </button>
        </AddContactDialog>
        <p className="text-muted-foreground max-w-xs">No chats yet. Click the plus to find someone and start messaging!</p>
      </div>
    </div>
  )
}

function ContactListSkeleton() {
    return (
        <div className="flex flex-col p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                           <Skeleton className="h-4 w-2/4" />
                           <Skeleton className="h-3 w-1/4" />
                        </div>
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                </div>
            ))}
        </div>
    )
}

const formatTimestamp = (isoString: string) => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        }).format(date);
    } catch (e) {
        return '';
    }
}


export function ContactList({ contacts, activeContactId, onSelectContact, onAddContact, onDeleteContact, isLoading }: ContactListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const { user: currentUser } = useAuth();
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value === ADMIN_SECRET_CODE && currentUser?.phoneNumber === ADMIN_PHONE_NUMBER) {
      setShowAdminPanel(true);
    } else if (showAdminPanel && value !== ADMIN_SECRET_CODE) {
      setShowAdminPanel(false);
    }
  };

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleBackToContacts = () => {
    setShowAdminPanel(false);
    setSearchTerm('');
  }

  const handleDeleteClick = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setContactToDelete(contact);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (contactToDelete) {
        onDeleteContact(contactToDelete.id);
    }
    setIsDeleteDialogOpen(false);
    setContactToDelete(null);
  };


  if (showAdminPanel) {
    return <AdminDashboard onBack={handleBackToContacts} />;
  }

  const renderContent = () => {
    if (isLoading) {
        return <ContactListSkeleton />
    }
    if (contacts.length <= 1 && !searchTerm) { // Only AI chat is there
        return <EmptyContactList onAddContact={onAddContact} />
    }
    if (filteredContacts.length > 0) {
        return filteredContacts.map((contact) => (
          <div
            key={contact.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectContact(contact.id)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectContact(contact.id)}
            className={cn(
              'flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50 relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              activeContactId === contact.id && 'bg-muted'
            )}
          >
            <div className="relative h-12 w-12 flex-shrink-0">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={contact.avatar} alt={contact.name} data-ai-hint="person" />
                    <AvatarFallback>{contact.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                {contact.online && (
                   <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-card" />
                )}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="truncate font-semibold text-foreground">{contact.name}</p>
                <p className="text-xs text-muted-foreground">{formatTimestamp(contact.lastMessageTime)}</p>
              </div>
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-sm text-muted-foreground">{contact.isTyping ? 'typing...' : contact.lastMessage}</p>
                {contact.unreadCount > 0 && (
                  <Badge variant="default" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full p-0">
                    {contact.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
             {contact.id !== AI_CONTACT_ID && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1/2 -translate-y-1/2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem
                            onClick={(e) => handleDeleteClick(contact, e)}
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete Chat</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
          </div>
        ));
    }
    return (
        <div className="p-4 text-center text-sm text-muted-foreground">
            No contacts found.
        </div>
    )
  }

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
                    <Link href="/?page=settings">
                      <Button variant="ghost" size="icon">
                          <Settings className="h-5 w-5" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Settings</p>
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
            onChange={handleSearchChange}
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
            {renderContent()}
        </div>
      </ScrollArea>
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete your chat history with {contactToDelete?.name}. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={confirmDelete}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
