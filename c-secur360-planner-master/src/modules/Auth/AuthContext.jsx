// ============== AUTH CONTEXT ==============
// Contexte d'authentification principal

import React, { createContext, useContext, useState, useCallback } from 'react';
import { DEFAULT_PERSONNEL, ADMIN_CONFIG } from '../../../config/constants.js';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [adminSession, setAdminSession] = useState(null);
    const [loading, setLoading] = useState(false);

    // Authentification utilisateur standard
    const login = useCallback((nom, password) => {
        setLoading(true);

        const user = DEFAULT_PERSONNEL.find(p =>
            p.nom === nom && p.password === password
        );

        setTimeout(() => {
            if (user) {
                setCurrentUser(user);
                setLoading(false);
                return { success: true, user };
            } else {
                setLoading(false);
                return { success: false, error: 'Nom d\'utilisateur ou mot de passe incorrect' };
            }
        }, 500);
    }, []);

    // Authentification administrateur
    const loginAdmin = useCallback((password) => {
        setLoading(true);

        setTimeout(() => {
            if (password === ADMIN_CONFIG.PASSWORD) {
                const session = {
                    timestamp: Date.now(),
                    expires: Date.now() + ADMIN_CONFIG.SESSION_TIMEOUT
                };
                setAdminSession(session);
                setIsAdminMode(true);
                setLoading(false);
                return { success: true };
            } else {
                setLoading(false);
                return { success: false, error: 'Mot de passe administrateur incorrect' };
            }
        }, 500);
    }, []);

    // Vérification de session admin
    const checkAdminSession = useCallback(() => {
        if (!adminSession) return false;

        const now = Date.now();
        if (now > adminSession.expires) {
            setAdminSession(null);
            setIsAdminMode(false);
            return false;
        }

        return true;
    }, [adminSession]);

    // Déconnexion standard
    const logout = useCallback(() => {
        setCurrentUser(null);
        setAdminSession(null);
        setIsAdminMode(false);
    }, []);

    // Déconnexion admin uniquement
    const logoutAdmin = useCallback(() => {
        setAdminSession(null);
        setIsAdminMode(false);
    }, []);

    // Vérifier les permissions
    const hasPermission = useCallback((action) => {
        if (!currentUser) return false;

        switch (action) {
            case 'modify':
                return currentUser.canModify || false;
            case 'coordinate':
                return currentUser.isCoordinator || false;
            case 'admin':
                return isAdminMode && checkAdminSession();
            default:
                return true;
        }
    }, [currentUser, isAdminMode, checkAdminSession]);

    // Obtenir les informations utilisateur enrichies
    const getUserInfo = useCallback(() => {
        if (!currentUser) return null;

        return {
            ...currentUser,
            isAdmin: isAdminMode && checkAdminSession(),
            permissions: {
                canModify: hasPermission('modify'),
                canCoordinate: hasPermission('coordinate'),
                isAdmin: hasPermission('admin')
            }
        };
    }, [currentUser, isAdminMode, hasPermission, checkAdminSession]);

    const value = {
        // États
        currentUser,
        isAdminMode,
        loading,
        isAuthenticated: !!currentUser,
        isAdmin: isAdminMode && checkAdminSession(),

        // Actions
        login,
        loginAdmin,
        logout,
        logoutAdmin,

        // Utilitaires
        hasPermission,
        getUserInfo,
        checkAdminSession
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;