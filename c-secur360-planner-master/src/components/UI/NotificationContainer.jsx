// ============== COMPOSANT NOTIFICATION CONTAINER ==============
// Conteneur pour afficher les notifications toast

import React from 'react';
import { Icon } from './Icon.jsx';
import { NOTIFICATION_CONFIG } from '../../../config/constants.js';

function NotificationItem({ notification, onClose }) {
    const config = NOTIFICATION_CONFIG.TYPES[notification.type] || NOTIFICATION_CONFIG.TYPES.info;

    return (
        <div
            className={`
                relative w-full max-w-sm mx-auto bg-white shadow-lg rounded-lg pointer-events-auto
                ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out
                ${notification.isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
            `}
        >
            {/* Barre de couleur */}
            <div
                className="absolute top-0 left-0 w-1 h-full"
                style={{ backgroundColor: config.color }}
            />

            <div className="p-4">
                <div className="flex items-start">
                    {/* Icône */}
                    <div className="flex-shrink-0">
                        <span
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-medium"
                            style={{ backgroundColor: config.color }}
                        >
                            {config.icon}
                        </span>
                    </div>

                    {/* Contenu */}
                    <div className="ml-3 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                            {notification.message}
                        </p>
                        {notification.timestamp && (
                            <p className="mt-1 text-xs text-gray-500">
                                {new Date(notification.timestamp).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        )}
                    </div>

                    {/* Bouton fermer */}
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            className="
                                bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500
                                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                            "
                            onClick={() => onClose(notification.id)}
                        >
                            <span className="sr-only">Fermer</span>
                            <Icon name="x" size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function NotificationContainer({ notifications, onRemoveNotification }) {
    if (!notifications || notifications.length === 0) {
        return null;
    }

    return (
        <div
            aria-live="assertive"
            className="
                fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end
                z-50
            "
        >
            <div className="w-full flex flex-col items-center space-y-4 sm:items-end max-h-screen overflow-hidden">
                {notifications.map((notification) => (
                    <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onClose={onRemoveNotification}
                    />
                ))}
            </div>
        </div>
    );
}

export default NotificationContainer;