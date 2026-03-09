"use client";

import React from 'react';
import Link from 'next/link';
import { useCart } from './CartProvider';
import { ShoppingCart, Settings } from 'lucide-react';
import Image from 'next/image';

export default function Header() {
    const { items, setIsCartOpen } = useCart();

    const count = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <header className="header" style={{ padding: 0, borderBottom: 'none', background: 'var(--background)' }}>
            <div style={{ position: 'relative', width: '100%', background: 'transparent', display: 'flex', justifyContent: 'center', padding: '32px 20px' }}>
                <Link href="/" style={{ display: 'block', position: 'relative', width: '100%', maxWidth: '350px', aspectRatio: '1/1', borderRadius: '40px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                    <Image
                        src="/logo-ono.jpg"
                        alt="ONO PESCA"
                        fill
                        style={{ objectFit: 'cover' }}
                        priority
                    />
                </Link>

                <div className="container" style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 20px', pointerEvents: 'none' }}>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', pointerEvents: 'auto' }}>
                        <button className="btn btn-primary desktop-cart-btn" onClick={() => setIsCartOpen(true)} style={{ boxShadow: 'var(--shadow-lg)' }}>
                            <ShoppingCart size={20} />
                            Carrinho ({count})
                        </button>
                    </div>
                </div>

                {/* FAB (Floating Action Button) do Carrinho para Mobile */}
                <div className="floating-cart" onClick={() => setIsCartOpen(true)}>
                    <ShoppingCart size={24} />
                    {count > 0 && <span className="floating-cart-badge">{count}</span>}
                </div>
            </div>
        </header>
    );
}
