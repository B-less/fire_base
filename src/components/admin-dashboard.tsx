
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, off, push, serverTimestamp } from 'firebase/database';
import type { User, Message } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User as UserIcon, Loader2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';


interface AdminDashboardProps {
    onBack: () => void;
}

const getConversationKey = (user1: string, user2: string) => {
  return [user1, user2].sort().join('-');
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUsers, setSelectedUsers] = useState<Record<string, boolean>>({});
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const usersRef = ref(db, 'users');
        const listener = onValue(usersRef, (snapshot) => {
            const usersData = snapshot.val();
            if (usersData) {
                const userList = Object.keys(usersData).map(key => ({
                    ...usersData[key],
                    phoneNumber: key
                }));
                setUsers(userList);
            }
            setIsLoading(false);
        });

        return () => off(usersRef, 'value', listener);
    }, []);

    const handleSelectUser = (phoneNumber: string, isSelected: boolean) => {
        setSelectedUsers(prev => ({
            ...prev,
            [phoneNumber]: isSelected,
        }));
    };

    const handleSelectAll = (isSelected: boolean) => {
        const newSelectedUsers: Record<string, boolean> = {};
        if (isSelected) {
            users.forEach(user => {
                newSelectedUsers[user.phoneNumber] = true;
            });
        }
        setSelectedUsers(newSelectedUsers);
    };

    const handleSendBroadcast = async () => {
        if (!broadcastMessage.trim()) return;

        setIsSending(true);
        const selectedPhoneNumbers = Object.keys(selectedUsers).filter(key => selectedUsers[key]);
        
        if (selectedPhoneNumbers.length === 0) {
            toast({ title: "No users selected", description: "Please select at least one user to send the message to.", variant: "destructive" });
            setIsSending(false);
            return;
        }

        const aiContactId = 'ai-assistant';
        const newDbMessage: Omit<Message, 'db_key' | 'id'> = {
            content: broadcastMessage,
            sender: aiContactId,
            timestamp: new Date().toISOString(),
            status: 'delivered',
        };

        try {
            const promises = selectedPhoneNumbers.map(phoneNumber => {
                const conversationKey = getConversationKey(phoneNumber, aiContactId);
                const messagesRef = ref(db, `messages/${conversationKey}`);
                const newMessageRef = push(messagesRef);
                return push(newMessageRef, newDbMessage);
            });
            
            await Promise.all(promises);

            toast({ title: "Broadcast Sent", description: `Message sent to ${selectedPhoneNumbers.length} user(s).` });
            setBroadcastMessage('');
            setSelectedUsers({});
            setIsBroadcastModalOpen(false);

        } catch (error) {
            console.error("Error sending broadcast:", error);
            toast({ title: "Send Error", description: "Could not send the broadcast message.", variant: "destructive" });
        } finally {
            setIsSending(false);
        }
    };
    
    const lastSeenText = (status?: User['status']) => {
        if (!status) return 'Never seen';
        if (status.online) return <span className="text-green-500 font-semibold">Online</span>;
        if (typeof status.lastSeen === 'number') {
            return `Last seen ${formatDistanceToNow(new Date(status.lastSeen), { addSuffix: true })}`;
        }
        return 'Last seen recently';
    }

    const selectedCount = Object.values(selectedUsers).filter(Boolean).length;
    const allSelected = users.length > 0 && selectedCount === users.length;


    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center gap-4 p-4 border-b">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </header>

            <ScrollArea className="flex-1">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="p-4 space-y-2">
                        <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/50">
                            <Checkbox 
                                id="select-all"
                                checked={allSelected}
                                onCheckedChange={(checked) => handleSelectAll(!!checked)}
                            />
                            <label htmlFor="select-all" className="flex-1 font-semibold text-sm">
                                {allSelected ? 'Deselect All' : 'Select All'} ({users.length} users)
                            </label>
                        </div>
                        {users.map((user) => (
                            <div key={user.phoneNumber} className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50">
                                <Checkbox 
                                    id={user.phoneNumber}
                                    checked={!!selectedUsers[user.phoneNumber]}
                                    onCheckedChange={(checked) => handleSelectUser(user.phoneNumber, !!checked)}
                                />
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={user.profilePicture} alt={user.name} />
                                    <AvatarFallback>
                                        <UserIcon className="h-6 w-6 text-muted-foreground" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold">{user.name}</p>
                                    <p className="text-sm text-muted-foreground">{user.phoneNumber}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">{lastSeenText(user.status)}</p>
                                    <p className="text-xs text-muted-foreground/70">
                                       {user.contacts?.length || 0} contacts
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
             {selectedCount > 0 && (
                <footer className="p-4 border-t bg-background">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{selectedCount} user(s) selected</p>
                        <Button onClick={() => setIsBroadcastModalOpen(true)}>
                            <Send className="mr-2 h-4 w-4" />
                            Send Broadcast
                        </Button>
                    </div>
                </footer>
             )}

            <Dialog open={isBroadcastModalOpen} onOpenChange={setIsBroadcastModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send Broadcast Message</DialogTitle>
                        <DialogDescription>
                            This message will be sent to all {selectedCount} selected users as a message from the AI Assistant.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea 
                        placeholder="Type your broadcast message here..."
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        rows={5}
                    />
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsBroadcastModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSendBroadcast} disabled={isSending || !broadcastMessage.trim()}>
                            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Message
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
