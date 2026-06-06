import type { Metadata, Viewport } from 'next';
import { Inter, Syne } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const syne = Syne({ subsets: ['latin'], variable: '--font-syne', display: 'swap' });

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
    <html lang="es" className={`${inter.variable} ${syne.variable}`} suppressHydrationWarning>
      <body className="font-body bg-background text-foreground antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
