// ============== COMPOSANT DE TEST DES TRADUCTIONS DE DATES ==============
// Composant pour tester et valider les traductions de dates

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import {
    formatLocalizedDate,
    getLocalizedDayName,
    getLocalizedMonthName,
    localizedDateString,
    generateLocalizedDays
} from '../../utils/localizedDateUtils.js';

export function DateTranslationTest() {
    const { t, currentLanguage, changeLanguage } = useLanguage();

    const testDate = new Date(2024, 0, 15); // 15 janvier 2024 (lundi)
    const testDays = generateLocalizedDays(testDate, 7, currentLanguage);

    return (
        <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    🌐 Test des Traductions de Dates
                </h2>

                {/* Sélecteur de langue */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => changeLanguage('fr')}
                        className={`px-4 py-2 rounded-lg font-medium ${
                            currentLanguage === 'fr'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        🇫🇷 Français
                    </button>
                    <button
                        onClick={() => changeLanguage('en')}
                        className={`px-4 py-2 rounded-lg font-medium ${
                            currentLanguage === 'en'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        🇺🇸 English
                    </button>
                </div>

                <div className="text-sm text-gray-600 mb-4">
                    Langue actuelle: <strong>{currentLanguage === 'fr' ? 'Français' : 'English'}</strong>
                </div>
            </div>

            {/* Tests de formatage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-bold text-lg mb-3 text-gray-800">
                        📅 Formatage des Dates
                    </h3>
                    <div className="space-y-2 text-sm">
                        <div>
                            <strong>Date complète:</strong><br />
                            {formatLocalizedDate(testDate, currentLanguage, 'full')}
                        </div>
                        <div>
                            <strong>Format long:</strong><br />
                            {formatLocalizedDate(testDate, currentLanguage, 'long')}
                        </div>
                        <div>
                            <strong>Format court:</strong><br />
                            {formatLocalizedDate(testDate, currentLanguage, 'short')}
                        </div>
                        <div>
                            <strong>Jour + Mois:</strong><br />
                            {formatLocalizedDate(testDate, currentLanguage, 'dayMonth')}
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-bold text-lg mb-3 text-gray-800">
                        📝 Composants de Date
                    </h3>
                    <div className="space-y-2 text-sm">
                        <div>
                            <strong>Jour (court):</strong><br />
                            {getLocalizedDayName(testDate, currentLanguage, true)}
                        </div>
                        <div>
                            <strong>Jour (complet):</strong><br />
                            {getLocalizedDayName(testDate, currentLanguage, false)}
                        </div>
                        <div>
                            <strong>Mois (court):</strong><br />
                            {getLocalizedMonthName(testDate, currentLanguage, true)}
                        </div>
                        <div>
                            <strong>Mois (complet):</strong><br />
                            {getLocalizedMonthName(testDate, currentLanguage, false)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Simulation du calendrier */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-bold text-lg mb-4 text-gray-800">
                    📆 Simulation Calendrier (semaine du 15 janvier 2024)
                </h3>

                <div className="grid grid-cols-7 gap-2">
                    {testDays.map((day, index) => (
                        <div
                            key={index}
                            className={`p-3 text-center rounded-lg border-2 ${
                                day.isWeekend
                                    ? 'bg-red-100 border-red-200 text-red-800'
                                    : 'bg-blue-100 border-blue-200 text-blue-800'
                            }`}
                        >
                            <div className="font-semibold text-xs">
                                {day.displayShort}
                            </div>
                            <div className="text-lg font-bold">
                                {day.dayNumber}
                            </div>
                            <div className="text-xs text-gray-600">
                                {day.monthName}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Test d'options compatibles */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-3 text-gray-800">
                    🔧 Compatibilité toLocaleDateString
                </h3>
                <div className="space-y-2 text-sm">
                    <div>
                        <strong>Avec weekday 'long':</strong><br />
                        {localizedDateString(testDate, currentLanguage, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div>
                        <strong>Avec weekday 'short':</strong><br />
                        {localizedDateString(testDate, currentLanguage, { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    <div>
                        <strong>Mois et année seulement:</strong><br />
                        {localizedDateString(testDate, currentLanguage, { month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Traductions du contexte */}
            <div className="bg-green-50 p-4 rounded-lg mt-6">
                <h3 className="font-bold text-lg mb-3 text-green-800">
                    🌍 Traductions du Contexte
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <strong>{t('calendar.today')}:</strong> calendar.today
                    </div>
                    <div>
                        <strong>{t('calendar.week')}:</strong> calendar.week
                    </div>
                    <div>
                        <strong>{t('calendar.month')}:</strong> calendar.month
                    </div>
                    <div>
                        <strong>{t('calendar.fullDate')}:</strong> calendar.fullDate
                    </div>
                </div>
            </div>
        </div>
    );
}