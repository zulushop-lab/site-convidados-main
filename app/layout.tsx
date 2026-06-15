import type { Metadata } from 'next';
import { Montserrat, Cormorant_Garamond, Playfair_Display, Alex_Brush } from 'next/font/google';

const alexBrush = Alex_Brush({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-alex-brush',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
});
import './globals.css';

import { TopNav } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';
import { LoadingScreen } from '@/components/LoadingScreen';
import { FloatingBackground } from '@/components/FloatingBackground';
import { GlobalNavigationOptions } from '@/components/GlobalMenu';

import { GlobalAudioPlayer } from '@/components/GlobalAudioPlayer';

const montserrat = Montserrat({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: 'Isadora & Matheus',
  description: 'Celebração do casamento de Isadora e Matheus',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${montserrat.variable} ${cormorant.variable} ${playfair.variable} ${alexBrush.variable}`}>
      <body className="antialiased min-h-[100dvh] flex flex-col font-body">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <GlobalAudioPlayer />
          <LoadingScreen />
          <FloatingBackground />
          <TopNav />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
          <GlobalNavigationOptions />
        </ThemeProvider>
      </body>
    </html>
  );
}
