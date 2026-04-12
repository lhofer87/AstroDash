import type { Metadata, Viewport } from 'next';
import './globals.css';
import { StoreHydration } from '@/app/providers/StoreHydration';

/** Enables env(safe-area-inset-*) for notched devices + PWAs */
export const viewport: Viewport = {
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'AstroDash | Observation dashboard',
  description:
    'Light pollution map, saved spots, and observing conditions forecast.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased">
        <StoreHydration>{children}</StoreHydration>
      </body>
    </html>
  );
}
