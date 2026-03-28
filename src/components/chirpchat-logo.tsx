import { cn } from '@/lib/utils';

type ChirpChatLogoProps = {
  className?: string;
};

export function ChirpChatLogo({ className }: ChirpChatLogoProps) {
  return (
    <svg
      viewBox="0 0 520 250"
      aria-hidden="true"
      className={cn('w-[260px]', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="chirp-body" x1="140" y1="44" x2="286" y2="188" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#b6edff" />
          <stop offset="0.48" stopColor="#5cbaf5" />
          <stop offset="1" stopColor="#2f86da" />
        </linearGradient>
        <linearGradient id="chirp-wing" x1="92" y1="116" x2="178" y2="176" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1c8cf2" />
          <stop offset="1" stopColor="#0f58c9" />
        </linearGradient>
        <linearGradient id="chirp-beak" x1="262" y1="100" x2="303" y2="126" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffd45d" />
          <stop offset="1" stopColor="#ff6d1e" />
        </linearGradient>
        <linearGradient id="chat-bubble" x1="310" y1="58" x2="390" y2="106" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#88d80d" />
          <stop offset="1" stopColor="#63c400" />
        </linearGradient>
        <radialGradient id="chirp-highlight" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(218 90) rotate(126.119) scale(101.865 125.244)">
          <stop offset="0" stopColor="#eefcff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#eefcff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="184" cy="194" rx="100" ry="12" fill="#0f172a" opacity="0.12" />

      <path
        d="M101 153c-20 9-35 11-48 9 8 12 22 21 43 25 21 3 40 1 55-8-19-3-36-12-50-26Z"
        fill="#0d3a87"
      />

      <path
        d="M197 56c22 1 41 9 56 24 15 14 22 33 22 55 0 23-7 43-22 58-15 15-35 23-59 24-29 2-54-6-76-24-22-18-37-29-73-25 19-11 34-22 42-44 5-14 9-28 18-40 19-19 54-30 92-28Z"
        fill="url(#chirp-body)"
        stroke="#0b3b88"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      <path
        d="M120 118c22-10 46-10 67 0 19 10 30 28 31 51-28 13-54 18-77 13-24-4-43-17-56-38 4-9 16-19 35-26Z"
        fill="url(#chirp-wing)"
        stroke="#0b3b88"
        strokeWidth="4"
        strokeLinejoin="round"
      />

      <path
        d="M96 142c20 12 47 18 81 17"
        stroke="#0b3b88"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M108 158c23 10 50 13 79 9"
        stroke="#0b3b88"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <path
        d="M171 57c6-14 19-23 39-27-6 9-10 18-10 28"
        fill="#57b8f7"
        stroke="#0b3b88"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M250 98c13-6 28-4 40 7-6 10-17 16-31 18-10 1-20-1-29-6 5-9 11-15 20-19Z"
        fill="url(#chirp-beak)"
        stroke="#d74f14"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      <path d="M252 110c10 2 20 2 30 0" stroke="#d74f14" strokeWidth="3" strokeLinecap="round" />

      <circle cx="224" cy="90" r="12" fill="#12316d" />
      <circle cx="228" cy="85" r="4" fill="#fff" />

      <path
        d="M151 80c24-18 52-24 85-19"
        stroke="#2b7fd3"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.65"
      />

      <path
        d="M298 55h55c18 0 32 13 32 29s-14 29-32 29h-27l-18 16 4-16h-14c-18 0-32-13-32-29s14-29 32-29Z"
        fill="url(#chat-bubble)"
      />
      <circle cx="326" cy="84" r="6" fill="#fff" />
      <circle cx="345" cy="84" r="6" fill="#fff" />
      <circle cx="364" cy="84" r="6" fill="#fff" />

      <path
        d="M95 82c14-20 39-34 78-39 42-5 73 5 94 24 20 19 31 43 31 72 0 19-5 37-14 51-14 22-37 34-69 38-34 4-65-1-91-16-13-7-24-16-36-25-11-8-24-12-38-12 11-8 20-18 27-31 8-14 8-28 18-43Z"
        fill="url(#chirp-highlight)"
      />

      <text
        x="34"
        y="235"
        fill="#0b357a"
        fontFamily="Avenir Next, Segoe UI, Arial, sans-serif"
        fontSize="70"
        fontWeight="500"
        letterSpacing="-2"
      >
        Chirp
      </text>
      <text
        x="224"
        y="235"
        fill="#72ce08"
        fontFamily="Avenir Next, Segoe UI, Arial, sans-serif"
        fontSize="70"
        fontWeight="500"
        letterSpacing="-2"
      >
        Chat
      </text>
    </svg>
  );
}
