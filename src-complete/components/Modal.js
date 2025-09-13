/**
 * Composant Modal réutilisable
 * EXTRAIT DE LA VERSION COMPLÈTE B3hoWdZQh
 * Modal avec gestion des tailles et fermeture
 */

import { Icon } from './UI/Icon.js';

export const Modal = ({ isOpen, onClose, title, children, size = "lg" }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: "max-w-md",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        full: "max-w-full mx-4"
    };

    return React.createElement('div', {
        className: "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4",
        onClick: onClose
    },
        React.createElement('div', {
            className: `bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden`,
            onClick: (e) => e.stopPropagation()
        },
            React.createElement('div', { className: "flex items-center justify-between p-4 border-b" },
                React.createElement('h2', { className: "text-xl font-semibold" }, title),
                React.createElement('button', {
                    onClick: onClose,
                    className: "p-2 hover:bg-gray-100 rounded-lg"
                }, React.createElement(Icon, { name: 'x', size: 20 }))
            ),
            React.createElement('div', { className: "overflow-y-auto max-h-[calc(90vh-80px)]" }, children)
        )
    );
};