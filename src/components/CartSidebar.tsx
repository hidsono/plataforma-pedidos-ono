"use client";

import React, { useState, useEffect } from 'react';
import { useCart } from './CartProvider';
import { X, Plus, Minus, Send, ShoppingBag, AlertTriangle, Clock, MapPin, Loader2 } from 'lucide-react';
import { getBusinessStatus, BusinessStatus } from '@/lib/businessHours';

// Substitua pelo número do WhatsApp no formato internacional: 5511999999999
const WHATSAPP_NUMBER = "551238622922";



export default function CartSidebar() {
    const { items, isCartOpen, setIsCartOpen, total, updateQuantity, clearCart } = useCart();

    const [name, setName] = useState('');
    const [cep, setCep] = useState('');
    const [street, setStreet] = useState('');
    const [number, setNumber] = useState('');
    const [complement, setComplement] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [city, setCity] = useState('São Sebastião');
    const [state, setState] = useState('SP');
    const [payment, setPayment] = useState('PIX');
    const [needsChange, setNeedsChange] = useState(false);
    const [changeFor, setChangeFor] = useState('');

    const [isSearchingCep, setIsSearchingCep] = useState(false);
    const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
    const [cepError, setCepError] = useState('');
    const [deliverySettings, setDeliverySettings] = useState<{ deliveryRules: any[], defaultFee: number } | null>(null);

    const [status, setStatus] = useState<BusinessStatus | null>(null);

    const handleSearchAddress = async () => {
        if (street.length < 3 || city.length < 3 || state.length < 2) {
            alert("Para buscar o CEP, preencha a Rua, Cidade e Estado (UF).");
            return;
        }
        setIsSearchingCep(true);
        setCepError('');
        try {
            // ViaCEP address search URL: UF/CIDADE/LOGRADOURO/json/
            const res = await fetch(`https://viacep.com.br/ws/${state}/${city}/${street}/json/`);
            const data = await res.json();

            if (Array.isArray(data) && data.length > 0) {
                // Pega o melhor resultado (primeiro)
                const result = data[0];
                setCep(result.cep);
                setNeighborhood(result.bairro);
                setCity(result.localidade);
                setState(result.uf);
                setDeliveryFee(calculateDeliveryFee(result.bairro));
            } else {
                alert("Nenhum CEP encontrado para este endereço. Tente digitar o nome da rua de forma diferente.");
            }
        } catch (error) {
            alert("Erro ao pesquisar endereço. Tente novamente.");
        } finally {
            setIsSearchingCep(false);
        }
    };

    useEffect(() => {
        if (isCartOpen) {
            setStatus(getBusinessStatus());
            // Busca as configurações de taxa sempre que o carrinho abre, sem cache
            fetch('/api/settings', { cache: 'no-store' })
                .then(res => res.json())
                .then(data => setDeliverySettings(data))
                .catch(console.error);
        }
    }, [isCartOpen]);

    const calculateDeliveryFee = (currentNeighborhood: string): number => {
        if (!deliverySettings) return 10.00;

        const normalize = (str: string) =>
            str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";

        const normalizedCurrent = normalize(currentNeighborhood);
        const rule = deliverySettings.deliveryRules?.find(r =>
            normalize(r.neighborhood) === normalizedCurrent
        );

        if (rule) return rule.fee;

        return deliverySettings.defaultFee || 10.00;
    };

    // Busca CEP automaticamente quando atinge 8 dígitos
    useEffect(() => {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length === 8) {
            handleSearchCep(cleanCep);
        } else if (neighborhood && deliverySettings) {
            // Se já temos o bairro mas as configurações mudaram (terminaram de carregar), atualiza a taxa
            setDeliveryFee(calculateDeliveryFee(neighborhood));
        } else {
            setDeliveryFee(null);
            setCepError('');
        }
    }, [cep, deliverySettings, neighborhood]);

    const handleSearchCep = async (cleanCep: string) => {
        setIsSearchingCep(true);
        setCepError('');
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await res.json();

            if (data.erro) {
                setCepError('CEP não encontrado.');
                setStreet('');
                setNeighborhood('');
                setCity('');
                setDeliveryFee(null);
            } else {
                setStreet(data.logradouro);
                setNeighborhood(data.bairro);
                setCity(data.localidade);
                setDeliveryFee(calculateDeliveryFee(data.bairro));
            }
        } catch (error) {
            setCepError('Erro ao buscar CEP.');
        } finally {
            setIsSearchingCep(false);
        }
    };

    const hasVariableWeight = items.some(item => item.isVariableWeight);

    const handleCheckout = () => {
        if (!name || !cep || !street || !number || !neighborhood) {
            alert("Por favor, preencha todos os campos obrigatórios para entrega.");
            return;
        }

        const currentStatus = getBusinessStatus();
        const finalTotal = total + (deliveryFee || 0);

        let message = `*NOVO PEDIDO!*\n\n`;

        if (!currentStatus.isOrderingOpen) {
            message += `⚠️ _Pedido feito fora do horário de atendimento. Será processado em: ${currentStatus.nextOpening}_ \n\n`;
        }

        message += `*Cliente:* ${name}\n`;
        message += `*CEP:* ${cep}\n`;
        message += `*Endereço:* ${street}, ${number}${complement ? ` (${complement})` : ''}\n`;
        message += `*Bairro:* ${neighborhood}\n`;
        message += `*Cidade:* ${city}\n`;
        message += `*Forma de Pagto:* ${payment}${payment === 'Dinheiro' ? (needsChange ? ` (Troco para R$ ${changeFor})` : ' (Não precisa de troco)') : ''}\n\n`;
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

        message += `\n----------------------\n`;
        message += `*Subtotal:* R$ ${total.toFixed(2)}\n`;
        message += `*Taxa de Entrega:* R$ ${(deliveryFee || 0).toFixed(2)}\n`;

        if (hasVariableWeight) {
            message += `*TOTAL APROXIMADO: ~ R$ ${finalTotal.toFixed(2)}*\n\n`;
            message += `_Aviso: Alguns itens são de peso variável. O valor final será confirmado após a pesagem das peças._`;
        } else {
            message += `*TOTAL: R$ ${finalTotal.toFixed(2)}*`;
        }

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
        clearCart();
        setIsCartOpen(false);
    };

    const cartTotalWithDelivery = total + (deliveryFee || 0);

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
                            {status && !status.isOrderingOpen && (
                                <div style={{
                                    backgroundColor: '#fff3cd',
                                    color: '#856404',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    marginBottom: '20px',
                                    fontSize: '0.85rem',
                                    border: '1px solid #ffeeba',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                                        <AlertTriangle size={16} />
                                        Fora do horário de pedidos
                                    </div>
                                    <p>Seu pedido será recebido agora, mas processado apenas em: <b>{status.nextOpening}</b>.</p>
                                </div>
                            )}

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
                                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <MapPin size={18} />
                                    Dados de Entrega
                                </h3>

                                <div className="form-group">
                                    <label className="form-label">Seu Nome *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Como podemos te chamar?"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="form-group">
                                        <label className="form-label">CEP *</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="00000-000"
                                                value={cep}
                                                maxLength={9}
                                                onChange={e => setCep(e.target.value)}
                                            />
                                            {isSearchingCep && (
                                                <div style={{ position: 'absolute', right: '10px', top: '10px' }}>
                                                    <Loader2 size={20} className="animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        {cepError && <span style={{ fontSize: '0.75rem', color: '#dc3545' }}>{cepError}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Número *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Nº"
                                            value={number}
                                            onChange={e => setNumber(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Logradouro (Rua/Av) *</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Nome da rua..."
                                            value={street}
                                            onChange={e => setStreet(e.target.value)}
                                            style={{ flex: 1 }}
                                        />
                                        {!cep && street.length >= 3 && (
                                            <button
                                                type="button"
                                                className="btn-search-cep"
                                                onClick={handleSearchAddress}
                                                disabled={isSearchingCep}
                                            >
                                                {isSearchingCep ? '...' : 'Buscar CEP'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Cidade *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={city}
                                            onChange={e => setCity(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Estado (UF) *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Ex: SP"
                                            maxLength={2}
                                            value={state}
                                            onChange={e => setState(e.target.value.toUpperCase())}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Bairro *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Bairro"
                                            value={neighborhood}
                                            onChange={e => setNeighborhood(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Complemento</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Apto, Bloco..."
                                            value={complement}
                                            onChange={e => setComplement(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Forma de Pagamento *</label>
                                    <select
                                        className="form-input"
                                        value={payment}
                                        onChange={e => {
                                            setPayment(e.target.value);
                                            if (e.target.value !== 'Dinheiro') {
                                                setNeedsChange(false);
                                                setChangeFor('');
                                            }
                                        }}
                                    >
                                        <option value="PIX">PIX</option>
                                        <option value="Dinheiro">Dinheiro</option>
                                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                                        <option value="Cartão de Débito">Cartão de Débito</option>
                                    </select>
                                </div>

                                {payment === 'Dinheiro' && (
                                    <div style={{
                                        padding: '12px',
                                        background: 'var(--secondary)',
                                        borderRadius: '8px',
                                        marginTop: '-10px',
                                        marginBottom: '20px',
                                        border: '1px solid var(--border)'
                                    }}>
                                        <p style={{ fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>Precisa de troco?</p>
                                        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                                <input
                                                    type="radio"
                                                    name="troco"
                                                    checked={!needsChange}
                                                    onChange={() => setNeedsChange(false)}
                                                /> Não
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                                <input
                                                    type="radio"
                                                    name="troco"
                                                    checked={needsChange}
                                                    onChange={() => setNeedsChange(true)}
                                                /> Sim
                                            </label>
                                        </div>

                                        {needsChange && (
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label">Troco para quanto? (R$)</label>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    placeholder="Ex: 50"
                                                    value={changeFor}
                                                    onChange={e => setChangeFor(e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="cart-footer">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                                <span style={{ color: 'var(--secondary-text)' }}>Subtotal:</span>
                                <span>R$ {total.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                                <span style={{ color: 'var(--secondary-text)' }}>Taxa de Entrega:</span>
                                <span style={{ color: deliveryFee !== null ? 'var(--success)' : 'inherit' }}>
                                    {deliveryFee !== null ? `R$ ${deliveryFee.toFixed(2)}` : 'Digite o CEP'}
                                </span>
                            </div>
                            <div className="cart-total" style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                                <span>Total {hasVariableWeight && <span style={{ fontSize: '0.85rem', color: 'var(--secondary-text)', fontWeight: 'normal' }}>(Aproximado)</span>}</span>
                                <span>{hasVariableWeight ? '~ ' : ''}R$ {cartTotalWithDelivery.toFixed(2)}</span>
                            </div>
                        </div>

                        {hasVariableWeight && (
                            <p style={{ fontSize: '0.8rem', color: '#dc3545', marginBottom: '16px', lineHeight: 1.4, backgroundColor: '#fae1e3', padding: '12px', borderRadius: '8px' }}>
                                <b>Atenção:</b> Alguns peixes têm variação natural de peso. O valor total é <b>aproximado</b> e será confirmado pelo nosso atendente após a pesagem no WhatsApp.
                            </p>
                        )}
                        <button className="btn btn-success" style={{ width: '100%', padding: '16px', gap: '8px' }} onClick={handleCheckout}>
                            <Send size={18} />
                            Enviar Pedido pelo WhatsApp
                        </button>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                .btn-search-cep {
                    padding: 0 12px;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: opacity 0.2s;
                }
                .btn-search-cep:hover { opacity: 0.9; }
                .btn-search-cep:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>
        </>
    );
}
