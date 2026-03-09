import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/components/CartProvider';
import Header from '@/components/Header';
import CartSidebar from '@/components/CartSidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Catálogo de Produtos | ONO PESCA',
  description: 'Faça seu pedido diretamente pelo nosso catálogo online.',
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
          <main>
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  );
}
