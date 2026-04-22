import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import TickerBar from '@/components/layout/TickerBar';
import Footer from '@/components/layout/Footer';
import AuthProvider from '@/components/auth/AuthProvider';
import LayoutShell from '@/components/layout/LayoutShell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'StockTerminal - 글로벌 투자 데이터 터미널',
  description: '전업투자자의 투자 환경을 일반 투자자에게. 한국/미국 주식 데이터를 한곳에서.',
};

export default function RootLayout({
  children,
  panel,
}: {
  children: React.ReactNode;
  panel: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className="min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <div className="w-full max-w-screen-2xl mx-auto flex-1 flex flex-col">
            <Header />
            <TickerBar />
            <LayoutShell footer={<Footer />}>
              {children}
            </LayoutShell>
          </div>
          {panel}
        </AuthProvider>
      </body>
    </html>
  );
}
