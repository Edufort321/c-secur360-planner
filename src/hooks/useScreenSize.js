/**
 * Hook de gestion de la taille d'écran et responsive
 * Détection mobile/tablet/desktop
 */

const { useState, useEffect } = React;

export const useScreenSize = () => {
    const [screenSize, setScreenSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1024,
        height: typeof window !== 'undefined' ? window.innerHeight : 768,
        isMobile: false,
        isTablet: false,
        isDesktop: false
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateScreenSize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            setScreenSize({
                width,
                height,
                isMobile: width < 768,
                isTablet: width >= 768 && width < 1024,
                isDesktop: width >= 1024
            });
        };

        // Initialiser
        updateScreenSize();

        // Écouter les changements de taille
        window.addEventListener('resize', updateScreenSize);
        
        return () => {
            window.removeEventListener('resize', updateScreenSize);
        };
    }, []);

    return screenSize;
};