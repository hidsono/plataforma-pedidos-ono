"use client";

import React, { useEffect, useState } from 'react';
import { useCart } from '@/components/CartProvider';
import { PackageOpen, PlusCircle, Search, X } from 'lucide-react';
import { Product } from '@/lib/db';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVarProduct, setSelectedVarProduct] = useState<Product | null>(null);
  const [cleaningOption, setCleaningOption] = useState<string>('Inteiro sem limpeza');
  const [fileSkinOption, setFileSkinOption] = useState<string>('Com Pele');
  const [takeLeftovers, setTakeLeftovers] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { addToCart, setIsCartOpen } = useCart();

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const activeProducts = products.filter(p => p.inStock !== false);

  const groupedProducts = activeProducts.reduce((acc, product) => {
    let cat = product.category || 'Outros';
    cat = cat.trim();
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const categories = ['Todos', ...Object.keys(groupedProducts).sort()];

  const productsToShow = (selectedCategory === 'Todos'
    ? activeProducts
    : groupedProducts[selectedCategory] || [])
    .filter(product => product.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleAddToCartClick = (product: Product) => {
    if (product.isVariableWeight) {
      const isFrozen = product.name.toLowerCase().includes('congelado') || (product.category || '').toLowerCase().includes('congelado');
      const isFreshFillet = (product.name.toLowerCase().includes('filé') || product.name.toLowerCase().includes('file')) && !isFrozen;

      setSelectedVarProduct(product);
      setCleaningOption(isFreshFillet ? 'Filé' : (isFrozen ? 'Congelado (Sem limpeza)' : 'Inteiro sem limpeza'));
      setFileSkinOption('Com Pele');
      setTakeLeftovers(false);
    } else {
      addToCart(product);
      setShowSuccessModal(true);
    }
  };

  const confirmVariableAdding = () => {
    if (selectedVarProduct) {
      const isFrozen = selectedVarProduct.name.toLowerCase().includes('congelado') || (selectedVarProduct.category || '').toLowerCase().includes('congelado');
      const isFreshFillet = (selectedVarProduct.name.toLowerCase().includes('filé') || selectedVarProduct.name.toLowerCase().includes('file')) && !isFrozen;

      let finalCleaningOption = cleaningOption;
      if (cleaningOption === 'Filé' && !isFrozen) {
        finalCleaningOption = isFreshFillet ? fileSkinOption : `Filé (${fileSkinOption})`;
      } else if (isFrozen) {
        finalCleaningOption = ''; // Don't send cleaning option for frozen
      }

      addToCart(selectedVarProduct, finalCleaningOption, takeLeftovers);
      setSelectedVarProduct(null);
      setShowSuccessModal(true);
    }
  };

  const isSelectedProductFillet = selectedVarProduct
    ? (selectedVarProduct.name.toLowerCase().includes('filé') || selectedVarProduct.name.toLowerCase().includes('file'))
    : false;

  const isSelectedProductFrozen = selectedVarProduct
    ? (selectedVarProduct.name.toLowerCase().includes('congelado') || (selectedVarProduct.category || '').toLowerCase().includes('congelado'))
    : false;

  const isSelectedProductFreshFillet = selectedVarProduct
    ? ((selectedVarProduct.name.toLowerCase().includes('filé') || selectedVarProduct.name.toLowerCase().includes('file')) && !isSelectedProductFrozen)
    : false;

  return (
    <>
      <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
        <div style={{ marginTop: '40px', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Nosso Catálogo</h1>
          <p style={{ color: 'var(--secondary-text)' }}>Escolha seus produtos e faça o pedido de forma rápida e segura.</p>

          <div style={{ marginTop: '20px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              <Search size={20} style={{ color: 'var(--secondary-text)' }} />
            </div>
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px 14px 44px',
                borderRadius: '99px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--foreground)',
                fontSize: '1rem',
                outline: 'none',
                boxShadow: 'var(--shadow-sm)',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary)';
                e.target.style.boxShadow = '0 0 0 2px rgba(var(--primary-rgb), 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'var(--shadow-sm)';
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p>Carregando produtos...</p>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state" style={{ marginTop: '40px' }}>
            <PackageOpen size={64} style={{ color: 'var(--border)' }} />
            <h2>Nenhum produto cadastrado ainda</h2>
            <p>Visite a <a href="/admin" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>área do Lojista</a> para enviar sua planilha Excel.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Category Horizontal Scrolling Buttons */}
            <div style={{
              display: 'flex',
              overflowX: 'auto',
              gap: '12px',
              paddingBottom: '16px',
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none',  // IE/Edge
            }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '8px 24px',
                    borderRadius: '99px',
                    whiteSpace: 'nowrap',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    transition: 'all 0.2s',
                    backgroundColor: selectedCategory === cat ? 'var(--primary)' : 'var(--card-bg)',
                    color: selectedCategory === cat ? '#fff' : 'var(--foreground)',
                    border: `1px solid ${selectedCategory === cat ? 'var(--primary)' : 'var(--border)'}`,
                    boxShadow: selectedCategory === cat ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--border)', color: 'var(--foreground)' }}>
              {selectedCategory === 'Todos' ? 'Todos os Produtos' : selectedCategory}
            </h2>

            <div className="product-grid" style={{ paddingTop: '0' }}>
              {productsToShow.map(product => (
                <div className="product-card" key={product.id}>
                  {product.imageUrl ? (
                    <div style={{ height: '200px', width: '100%', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--secondary)' }}>
                      <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div className="product-image-placeholder">
                      {product.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="product-content">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                      <h3 className="product-title" style={{ marginBottom: 0 }}>{product.name}</h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', backgroundColor: 'var(--secondary)', padding: '2px 8px', borderRadius: '4px', alignSelf: 'flex-start' }}>
                        {product.category || 'Outros'}
                      </span>
                    </div>

                    <div className="product-price">
                      R$ {Number(product.price).toFixed(2)} {product.isVariableWeight && <span style={{ fontSize: '0.9rem', color: 'var(--secondary-text)' }}>/ kg</span>}
                    </div>

                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: 'auto' }}
                      onClick={() => handleAddToCartClick(product)}
                    >
                      <PlusCircle size={18} />
                      Adicionar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedVarProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="animate-fade-in" style={{ backgroundColor: 'var(--card-bg)', width: '100%', maxWidth: '400px', borderRadius: '16px', padding: '24px', position: 'relative', border: '1px solid var(--border)' }}>
            <button
              onClick={() => setSelectedVarProduct(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--foreground)' }}
            >
              <X size={24} />
            </button>

            <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', paddingRight: '24px' }}>
              Opções para {selectedVarProduct.name}
            </h2>
            <p style={{ color: 'var(--secondary-text)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Para produtos de peso variável, você define a quantidade de peças. Enviaremos o valor exato após a pesagem.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {!isSelectedProductFreshFillet && !isSelectedProductFrozen && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.95rem' }}>Opção de Limpeza:</label>
                  <select
                    value={cleaningOption}
                    onChange={(e) => setCleaningOption(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', fontSize: '1rem' }}
                  >
                    <option value="Inteiro sem limpeza">Inteiro (Sem limpeza)</option>
                    <option value="Inteiro limpo (barrigada, guelras, escamas e galhas)">Inteiro limpo (barrigada, guelras, escamas e galhas)</option>
                    <option value="Filé">Filé</option>
                    <option value="Postas">Postas</option>
                    <option value="Espalmado (Aberto ao meio)">Espalmado (Aberto ao meio)</option>
                    <option value="Espalmado pelas costas">Espalmado pelas Costas</option>
                  </select>
                </div>
              )}

              {cleaningOption === 'Filé' && !isSelectedProductFrozen && (
                <div style={{ marginTop: !isSelectedProductFreshFillet ? '-8px' : '0' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.95rem' }}>Opção da Pele:</label>
                  <select
                    value={fileSkinOption}
                    onChange={(e) => setFileSkinOption(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', fontSize: '1rem' }}
                  >
                    <option value="Com Pele">Com Pele</option>
                    <option value="Sem Pele">Sem Pele</option>
                  </select>
                </div>
              )}

              {cleaningOption !== 'Inteiro sem limpeza' && !isSelectedProductFreshFillet && !isSelectedProductFrozen && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={takeLeftovers}
                    onChange={(e) => setTakeLeftovers(e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontSize: '0.95rem' }}>Deseja levar a cabeça/espinhaço (restos)?</span>
                </label>
              )}

              <button className="btn btn-primary" onClick={confirmVariableAdding} style={{ padding: '14px', fontSize: '1rem', marginTop: '8px' }}>
                Adicionar ao Carrinho
              </button>
            </div>
          </div>
        </div>
      )}
      {showSuccessModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="animate-fade-in" style={{ backgroundColor: 'var(--card-bg)', width: '100%', maxWidth: '400px', borderRadius: '16px', padding: '32px', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ backgroundColor: 'var(--success)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <PlusCircle size={32} color="#fff" />
            </div>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Produto Adicionado!</h2>
            <p style={{ color: 'var(--secondary-text)', marginBottom: '32px' }}>O item foi colocado no seu carrinho com sucesso.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px' }}
                onClick={() => {
                  setShowSuccessModal(false);
                  setIsCartOpen(true);
                }}
              >
                Visualizar Carrinho
              </button>
              <button
                className="btn btn-secondary"
                style={{ width: '100%', padding: '14px', background: 'transparent', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                onClick={() => setShowSuccessModal(false)}
              >
                Continuar Comprando
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
