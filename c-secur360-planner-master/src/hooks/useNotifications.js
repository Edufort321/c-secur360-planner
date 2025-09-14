// ============== HOOK NOTIFICATIONS ==============
// Hook pour gérer le système de notifications toast

import { useState, useCallback } from 'react';
import { NOTIFICATION_CONFIG } from '../../config/constants.js';

export function useNotifications() {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random();
        const notification = {
            id,
            message,
            type,
            timestamp: new Date()
        };

        setNotifications(prev => {
            const newNotifications = [...prev, notification];
            // Limiter le nombre de notifications
            if (newNotifications.length > NOTIFICATION_CONFIG.MAX_NOTIFICATIONS) {
                return newNotifications.slice(-NOTIFICATION_CONFIG.MAX_NOTIFICATIONS);
            }
            return newNotifications;
        });

        // Auto-suppression après délai configuré
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, NOTIFICATION_CONFIG.DURATION);

        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    // Méthodes de convenance pour les différents types
    const success = useCallback((message) => addNotification(message, 'success'), [addNotification]);
    const error = useCallback((message) => addNotification(message, 'error'), [addNotification]);
    const warning = useCallback((message) => addNotification(message, 'warning'), [addNotification]);
    const info = useCallback((message) => addNotification(message, 'info'), [addNotification]);

    return {
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
        success,
        error,
        warning,
        info
    };
}