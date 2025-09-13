/**
 * Conteneur de notifications toast
 * EXTRAIT DE LA VERSION COMPLÈTE B3hoWdZQh
 * Affichage des notifications dans le coin supérieur droit
 */

import { Icon } from './UI/Icon.js';

export const NotificationContainer = ({ notifications }) => {
    return React.createElement('div', { 
        className: "fixed top-4 right-4 z-50 space-y-2" 
    },
        ...notifications.map(notification => 
            React.createElement('div', {
                key: notification.id,
                className: `notification px-4 py-3 rounded-lg shadow-lg max-w-sm ${
                    notification.type === 'success' ? 'bg-green-500 text-white' :
                    notification.type === 'error' ? 'bg-red-500 text-white' :
                    'bg-blue-500 text-white'
                }`
            },
                React.createElement('div', { className: "flex items-center gap-2" },
                    React.createElement(Icon, { 
                        name: notification.type === 'success' ? 'check' : 
                             notification.type === 'error' ? 'x' : 'info', 
                        size: 16 
                    }),
                    React.createElement('span', { className: "text-sm" }, notification.message)
                )
            )
        )
    );
};