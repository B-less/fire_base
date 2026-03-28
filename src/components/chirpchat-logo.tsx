import { cn } from '@/lib/utils';

type ChirpChatLogoProps = {
  className?: string;
};

export function ChirpChatLogo({ className }: ChirpChatLogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={cn('h-8 w-8', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19 16.5h19c7.18 0 13 5.82 13 13v2c0 7.18-5.82 13-13 13H29.5L18 52V42.6c-7-.5-12.5-6.33-12.5-13.6v-.5c0-6.63 5.37-12 12-12H19Z"
        fill="currentColor"
      />
      <path
        d="M25 28.5h11.5"
        stroke="hsl(var(--primary))"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M25 34.5h17"
        stroke="hsl(var(--primary))"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M43.5 14c3 1.2 5.3 3.5 6.5 6.5"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M47.5 9c4.4 1.6 7.9 5.1 9.5 9.5"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
