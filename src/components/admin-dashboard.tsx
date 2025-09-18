
'use client';

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, off, push, serverTimestamp, set } from 'firebase/database';
import type { User, Message, AIUsageLog, AllMessages } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User as UserIcon, Loader2, Send, Bot } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
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
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from './ui/badge';


interface AdminDashboardProps {
    onBack: () => void;
}

const getConversationKey = (user1: string, user2: string) => {
  return [user1, user2].sort().join('-');
}

const COLORS = {
    'chat': '#0088FE',
    'image': '#00C49F',
    'video': '#FFBB28',
    'smart-reply': '#FF8042',
};

const FEATURE_DISPLAY_NAMES: Record<string, string> = {
    'chat': 'AI Chat',
    'image': 'Image Generation',
    'video': 'Video Generation',
    'smart-reply': 'Smart Reply'
};

const featureBadgeVariant = {
    'chat': 'default',
    'image': 'secondary',
    'video': 'outline',
    'smart-reply': 'destructive',
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [allMessages, setAllMessages] = useState<AllMessages>({});
    const [aiUsageLogs, setAiUsageLogs] = useState<AIUsageLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUsers, setSelectedUsers] = useState<Record<string, boolean>>({});
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setIsLoading(true);
        const usersRef = ref(db, 'users');
        const usersListener = onValue(usersRef, (snapshot) => {
            const usersData = snapshot.val();
            if (usersData) {
                const userList = Object.keys(usersData).map(key => ({
                    ...usersData[key],
                    phoneNumber: key
                }));
                setUsers(userList);
            }
        });

        const logsRef = ref(db, 'aiUsageLogs');
        const logsListener = onValue(logsRef, (snapshot) => {
            const logsData = snapshot.val();
            if (logsData) {
                const logList: AIUsageLog[] = Object.keys(logsData).map(key => ({
                    id: key,
                    ...logsData[key]
                })).sort((a, b) => b.timestamp - a.timestamp);
                setAiUsageLogs(logList);
            }
        });

        const messagesRef = ref(db, 'messages');
        const messagesListener = onValue(messagesRef, (snapshot) => {
            setAllMessages(snapshot.val() || {});
        });

        // Combine loading state management
        Promise.all([
            new Promise(resolve => onValue(usersRef, resolve, { onlyOnce: true })),
            new Promise(resolve => onValue(logsRef, resolve, { onlyOnce: true })),
            new Promise(resolve => onValue(messagesRef, resolve, { onlyOnce: true })),
        ]).then(() => setIsLoading(false));

        return () => {
            off(usersRef, 'value', usersListener);
            off(logsRef, 'value', logsListener);
            off(messagesRef, 'value', messagesListener);
        }
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

        try {
            const newBroadcastRef = push(ref(db, 'broadcasts'));
            await set(newBroadcastRef, {
                message: broadcastMessage,
                timestamp: serverTimestamp(),
                targetCount: selectedPhoneNumbers.length,
            });

            toast({ title: "Broadcast Sent", description: `Banner notification sent to ${selectedPhoneNumbers.length} user(s).` });
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

    const aiUsageData = Object.values(FEATURE_DISPLAY_NAMES).map(name => {
        const featureKey = Object.keys(FEATURE_DISPLAY_NAMES).find(key => FEATURE_DISPLAY_NAMES[key] === name) || '';
        return {
            name,
            value: aiUsageLogs.filter(log => log.feature === featureKey).length
        }
    }).filter(d => d.value > 0);

    const userActivityData = useMemo(() => {
        const messageCounts: Record<string, number> = {};
        
        Object.values(allMessages).forEach(conversation => {
            Object.values(conversation).forEach(message => {
                if (message.sender) {
                    messageCounts[message.sender] = (messageCounts[message.sender] || 0) + 1;
                }
            });
        });
        
        const usersMap = new Map(users.map(u => [u.phoneNumber, u.name]));

        return Object.entries(messageCounts)
            .map(([phoneNumber, count]) => ({
                name: usersMap.get(phoneNumber) || phoneNumber,
                messages: count
            }))
            .filter(u => u.name !== 'ai-assistant')
            .sort((a, b) => b.messages - a.messages)
            .slice(0, 10); // Top 10 users

    }, [allMessages, users]);


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
                    <div className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="lg:col-span-1">
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bot className="h-5 w-5" />
                                    AI Usage Analytics
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {aiUsageLogs.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={aiUsageData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                                nameKey="name"
                                                label={(entry) => `${entry.name} (${entry.value})`}
                                            >
                                                {aiUsageData.map((entry, index) => {
                                                     const featureKey = Object.keys(FEATURE_DISPLAY_NAMES).find(key => FEATURE_DISPLAY_NAMES[key] === entry.name);
                                                     return <Cell key={`cell-${index}`} fill={COLORS[featureKey as keyof typeof COLORS]} />
                                                })}
                                            </Pie>
                                            <Tooltip formatter={(value, name) => [value, name]}/>
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-muted-foreground text-center p-8">No AI usage data yet.</p>
                                )}
                            </CardContent>
                        </Card>
                        
                        <Card className="md:col-span-2">
                             <CardHeader>
                                <CardTitle>Most Active Users</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {userActivityData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={userActivityData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="name" type="category" width={80} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="messages" fill="#8884d8" name="Messages Sent" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                     <p className="text-muted-foreground text-center p-8">No user activity data yet.</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-3">
                            <CardHeader>
                                <CardTitle>Recent AI Logs</CardTitle>
                            </CardHeader>
                            <CardContent>
                                 <ScrollArea className="h-[300px]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Feature</TableHead>
                                                <TableHead>User</TableHead>
                                                <TableHead>Time</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {aiUsageLogs.slice(0, 20).map(log => {
                                                const user = users.find(u => u.phoneNumber === log.userId);
                                                return (
                                                <TableRow key={log.id}>
                                                    <TableCell>
                                                        <Badge variant={(featureBadgeVariant[log.feature as keyof typeof featureBadgeVariant] || 'default') as any}>
                                                            {FEATURE_DISPLAY_NAMES[log.feature] || log.feature}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{user?.name || log.userId || 'System'}</TableCell>
                                                    <TableCell>{format(new Date(log.timestamp), 'Pp')}</TableCell>
                                                </TableRow>
                                            )})}
                                        </TableBody>
                                    </Table>
                                    {aiUsageLogs.length === 0 && <p className="text-muted-foreground text-center p-8">No logs to display.</p>}
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        <div className="lg:col-span-3 p-4 space-y-2 border-t mt-4">
                            <div className="flex items-center justify-between font-semibold p-3 text-lg">
                                User Management
                            </div>
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
                            This message will be sent as a banner to all {selectedCount} selected users.
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

    