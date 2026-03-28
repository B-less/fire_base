import { cn } from '@/lib/utils';

type ChirpChatLogoProps = {
  className?: string;
};

export function ChirpChatLogo({ className }: ChirpChatLogoProps) {
  return (
    <svg
      viewBox="0 0 512 256"
      className={cn('w-[260px]', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="210" cy="170" rx="90" ry="10" fill="#000" opacity="0.08" />

      <path
        d="M130 120c0-40 35-70 80-70s80 30 80 70-35 70-80 70-80-30-80-70z"
        fill="#6EC1E4"
      />

      <path
        d="M140 120c20-25 70-25 95 0-10 35-75 45-95 0z"
        fill="#2F80ED"
      />

      <path
        d="M110 125c-25-10-40-20-50-30 5 20 20 35 45 40z"
        fill="#2F80ED"
      />

      <circle cx="255" cy="95" r="38" fill="#6EC1E4" />

      <path
        d="M285 100c20-10 40 5 40 5s-15 20-40 15c-10-2-15-10 0-20z"
        fill="#FFA726"
      />

      <circle cx="265" cy="90" r="7" fill="#0B357A" />
      <circle cx="268" cy="87" r="2.5" fill="#fff" />

      <path
        d="M320 55h60c20 0 35 15 35 30s-15 30-35 30h-25l-20 18 5-18h-20c-20 0-35-15-35-30s15-30 35-30z"
        fill="#72CE08"
      />

      <circle cx="345" cy="85" r="5" fill="#fff" />
      <circle cx="365" cy="85" r="5" fill="#fff" />
      <circle cx="385" cy="85" r="5" fill="#fff" />

      <text
        x="90"
        y="230"
        fontSize="60"
        fill="#0B357A"
        fontFamily="Avenir Next, Segoe UI, Arial, sans-serif"
        fontWeight="500"
        letterSpacing="-1"
      >
        Chirp
      </text>

      <text
        x="250"
        y="230"
        fontSize="60"
        fill="#72CE08"
        fontFamily="Avenir Next, Segoe UI, Arial, sans-serif"
        fontWeight="500"
        letterSpacing="-1"
      >
        Chat
      </text>
    </svg>
  );
}
