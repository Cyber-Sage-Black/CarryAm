import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'CarryAm — Peer-to-Peer Intercity Delivery',
  description:
    'Connect with verified travelers moving along your route. Same-day package delivery at 60% lower cost with bank-grade escrow protection.',
  keywords: [
    'CarryAm',
    'intercity delivery',
    'Lagos Ibadan',
    'peer to peer',
    'package delivery',
    'Nigeria logistics',
  ],
  openGraph: {
    title: 'CarryAm — Send Parcels with Verified Travelers',
    description:
      'Turn everyday commuters into instant couriers. Same-day delivery at 60% lower cost.',
    siteName: 'CarryAm',
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CarryAm — Peer-to-Peer Intercity Delivery',
    description:
      'Connect with verified travelers. Same-day delivery at 60% lower cost.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#0284C7" />
      </head>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
