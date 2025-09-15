// ============== CONTEXTE THÈME VERSION ORIGINALE ==============
// Reproduction exacte du système thème nuit/jour de la version originale

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    // État du thème (jour/nuit)
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isSystemTheme, setIsSystemTheme] = useState(true);

    // Préférences utilisateur
    const [userPreferences, setUserPreferences] = useState({
        autoSwitch: false,
        switchTime: {
            darkModeStart: '18:00',
            lightModeStart: '06:00'
        },
        reducedMotion: false,
        highContrast: false,
        compactMode: false
    });

    // Chargement des préférences depuis localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('c-secur360-theme');
        const savedPreferences = localStorage.getItem('c-secur360-theme-preferences');

        if (savedTheme) {
            const themeData = JSON.parse(savedTheme);
            setIsDarkMode(themeData.isDarkMode);
            setIsSystemTheme(themeData.isSystemTheme);
        } else {
            // Détecter le thème système par défaut
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDarkMode(prefersDark);
        }

        if (savedPreferences) {
            setUserPreferences(JSON.parse(savedPreferences));
        }
    }, []);

    // Écoute des changements du thème système
    useEffect(() => {
        if (isSystemTheme) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            const handleChange = (e) => {
                setIsDarkMode(e.matches);
            };

            mediaQuery.addEventListener('change', handleChange);
            setIsDarkMode(mediaQuery.matches);

            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [isSystemTheme]);

    // Commutation automatique selon l'heure
    useEffect(() => {
        if (userPreferences.autoSwitch && !isSystemTheme) {
            const checkTime = () => {
                const now = new Date();
                const currentTime = now.getHours() * 60 + now.getMinutes();

                const [darkHour, darkMin] = userPreferences.switchTime.darkModeStart.split(':').map(Number);
                const [lightHour, lightMin] = userPreferences.switchTime.lightModeStart.split(':').map(Number);

                const darkTime = darkHour * 60 + darkMin;
                const lightTime = lightHour * 60 + lightMin;

                let shouldBeDark;
                if (darkTime < lightTime) {
                    // Exemple: 18:00 à 06:00 (nuit normale)
                    shouldBeDark = currentTime >= darkTime || currentTime < lightTime;
                } else {
                    // Exemple: 22:00 à 05:00 (nuit tardive)
                    shouldBeDark = currentTime >= darkTime && currentTime < lightTime;
                }

                if (shouldBeDark !== isDarkMode) {
                    setIsDarkMode(shouldBeDark);
                }
            };

            checkTime();
            const interval = setInterval(checkTime, 60000); // Vérifier chaque minute

            return () => clearInterval(interval);
        }
    }, [userPreferences.autoSwitch, userPreferences.switchTime, isDarkMode, isSystemTheme]);

    // Application du thème au DOM
    useEffect(() => {
        const root = document.documentElement;

        if (isDarkMode) {
            root.classList.add('theme-nuit');
            root.classList.remove('theme-jour');
        } else {
            root.classList.add('theme-jour');
            root.classList.remove('theme-nuit');
        }

        // Classes additionnelles pour les préférences
        if (userPreferences.reducedMotion) {
            root.classList.add('reduced-motion');
        } else {
            root.classList.remove('reduced-motion');
        }

        if (userPreferences.highContrast) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }

        if (userPreferences.compactMode) {
            root.classList.add('compact-mode');
        } else {
            root.classList.remove('compact-mode');
        }
    }, [isDarkMode, userPreferences]);

    // Sauvegarde des préférences
    useEffect(() => {
        localStorage.setItem('c-secur360-theme', JSON.stringify({
            isDarkMode,
            isSystemTheme
        }));
    }, [isDarkMode, isSystemTheme]);

    useEffect(() => {
        localStorage.setItem('c-secur360-theme-preferences', JSON.stringify(userPreferences));
    }, [userPreferences]);

    // Fonctions de contrôle
    const toggleTheme = () => {
        setIsSystemTheme(false);
        setIsDarkMode(!isDarkMode);
    };

    const setTheme = (dark) => {
        setIsSystemTheme(false);
        setIsDarkMode(dark);
    };

    const useSystemTheme = () => {
        setIsSystemTheme(true);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(prefersDark);
    };

    const updatePreferences = (newPreferences) => {
        setUserPreferences(prev => ({
            ...prev,
            ...newPreferences
        }));
    };

    // Obtenir le nom du thème actuel
    const getThemeName = () => {
        if (isSystemTheme) {
            return 'Système';
        }
        return isDarkMode ? 'Nuit' : 'Jour';
    };

    // Obtenir l'icône du thème
    const getThemeIcon = () => {
        if (isSystemTheme) {
            return 'desktop';
        }
        return isDarkMode ? 'moon' : 'sun';
    };

    // Valeurs du contexte
    const value = {
        // État
        isDarkMode,
        isSystemTheme,
        userPreferences,

        // Fonctions
        toggleTheme,
        setTheme,
        useSystemTheme,
        updatePreferences,

        // Utilitaires
        getThemeName,
        getThemeIcon,

        // Classes CSS
        themeClass: isDarkMode ? 'theme-nuit' : 'theme-jour'
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

// Hook pour utiliser le contexte
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme doit être utilisé dans un ThemeProvider');
    }
    return context;
}

export default ThemeContext;