// ============== UTILITAIRES DATE ==============
// Fonctions utilitaires pour la gestion des dates et calendriers

/**
 * Calcule la date de fin d'une tâche basée sur la durée et les horaires
 * @param {string} startDate - Date de début (YYYY-MM-DD)
 * @param {number} duration - Durée en jours
 * @param {boolean} includeWeekends - Inclure les fins de semaine
 * @param {boolean} isNightWork - Travail de nuit
 * @param {boolean} is24h - Travail 24h/24h
 * @returns {string} - Date de fin calculée
 */
export function calculateEndDate(startDate, duration = 1, includeWeekends = false, isNightWork = false, is24h = false) {
    const start = new Date(startDate);
    let daysToAdd = parseInt(duration) || 1;

    // Pour le travail 24h/24h, réduire la durée
    if (is24h) {
        daysToAdd = Math.max(1, Math.ceil(daysToAdd / 3));
    }

    let currentDate = new Date(start);
    let addedDays = 0;

    while (addedDays < daysToAdd - 1) {
        currentDate.setDate(currentDate.getDate() + 1);

        // Si on n'inclut pas les fins de semaine, ignorer samedi (6) et dimanche (0)
        if (!includeWeekends && (currentDate.getDay() === 0 || currentDate.getDay() === 6)) {
            continue;
        }

        addedDays++;
    }

    return currentDate.toISOString().split('T')[0];
}

/**
 * Génère des dates récurrentes
 * @param {string} startDate - Date de début
 * @param {string} endDate - Date de fin
 * @param {string} recurrenceType - Type de récurrence (daily, weekly, monthly)
 * @param {number} recurrenceInterval - Intervalle de récurrence
 * @returns {Array} - Liste des dates générées
 */
export function genererDatesRecurrentes(startDate, endDate, recurrenceType = 'weekly', recurrenceInterval = 1) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    let current = new Date(start);

    while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);

        switch (recurrenceType) {
            case 'daily':
                current.setDate(current.getDate() + recurrenceInterval);
                break;
            case 'weekly':
                current.setDate(current.getDate() + (7 * recurrenceInterval));
                break;
            case 'monthly':
                current.setMonth(current.getMonth() + recurrenceInterval);
                break;
            default:
                current.setDate(current.getDate() + 7); // défaut hebdomadaire
        }
    }

    return dates;
}

/**
 * Formate une date en français
 * @param {string|Date} date - Date à formater
 * @param {string} format - Format de sortie ('short', 'long', 'day')
 * @returns {string} - Date formatée
 */
export function formatDateFrench(date, format = 'short') {
    const d = typeof date === 'string' ? new Date(date) : date;

    const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const joursAbreg = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const mois = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const moisAbreg = [
        'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
        'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
    ];

    switch (format) {
        case 'long':
            return `${jours[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`;
        case 'short':
            return `${d.getDate()} ${moisAbreg[d.getMonth()]} ${d.getFullYear()}`;
        case 'day':
            return joursAbreg[d.getDay()];
        case 'dayFull':
            return jours[d.getDay()];
        default:
            return d.toLocaleDateString('fr-CA');
    }
}

/**
 * Vérifie si une date est un jour ouvrable
 * @param {string|Date} date - Date à vérifier
 * @returns {boolean} - True si jour ouvrable
 */
export function isWorkingDay(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const dayOfWeek = d.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // Pas dimanche (0) ni samedi (6)
}

/**
 * Obtient les dates d'une semaine
 * @param {Date} date - Date de référence
 * @returns {Array} - Liste des dates de la semaine
 */
export function getWeekDates(date) {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day; // Premier jour de la semaine (dimanche)

    const firstDay = new Date(start.setDate(diff));
    const week = [];

    for (let i = 0; i < 7; i++) {
        const day = new Date(firstDay);
        day.setDate(firstDay.getDate() + i);
        week.push(day);
    }

    return week;
}

/**
 * Obtient les dates d'un mois
 * @param {number} year - Année
 * @param {number} month - Mois (0-11)
 * @returns {Array} - Grille du calendrier mensuel
 */
export function getMonthCalendar(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);

    // Commencer au dimanche de la première semaine
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const calendar = [];
    let week = [];

    for (let i = 0; i < 42; i++) { // 6 semaines max
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        week.push(currentDate);

        if (week.length === 7) {
            calendar.push(week);
            week = [];
        }

        // Arrêter si on a dépassé le mois et qu'on est en début de semaine
        if (currentDate > lastDay && currentDate.getDay() === 0 && calendar.length >= 4) {
            break;
        }
    }

    return calendar;
}

/**
 * Calcule le nombre de jours ouvrables entre deux dates
 * @param {string|Date} startDate - Date de début
 * @param {string|Date} endDate - Date de fin
 * @returns {number} - Nombre de jours ouvrables
 */
export function getWorkingDaysBetween(startDate, endDate) {
    const start = new Date(typeof startDate === 'string' ? startDate : startDate);
    const end = new Date(typeof endDate === 'string' ? endDate : endDate);

    let count = 0;
    const current = new Date(start);

    while (current <= end) {
        if (isWorkingDay(current)) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }

    return count;
}