import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: { default: 'AgroMarket Bolivia', template: '%s | AgroMarket Bolivia' },
  description: 'La primera plataforma agritech integrada de Bolivia. Conectamos productores, compradores, proveedores e instituciones financieras del sector agropecuario.',
  keywords: ['agritech', 'bolivia', 'agricultura', 'mercado', 'productores', 'cosechas', 'insumos'],
  authors: [{ name: 'AgroMarket Bolivia' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://agromarket.bo'),
  openGraph: {
    type: 'website',
    locale: 'es_BO',
    siteName: 'AgroMarket Bolivia',
    title: 'AgroMarket Bolivia — Plataforma Agritech',
    description: 'Vende tu cosecha, compra insumos y accede a crédito agrícola desde tu celular.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', title: 'AgroMarket Bolivia', images: ['/og-image.png'] },
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2D7D2A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Syne:wght@400..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-background text-foreground antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
