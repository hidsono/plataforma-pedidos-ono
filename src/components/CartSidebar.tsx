"use client";

import React, { useState } from 'react';
import { useCart } from './CartProvider';
import { X, Plus, Minus, Send, ShoppingBag } from 'lucide-react';

// Substitua pelo número do WhatsApp no formato internacional: 5511999999999
const WHATSAPP_NUMBER = "551238622922";

export default function CartSidebar() {
    const { items, isCartOpen, setIsCartOpen, total, updateQuantity, clearCart } = useCart();

    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [payment, setPayment] = useState('PIX');

    const hasVariableWeight = items.some(item => item.isVariableWeight);

    const handleCheckout = () => {
        if (!name || !address) {
            alert("Por favor, preencha nome e endereço para entrega.");
            return;
        }

        let message = `*NOVO PEDIDO!*\n\n`;
        message += `*Cliente:* ${name}\n`;
        message += `*Endereço:* ${address}\n`;
        message += `*Forma de Pagto:* ${payment}\n\n`;
        message += `*ITENS DO PEDIDO:*\n`;

        items.forEach(item => {
            message += `- ${item.quantity}x ${item.name}`;

            if (item.isVariableWeight) {
                message += ` (~R$ ${(item.price * item.quantity).toFixed(2)} - *Peso Variável*)\n`;
                if (item.cleaningOption) {
                    message += `   ↳ Limpeza: ${item.cleaningOption}\n`;
                }
                if (item.takeLeftovers) {
                    message += `   ↳ Levar ossos/cabeça: Sim\n`;
                }
            } else {
                message += ` (R$ ${(item.price * item.quantity).toFixed(2)})\n`;
            }
        });

        if (hasVariableWeight) {
            message += `\n*TOTAL APROXIMADO: ~ R$ ${total.toFixed(2)}*\n\n`;
            message += `_Aviso: Alguns itens são de peso variável. O valor final será confirmado após a pesagem das peças._`;
        } else {
            message += `\n*TOTAL: R$ ${total.toFixed(2)}*`;
        }

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
        clearCart();
        setIsCartOpen(false);
    };

    return (
        <>
            <div className={`cart-overlay ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)} />

            <div className={`cart-sidebar ${isCartOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShoppingBag size={20} />
                        Seu Carrinho
                    </h2>
                    <button className="btn" onClick={() => setIsCartOpen(false)} style={{ background: 'transparent' }}>
                        <X size={20} />
                    </button>
                </div>

                <div className="cart-body">
                    {items.length === 0 ? (
                        <div className="empty-state">
                            <ShoppingBag size={48} />
                            <p>Seu carrinho está vazio.</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ marginBottom: '24px' }}>
                                {items.map(item => (
                                    <div key={item.id} className="cart-item">
                                        <div className="cart-item-info">
                                            <div className="cart-item-title">{item.name}</div>
                                            {item.isVariableWeight && (
                                                <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '4px', fontWeight: 600 }}>
                                                    Peso Variável
                                                </div>
                                            )}
                                            {item.cleaningOption && (
                                                <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>
                                                    Limpeza: {item.cleaningOption}
                                                </div>
                                            )}
                                            {item.takeLeftovers && (
                                                <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>
                                                    + Levar restos
                                                </div>
                                            )}
                                            <div className="cart-item-price">
                                                {item.isVariableWeight ? '~ ' : ''}R$ {(item.price * item.quantity).toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="cart-item-actions">
                                            <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                                <Minus size={14} />
                                            </button>
                                            <span>{item.quantity}</span>
                                            <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                                <h3 style={{ marginBottom: '16px' }}>Dados de Entrega</h3>
                                <div className="form-group">
                                    <label className="form-label">Seu Nome</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Como podemos te chamar?"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Endereço Completo</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Rua, Número, Bairro, Complemento"
                                        value={address}
                                        onChange={e => setAddress(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Forma de Pagamento</label>
                                    <select
                                        className="form-input"
                                        value={payment}
                                        onChange={e => setPayment(e.target.value)}
                                    >
                                        <option value="PIX">PIX</option>
                                        <option value="Dinheiro">Dinheiro</option>
                                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                                        <option value="Cartão de Débito">Cartão de Débito</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="cart-footer">
                        <div className="cart-total">
                            <span>Total {hasVariableWeight && <span style={{ fontSize: '0.85rem', color: 'var(--secondary-text)', fontWeight: 'normal' }}>(Aproximado)</span>}</span>
                            <span>{hasVariableWeight ? '~ ' : ''}R$ {total.toFixed(2)}</span>
                        </div>
                        {hasVariableWeight && (
                            <p style={{ fontSize: '0.8rem', color: '#dc3545', marginBottom: '16px', lineHeight: 1.4, backgroundColor: '#fae1e3', padding: '12px', borderRadius: '8px' }}>
                                <b>Atenção:</b> Alguns peixes têm variação natural de peso. O valor total é <b>aproximado</b> e será confirmado pelo nosso atendente após a pesagem no WhatsApp.
                            </p>
                        )}
                        <button className="btn btn-success" style={{ width: '100%', padding: '16px' }} onClick={handleCheckout}>
                            <Send size={18} />
                            Enviar Pedido pelo WhatsApp
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
