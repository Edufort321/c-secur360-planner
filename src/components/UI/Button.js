/**
 * Composant Button - Boutons réutilisables avec variants
 * Système de design cohérent
 */

const { React } = window;
import { Icon } from './Icon.js';

export const Button = ({ 
    children, 
    variant = 'primary', 
    size = 'md',
    icon,
    iconPosition = 'left',
    disabled = false,
    loading = false,
    className = '',
    onClick,
    type = 'button',
    ...props 
}) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
        secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
        success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
        danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
        warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500',
        outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-gray-500',
        ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
        link: 'text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline focus:ring-blue-500'
    };
    
    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
        xl: 'px-8 py-4 text-lg'
    };
    
    const disabledClasses = 'opacity-50 cursor-not-allowed pointer-events-none';
    const loadingClasses = 'cursor-wait';
    
    const classes = [
        baseClasses,
        variants[variant] || variants.primary,
        sizes[size],
        disabled && disabledClasses,
        loading && loadingClasses,
        className
    ].filter(Boolean).join(' ');
    
    const handleClick = (e) => {
        if (disabled || loading) {
            e.preventDefault();
            return;
        }
        onClick?.(e);
    };
    
    const renderIcon = (position) => {
        if (!icon || loading) return null;
        
        const iconMargin = position === 'left' ? 'mr-2' : 'ml-2';
        
        if (typeof icon === 'string') {
            return React.createElement(Icon, {
                name: icon,
                size: size === 'sm' ? 16 : size === 'lg' ? 20 : size === 'xl' ? 24 : 18,
                className: iconMargin
            });
        }
        
        return React.createElement('span', { className: iconMargin }, icon);
    };
    
    const renderLoading = () => {
        if (!loading) return null;
        
        return React.createElement('div', {
            className: 'mr-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin'
        });
    };
    
    return React.createElement('button', {
        type,
        className: classes,
        onClick: handleClick,
        disabled: disabled || loading,
        ...props
    }, [
        renderLoading(),
        iconPosition === 'left' && renderIcon('left'),
        children,
        iconPosition === 'right' && renderIcon('right')
    ].filter(Boolean));
};