import './globals.css';
import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { ClientLayout } from '@/components/layout/ClientLayout';
import ConfigureAmplify  from '@/utils/configureAmplify';


const manrope = Manrope({ 
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  variable: '--font-manrope'
});

export const metadata: Metadata = {
  title: 'Capture',
  description: 'Capture your moments',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} font-sans`} suppressHydrationWarning>
        <ConfigureAmplify />
        <RouteGuard>
          <ClientLayout>
            {children}
            <img src="/logo.svg" alt="CaptureJoy" className="fixed bottom-8 right-8 select-none" />
          </ClientLayout>
        </RouteGuard>
      </body>
    </html>
  );
}