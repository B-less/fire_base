
import { Suspense } from 'react';
import { HomePageClient } from '@/components/home-page-client';
import { Skeleton } from '@/components/ui/skeleton';

function LoadingSkeleton() {
  return (
    <main className="flex h-screen w-full items-center justify-center bg-background p-0 md:p-4">
      <div className="flex h-full w-full max-w-7xl items-center gap-4 p-4">
        <Skeleton className="hidden h-[80%] w-1/3 rounded-2xl md:block" />
        <Skeleton className="h-[80%] w-full rounded-2xl md:w-2/3" />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <HomePageClient />
    </Suspense>
  );
}
