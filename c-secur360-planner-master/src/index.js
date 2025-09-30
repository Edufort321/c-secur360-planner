// ============== POINT D'ENTRÉE APPLICATION ==============
// Point d'entrée principal de l'application React

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { LanguageProvider } from './contexts/LanguageContext.jsx';

console.log('🚀 Chargement de l\'application C-Secur360 V6.7 - Version Modulaire');

// Vérification des dépendances
if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
    console.error('❌ React ou ReactDOM non chargé');
    document.getElementById('root').innerHTML = `
        <div style="padding: 20px; background: #fee; border: 2px solid #f00; margin: 20px; border-radius: 10px;">
            <h1 style="color: #d00;">🚨 Erreur de chargement</h1>
            <p>React ou ReactDOM n'est pas chargé correctement.</p>
            <p>Vérifiez la configuration de votre environnement de développement.</p>
        </div>
    `;
    throw new Error('React dependencies not loaded');
}

// Initialisation de l'application
try {
    console.log('🚀 Initialisation de l\'application...');

    const rootElement = document.getElementById('root');
    if (!rootElement) {
        throw new Error('Élément root non trouvé');
    }

    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <LanguageProvider>
            <App />
        </LanguageProvider>
    );

    console.log('🎉 Application React initialisée avec succès');

} catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    document.getElementById('root').innerHTML = `
        <div style="padding: 20px; background: #fee; border: 2px solid #f00; margin: 20px; border-radius: 10px;">
            <h1 style="color: #d00;">🚨 Erreur d'initialisation</h1>
            <p><strong>Problème:</strong> ${error.message}</p>
            <pre style="background: #f8f8f8; padding: 10px; font-size: 12px; white-space: pre-wrap;">${error.stack}</pre>
        </div>
    `;
}