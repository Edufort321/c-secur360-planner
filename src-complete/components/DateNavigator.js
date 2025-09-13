/**
 * Composant navigateur de date
 * EXTRAIT DE LA VERSION COMPLÈTE B3hoWdZQh
 * Sélecteur d'année et de mois pour navigation rapide
 */

import { Icon } from './UI/Icon.js';

const { useState } = React;

export const DateNavigator = ({ currentDate, onDateChange, onClose }) => {
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());

    const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);

    const handleGoToDate = () => {
        const newDate = new Date(selectedYear, selectedMonth, 1);
        onDateChange(newDate);
        onClose();
    };

    return React.createElement('div', { className: "bg-white border rounded-lg shadow-lg p-4 w-72" },
        React.createElement('div', { className: "flex items-center justify-between mb-4" },
            React.createElement('h3', { className: "font-semibold" }, "Aller à une date"),
            React.createElement('button', {
                onClick: onClose,
                className: "p-1 hover:bg-gray-100 rounded"
            }, React.createElement(Icon, { name: 'x', size: 16 }))
        ),

        React.createElement('div', { className: "space-y-4" },
            React.createElement('div', null,
                React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Année"),
                React.createElement('select', {
                    value: selectedYear,
                    onChange: (e) => setSelectedYear(parseInt(e.target.value)),
                    className: "w-full p-2 border rounded-lg"
                },
                    ...years.map(year => 
                        React.createElement('option', { key: year, value: year }, year)
                    )
                )
            ),

            React.createElement('div', null,
                React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Mois"),
                React.createElement('div', { className: "grid grid-cols-3 gap-2" },
                    ...months.map((month, index) => 
                        React.createElement('button', {
                            key: index,
                            onClick: () => setSelectedMonth(index),
                            className: `p-2 text-sm border rounded-lg transition-colors ${
                                selectedMonth === index ? 
                                'bg-blue-500 text-white border-blue-500' : 
                                'hover:bg-gray-50'
                            }`
                        }, month.substr(0, 3))
                    )
                )
            ),

            React.createElement('div', { className: "flex gap-2 pt-2" },
                React.createElement('button', {
                    onClick: onClose,
                    className: "flex-1 px-3 py-2 border rounded-lg hover:bg-gray-50"
                }, "Annuler"),
                React.createElement('button', {
                    onClick: handleGoToDate,
                    className: "flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                }, "Aller")
            )
        )
    );
};