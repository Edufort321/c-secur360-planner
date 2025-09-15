// ============== MENU DÉROULANT HAMBURGER ==============
// Menu hamburger avec les fonctions principales comme l'original

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';

export function MenuDropdown({
    onCreateEvent,
    onManageConges,
    onManageResources,
    className = ''
}) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Fermer le menu si on clique en dehors
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const menuItems = [
        {
            id: 'create-event',
            label: 'Créer événement',
            icon: 'plus',
            color: 'text-blue-600',
            action: onCreateEvent
        },
        {
            id: 'conges',
            label: 'Gestion des congés',
            icon: 'calendar',
            color: 'text-green-600',
            action: onManageConges
        },
        {
            id: 'resources',
            label: 'Ressources',
            icon: 'users',
            color: 'text-purple-600',
            action: onManageResources
        }
    ];

    const handleMenuItemClick = (action) => {
        action();
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={menuRef}>
            {/* Bouton hamburger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="Menu"
            >
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                >
                    <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
            </button>

            {/* Menu déroulant */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
                    <div className="py-2">
                        {/* En-tête du menu */}
                        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Actions rapides
                            </h3>
                        </div>

                        {/* Items du menu */}
                        <div className="py-1">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleMenuItemClick(item.action)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                                >
                                    <Icon name={item.icon} size={18} className={item.color} />
                                    <div>
                                        <div className="font-medium">{item.label}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {item.id === 'create-event' && 'Planifier un nouveau job'}
                                            {item.id === 'conges' && 'Gérer les demandes de congés'}
                                            {item.id === 'resources' && 'Personnel et équipements'}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Séparateur et info */}
                        <div className="border-t border-gray-200 dark:border-gray-600 mt-1 pt-2">
                            <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                                Version 6.7 - Interface modernisée
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Overlay pour fermer le menu */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}