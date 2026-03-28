import Image from 'next/image';

import { cn } from '@/lib/utils';

type ChirpChatLogoProps = {
  className?: string;
};

export function ChirpChatLogo({ className }: ChirpChatLogoProps) {
  return (
    <div className={cn('relative aspect-square w-full max-w-[220px]', className)}>
      <Image
        src="/chirpchat-logo.svg"
        alt="ChirpChat logo"
        fill
        priority
        sizes="220px"
        className="object-contain"
      />
    </div>
  );
}
