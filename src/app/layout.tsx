
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { PT_Sans } from 'next/font/google';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});


export const metadata: Metadata = {
  title: 'ChirpChat',
  description: 'A modern chat application',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon-192x192.png" />
      </head>
      <body className={cn("font-body antialiased", ptSans.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
