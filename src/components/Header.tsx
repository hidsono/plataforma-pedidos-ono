"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from './CartProvider';
import { ShoppingCart, Clock } from 'lucide-react';
import Image from 'next/image';
import { getBusinessStatus, BusinessStatus } from '@/lib/businessHours';

export default function Header() {
    const { items, setIsCartOpen } = useCart();
    const [status, setStatus] = useState<BusinessStatus | null>(null);

    useEffect(() => {
        // Atualiza o status inicialmente e depois a cada minuto
        const updateStatus = () => setStatus(getBusinessStatus());
        updateStatus();
        const interval = setInterval(updateStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    const count = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <header className="header" style={{ padding: 0, borderBottom: 'none', background: 'var(--background)' }}>
            <div style={{ position: 'relative', width: '100%', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px 10px' }}>
                <Link href="/" style={{ display: 'block', position: 'relative', width: '100%', maxWidth: '350px', aspectRatio: '1/1', borderRadius: '40px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                    <Image
                        src="/logo-ono.jpg"
                        alt="ONO PESCA"
                        fill
                        style={{ objectFit: 'cover' }}
                        priority
                    />
                </Link>

                {status && (
                    <div style={{
                        marginTop: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: '99px',
                        backgroundColor: status.isOrderingOpen ? 'rgba(26, 131, 85, 0.1)' : 'rgba(211, 47, 47, 0.1)',
                        color: status.isOrderingOpen ? 'var(--success)' : '#d32f2f',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        border: `1px solid ${status.isOrderingOpen ? 'var(--success)' : '#d32f2f'}`
                    }}>
                        <Clock size={14} />
                        {status.message}
                    </div>
                )}

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
