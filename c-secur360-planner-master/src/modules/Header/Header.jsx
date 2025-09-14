// ============== HEADER COMPONENT ==============
// Header principal de l'application

import React, { useState } from 'react';
import { Icon } from '../../components/UI/Icon.jsx';
import { useAuth } from '../Auth/AuthContext.jsx';
import { LoginModal } from '../Auth/LoginModal.jsx';
import { AdminAuthModal } from '../Auth/AdminAuthModal.jsx';
import { getBureauOptions } from '../../utils/bureauUtils.js';

export function Header({
    selectedView,
    onViewChange,
    selectedBureau,
    onBureauChange,
    onAdminAccess
}) {
    const { currentUser, isAuthenticated, isAdmin, logout, logoutAdmin } = useAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const bureauOptions = getBureauOptions();

    const handleAdminAuth = () => {
        setShowAdminModal(true);
    };

    const handleAdminSuccess = () => {
        onAdminAccess?.();
    };

    const handleLogout = () => {
        logout();
        setShowUserMenu(false);
    };

    const handleLogoutAdmin = () => {
        logoutAdmin();
        setShowUserMenu(false);
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    {/* Logo et titre */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <img
                                className="h-8 w-auto"
                                src="/assets/images/logo.png"
                                alt="C-Secur360"
                                onError={(e) => {
                                    // Fallback si le logo n'est pas trouvé
                                    e.target.style.display = 'none';
                                }}
                            />
                            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                CS
                            </div>
                        </div>
                        <div className="ml-4">
                            <h1 className="text-xl font-bold text-gray-900">
                                Planificateur C-Secur360
                            </h1>
                            <p className="text-sm text-gray-500">
                                Version 6.7 - Gestion d'équipes et projets
                            </p>
                        </div>
                    </div>

                    {/* Contrôles centraux */}
                    <div className="flex items-center space-x-4">
                        {/* Sélecteur de vue */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => onViewChange?.('month')}
                                className={`
                                    px-3 py-1 text-sm font-medium rounded-md transition-colors
                                    ${selectedView === 'month'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }
                                `}
                            >
                                <Icon name="calendar" size={16} className="inline mr-1" />
                                Mois
                            </button>
                            <button
                                onClick={() => onViewChange?.('week')}
                                className={`
                                    px-3 py-1 text-sm font-medium rounded-md transition-colors
                                    ${selectedView === 'week'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }
                                `}
                            >
                                <Icon name="arrow_forward" size={16} className="inline mr-1" />
                                Semaine
                            </button>
                        </div>

                        {/* Filtre bureau */}
                        {bureauOptions.length > 0 && (
                            <select
                                value={selectedBureau || 'all'}
                                onChange={(e) => onBureauChange?.(e.target.value === 'all' ? null : e.target.value)}
                                className="
                                    block px-3 py-2 border border-gray-300 rounded-md text-sm
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                "
                            >
                                <option value="all">Tous les bureaux</option>
                                {bureauOptions.map(bureau => (
                                    <option key={bureau.value} value={bureau.value}>
                                        {bureau.label}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Actions utilisateur */}
                    <div className="flex items-center space-x-3">
                        {!isAuthenticated ? (
                            <button
                                onClick={() => setShowLoginModal(true)}
                                className="
                                    inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md
                                    text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2
                                    focus:ring-offset-2 focus:ring-blue-500
                                "
                            >
                                <Icon name="user" size={16} className="mr-2" />
                                Se connecter
                            </button>
                        ) : (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="
                                        flex items-center text-sm rounded-full focus:outline-none
                                        focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                                    "
                                >
                                    <div className="flex items-center space-x-2">
                                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-blue-600 font-medium text-sm">
                                                {currentUser.nom.split(' ').map(n => n[0]).join('')}
                                            </span>
                                        </div>
                                        <div className="hidden md:block text-left">
                                            <p className="text-sm font-medium text-gray-700">
                                                {currentUser.nom}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {currentUser.succursale}
                                            </p>
                                        </div>
                                        <Icon name="expand_more" size={16} className="text-gray-400" />
                                    </div>
                                </button>

                                {/* Menu utilisateur */}
                                {showUserMenu && (
                                    <div className="
                                        absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5
                                        focus:outline-none z-50
                                    ">
                                        <div className="py-1">
                                            {/* Info utilisateur */}
                                            <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                                                <p className="font-medium">{currentUser.nom}</p>
                                                <p className="text-gray-500">{currentUser.succursale}</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {currentUser.canModify && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                                                            Modification
                                                        </span>
                                                    )}
                                                    {currentUser.isCoordinator && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                                                            Coordinateur
                                                        </span>
                                                    )}
                                                    {isAdmin && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            {!isAdmin && (
                                                <button
                                                    onClick={handleAdminAuth}
                                                    className="
                                                        block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100
                                                        flex items-center
                                                    "
                                                >
                                                    <Icon name="settings" size={16} className="mr-2" />
                                                    Mode Administrateur
                                                </button>
                                            )}

                                            {isAdmin && (
                                                <button
                                                    onClick={handleLogoutAdmin}
                                                    className="
                                                        block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100
                                                        flex items-center
                                                    "
                                                >
                                                    <Icon name="visibility_off" size={16} className="mr-2" />
                                                    Quitter mode Admin
                                                </button>
                                            )}

                                            <button
                                                onClick={handleLogout}
                                                className="
                                                    block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100
                                                    flex items-center border-t border-gray-100
                                                "
                                            >
                                                <Icon name="arrow_back" size={16} className="mr-2" />
                                                Se déconnecter
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
            />

            <AdminAuthModal
                isOpen={showAdminModal}
                onClose={() => setShowAdminModal(false)}
                onSuccess={handleAdminSuccess}
            />
        </header>
    );
}

export default Header;