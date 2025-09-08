
'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { ChatContainer } from '@/components/chat-container';
import { Skeleton } from '@/components/ui/skeleton';
import SettingsPage from '@/app/settings/page';

export function HomePageClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showSettings = searchParams.get('page') === 'settings';

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <main className="flex h-screen w-full items-center justify-center bg-background p-0 md:p-4">
        <div className="flex h-full w-full max-w-7xl items-center gap-4 p-4">
          <Skeleton className="hidden h-[80%] w-1/3 rounded-2xl md:block" />
          <Skeleton className="h-[80%] w-full rounded-2xl md:w-2/3" />
        </div>
      </main>
    );
  }
  
  const handleBackToChat = () => {
    router.push('/');
  }

  return (
    <main className="flex h-screen w-full items-center justify-center bg-background p-0 md:p-4">
      <div className="h-full w-full max-w-7xl rounded-none border-0 bg-card shadow-none md:rounded-2xl md:border md:shadow-lg overflow-hidden">
        <div className={!showSettings ? 'h-full' : 'hidden'}>
          <ChatContainer />
        </div>
        {showSettings && (
          <div className="h-full">
            <SettingsPage onBack={handleBackToChat} />
          </div>
        )}
      </div>
    </main>
  );
}
