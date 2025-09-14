// ============== HOOK SCREEN SIZE ==============
// Hook pour détecter la taille d'écran et gérer le responsive

import { useState, useEffect } from 'react';
import { SCREEN_BREAKPOINTS } from '../../config/constants.js';

export function useScreenSize() {
    const [screenSize, setScreenSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1024,
        height: typeof window !== 'undefined' ? window.innerHeight : 768,
        isMobile: false,
        isTablet: false,
        isDesktop: false
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        function updateScreenSize() {
            const width = window.innerWidth;
            const height = window.innerHeight;

            setScreenSize({
                width,
                height,
                isMobile: width < SCREEN_BREAKPOINTS.mobile,
                isTablet: width >= SCREEN_BREAKPOINTS.mobile && width < SCREEN_BREAKPOINTS.desktop,
                isDesktop: width >= SCREEN_BREAKPOINTS.desktop
            });
        }

        updateScreenSize();

        window.addEventListener('resize', updateScreenSize);
        return () => window.removeEventListener('resize', updateScreenSize);
    }, []);

    return screenSize;
}