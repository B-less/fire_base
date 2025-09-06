import { ChatContainer } from '@/components/chat-container';

export default function Home() {
  return (
    <main className="flex h-screen w-full items-center justify-center bg-background p-0 md:p-4">
      <div className="h-full w-full max-w-7xl rounded-none border-0 bg-card shadow-none md:rounded-2xl md:border md:shadow-lg">
        <ChatContainer />
      </div>
    </main>
  );
}
