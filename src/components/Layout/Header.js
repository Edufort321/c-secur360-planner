/**
 * Composant Header - En-tête de l'application
 * Navigation responsive avec menu hamburger
 */

const { React, useState } = window;
import { Icon } from '../UI/Icon.js';
import { Button } from '../UI/Button.js';
import { GoogleDriveButton } from '../GoogleDrive/GoogleDriveButton.js';

export const Header = ({ 
    title = 'Planificateur C-Secur360 V6.7',
    user,
    googleDrive,
    forceSync,
    notifications,
    onLogout,
    screenSize
}) => {
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const toggleMobileMenu = () => setShowMobileMenu(!showMobileMenu);
    const closeMobileMenu = () => setShowMobileMenu(false);

    const handleLogout = () => {
        onLogout?.();
        setShowUserMenu(false);
        notifications?.addInfo('Déconnexion réussie');
    };

    return React.createElement('header', {
        className: 'bg-gradient-to-r from-gray-900 to-black shadow-lg border-b border-gray-800'
    }, [
        React.createElement('div', {
            key: 'container',
            className: 'px-4 py-3'
        }, [
            // BARRE PRINCIPALE COMPACTE
            React.createElement('div', {
                key: 'main-bar',
                className: 'flex items-center justify-between'
            }, [
                // Logo et titre (version mobile/desktop)
                React.createElement('div', {
                    key: 'brand',
                    className: 'flex items-center gap-3'
                }, [
                    // Logo
                    React.createElement('div', {
                        key: 'logo',
                        className: 'w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg'
                    }, 'CS'),
                    
                    // Titre (caché sur mobile)
                    !screenSize?.isMobile && React.createElement('div', {
                        key: 'title-desktop'
                    }, [
                        React.createElement('h1', {
                            key: 'title',
                            className: 'text-white font-bold text-xl'
                        }, title),
                        React.createElement('p', {
                            key: 'subtitle',
                            className: 'text-gray-400 text-sm'
                        }, 'Gestion intelligente des projets de sécurité')
                    ])
                ]),

                // Actions desktop
                !screenSize?.isMobile && React.createElement('div', {
                    key: 'desktop-actions',
                    className: 'flex items-center gap-4'
                }, [
                    // Google Drive
                    React.createElement(GoogleDriveButton, {
                        key: 'google-drive',
                        googleDrive,
                        forceSync,
                        notifications
                    }),

                    // Utilisateur connecté
                    user && React.createElement('div', {
                        key: 'user',
                        className: 'relative'
                    }, [
                        React.createElement(Button, {
                            key: 'user-button',
                            variant: 'ghost',
                            size: 'sm',
                            onClick: () => setShowUserMenu(!showUserMenu),
                            className: 'text-white hover:bg-gray-800'
                        }, [
                            React.createElement('div', {
                                key: 'user-info',
                                className: 'flex items-center gap-2'
                            }, [
                                React.createElement('div', {
                                    key: 'avatar',
                                    className: 'w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium',
                                    style: { backgroundColor: user.couleur || '#3b82f6' }
                                }, user.nom?.charAt(0) || 'U'),
                                React.createElement('span', {
                                    key: 'name',
                                    className: 'hidden sm:block'
                                }, user.nom),
                                React.createElement(Icon, {
                                    key: 'chevron',
                                    name: showUserMenu ? 'chevron-up' : 'chevron-down',
                                    size: 16
                                })
                            ])
                        ]),

                        // Menu utilisateur
                        showUserMenu && React.createElement('div', {
                            key: 'user-menu',
                            className: 'absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50'
                        }, [
                            React.createElement('div', {
                                key: 'user-info-detailed',
                                className: 'p-3 border-b border-gray-100'
                            }, [
                                React.createElement('p', {
                                    key: 'name',
                                    className: 'font-medium text-gray-900'
                                }, user.nom),
                                React.createElement('p', {
                                    key: 'specialty',
                                    className: 'text-sm text-gray-600'
                                }, user.specialite),
                                React.createElement('p', {
                                    key: 'email',
                                    className: 'text-xs text-gray-500'
                                }, user.email)
                            ]),
                            React.createElement('div', {
                                key: 'actions',
                                className: 'p-1'
                            }, [
                                React.createElement(Button, {
                                    key: 'logout',
                                    variant: 'ghost',
                                    size: 'sm',
                                    onClick: handleLogout,
                                    className: 'w-full justify-start text-red-600 hover:bg-red-50'
                                }, [
                                    React.createElement(Icon, {
                                        key: 'icon',
                                        name: 'close',
                                        className: 'mr-2',
                                        size: 16
                                    }),
                                    'Déconnexion'
                                ])
                            ])
                        ])
                    ])
                ]),

                // Menu hamburger (mobile)
                screenSize?.isMobile && React.createElement(Button, {
                    key: 'hamburger',
                    variant: 'ghost',
                    size: 'sm',
                    onClick: toggleMobileMenu,
                    className: 'text-white hover:bg-gray-800 p-2'
                }, React.createElement(Icon, {
                    name: showMobileMenu ? 'close' : 'menu',
                    size: 24
                }))
            ])
        ]),

        // MENU MOBILE DÉROULANT
        showMobileMenu && screenSize?.isMobile && React.createElement('div', {
            key: 'mobile-menu',
            className: 'border-t border-gray-800 bg-gray-800'
        }, [
            React.createElement('div', {
                key: 'mobile-content',
                className: 'p-4 space-y-4'
            }, [
                // Info section
                React.createElement('div', {
                    key: 'info-section'
                }, [
                    React.createElement('h3', {
                        key: 'title',
                        className: 'text-white font-semibold text-lg mb-2'
                    }, 'Planificateur C-Secur360'),
                    React.createElement('p', {
                        key: 'desc',
                        className: 'text-gray-400 text-sm'
                    }, 'Gestion intelligente des projets de sécurité')
                ]),

                // Utilisateur section
                user && React.createElement('div', {
                    key: 'account-section',
                    className: 'bg-gray-900 rounded-lg p-3'
                }, [
                    React.createElement('h4', {
                        key: 'title',
                        className: 'text-blue-400 font-medium text-sm mb-2'
                    }, '👤 Compte'),
                    React.createElement('div', {
                        key: 'user-info',
                        className: 'flex items-center gap-3 mb-3'
                    }, [
                        React.createElement('div', {
                            key: 'avatar',
                            className: 'w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium',
                            style: { backgroundColor: user.couleur || '#3b82f6' }
                        }, user.nom?.charAt(0) || 'U'),
                        React.createElement('div', {
                            key: 'details'
                        }, [
                            React.createElement('p', {
                                key: 'name',
                                className: 'text-white font-medium'
                            }, user.nom),
                            React.createElement('p', {
                                key: 'specialty',
                                className: 'text-gray-400 text-xs'
                            }, user.specialite)
                        ])
                    ]),
                    React.createElement(Button, {
                        key: 'logout',
                        variant: 'danger',
                        size: 'sm',
                        onClick: handleLogout,
                        className: 'w-full'
                    }, [
                        React.createElement(Icon, {
                            key: 'icon',
                            name: 'close',
                            className: 'mr-2',
                            size: 16
                        }),
                        'Déconnexion'
                    ])
                ]),

                // Google Drive section
                React.createElement('div', {
                    key: 'gdrive-section',
                    className: 'bg-gray-900 rounded-lg p-3'
                }, [
                    React.createElement('h4', {
                        key: 'title',
                        className: 'text-blue-400 font-medium text-sm mb-2'
                    }, '☁️ Synchronisation'),
                    React.createElement('div', {
                        key: 'button-container',
                        className: 'w-full'
                    }, React.createElement(GoogleDriveButton, {
                        googleDrive,
                        forceSync,
                        notifications
                    }))
                ]),

                // Actions section
                React.createElement('div', {
                    key: 'actions-section',
                    className: 'bg-gray-900 rounded-lg p-3'
                }, [
                    React.createElement('h4', {
                        key: 'title',
                        className: 'text-blue-400 font-medium text-sm mb-2'
                    }, '⚙️ Actions'),
                    React.createElement('div', {
                        key: 'buttons',
                        className: 'space-y-2'
                    }, [
                        React.createElement(Button, {
                            key: 'new-job',
                            variant: 'primary',
                            size: 'sm',
                            onClick: closeMobileMenu,
                            className: 'w-full'
                        }, [
                            React.createElement(Icon, {
                                key: 'icon',
                                name: 'plus',
                                className: 'mr-2',
                                size: 16
                            }),
                            'Nouveau Projet'
                        ]),
                        React.createElement(Button, {
                            key: 'calendar',
                            variant: 'outline',
                            size: 'sm',
                            onClick: closeMobileMenu,
                            className: 'w-full text-gray-300 border-gray-600 hover:bg-gray-700'
                        }, [
                            React.createElement(Icon, {
                                key: 'icon',
                                name: 'calendar',
                                className: 'mr-2',
                                size: 16
                            }),
                            'Calendrier'
                        ])
                    ])
                ])
            ])
        ])
    ]);
};