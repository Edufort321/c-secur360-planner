// ============== HEADER TEMPORAIRE POUR TESTS ==============
// Header simple pour tester le système de thème

import React, { useState, useEffect } from 'react';
import { Icon } from '../UI/Icon';
import { Logo } from '../UI/Logo';
import { MenuDropdown } from '../UI/MenuDropdown';
import { LanguageSelector } from '../UI/LanguageSelector';

export function Header({
    utilisateurConnecte,
    onLogout,
    onCreateEvent,
    onManageConges,
    onManageResources
}) {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallButton, setShowInstallButton] = useState(false);

    useEffect(() => {
        // Écouter l'événement beforeinstallprompt
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallButton(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Vérifier si l'app est déjà installée
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowInstallButton(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowInstallButton(false);
        }

        setDeferredPrompt(null);
    };
    return (
        <header className="bg-gray-900 border-b border-gray-700 px-4 py-3">
            <div className="flex items-center justify-between">
                {/* Logo et titre */}
                <Logo size="normal" showText={true} />

                {/* Actions droite */}
                <div className="flex items-center gap-4">
                    {/* Bouton installation PWA */}
                    {showInstallButton && (
                        <button
                            onClick={handleInstallClick}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                            title="Installer l'application"
                        >
                            <Icon name="download" size={16} />
                            <span className="hidden sm:inline">Installer</span>
                        </button>
                    )}

                    {/* Sélecteur de langue */}
                    <LanguageSelector showLabel={false} size="normal" />

                    {/* Menu hamburger avec fonctions principales */}
                    <MenuDropdown
                        onCreateEvent={onCreateEvent}
                        onManageConges={onManageConges}
                        onManageResources={onManageResources}
                    />

                    {/* Utilisateur connecté */}
                    {utilisateurConnecte && (
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="text-sm font-medium text-white">
                                    {utilisateurConnecte.nom}
                                </div>
                                <div className="text-xs text-gray-300">
                                    {utilisateurConnecte.poste}
                                </div>
                            </div>
                            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                                <Icon name="user" size={16} className="text-white" />
                            </div>
                        </div>
                    )}

                    {/* Bouton déconnexion */}
                    {utilisateurConnecte && onLogout && (
                        <button
                            onClick={onLogout}
                            className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            title="Se déconnecter"
                        >
                            <Icon name="logout" size={16} />
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}