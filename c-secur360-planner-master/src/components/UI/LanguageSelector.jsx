// ============== SÉLECTEUR DE LANGUE ==============
// Composant pour basculer entre FR et EN

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export const LANGUAGES = {
    fr: { code: 'fr', name: 'Français', flag: '🇫🇷', display: 'FR' },
    en: { code: 'en', name: 'English', flag: '🇬🇧', display: 'EN' }
};

export function LanguageSelector({ showLabel = true, compact = false }) {
    const { currentLanguage, changeLanguage } = useLanguage();

    const toggleLanguage = () => {
        const newLang = currentLanguage === 'fr' ? 'en' : 'fr';
        changeLanguage(newLang);
    };

    const currentLang = LANGUAGES[currentLanguage];

    return (
        <button
            onClick={toggleLanguage}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white transition-all duration-200 border border-gray-700 hover:border-gray-600 ${compact ? 'text-sm' : ''}`}
            title={currentLang.name}
        >
            <span className="font-medium">
                {currentLang.display}
            </span>
        </button>
    );
}

export default LanguageSelector;
