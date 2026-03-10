import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/components/CartProvider';
import Header from '@/components/Header';
import CartSidebar from '@/components/CartSidebar';
import InstallPWA from '@/components/InstallPWA';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Catálogo de Produtos | ONO PESCA',
  description: 'Faça seu pedido diretamente pelo nosso catálogo online.',
  manifest: '/manifest.json',
  themeColor: '#ffffff',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ONO PESCA',
  },
  icons: {
    apple: '/logo-ono.jpg',
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <CartProvider>
          <Header />
          <CartSidebar />
          <InstallPWA />
          <main>
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  );
}
