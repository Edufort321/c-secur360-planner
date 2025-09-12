/**
 * Hook de gestion des notifications utilisateur
 * Toast notifications avec différents types
 */

const { useState, useCallback } = React;

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now() + Math.random();
        const notification = {
            id,
            message,
            type, // success, error, warning, info
            createdAt: new Date(),
            duration
        };

        setNotifications(prev => [...prev, notification]);

        // Auto-remove après la durée spécifiée
        if (duration > 0) {
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const addSuccess = useCallback((message, duration = 3000) => {
        return addNotification(message, 'success', duration);
    }, [addNotification]);

    const addError = useCallback((message, duration = 5000) => {
        return addNotification(message, 'error', duration);
    }, [addNotification]);

    const addWarning = useCallback((message, duration = 4000) => {
        return addNotification(message, 'warning', duration);
    }, [addNotification]);

    const addInfo = useCallback((message, duration = 3000) => {
        return addNotification(message, 'info', duration);
    }, [addNotification]);

    return {
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
        addSuccess,
        addError,
        addWarning,
        addInfo
    };
};