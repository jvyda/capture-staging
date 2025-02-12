import './globals.css';
import { Manrope } from 'next/font/google';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { ConfigureAmplify } from '@/utils/configureAmlify';

const manrope = Manrope({ 
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  variable: '--font-manrope'
});



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} font-sans`} suppressHydrationWarning>
        <ConfigureAmplify />
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}