"use client";

import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, CheckCircle, Database, Trash2, Edit2, Plus, X, Eye, EyeOff } from 'lucide-react';
import { Product } from '@/lib/db';

export default function AdminPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({ name: '', price: '', category: '', imageUrl: '', isVariableWeight: false });
    const [isSaving, setIsSaving] = useState(false);

    // Sistema de senha
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');

    useEffect(() => {
        fetch('/api/products')
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(console.error);
    }, []);

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

                // Converte para um array de arrays de strings (raw) para encontrar os cabeçalhos
                const data = XLSX.utils.sheet_to_json(ws);

                const newProducts: Product[] = data.map((row: any, index: number) => {
                    // Tenta adivinhar as colunas comuns
                    const name = row['Nome'] || row['NOME'] || row['Produto'] || row['PRODUTO'] || row['Título'] || `Produto ${index + 1}`;

                    let price = row['Preço'] || row['PREÇO'] || row['Valor'] || row['VALOR'] || row['Price'] || 0;
                    if (typeof price === 'string') {
                        price = parseFloat(price.replace('R$', '').replace(',', '.').trim()) || 0;
                    }

                    let category = row['Categoria'] || row['CATEGORIA'] || row['Grupo'] || 'Geral';
                    category = String(category).trim();
                    // Capitalize first letter to normalize categories (e.g "frescos" -> "Frescos")
                    category = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();

                    let imageUrl = row['Imagem'] || row['IMAGEM'] || row['Foto'] || row['FOTO'] || row['URL'] || '';
                    imageUrl = String(imageUrl).trim();

                    return {
                        id: `prod_${Date.now()}_${index}`,
                        name: String(name),
                        price: Number(price),
                        category: String(category),
                        inStock: true,
                        ...(imageUrl ? { imageUrl } : {})
                    };
                });

                // Salvar na API
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

            if (editingProduct) {
                const res = await fetch(`/api/products/${editingProduct.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ product: productData })
                });
                const data = await res.json();
                if (data.success) {
                    setProducts(prev => prev.map(p => p.id === editingProduct.id ? data.product : p));
                    setIsModalOpen(false);
                } else {
                    alert('Erro ao atualizar produto.');
                }
            } else {
                const res = await fetch('/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ product: productData })
                });
                const data = await res.json();
                if (data.success) {
                    setProducts(prev => [...prev, data.product]);
                    setIsModalOpen(false);
                } else {
                    alert('Erro ao criar produto.');
                }
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar produto.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="animate-fade-in" style={{ background: 'var(--card-bg)', padding: '32px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center', maxWidth: '400px', width: '100%', marginTop: '40px' }}>
                    <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Acesso Restrito</h2>
                    <p style={{ color: 'var(--secondary-text)', marginBottom: '24px' }}>Digite a senha para gerenciar o seu catálogo.</p>
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
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', marginBottom: '16px', outline: 'none' }}
                            autoFocus
                        />
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', justifyContent: 'center' }}>
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
                <div style={{ marginTop: '40px', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Área do Lojista</h1>
                    <p style={{ color: 'var(--secondary-text)' }}>Faça o upload da sua planilha Excel (.xlsx) ou CSV para atualizar seu catálogo instantaneamente.</p>
                </div>

                <div style={{ background: 'var(--card-bg)', padding: '32px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Database size={20} />
                        Atualizar Produtos via Excel
                    </h2>

                    <p style={{ color: 'var(--secondary-text)', marginBottom: '8px' }}>
                        Sua planilha deve ter as seguintes colunas (na primeira linha): <b>Nome</b>, <b>Valor</b> (ou Preço), <b>Categoria</b> e opcionalmente <b>Imagem</b> (com o link da foto).
                    </p>

                    <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />

                    <div className="upload-zone" onClick={() => !isUploading && fileInputRef.current?.click()}>
                        <UploadCloud size={48} className="upload-icon" />
                        <h3 style={{ marginBottom: '8px' }}>
                            {isUploading ? 'Processando planilha...' : 'Clique para enviar seu arquivo Excel'}
                        </h3>
                        <p style={{ color: 'var(--secondary-text)', fontSize: '0.9rem' }}>Suporta arquivos .xlsx e .csv</p>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <h2 style={{ fontSize: '1.2rem' }}>Produtos Cadastrados ({products.length})</h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className="btn btn-primary"
                            onClick={openAddModal}
                        >
                            <Plus size={16} />
                            Novo Produto
                        </button>
                        {products.length > 0 && (
                            <button
                                className="btn btn-secondary"
                                style={{ color: '#dc3545', background: 'transparent', border: '1px solid #dc3545' }}
                                onClick={handleClearProducts}
                            >
                                <Trash2 size={16} />
                                Limpar
                            </button>
                        )}
                    </div>
                </div>

                {products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', background: 'var(--secondary)', borderRadius: '12px' }}>
                        Nenhum produto cadastrado até o momento. Envie uma planilha acima.
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Categoria</th>
                                    <th style={{ textAlign: 'right' }}>Valor</th>
                                    <th style={{ textAlign: 'center', width: '80px' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => (
                                    <tr key={p.id} style={{ opacity: p.inStock === false ? 0.6 : 1 }}>
                                        <td style={{ fontWeight: 600 }}>
                                            {p.name}
                                            {p.inStock === false && <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#dc3545', padding: '2px 6px', background: '#fae1e3', borderRadius: '4px' }}>Inativo</span>}
                                        </td>
                                        <td><span className="badge">{p.category}</span></td>
                                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>
                                            R$ {Number(p.price).toFixed(2)}
                                        </td>
                                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                            <button
                                                onClick={() => handleToggleStock(p)}
                                                style={{ background: 'transparent', color: p.inStock === false ? 'var(--primary)' : 'var(--secondary-text)', padding: '6px', borderRadius: '6px', border: '1px solid transparent', cursor: 'pointer', marginRight: '4px' }}
                                                onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
                                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                title={p.inStock === false ? "Ativar Produto" : "Desativar Produto"}
                                            >
                                                {p.inStock === false ? <Eye size={16} /> : <EyeOff size={16} />}
                                            </button>
                                            <button
                                                onClick={() => openEditModal(p)}
                                                style={{ background: 'transparent', color: 'var(--primary)', padding: '6px', borderRadius: '6px', border: '1px solid transparent', cursor: 'pointer', marginRight: '4px' }}
                                                onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
                                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                title="Editar Produto"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                                style={{ background: 'transparent', color: '#dc3545', padding: '6px', borderRadius: '6px', border: '1px solid transparent', cursor: 'pointer' }}
                                                onMouseOver={e => e.currentTarget.style.backgroundColor = '#fae1e3'}
                                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                title="Excluir Produto"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
                    <div className="animate-fade-in" style={{ backgroundColor: 'var(--card-bg)', width: '100%', maxWidth: '500px', borderRadius: '16px', padding: '24px', position: 'relative', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--foreground)' }}
                        >
                            <X size={24} />
                        </button>

                        <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', paddingRight: '24px' }}>
                            {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                        </h2>

                        <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Nome do Produto</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Preço (R$)</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="0,00"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Categoria</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Link da Imagem (opcional)</label>
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    value={formData.imageUrl}
                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                <input
                                    type="checkbox"
                                    id="isVariableWeight"
                                    checked={formData.isVariableWeight}
                                    onChange={e => setFormData({ ...formData, isVariableWeight: e.target.checked })}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                                />
                                <label htmlFor="isVariableWeight" style={{ fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
                                    Produto vendido por unidade com variações de peso (Ex: Pescado Inteiro)
                                </label>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ marginTop: '16px', padding: '14px' }} disabled={isSaving}>
                                {isSaving ? 'Salvando...' : 'Salvar Produto'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
