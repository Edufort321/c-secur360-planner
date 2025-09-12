/**
 * Composant Modal - Modales réutilisables
 * Gestion du focus et des touches d'échappement
 */

const { React, useState, useEffect, useRef } = window;
import { Icon } from './Icon.js';
import { Button } from './Button.js';

export const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    closable = true,
    className = '',
    overlayClassName = ''
}) => {
    const modalRef = useRef();
    const previousFocusRef = useRef();
    
    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-full mx-4'
    };
    
    // Gestion du focus
    useEffect(() => {
        if (isOpen) {
            previousFocusRef.current = document.activeElement;
            modalRef.current?.focus();
        } else {
            previousFocusRef.current?.focus();
        }
    }, [isOpen]);
    
    // Gestion de l'échappement
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen && closable) {
                onClose();
            }
        };
        
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, closable, onClose]);
    
    // Empêcher le scroll du body
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
    
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && closable) {
            onClose();
        }
    };
    
    return React.createElement('div', {
        className: `fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayClassName}`,
        onClick: handleOverlayClick
    }, [
        // Overlay
        React.createElement('div', {
            key: 'overlay',
            className: 'absolute inset-0 bg-black bg-opacity-50 transition-opacity',
            'aria-hidden': 'true'
        }),
        
        // Modal
        React.createElement('div', {
            key: 'modal',
            ref: modalRef,
            className: `relative bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden ${sizes[size]} ${className}`,
            tabIndex: -1,
            role: 'dialog',
            'aria-modal': 'true',
            'aria-labelledby': title ? 'modal-title' : undefined
        }, [
            // Header
            (title || closable) && React.createElement('div', {
                key: 'header',
                className: 'flex items-center justify-between p-6 border-b border-gray-200'
            }, [
                title && React.createElement('h3', {
                    key: 'title',
                    id: 'modal-title',
                    className: 'text-lg font-semibold text-gray-900'
                }, title),
                
                closable && React.createElement(Button, {
                    key: 'close',
                    variant: 'ghost',
                    size: 'sm',
                    onClick: onClose,
                    className: 'text-gray-400 hover:text-gray-600',
                    'aria-label': 'Fermer'
                }, React.createElement(Icon, { name: 'close', size: 20 }))
            ]),
            
            // Content
            React.createElement('div', {
                key: 'content',
                className: 'p-6 overflow-y-auto max-h-[calc(90vh-120px)]'
            }, children),
            
            // Footer
            footer && React.createElement('div', {
                key: 'footer',
                className: 'flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50'
            }, footer)
        ])
    ]);
};

// Composant ConfirmModal pour les confirmations
export const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirmation',
    message,
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    variant = 'danger'
}) => {
    return React.createElement(Modal, {
        isOpen,
        onClose,
        title,
        size: 'sm',
        footer: [
            React.createElement(Button, {
                key: 'cancel',
                variant: 'outline',
                onClick: onClose
            }, cancelText),
            React.createElement(Button, {
                key: 'confirm',
                variant,
                onClick: () => {
                    onConfirm();
                    onClose();
                }
            }, confirmText)
        ]
    }, React.createElement('p', { className: 'text-gray-600' }, message));
};