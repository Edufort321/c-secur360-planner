/**
 * Hook de gestion des notifications
 * EXTRAIT DE LA VERSION COMPLÈTE B3hoWdZQh
 * Système de notifications toast avec auto-dismiss
 */

const { useState, useCallback } = React;

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((message, type = 'success') => {
        const id = Date.now();
        const notification = { id, message, type };
        setNotifications(prev => [...prev, notification]);

        // Auto-dismiss après 5 secondes
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);

        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    return {
        notifications,
        addNotification,
        removeNotification,
        clearNotifications
    };
};