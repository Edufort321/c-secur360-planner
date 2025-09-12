/**
 * Composant principal App - Point d'entrée de l'application
 * Gestion de l'authentification et de la navigation principale
 */

const { React, useState, useEffect } = window;
import { useAppDataWithSync } from '../hooks/useAppDataWithSync.js';
import { useNotifications } from '../hooks/useNotifications.js';
import { useScreenSize } from '../hooks/useScreenSize.js';
import { Header } from './Layout/Header.js';
import { NotificationContainer } from './Notifications/NotificationContainer.js';

export const App = () => {
    // ============== HOOKS PRINCIPAUX ==============
    const appData = useAppDataWithSync();
    const notifications = useNotifications();
    const screenSize = useScreenSize();
    
    // ============== ÉTATS LOCAUX ==============
    const [currentView, setCurrentView] = useState('calendar'); // calendar, jobs, personnel, equipements
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(true);

    // ============== GESTION AUTHENTIFICATION ==============
    const handleLogin = (utilisateur, motDePasse) => {
        console.log('🔐 Tentative de connexion:', utilisateur?.nom);
        
        if (!utilisateur) {
            console.log('❌ Aucun utilisateur fourni');
            notifications.addError('Erreur d\'authentification');
            return;
        }
        
        if (!motDePasse) {
            console.log('❌ Aucun mot de passe fourni');
            notifications.addError('Mot de passe requis');
            return;
        }

        // Vérification simple du mot de passe (en production, utiliser un système sécurisé)
        if (utilisateur.motDePasse && utilisateur.motDePasse === motDePasse) {
            console.log('✅ Connexion réussie pour:', utilisateur.nom);
            setCurrentUser(utilisateur);
            setIsAuthenticated(true);
            setShowLoginModal(false);
            notifications.addSuccess(`Connexion réussie - ${utilisateur.nom}`);
        } else {
            console.log('❌ Mot de passe incorrect pour:', utilisateur.nom);
            notifications.addError('Nom d\'utilisateur ou mot de passe incorrect');
        }
    };

    const handleLogout = () => {
        console.log('🚪 Déconnexion utilisateur');
        setCurrentUser(null);
        setIsAuthenticated(false);
        setShowLoginModal(true);
    };

    // ============== GESTION DES VUES ==============
    const renderMainContent = () => {
        if (!isAuthenticated) {
            return React.createElement('div', {
                className: 'min-h-screen bg-gray-100 flex items-center justify-center'
            }, React.createElement('div', {
                className: 'text-center p-8'
            }, [
                React.createElement('h2', {
                    key: 'title',
                    className: 'text-2xl font-bold text-gray-800 mb-4'
                }, 'Authentification requise'),
                React.createElement('p', {
                    key: 'message',
                    className: 'text-gray-600'
                }, 'Veuillez vous connecter pour accéder à l\'application.')
            ]));
        }

        // Pour l'instant, affichage simple - sera remplacé par les vrais composants
        const viewComponents = {
            calendar: () => React.createElement('div', {
                className: 'p-6'
            }, [
                React.createElement('h1', {
                    key: 'title',
                    className: 'text-2xl font-bold text-gray-800 mb-4'
                }, '📅 Vue Calendrier'),
                React.createElement('p', {
                    key: 'desc',
                    className: 'text-gray-600'
                }, 'Calendrier des jobs et événements à venir...')
            ]),
            jobs: () => React.createElement('div', {
                className: 'p-6'
            }, [
                React.createElement('h1', {
                    key: 'title',
                    className: 'text-2xl font-bold text-gray-800 mb-4'
                }, '🏗️ Gestion des Jobs'),
                React.createElement('p', {
                    key: 'desc',
                    className: 'text-gray-600'
                }, 'Liste et gestion des projets en cours...')
            ]),
            personnel: () => React.createElement('div', {
                className: 'p-6'
            }, [
                React.createElement('h1', {
                    key: 'title',
                    className: 'text-2xl font-bold text-gray-800 mb-4'
                }, '👥 Gestion du Personnel'),
                React.createElement('p', {
                    key: 'desc',
                    className: 'text-gray-600'
                }, 'Équipe et disponibilités...')
            ]),
            equipements: () => React.createElement('div', {
                className: 'p-6'
            }, [
                React.createElement('h1', {
                    key: 'title',
                    className: 'text-2xl font-bold text-gray-800 mb-4'
                }, '🔧 Gestion des Équipements'),
                React.createElement('p', {
                    key: 'desc',
                    className: 'text-gray-600'
                }, 'Matériel et disponibilités...')
            ])
        };

        const ViewComponent = viewComponents[currentView] || viewComponents.calendar;
        return React.createElement('main', {
            className: 'flex-1 bg-gray-50'
        }, React.createElement(ViewComponent));
    };

    // ============== MODAL DE CONNEXION ==============
    const renderLoginModal = () => {
        if (!showLoginModal) return null;

        return React.createElement('div', {
            className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
        }, React.createElement('div', {
            className: 'bg-white rounded-lg shadow-xl max-w-md w-full p-6'
        }, [
            React.createElement('div', {
                key: 'header',
                className: 'text-center mb-6'
            }, [
                React.createElement('div', {
                    key: 'logo',
                    className: 'w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4'
                }, 'CS'),
                React.createElement('h2', {
                    key: 'title',
                    className: 'text-2xl font-bold text-gray-800'
                }, 'Planificateur C-Secur360'),
                React.createElement('p', {
                    key: 'subtitle',
                    className: 'text-gray-600 mt-2'
                }, 'Veuillez vous identifier')
            ]),

            React.createElement('form', {
                key: 'form',
                className: 'space-y-4',
                onSubmit: (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const email = formData.get('email');
                    const password = formData.get('password');
                    
                    // Trouver l'utilisateur par email
                    const user = appData.personnel.find(p => p.email === email);
                    if (user) {
                        handleLogin(user, password);
                    } else {
                        notifications.addError('Utilisateur non trouvé');
                    }
                }
            }, [
                React.createElement('div', {
                    key: 'email-field'
                }, [
                    React.createElement('label', {
                        key: 'label',
                        className: 'block text-sm font-medium text-gray-700 mb-1'
                    }, 'Email'),
                    React.createElement('input', {
                        key: 'input',
                        name: 'email',
                        type: 'email',
                        required: true,
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                        placeholder: 'votre.email@c-secur360.com',
                        defaultValue: 'jean.dupont@c-secur360.com' // Pour les tests
                    })
                ]),

                React.createElement('div', {
                    key: 'password-field'
                }, [
                    React.createElement('label', {
                        key: 'label',
                        className: 'block text-sm font-medium text-gray-700 mb-1'
                    }, 'Mot de passe'),
                    React.createElement('input', {
                        key: 'input',
                        name: 'password',
                        type: 'password',
                        required: true,
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                        placeholder: 'Votre mot de passe',
                        defaultValue: 'password123' // Pour les tests
                    })
                ]),

                React.createElement('button', {
                    key: 'submit',
                    type: 'submit',
                    className: 'w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors'
                }, 'Se connecter'),

                React.createElement('div', {
                    key: 'test-info',
                    className: 'mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800'
                }, [
                    React.createElement('p', {
                        key: 'title',
                        className: 'font-medium mb-1'
                    }, '🧪 Mode Test'),
                    React.createElement('p', {
                        key: 'desc'
                    }, 'Email: jean.dupont@c-secur360.com'),
                    React.createElement('p', {
                        key: 'desc2'
                    }, 'Mot de passe: password123')
                ])
            ])
        ]));
    };

    // ============== EFFET D'INITIALISATION ==============
    useEffect(() => {
        console.log('🚀 Initialisation de l\'application');
        
        // Ajouter des mots de passe par défaut au personnel pour les tests
        if (appData.personnel.length > 0) {
            const personnelWithPasswords = appData.personnel.map(p => ({
                ...p,
                motDePasse: p.motDePasse || 'password123'
            }));
            
            if (JSON.stringify(personnelWithPasswords) !== JSON.stringify(appData.personnel)) {
                appData.setPersonnel(personnelWithPasswords);
            }
        }
    }, [appData.personnel]);

    // ============== RENDU PRINCIPAL ==============
    return React.createElement('div', {
        className: 'min-h-screen bg-gray-100 flex flex-col'
    }, [
        // Header
        isAuthenticated && React.createElement(Header, {
            key: 'header',
            user: currentUser,
            googleDrive: appData.googleDrive,
            forceSync: appData.forceSync,
            notifications,
            onLogout: handleLogout,
            screenSize
        }),

        // Contenu principal
        React.createElement('div', {
            key: 'main',
            className: 'flex-1 flex flex-col'
        }, renderMainContent()),

        // Modal de connexion
        renderLoginModal(),

        // Notifications
        React.createElement(NotificationContainer, {
            key: 'notifications',
            notifications: notifications.notifications,
            removeNotification: notifications.removeNotification
        })
    ]);
};