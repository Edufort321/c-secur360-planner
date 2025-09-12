/**
 * Composant GoogleDriveButton - Interface de gestion Google Drive
 * Authentification, synchronisation et statut
 */

const { React, useState } = window;
import { Icon } from '../UI/Icon.js';
import { Button } from '../UI/Button.js';

export const GoogleDriveButton = ({ googleDrive, forceSync, notifications }) => {
    const [showDetails, setShowDetails] = useState(false);

    const formatLastSync = (date) => {
        if (!date) return 'Jamais';
        const now = new Date();
        const syncDate = new Date(date);
        const diffMs = now - syncDate;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins}min`;
        if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`;
        return syncDate.toLocaleDateString('fr-FR');
    };

    const handleSignIn = async () => {
        try {
            await googleDrive.signIn();
            notifications?.addSuccess('Connexion Google Drive réussie');
        } catch (error) {
            notifications?.addError('Erreur de connexion Google Drive');
        }
    };

    const handleSignOut = async () => {
        try {
            await googleDrive.signOut();
            notifications?.addInfo('Déconnexion Google Drive');
        } catch (error) {
            notifications?.addError('Erreur de déconnexion');
        }
    };

    const handleForceSync = async () => {
        try {
            const result = await forceSync();
            if (result?.success) {
                notifications?.addSuccess('Synchronisation réussie');
            } else {
                notifications?.addError(result?.error || 'Erreur de synchronisation');
            }
        } catch (error) {
            notifications?.addError('Erreur de synchronisation');
        }
    };

    // Si Google Drive n'est pas disponible
    if (!googleDrive.isGoogleDriveAvailable) {
        return React.createElement('div', {
            className: 'relative'
        }, [
            React.createElement(Button, {
                key: 'button',
                variant: 'outline',
                size: 'sm',
                disabled: true,
                className: 'text-gray-500'
            }, [
                React.createElement(Icon, { 
                    key: 'icon',
                    name: 'cloud', 
                    className: 'mr-2' 
                }),
                'Google Drive (Non configuré)'
            ])
        ]);
    }

    // Si pas encore initialisé
    if (!googleDrive.isInitialized) {
        return React.createElement('div', {
            className: 'relative'
        }, [
            React.createElement(Button, {
                key: 'button',
                variant: 'outline',
                size: 'sm',
                disabled: true,
                loading: true
            }, 'Initialisation...')
        ]);
    }

    // Si connecté
    if (googleDrive.isAuthenticated) {
        return React.createElement('div', {
            className: 'relative'
        }, [
            React.createElement(Button, {
                key: 'button',
                variant: 'outline',
                size: 'sm',
                onClick: () => setShowDetails(!showDetails),
                className: 'text-green-600 border-green-300 hover:bg-green-50'
            }, [
                React.createElement(Icon, { 
                    key: 'icon',
                    name: googleDrive.isSyncing ? 'cloud-upload' : 'cloud', 
                    className: `mr-2 ${googleDrive.isSyncing ? 'animate-pulse' : ''}` 
                }),
                googleDrive.isSyncing ? 'Synchronisation...' : 'Google Drive',
                React.createElement(Icon, { 
                    key: 'chevron',
                    name: showDetails ? 'chevron-up' : 'chevron-down', 
                    className: 'ml-2',
                    size: 16
                })
            ]),

            // Menu déroulant
            showDetails && React.createElement('div', {
                key: 'dropdown',
                className: 'absolute top-full right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50'
            }, [
                React.createElement('div', {
                    key: 'content',
                    className: 'p-4 space-y-3'
                }, [
                    // Statut
                    React.createElement('div', {
                        key: 'status',
                        className: 'flex items-center gap-2'
                    }, [
                        React.createElement('div', {
                            key: 'indicator',
                            className: 'w-3 h-3 bg-green-500 rounded-full animate-pulse'
                        }),
                        React.createElement('span', {
                            key: 'text',
                            className: 'text-sm font-medium text-green-600'
                        }, 'Connecté à Google Drive')
                    ]),

                    // Dernière synchronisation
                    React.createElement('div', {
                        key: 'sync-info',
                        className: 'text-xs text-gray-600'
                    }, [
                        React.createElement('div', { key: 'label' }, 'Dernière synchronisation:'),
                        React.createElement('div', { 
                            key: 'date',
                            className: 'font-medium' 
                        }, formatLastSync(googleDrive.lastSync))
                    ]),

                    // Erreur éventuelle
                    googleDrive.error && React.createElement('div', {
                        key: 'error',
                        className: 'text-xs text-red-600 bg-red-50 p-2 rounded'
                    }, googleDrive.error),

                    // Actions
                    React.createElement('div', {
                        key: 'actions',
                        className: 'flex gap-2 pt-2 border-t border-gray-100'
                    }, [
                        React.createElement(Button, {
                            key: 'sync',
                            variant: 'outline',
                            size: 'sm',
                            onClick: handleForceSync,
                            disabled: googleDrive.isSyncing,
                            loading: googleDrive.isSyncing,
                            className: 'flex-1'
                        }, [
                            React.createElement(Icon, { 
                                key: 'icon',
                                name: 'cloud-upload', 
                                className: 'mr-1',
                                size: 16
                            }),
                            'Synchroniser'
                        ]),

                        React.createElement(Button, {
                            key: 'signout',
                            variant: 'ghost',
                            size: 'sm',
                            onClick: handleSignOut,
                            className: 'text-red-600 hover:bg-red-50'
                        }, [
                            React.createElement(Icon, { 
                                key: 'icon',
                                name: 'close', 
                                className: 'mr-1',
                                size: 16
                            }),
                            'Déconnecter'
                        ])
                    ])
                ])
            ])
        ]);
    }

    // Si pas connecté
    return React.createElement('div', {
        className: 'relative'
    }, [
        React.createElement(Button, {
            key: 'button',
            variant: 'outline',
            size: 'sm',
            onClick: handleSignIn,
            className: 'text-gray-600 hover:text-blue-600 hover:border-blue-300'
        }, [
            React.createElement(Icon, { 
                key: 'icon',
                name: 'cloud', 
                className: 'mr-2' 
            }),
            'Connecter Google Drive'
        ]),

        // Tooltip d'aide
        React.createElement('div', {
            key: 'tooltip',
            className: 'absolute top-full right-0 mt-1 w-48 text-xs text-gray-500 bg-gray-50 p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none'
        }, 'Connectez-vous pour sauvegarder automatiquement vos données')
    ]);
};