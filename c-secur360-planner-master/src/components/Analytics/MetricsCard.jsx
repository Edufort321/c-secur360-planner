// ============== CARTE DE MÉTRIQUES ==============
// Composant pour afficher des métriques avec indicateurs visuels

import React from 'react';
import { Icon } from '../UI/Icon';

export function MetricsCard({
    title,
    value,
    unit = '',
    trend = null,
    icon = 'barChart',
    color = 'blue',
    subtitle = null,
    children = null
}) {
    const colorClasses = {
        blue: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-600',
            value: 'text-blue-900',
            icon: 'text-blue-500'
        },
        green: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-600',
            value: 'text-green-900',
            icon: 'text-green-500'
        },
        yellow: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            text: 'text-yellow-600',
            value: 'text-yellow-900',
            icon: 'text-yellow-500'
        },
        red: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-600',
            value: 'text-red-900',
            icon: 'text-red-500'
        },
        purple: {
            bg: 'bg-purple-50',
            border: 'border-purple-200',
            text: 'text-purple-600',
            value: 'text-purple-900',
            icon: 'text-purple-500'
        }
    };

    const classes = colorClasses[color] || colorClasses.blue;

    return (
        <div className={`${classes.bg} ${classes.border} border rounded-lg p-6 transition-all hover:shadow-md`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                    <p className={`text-sm font-medium ${classes.text}`}>{title}</p>
                    <div className="flex items-baseline gap-2">
                        <p className={`text-3xl font-bold ${classes.value}`}>
                            {typeof value === 'number' ? value.toLocaleString() : value}
                            {unit && <span className="text-lg">{unit}</span>}
                        </p>
                        {trend && (
                            <div className={`flex items-center text-sm ${
                                trend.direction === 'up' ? 'text-green-600' :
                                trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                                <Icon
                                    name={trend.direction === 'up' ? 'chevronUp' :
                                          trend.direction === 'down' ? 'chevronDown' : 'chevronRight'}
                                    size={14}
                                />
                                <span>{trend.value}%</span>
                            </div>
                        )}
                    </div>
                    {subtitle && (
                        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                    )}
                </div>
                <div className={`text-3xl ${classes.icon}`}>
                    <Icon name={icon} size={32} />
                </div>
            </div>
            {children}
        </div>
    );
}