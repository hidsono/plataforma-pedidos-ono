"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
    id: string; // unique string for the cart item (product.id + options)
    productId: string;
    name: string;
    price: number;
    quantity: number;
    isVariableWeight?: boolean;
    cleaningOption?: string;
    takeLeftovers?: boolean;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: any, cleaningOption?: string, takeLeftovers?: boolean) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, qty: number) => void;
    clearCart: () => void;
    isCartOpen: boolean;
    setIsCartOpen: (open: boolean) => void;
    total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('cart');
        if (saved) {
            try { setItems(JSON.parse(saved)); } catch (e) { }
        }
    }, []);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem('cart', JSON.stringify(items));
        }
    }, [items, mounted]);

    const addToCart = (product: any, cleaningOption?: string, takeLeftovers?: boolean) => {
        setItems(prev => {
            const isVariableWeight = product.isVariableWeight;
            const cartItemId = isVariableWeight && cleaningOption
                ? `${product.id}-${cleaningOption}-${takeLeftovers ? 'leftovers' : 'no'}`
                : product.id;

            const existing = prev.find(item => item.id === cartItemId);
            if (existing) {
                return prev.map(item => item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, {
                id: cartItemId,
                productId: product.id,
                name: product.name,
                price: Number(product.price) || 0,
                quantity: 1,
                isVariableWeight,
                cleaningOption,
                takeLeftovers
            }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (id: string) => setItems(prev => prev.filter(item => item.id !== id));

    const updateQuantity = (id: string, qty: number) => {
        if (qty < 1) {
            removeFromCart(id);
            return;
        }
        setItems(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item));
    };

    const clearCart = () => setItems([]);

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, isCartOpen, setIsCartOpen, total }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within a CartProvider");
    return context;
}
