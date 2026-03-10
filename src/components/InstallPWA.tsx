"use client";

import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export default function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Detectar se é iOS
        const isIOSDevice = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;

        setIsIOS(isIOSDevice);

        // Para iOS, mostramos o banner se não estiver instalado
        if (isIOSDevice && !isStandalone) {
            setShowBanner(true);
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            // Impedir que o mini-infobar apareça no mobile
            e.preventDefault();
            // Salva o evento para ser acionado depois
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Mostra o banner de instalação (Android/Chrome)
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Verifica se já está instalado (Geral)
        if (isStandalone) {
            setShowBanner(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Mostra o prompt de instalação
        deferredPrompt.prompt();

        // Aguarda a resposta do usuário
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('Usuário aceitou a instalação');
        }

        // O prompt só pode ser usado uma vez
        setDeferredPrompt(null);
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="pwa-banner animate-fade-in shadow-lg">
            <div className="pwa-banner-content">
                {isIOS ? (
                    <div className="pwa-banner-text">
                        <strong style={{ color: 'var(--primary)', display: 'block' }}>Instalar no iPhone</strong>
                        <span style={{ fontSize: '0.85rem', color: 'var(--secondary-text)' }}>
                            Toque no ícone de <span style={{ fontWeight: 'bold' }}>Compartilhar</span> e depois em <span style={{ fontWeight: 'bold' }}>Adicionar à Tela de Início</span>.
                        </span>
                    </div>
                ) : (
                    <div className="pwa-banner-text">
                        <strong style={{ color: 'var(--primary)', display: 'block' }}>Instalar Aplicativo</strong>
                        <span style={{ fontSize: '0.85rem', color: 'var(--secondary-text)' }}>Peça mais rápido e direto da sua tela inicial!</span>
                    </div>
                )}
                <div className="pwa-banner-actions">
                    {!isIOS && (
                        <button onClick={handleInstallClick} className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '20px' }}>
                            <Download size={18} />
                            Instalar
                        </button>
                    )}
                    <button onClick={() => setShowBanner(false)} style={{ background: 'transparent', color: 'var(--secondary-text)', padding: '4px', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                .pwa-banner {
                    position: fixed;
                    bottom: 24px;
                    left: 20px;
                    right: 20px;
                    background: var(--card-bg);
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    z-index: 2000;
                    max-width: 500px;
                    margin: 0 auto;
                }
                .pwa-banner-content {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    gap: 12px;
                }
                .pwa-banner-text {
                    flex: 1;
                }
                .pwa-banner-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                @media (max-width: 768px) {
                    .pwa-banner {
                        bottom: 150px; /* Acima dos botões flutuantes */
                        left: 12px;
                        right: 12px;
                    }
                    .pwa-banner-text span {
                        font-size: 0.75rem;
                    }
                }
            `}} />
        </div>
    );
}
