// ============== LOGO C-SECUR360 ==============
// Logo officiel de C-Secur360

import React from 'react';

export function Logo({ size = 'normal', className = '', showText = true }) {
    const sizeClasses = {
        small: 'w-8 h-8',
        normal: 'w-12 h-12',
        large: 'w-16 h-16',
        xl: 'w-20 h-20'
    };

    const textSizes = {
        small: 'text-sm',
        normal: 'text-lg',
        large: 'text-xl',
        xl: 'text-2xl'
    };

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* Logo C-Secur360 */}
            <img
                src="/assets/images/logo.png"
                alt="C-Secur360 Logo"
                className={`${sizeClasses[size]} object-contain`}
            />

            {/* Texte du logo */}
            {showText && (
                <div className="flex flex-col">
                    <div className={`font-bold text-gray-300 ${textSizes[size]} leading-tight`} style={{
                        textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                        background: 'linear-gradient(135deg, #e5e7eb, #9ca3af, #6b7280)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        C-Secur360
                    </div>
                    <div className="text-xs text-gray-400 font-medium tracking-wide" style={{
                        textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                        background: 'linear-gradient(135deg, #d1d5db, #9ca3af)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        PLANIFICATEUR
                    </div>
                </div>
            )}
        </div>
    );
}

// Version simple pour petits espaces
export function LogoIcon({ size = 'normal', className = '' }) {
    const sizeClasses = {
        small: 'w-6 h-6',
        normal: 'w-8 h-8',
        large: 'w-10 h-10'
    };

    return (
        <img
            src="/assets/images/logo.png"
            alt="C-Secur360"
            className={`${sizeClasses[size]} object-contain ${className}`}
        />
    );
}