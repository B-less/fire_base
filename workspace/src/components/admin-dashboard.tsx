'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminDashboardProps {
    onBack: () => void;
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center gap-4 p-4 border-b">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Welcome to the Admin Dashboard</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Admin functionality is under construction.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
