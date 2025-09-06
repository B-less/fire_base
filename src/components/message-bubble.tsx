import { Check, CheckCheck } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

interface MessageBubbleProps {
  message: Message;
  contactAvatar: string;
  isFirstInGroup: boolean;
}

const ReadStatusIcon = ({ status }: { status: Message['status'] }) => {
  if (status === 'read') {
    return <CheckCheck className="h-4 w-4 text-primary" />;
  }
  if (status === 'delivered') {
    return <CheckCheck className="h-4 w-4 text-muted-foreground" />;
  }
  return <Check className="h-4 w-4 text-muted-foreground" />;
};

export function MessageBubble({ message, contactAvatar, isFirstInGroup }: MessageBubbleProps) {
  const isMyMessage = message.sender === 'me';

  return (
    <div
      className={cn(
        'flex items-end gap-2 message-in',
        isMyMessage ? 'justify-end' : 'justify-start'
      )}
    >
      {!isMyMessage && (
        <Avatar className={cn('h-8 w-8', !isFirstInGroup && 'invisible')}>
          <AvatarImage src={contactAvatar} alt="Contact" data-ai-hint="person" />
          <AvatarFallback>C</AvatarFallback>
        </Avatar>
      )}
      <Card
        className={cn(
          'max-w-xs md:max-w-md lg:max-w-lg p-0 shadow-md',
          isMyMessage
            ? 'rounded-br-none bg-primary text-primary-foreground'
            : 'rounded-bl-none bg-card text-card-foreground'
        )}
      >
        <CardContent className="p-3">
          {message.image && (
             <Image
                src={message.image}
                alt="Shared media"
                width={300}
                height={200}
                className="rounded-md mb-2 object-cover"
                data-ai-hint="abstract landscape"
              />
          )}
          <p className="whitespace-pre-wrap">{message.content}</p>
          <div className="mt-1 flex items-center justify-end gap-2">
            <span className={cn('text-xs', isMyMessage ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
              {message.timestamp}
            </span>
            {isMyMessage && <ReadStatusIcon status={message.status} />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
