// ============== PLANIFICATEUR C-SECUR360 V6.7 ==============
// Application React complète extraite du HTML pour optimiser le chargement

console.log('🚀 Chargement de l\'application C-Secur360 V6.7');

// Vérification des dépendances
if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
    console.error('❌ React ou ReactDOM non chargé');
    document.getElementById('root').innerHTML = `
        <div style="padding: 20px; background: #fee; border: 2px solid #f00; margin: 20px; border-radius: 10px;">
            <h1 style="color: #d00;">🚨 Erreur de chargement</h1>
            <p>React ou ReactDOM n'est pas chargé correctement.</p>
            <p><a href="./simple.html" style="color: #00f;">→ Version de diagnostic</a></p>
        </div>
    `;
    throw new Error('React dependencies not loaded');
}

const { useState, useCallback, useEffect } = React;
const h = React.createElement;

// ============== COMPOSANTS PRINCIPAUX ==============

// Hook de données
const useAppData = () => {
    // Version simplifiée pour le test initial
    const [jobs, setJobs] = useState([]);
    const [personnel, setPersonnel] = useState([]);
    
    return {
        jobs,
        setJobs,
        personnel,
        setPersonnel,
        // Autres données...
    };
};

// Composant principal simplifié
function PlanificateurFinal() {
    const [isLoading, setIsLoading] = useState(true);
    const appData = useAppData();

    useEffect(() => {
        // Simulation de chargement
        setTimeout(() => {
            setIsLoading(false);
            console.log('✅ Application chargée avec succès');
        }, 1000);
    }, []);

    if (isLoading) {
        return h('div', { 
            className: 'min-h-screen bg-gray-100 flex items-center justify-center' 
        },
            h('div', { className: 'text-center' },
                h('div', { className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4' }),
                h('p', { className: 'text-gray-600' }, 'Chargement du planificateur...')
            )
        );
    }

    return h('div', { className: 'min-h-screen bg-gray-50' },
        // Header
        h('header', { className: 'bg-white shadow-sm border-b' },
            h('div', { className: 'max-w-7xl mx-auto px-4 py-4' },
                h('h1', { className: 'text-2xl font-bold text-gray-900' },
                    '🎯 Planificateur C-Secur360 V6.7'
                ),
                h('p', { className: 'text-gray-600 mt-1' },
                    'Version optimisée - JavaScript externe'
                )
            )
        ),

        // Contenu principal
        h('main', { className: 'max-w-7xl mx-auto px-4 py-6' },
            h('div', { className: 'bg-white rounded-lg shadow p-6' },
                h('h2', { className: 'text-xl font-semibold mb-4' },
                    '✅ Application chargée avec succès !'
                ),
                h('div', { className: 'space-y-4' },
                    h('p', null, 'L\'application fonctionne maintenant avec JavaScript externe.'),
                    h('div', { className: 'flex gap-4' },
                        h('button', {
                            className: 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded',
                            onClick: () => alert('Test d\'interaction réussi !')
                        }, '🧪 Test Interaction'),
                        h('a', {
                            href: './simple.html',
                            className: 'bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded inline-block'
                        }, '🔍 Page de diagnostic')
                    )
                )
            )
        )
    );
}

// ============== INITIALISATION ==============
try {
    console.log('🚀 Initialisation de l\'application...');
    
    const rootElement = document.getElementById('root');
    if (!rootElement) {
        throw new Error('Élément root non trouvé');
    }
    
    const root = ReactDOM.createRoot(rootElement);
    root.render(h(PlanificateurFinal));
    
    console.log('🎉 Application React initialisée avec succès');
    
} catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    document.body.innerHTML = `
        <div style="padding: 20px; background: #fee; border: 2px solid #f00; margin: 20px; border-radius: 10px;">
            <h1 style="color: #d00;">🚨 Erreur d'initialisation</h1>
            <p><strong>Problème:</strong> ${error.message}</p>
            <pre style="background: #f8f8f8; padding: 10px; font-size: 12px;">${error.stack}</pre>
            <p><a href="./simple.html" style="color: #00f;">→ Page de diagnostic</a></p>
        </div>
    `;
}