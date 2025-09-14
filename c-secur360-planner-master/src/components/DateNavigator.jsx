import { useState } from 'react';
import { Icon } from './UI/Icon';

export function DateNavigator({ selectedDate, onDateChange, selectedView, onViewChange }) {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const formatDate = (date, view) => {
        const options = {
            year: 'numeric',
            month: 'long',
            ...(view === 'week' ? { day: 'numeric' } : {})
        };
        return date.toLocaleDateString('fr-FR', options);
    };

    const navigateDate = (direction) => {
        const newDate = new Date(selectedDate);

        if (selectedView === 'month') {
            newDate.setMonth(newDate.getMonth() + direction);
        } else {
            newDate.setDate(newDate.getDate() + (direction * 7));
        }

        onDateChange(newDate);
    };

    const goToToday = () => {
        onDateChange(new Date());
        setIsCalendarOpen(false);
    };

    const handleCalendarClick = (day) => {
        const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
        onDateChange(newDate);
        setIsCalendarOpen(false);
    };

    const generateCalendar = () => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(firstDay.getDate() - firstDay.getDay());

        const days = [];
        const current = new Date(startDate);

        for (let i = 0; i < 42; i++) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        return days;
    };

    const calendarDays = generateCalendar();
    const today = new Date();

    return (
        <div className="flex items-center space-x-4">
            {/* Navigation précédent/suivant */}
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => navigateDate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={selectedView === 'month' ? 'Mois précédent' : 'Semaine précédente'}
                >
                    <Icon name="chevron-left" size={20} />
                </button>

                <button
                    onClick={() => navigateDate(1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={selectedView === 'month' ? 'Mois suivant' : 'Semaine suivante'}
                >
                    <Icon name="chevron-right" size={20} />
                </button>
            </div>

            {/* Affichage de la date actuelle */}
            <div className="relative">
                <button
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className="flex items-center space-x-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <Icon name="calendar" size={20} />
                    <span className="font-medium capitalize">
                        {formatDate(selectedDate, selectedView)}
                    </span>
                    <Icon name="chevron-down" size={16} className={`transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Mini calendrier */}
                {isCalendarOpen && (
                    <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg p-4 z-50 min-w-80">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium">
                                {selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                            </h3>
                            <button
                                onClick={goToToday}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            >
                                Aujourd'hui
                            </button>
                        </div>

                        {/* Jours de la semaine */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
                                <div key={day} className="text-xs font-medium text-gray-500 text-center p-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Jours du mois */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, index) => {
                                const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                                const isToday = day.toDateString() === today.toDateString();
                                const isSelected = day.toDateString() === selectedDate.toDateString();

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleCalendarClick(day.getDate())}
                                        className={`p-2 text-sm rounded hover:bg-blue-100 transition-colors ${
                                            !isCurrentMonth
                                                ? 'text-gray-300'
                                                : isSelected
                                                    ? 'bg-blue-600 text-white'
                                                    : isToday
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'text-gray-700'
                                        }`}
                                        disabled={!isCurrentMonth}
                                    >
                                        {day.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Bouton aujourd'hui */}
            <button
                onClick={goToToday}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
                Aujourd'hui
            </button>

            {/* Sélecteur de vue */}
            <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                    onClick={() => onViewChange('month')}
                    className={`px-4 py-2 text-sm rounded transition-colors ${
                        selectedView === 'month'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Mois
                </button>
                <button
                    onClick={() => onViewChange('week')}
                    className={`px-4 py-2 text-sm rounded transition-colors ${
                        selectedView === 'week'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Semaine
                </button>
            </div>

            {/* Fermer le calendrier en cliquant à l'extérieur */}
            {isCalendarOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsCalendarOpen(false)}
                />
            )}
        </div>
    );
}