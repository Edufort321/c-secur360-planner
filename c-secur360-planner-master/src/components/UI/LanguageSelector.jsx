// ============== SÉLECTEUR DE LANGUE ==============
// Composant pour basculer entre français et anglais

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export function LanguageSelector({ showLabel = false, size = 'normal', className = '' }) {
    const { language, setLanguage } = useLanguage();

    const sizeClasses = {
        small: 'text-xs',
        normal: 'text-sm',
        large: 'text-base'
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {showLabel && (
                <span className={`${sizeClasses[size]} text-gray-700 dark:text-gray-300 font-medium`}>
                    🌐 Langue:
                </span>
            )}
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                <button
                    onClick={() => setLanguage('fr')}
                    className={`px-3 py-1 rounded-md transition-colors ${sizeClasses[size]} font-medium ${
                        language === 'fr'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                    🇫🇷 FR
                </button>
                <button
                    onClick={() => setLanguage('en')}
                    className={`px-3 py-1 rounded-md transition-colors ${sizeClasses[size]} font-medium ${
                        language === 'en'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                    🇬🇧 EN
                </button>
            </div>
        </div>
    );
}
