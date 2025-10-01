// ============== SÉLECTEUR DE LANGUE ==============
// Composant pour basculer entre français et anglais

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export function LanguageSelector({ showLabel = false, size = 'normal', className = '' }) {
    const { currentLanguage, changeLanguage } = useLanguage();

    const sizeClasses = {
        small: 'text-xs',
        normal: 'text-sm',
        large: 'text-base'
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {showLabel && (
                <span className={`${sizeClasses[size]} text-gray-700 dark:text-gray-300 font-medium`}>
                    🌐
                </span>
            )}
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                <button
                    onClick={() => changeLanguage('fr')}
                    className={`px-3 py-1 rounded-md transition-colors ${sizeClasses[size]} font-medium ${
                        currentLanguage === 'fr'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                    FR
                </button>
                <button
                    onClick={() => changeLanguage('en')}
                    className={`px-3 py-1 rounded-md transition-colors ${sizeClasses[size]} font-medium ${
                        currentLanguage === 'en'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                    EN
                </button>
            </div>
        </div>
    );
}
