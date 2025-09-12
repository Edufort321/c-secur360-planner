/**
 * Composant NotificationContainer - Affichage des notifications toast
 * Positionnement fixe et animations
 */

const { React } = window;
import { Icon } from '../UI/Icon.js';

export const NotificationContainer = ({ notifications = [], removeNotification }) => {
    if (notifications.length === 0) return null;

    const getIconName = (type) => {
        switch (type) {
            case 'success': return 'check';
            case 'error': return 'alert-circle';
            case 'warning': return 'alert-circle';
            case 'info': return 'info';
            default: return 'info';
        }
    };

    const getTypeClasses = (type) => {
        switch (type) {
            case 'success': 
                return 'bg-green-50 border-green-200 text-green-800';
            case 'error': 
                return 'bg-red-50 border-red-200 text-red-800';
            case 'warning': 
                return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            case 'info': 
                return 'bg-blue-50 border-blue-200 text-blue-800';
            default: 
                return 'bg-gray-50 border-gray-200 text-gray-800';
        }
    };

    return React.createElement('div', {
        className: 'fixed top-4 right-4 z-50 space-y-2',
        style: { pointerEvents: 'none' }
    }, notifications.map((notification) => 
        React.createElement('div', {
            key: notification.id,
            className: `max-w-sm w-full shadow-lg rounded-lg border p-4 transition-all duration-300 transform translate-x-0 ${getTypeClasses(notification.type)}`,
            style: { 
                pointerEvents: 'auto',
                animation: 'slideInRight 0.3s ease-out'
            }
        }, [
            React.createElement('div', {
                key: 'content',
                className: 'flex items-start'
            }, [
                React.createElement('div', {
                    key: 'icon',
                    className: 'flex-shrink-0'
                }, React.createElement(Icon, {
                    name: getIconName(notification.type),
                    size: 20,
                    className: 'mt-0.5'
                })),

                React.createElement('div', {
                    key: 'message',
                    className: 'ml-3 flex-1'
                }, React.createElement('p', {
                    className: 'text-sm font-medium'
                }, notification.message)),

                React.createElement('button', {
                    key: 'close',
                    onClick: () => removeNotification(notification.id),
                    className: 'ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none'
                }, React.createElement(Icon, {
                    name: 'close',
                    size: 16
                }))
            ])
        ])
    )).concat([
        // Styles CSS injectés
        React.createElement('style', {
            key: 'notification-styles'
        }, `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `)
    ]);
};