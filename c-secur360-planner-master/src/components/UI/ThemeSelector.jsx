// ============== SÉLECTEUR DE THÈME VERSION ORIGINALE ==============
// Reproduction exacte du sélecteur thème nuit/jour de la version originale

import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Icon } from './Icon';

export function ThemeSelector({ className = '', showLabel = true, size = 'normal' }) {
    const {
        isDarkMode,
        isSystemTheme,
        userPreferences,
        toggleTheme,
        setTheme,
        useSystemTheme,
        updatePreferences,
        getThemeName,
        getThemeIcon
    } = useTheme();

    const [showMenu, setShowMenu] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);

    // Styles selon la taille
    const sizeClasses = {
        small: 'px-2 py-1 text-sm',
        normal: 'px-3 py-2',
        large: 'px-4 py-3 text-lg'
    };

    const iconSizes = {
        small: 14,
        normal: 16,
        large: 20
    };

    // Options de thème
    const themeOptions = [
        { id: 'light', name: 'Jour', icon: 'sun', action: () => setTheme(false) },
        { id: 'dark', name: 'Nuit', icon: 'moon', action: () => setTheme(true) },
        { id: 'system', name: 'Système', icon: 'desktop', action: useSystemTheme }
    ];

    const handleTimeChange = (type, value) => {
        updatePreferences({
            switchTime: {
                ...userPreferences.switchTime,
                [type]: value
            }
        });
    };

    return (
        <div className={`relative ${className}`}>
            {/* Bouton principal */}
            <button
                onClick={() => setShowMenu(!showMenu)}
                className={`
                    ${sizeClasses[size]}
                    bg-white dark:bg-gray-800
                    border border-gray-300 dark:border-gray-600
                    rounded-lg
                    flex items-center gap-2
                    hover:bg-gray-50 dark:hover:bg-gray-700
                    transition-colors duration-200
                    text-gray-700 dark:text-gray-300
                    shadow-sm
                `}
                title={`Thème: ${getThemeName()}`}
            >
                <Icon name={getThemeIcon()} size={iconSizes[size]} />
                {showLabel && (
                    <span className="font-medium">{getThemeName()}</span>
                )}
                <Icon name="chevronDown" size={12} className={`transition-transform ${showMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Menu déroulant */}
            {showMenu && (
                <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-48">
                    <div className="p-2">
                        {/* Options de thème */}
                        <div className="space-y-1">
                            {themeOptions.map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        option.action();
                                        setShowMenu(false);
                                    }}
                                    className={`
                                        w-full flex items-center gap-3 px-3 py-2 rounded-md text-left
                                        hover:bg-gray-100 dark:hover:bg-gray-700
                                        transition-colors
                                        ${
                                            (option.id === 'light' && !isDarkMode && !isSystemTheme) ||
                                            (option.id === 'dark' && isDarkMode && !isSystemTheme) ||
                                            (option.id === 'system' && isSystemTheme)
                                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                : 'text-gray-700 dark:text-gray-300'
                                        }
                                    `}
                                >
                                    <Icon name={option.icon} size={16} />
                                    <span className="font-medium">{option.name}</span>
                                    {((option.id === 'light' && !isDarkMode && !isSystemTheme) ||
                                      (option.id === 'dark' && isDarkMode && !isSystemTheme) ||
                                      (option.id === 'system' && isSystemTheme)) && (
                                        <Icon name="checkCircle" size={14} className="ml-auto" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-600 my-2"></div>

                        {/* Bouton préférences */}
                        <button
                            onClick={() => {
                                setShowPreferences(true);
                                setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                        >
                            <Icon name="settings" size={16} />
                            <span>Préférences</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Modal des préférences */}
            {showPreferences && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Préférences de thème
                            </h3>
                            <button
                                onClick={() => setShowPreferences(false)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400"
                            >
                                <Icon name="close" size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Commutation automatique */}
                            <div>
                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={userPreferences.autoSwitch}
                                        onChange={(e) => updatePreferences({ autoSwitch: e.target.checked })}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            Commutation automatique
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Changer automatiquement selon l'heure
                                        </div>
                                    </div>
                                </label>

                                {userPreferences.autoSwitch && (
                                    <div className="mt-4 ml-7 space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    🌙 Mode nuit à
                                                </label>
                                                <input
                                                    type="time"
                                                    value={userPreferences.switchTime.darkModeStart}
                                                    onChange={(e) => handleTimeChange('darkModeStart', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    ☀️ Mode jour à
                                                </label>
                                                <input
                                                    type="time"
                                                    value={userPreferences.switchTime.lightModeStart}
                                                    onChange={(e) => handleTimeChange('lightModeStart', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Accessibilité */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-900 dark:text-white">Accessibilité</h4>

                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={userPreferences.reducedMotion}
                                        onChange={(e) => updatePreferences({ reducedMotion: e.target.checked })}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            Réduire les animations
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Moins d'effets de transition
                                        </div>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={userPreferences.highContrast}
                                        onChange={(e) => updatePreferences({ highContrast: e.target.checked })}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            Contraste élevé
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Améliore la lisibilité
                                        </div>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={userPreferences.compactMode}
                                        onChange={(e) => updatePreferences({ compactMode: e.target.checked })}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            Mode compact
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Interface plus dense
                                        </div>
                                    </div>
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <button
                                    onClick={() => setShowPreferences(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fermer le menu si on clique ailleurs */}
            {showMenu && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                />
            )}
        </div>
    );
}

// Version simple du toggle (bouton rapide)
export function ThemeToggle({ className = '' }) {
    const { isDarkMode, toggleTheme, getThemeIcon } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`
                p-2 rounded-lg
                bg-white dark:bg-gray-800
                border border-gray-300 dark:border-gray-600
                hover:bg-gray-50 dark:hover:bg-gray-700
                transition-colors duration-200
                text-gray-700 dark:text-gray-300
                shadow-sm
                ${className}
            `}
            title={`Basculer vers le thème ${isDarkMode ? 'jour' : 'nuit'}`}
        >
            <Icon name={getThemeIcon()} size={16} />
        </button>
    );
}