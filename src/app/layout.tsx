import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'GetCareKorea - Premium Medical Tourism in Korea',
    template: '%s | GetCareKorea',
  },
  description:
    'Connect with top-rated Korean hospitals and certified medical interpreters. Experience world-class healthcare at affordable prices.',
  keywords: [
    'medical tourism',
    'Korea',
    'plastic surgery',
    'health checkup',
    'medical interpreter',
    'hospital',
  ],
  authors: [{ name: 'GetCareKorea' }],
  creator: 'GetCareKorea',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'GetCareKorea',
    title: 'GetCareKorea - Premium Medical Tourism in Korea',
    description:
      'Connect with top-rated Korean hospitals and certified medical interpreters.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GetCareKorea',
    description: 'Premium Medical Tourism in Korea',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
