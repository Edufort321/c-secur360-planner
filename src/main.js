/**
 * Point d'entrée principal de l'application C-Secur360
 * Architecture moderne avec modules ES6 et composants séparés
 */

// ============== IMPORTS ==============
import { App } from './components/App.js';
import { initFavicon } from './utils/favicon.js';

// ============== VÉRIFICATIONS PRÉLIMINAIRES ==============
console.log('🚀 C-Secur360 Planificateur V6.8 - Architecture Moderne');
console.log('📦 Chargement des modules...');

// Vérifier que React est disponible
if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
    console.error('❌ React ou ReactDOM non disponible');
    document.body.innerHTML = `
        <div style="padding: 20px; background: #fee; border: 2px solid #f00; margin: 20px; border-radius: 10px; font-family: Arial;">
            <h1 style="color: #d00;">🚨 Erreur de Dépendances</h1>
            <p><strong>Problème:</strong> React ou ReactDOM n'est pas chargé</p>
            <p><strong>Solution:</strong> Vérifiez que les scripts React sont bien inclus</p>
            <details style="margin-top: 15px;">
                <summary style="cursor: pointer; color: #666;">Détails techniques</summary>
                <pre style="background: #f8f8f8; padding: 10px; margin-top: 10px; font-size: 12px;">
React: ${typeof React}
ReactDOM: ${typeof ReactDOM}
Location: ${window.location.href}
UserAgent: ${navigator.userAgent}
                </pre>
            </details>
        </div>
    `;
    throw new Error('React dependencies missing');
}

console.log('✅ React détecté:', React.version);
console.log('✅ ReactDOM disponible');

// ============== GESTION DES ERREURS GLOBALES ==============
window.addEventListener('error', (event) => {
    console.error('❌ Erreur globale capturée:', event.error);
    
    // Afficher une erreur utilisateur si l'app n'est pas encore montée
    if (!document.getElementById('root').hasChildNodes()) {
        document.getElementById('root').innerHTML = `
            <div style="padding: 20px; background: #fee; border: 2px solid #f00; margin: 20px; border-radius: 10px; font-family: Arial;">
                <h1 style="color: #d00;">🚨 Erreur d'Exécution</h1>
                <p><strong>Problème:</strong> ${event.error.message}</p>
                <p><strong>Fichier:</strong> ${event.filename}:${event.lineno}</p>
                <details style="margin-top: 15px;">
                    <summary style="cursor: pointer; color: #666;">Stack trace</summary>
                    <pre style="background: #f8f8f8; padding: 10px; margin-top: 10px; font-size: 11px; overflow: auto;">
${event.error.stack}
                    </pre>
                </details>
                <p style="margin-top: 15px;">
                    <a href="#" onclick="window.location.reload()" style="color: #007bff;">🔄 Recharger la page</a>
                </p>
            </div>
        `;
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promise rejetée:', event.reason);
});

// ============== INITIALISATION ==============
const initializeApp = async () => {
    try {
        console.log('🎯 Initialisation de l\'application...');
        
        // 1. Générer le favicon
        console.log('🎨 Génération du favicon...');
        initFavicon();
        
        // 2. Vérifier l'élément root
        const rootElement = document.getElementById('root');
        if (!rootElement) {
            throw new Error('Élément #root non trouvé dans le DOM');
        }
        console.log('✅ Élément root trouvé');
        
        // 3. Vérifier que le composant App est disponible
        if (typeof App !== 'function') {
            throw new Error('Composant App non disponible');
        }
        console.log('✅ Composant App chargé');
        
        // 4. Créer la racine React et monter l'application
        console.log('🏗️ Montage de l\'application React...');
        const root = ReactDOM.createRoot(rootElement);
        
        // Ajouter un écran de chargement pendant le montage
        rootElement.innerHTML = `
            <div style="min-height: 100vh; display: flex; items-center: justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <div style="text-align: center; color: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <div style="width: 60px; height: 60px; border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; margin: 0 auto 20px; animation: spin 1s linear infinite;"></div>
                    <h2 style="margin: 0 0 10px 0; font-size: 24px; font-weight: bold;">Planificateur C-Secur360</h2>
                    <p style="margin: 0; opacity: 0.8; font-size: 16px;">Initialisation de l'application...</p>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        // Petit délai pour voir l'écran de chargement
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Monter l'application
        root.render(React.createElement(App));
        
        console.log('🎉 Application montée avec succès !');
        console.log('📊 Statistiques du montage:');
        console.log(`   - Temps de chargement: ${performance.now().toFixed(2)}ms`);
        console.log(`   - Mode: ${process?.env?.NODE_ENV || 'development'}`);
        console.log(`   - Navigateur: ${navigator.userAgent.split(' ')[0]}`);
        
        // Marquer l'application comme prête
        window.C_SECUR360_APP_READY = true;
        
        // Émettre un événement personnalisé
        window.dispatchEvent(new CustomEvent('c-secur360-ready', {
            detail: {
                version: '6.8',
                timestamp: new Date().toISOString(),
                features: ['react', 'google-drive', 'responsive', 'modular']
            }
        }));
        
    } catch (error) {
        console.error('💥 Erreur lors de l\'initialisation:', error);
        
        const rootElement = document.getElementById('root');
        if (rootElement) {
            rootElement.innerHTML = `
                <div style="padding: 20px; background: #fee; border: 2px solid #f00; margin: 20px; border-radius: 10px; font-family: Arial;">
                    <h1 style="color: #d00;">🚨 Erreur d'Initialisation</h1>
                    <p><strong>Problème:</strong> ${error.message}</p>
                    <details style="margin-top: 15px;">
                        <summary style="cursor: pointer; color: #666;">Détails de l'erreur</summary>
                        <pre style="background: #f8f8f8; padding: 10px; margin-top: 10px; font-size: 11px; overflow: auto;">
${error.stack}
                        </pre>
                    </details>
                    <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
                        <h3 style="color: #856404; margin: 0 0 10px 0;">💡 Solutions possibles:</h3>
                        <ul style="color: #856404; margin: 0; padding-left: 20px;">
                            <li>Rechargez la page (Ctrl+F5)</li>
                            <li>Vérifiez votre connexion Internet</li>
                            <li>Désactivez temporairement les bloqueurs de publicité</li>
                            <li>Essayez dans un navigateur différent</li>
                        </ul>
                    </div>
                    <p style="margin-top: 15px;">
                        <a href="#" onclick="window.location.reload()" 
                           style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                            🔄 Recharger la page
                        </a>
                    </p>
                </div>
            `;
        }
        
        throw error;
    }
};

// ============== DÉMARRAGE ==============
// Attendre que le DOM soit prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // Le DOM est déjà prêt
    initializeApp();
}

// ============== EXPORTS POUR DEBUG ==============
// Utile pour le debug en mode développement
if (typeof window !== 'undefined') {
    window.C_SECUR360_DEBUG = {
        version: '6.8-modular',
        initializeApp,
        App,
        React: typeof React !== 'undefined' ? React : null,
        ReactDOM: typeof ReactDOM !== 'undefined' ? ReactDOM : null
    };
}