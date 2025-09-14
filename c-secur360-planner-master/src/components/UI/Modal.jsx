// ============== COMPOSANT MODAL ==============
// Composant modal de base réutilisable

import React, { useEffect } from 'react';
import { Icon } from './Icon.jsx';

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
    closeOnBackdrop = true,
    closeOnEscape = true,
    className = '',
    ...props
}) {
    // Gestion de l'échappement
    useEffect(() => {
        if (!isOpen || !closeOnEscape) return;

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, closeOnEscape, onClose]);

    // Prévenir le scroll du body quand le modal est ouvert
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Classes pour les différentes tailles
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-full mx-4'
    };

    const handleBackdropClick = (e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto"
            onClick={handleBackdropClick}
            {...props}
        >
            {/* Backdrop */}
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

                {/* Spacer pour centrer verticalement */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
                    &#8203;
                </span>

                {/* Contenu du modal */}
                <div
                    className={`
                        inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all
                        sm:my-8 sm:align-middle w-full ${sizeClasses[size]} ${className}
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    {(title || showCloseButton) && (
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                {title && (
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        {title}
                                    </h3>
                                )}
                                {showCloseButton && (
                                    <button
                                        onClick={onClose}
                                        className="
                                            text-gray-400 hover:text-gray-600 transition-colors
                                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                            rounded-md p-1
                                        "
                                        aria-label="Fermer"
                                    >
                                        <Icon name="x" size={20} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Contenu */}
                    <div className="bg-white">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Composants auxiliaires pour une meilleure organisation
export function ModalHeader({ children, className = '' }) {
    return (
        <div className={`px-4 py-5 sm:px-6 ${className}`}>
            {children}
        </div>
    );
}

export function ModalBody({ children, className = '' }) {
    return (
        <div className={`px-4 py-5 sm:p-6 ${className}`}>
            {children}
        </div>
    );
}

export function ModalFooter({ children, className = '' }) {
    return (
        <div className={`bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200 ${className}`}>
            {children}
        </div>
    );
}

export default Modal;