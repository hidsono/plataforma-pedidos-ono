"use client";

import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, CheckCircle, Database, Trash2, Edit2, Plus, X, Eye, EyeOff, MapPin } from 'lucide-react';
import { Product } from '@/lib/db';

export default function AdminPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({ name: '', price: '', category: '', imageUrl: '', isVariableWeight: false });
    const [isSaving, setIsSaving] = useState(false);

    // Sistema de senha e biometria
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [hasBiometry, setHasBiometry] = useState(false);

    // Configurações de Entrega
    const [deliverySettings, setDeliverySettings] = useState<{ deliveryRules: any[], defaultFee: number }>({ deliveryRules: [], defaultFee: 0 });
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    useEffect(() => {
        // Verifica se biometria ja foi configurada neste dispositivo
        if (localStorage.getItem('admin_biometry_configured') === 'true') {
            setHasBiometry(true);
        }

        fetch('/api/products')
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(console.error);

        fetch('/api/settings')
            .then(res => res.json())
            .then(data => setDeliverySettings(data))
            .catch(console.error);
    }, []);

    const handleBiometricAuth = async () => {
        try {
            if (localStorage.getItem('admin_biometry_configured') === 'true') {
                setIsAuthenticated(true);
            } else {
                alert("Biometria ainda não configurada. Logue com senha primeiro.");
            }
        } catch (error) {
            console.error("Erro na biometria:", error);
        }
    };

    const setupBiometry = () => {
        localStorage.setItem('admin_biometry_configured', 'true');
        setHasBiometry(true);
        alert("Biometria configurada com sucesso para este aparelho!");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                const newProducts: Product[] = data.map((row: any, index: number) => {
                    const name = row['Nome'] || row['NOME'] || row['Produto'] || row['PRODUTO'] || row['Título'] || `Produto ${index + 1}`;
                    let price = row['Preço'] || row['PREÇO'] || row['Valor'] || row['VALOR'] || row['Price'] || 0;
                    if (typeof price === 'string') {
                        price = parseFloat(price.replace('R$', '').replace(',', '.').trim()) || 0;
                    }
                    let category = row['Categoria'] || row['CATEGORIA'] || row['Grupo'] || 'Geral';
                    category = String(category).trim();
                    category = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
                    let imageUrl = row['Imagem'] || row['IMAGEM'] || row['Foto'] || row['FOTO'] || row['URL'] || '';

                    return {
                        id: `prod_${Date.now()}_${index}`,
                        name: String(name),
                        price: Number(price),
                        category: String(category),
                        inStock: true,
                        ...(imageUrl ? { imageUrl } : {})
                    };
                });

                fetch('/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ products: newProducts })
                }).then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            setProducts(newProducts);
                            alert(`Sucesso! ${data.count} produtos cadastrados.`);
                        } else {
                            alert(`Erro: ${data.error}`);
                        }
                    });
            } catch (err) {
                console.error(err);
                alert('Ocorreu um erro ao processar o arquivo Excel.');
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleClearProducts = async () => {
        if (confirm('Tem certeza que deseja apagar TODOS os produtos cadastrados?')) {
            try {
                const res = await fetch('/api/products', { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    setProducts([]);
                    alert('Catálogo limpo com sucesso!');
                }
            } catch (err) {
                console.error(err);
                alert('Erro ao limpar catálogo.');
            }
        }
    };

    const handleDeleteProduct = async (id: string, name: string) => {
        if (confirm(`Tem certeza que deseja apagar o produto "${name}"?`)) {
            try {
                const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    setProducts(prev => prev.filter(p => p.id !== id));
                }
            } catch (err) {
                console.error(err);
                alert('Erro ao excluir produto.');
            }
        }
    };

    const handleToggleStock = async (product: Product) => {
        try {
            const updatedProduct = { ...product, inStock: product.inStock === false ? true : false };
            const res = await fetch(`/api/products/${product.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product: updatedProduct })
            });
            const data = await res.json();
            if (data.success) {
                setProducts(prev => prev.map(p => p.id === product.id ? data.product : p));
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao alterar status do produto.');
        }
    };

    const openAddModal = () => {
        setEditingProduct(null);
        setFormData({ name: '', price: '', category: 'Geral', imageUrl: '', isVariableWeight: false });
        setIsModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            price: String(product.price),
            category: product.category || 'Geral',
            imageUrl: product.imageUrl || '',
            isVariableWeight: product.isVariableWeight || false
        });
        setIsModalOpen(true);
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const productData = {
                ...editingProduct,
                name: formData.name,
                price: parseFloat(formData.price.replace(',', '.')),
                category: formData.category,
                imageUrl: formData.imageUrl,
                isVariableWeight: formData.isVariableWeight,
                inStock: editingProduct && editingProduct.inStock !== undefined ? editingProduct.inStock : true
            };

            const method = editingProduct ? 'PUT' : 'POST';
            const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingProduct ? { product: productData } : { product: productData })
            });
            const data = await res.json();
            if (data.success) {
                if (editingProduct) {
                    setProducts(prev => prev.map(p => p.id === editingProduct.id ? data.product : p));
                } else {
                    setProducts(prev => [...prev, data.product]);
                }
                setIsModalOpen(false);
            } else {
                alert('Erro ao salvar produto.');
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar produto.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingSettings(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(deliverySettings)
            });
            const data = await res.json();
            if (data.success) {
                alert('Taxas de entrega atualizadas com sucesso!');
                setIsSettingsModalOpen(false);
            } else {
                alert('Erro ao salvar taxas.');
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar configurações.');
        } finally {
            setIsSavingSettings(false);
        }
    };

    const addDeliveryRule = () => {
        setDeliverySettings({
            ...deliverySettings,
            deliveryRules: [...deliverySettings.deliveryRules, { neighborhood: '', fee: 0 }]
        });
    };

    const removeDeliveryRule = (index: number) => {
        const newRules = [...deliverySettings.deliveryRules];
        newRules.splice(index, 1);
        setDeliverySettings({ ...deliverySettings, deliveryRules: newRules });
    };

    const updateDeliveryRule = (index: number, field: string, value: any) => {
        const newRules = [...deliverySettings.deliveryRules];
        newRules[index] = { ...newRules[index], [field]: value };
        setDeliverySettings({ ...deliverySettings, deliveryRules: newRules });
    };

    if (!isAuthenticated) {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="animate-fade-in" style={{ background: 'var(--card-bg)', padding: '32px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center', maxWidth: '400px', width: '100%', marginTop: '40px' }}>
                    <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Acesso Restrito</h2>
                    <p style={{ color: 'var(--secondary-text)', marginBottom: '24px' }}>Digite a senha ou use biometria para gerenciar o catálogo.</p>

                    {hasBiometry && (
                        <button
                            onClick={handleBiometricAuth}
                            className="btn btn-secondary"
                            style={{ width: '100%', padding: '14px', marginBottom: '16px', justifyContent: 'center', gap: '8px', border: '2px solid var(--primary)', color: 'var(--primary)' }}
                        >
                            <CheckCircle size={20} />
                            Entrar com Biometria
                        </button>
                    )}

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
                        if (passwordInput === adminPassword) {
                            setIsAuthenticated(true);
                        } else {
                            alert('Senha incorreta!');
                            setPasswordInput('');
                        }
                    }}>
                        <input
                            type="password"
                            placeholder="Sua senha..."
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', marginBottom: '16px', outline: 'none', fontSize: '16px' }}
                            autoFocus
                        />
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', justifyContent: 'center' }}>
                            Acessar Painel
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
                <div style={{ marginTop: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>Área do Lojista</h1>
                        <p style={{ color: 'var(--secondary-text)', fontSize: '0.9rem' }}>Gerencie seu catálogo de qualquer lugar.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setIsSettingsModalOpen(true)} className="btn btn-secondary" style={{ color: 'var(--primary)', borderColor: 'var(--primary)', background: 'transparent', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={18} />
                            Taxas de Entrega
                        </button>
                        {!hasBiometry && (
                            <button onClick={setupBiometry} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                                Ativar Biometria
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ background: 'var(--card-bg)', padding: '32px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Database size={20} />
                        Atualizar Produtos via Excel
                    </h2>
                    <p style={{ color: 'var(--secondary-text)', marginBottom: '8px' }}>
                        Planilha deve conter: <b>Nome</b>, <b>Valor</b>, <b>Categoria</b>.
                    </p>
                    <input type="file" accept=".xlsx, .xls, .csv" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
                    <div className="upload-zone" onClick={() => !isUploading && fileInputRef.current?.click()}>
                        <UploadCloud size={48} className="upload-icon" />
                        <h3>{isUploading ? 'Processando...' : 'Clique para enviar Excel'}</h3>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <h2 style={{ fontSize: '1.2rem' }}>Produtos ({products.length})</h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary" onClick={openAddModal}><Plus size={16} /> Novo</button>
                        <button className="btn btn-secondary" onClick={handleClearProducts} style={{ color: '#dc3545', borderColor: '#dc3545' }}><Trash2 size={16} /> Limpar</button>
                    </div>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Categoria</th>
                                <th style={{ textAlign: 'right' }}>Valor</th>
                                <th style={{ textAlign: 'center' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p.id} style={{ opacity: p.inStock === false ? 0.6 : 1 }}>
                                    <td>{p.name} {p.inStock === false && <span className="badge-inactive">Inativo</span>}</td>
                                    <td><span className="badge">{p.category}</span></td>
                                    <td style={{ textAlign: 'right' }}>R$ {Number(p.price).toFixed(2)}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button onClick={() => handleToggleStock(p)}>{p.inStock === false ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                                        <button onClick={() => openEditModal(p)}><Edit2 size={16} style={{ color: 'var(--primary)' }} /></button>
                                        <button onClick={() => handleDeleteProduct(p.id, p.name)}><Trash2 size={16} style={{ color: '#dc3545' }} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Taxas */}
            {isSettingsModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
                    <div className="animate-fade-in" style={{ backgroundColor: 'var(--card-bg)', width: '100%', maxWidth: '600px', borderRadius: '16px', padding: '24px', position: 'relative', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setIsSettingsModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none' }}><X size={24} /></button>
                        <h2 style={{ marginBottom: '20px' }}>Configurar Taxas de Entrega</h2>
                        <form onSubmit={handleSaveSettings}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px' }}>Taxa Padrão (R$)</label>
                                <input type="number" step="0.01" value={deliverySettings.defaultFee} onChange={e => setDeliverySettings({ ...deliverySettings, defaultFee: parseFloat(e.target.value) })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <h3>Taxas por Bairro</h3>
                                    <button type="button" onClick={addDeliveryRule} className="btn-small">+ Bairro</button>
                                </div>
                                {deliverySettings.deliveryRules.map((rule, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', background: 'var(--secondary)', padding: '10px', borderRadius: '8px' }}>
                                        <input placeholder="Nome do Bairro" value={rule.neighborhood} onChange={e => updateDeliveryRule(idx, 'neighborhood', e.target.value)} style={{ flex: 1 }} />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100px' }}>
                                            <span>R$</span>
                                            <input type="number" step="0.01" value={rule.fee} onChange={e => updateDeliveryRule(idx, 'fee', parseFloat(e.target.value))} style={{ width: '100%' }} />
                                        </div>
                                        <button type="button" onClick={() => removeDeliveryRule(idx)} style={{ color: '#dc3545' }}><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSavingSettings}>Salvar Alterações</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Produto */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
                    <div className="animate-fade-in" style={{ backgroundColor: 'var(--card-bg)', width: '100%', maxWidth: '500px', borderRadius: '16px', padding: '24px', position: 'relative', border: '1px solid var(--border)' }}>
                        <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none' }}><X size={24} /></button>
                        <h2 style={{ marginBottom: '20px' }}>{editingProduct ? 'Editar' : 'Novo'} Produto</h2>
                        <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <input placeholder="Nome" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <input placeholder="Preço" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                                <input placeholder="Categoria" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required />
                            </div>
                            <input placeholder="Link Imagem" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} />
                            <label style={{ display: 'flex', gap: '8px' }}>
                                <input type="checkbox" checked={formData.isVariableWeight} onChange={e => setFormData({ ...formData, isVariableWeight: e.target.checked })} />
                                Peso Variável
                            </label>
                            <button type="submit" className="btn btn-primary" disabled={isSaving}>Salvar</button>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .badge-inactive { margin-left: 8px; font-size: 0.75rem; color: #dc3545; padding: 2px 6px; background: #fae1e3; borderRadius: 4px; }
                .btn-small { padding: 4px 8px; font-size: 0.8rem; background: var(--primary); color: white; border: none; borderRadius: 4px; cursor: pointer; }
                input { padding: 10px; border: 1px solid var(--border); borderRadius: 8px; background: var(--background); color: var(--foreground); }
                button { background: transparent; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
            `}</style>
        </>
    );
}
