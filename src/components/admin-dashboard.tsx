
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import type { User } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User as UserIcon, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AdminDashboardProps {
    onBack: () => void;
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
    
    const lastSeenText = (status?: User['status']) => {
        if (!status) return 'Never seen';
        if (status.online) return <span className="text-green-500 font-semibold">Online</span>;
        if (typeof status.lastSeen === 'number') {
            return `Last seen ${formatDistanceToNow(new Date(status.lastSeen), { addSuffix: true })}`;
        }
        return 'Last seen recently';
    }


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
                        {users.map((user) => (
                            <div key={user.phoneNumber} className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50">
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
        </div>
    );
}
