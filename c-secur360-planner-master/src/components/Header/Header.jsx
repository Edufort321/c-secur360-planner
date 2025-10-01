// ============== HEADER TEMPORAIRE POUR TESTS ==============
// Header simple pour tester le système de thème

import React from 'react';
import { Icon } from '../UI/Icon';
import { Logo } from '../UI/Logo';
import { MenuDropdown } from '../UI/MenuDropdown';

export function Header({
    utilisateurConnecte,
    onLogout,
    onCreateEvent,
    onManageConges,
    onManageResources
}) {
    return (
        <header className="bg-gray-900 border-b border-gray-700 px-4 py-3">
            <div className="flex items-center justify-between">
                {/* Logo et titre */}
                <Logo size="normal" showText={true} />

                {/* Actions droite */}
                <div className="flex items-center gap-4">
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