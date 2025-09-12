/**
 * Utilitaire de génération du favicon dynamique
 * Crée un favicon avec les initiales CS
 */

export const createFavicon = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    // Fond bleu C-Secur360 avec gradient
    const gradient = ctx.createLinearGradient(0, 0, 32, 32);
    gradient.addColorStop(0, '#3b82f6'); // blue-500
    gradient.addColorStop(1, '#1d4ed8'); // blue-700
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    
    // Bordure subtile
    ctx.strokeStyle = '#1e40af'; // blue-800
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 31, 31);
    
    // Texte CS en blanc
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CS', 16, 16);
    
    // Convertir en favicon et appliquer
    const faviconUrl = canvas.toDataURL('image/x-icon');
    
    // Chercher ou créer l'élément favicon
    let favicon = document.getElementById('favicon');
    if (!favicon) {
        favicon = document.createElement('link');
        favicon.id = 'favicon';
        favicon.rel = 'icon';
        favicon.type = 'image/x-icon';
        document.head.appendChild(favicon);
    }
    
    favicon.href = faviconUrl;
    
    return faviconUrl;
};

// Fonction d'initialisation à appeler au chargement
export const initFavicon = () => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createFavicon);
    } else {
        createFavicon();
    }
};