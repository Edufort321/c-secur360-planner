// ============== UTILITAIRES DATE LOCALISÉES ==============
// Fonctions utilitaires pour la gestion des dates avec traduction

/**
 * Traductions pour les jours de la semaine
 */
const DAY_NAMES = {
    fr: {
        full: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
        short: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    },
    en: {
        full: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    }
};

/**
 * Traductions pour les mois
 */
const MONTH_NAMES = {
    fr: {
        full: [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ],
        short: [
            'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
            'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
        ]
    },
    en: {
        full: [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ],
        short: [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ]
    }
};

/**
 * Obtient le nom du jour traduit
 * @param {Date|string} date - Date à traiter
 * @param {string} language - Langue ('fr' ou 'en')
 * @param {boolean} short - Format court (true) ou long (false)
 * @returns {string} - Nom du jour traduit
 */
export function getLocalizedDayName(date, language = 'fr', short = true) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const dayIndex = d.getDay();

    return short
        ? DAY_NAMES[language]?.short[dayIndex] || DAY_NAMES.fr.short[dayIndex]
        : DAY_NAMES[language]?.full[dayIndex] || DAY_NAMES.fr.full[dayIndex];
}

/**
 * Obtient le nom du mois traduit
 * @param {Date|string} date - Date à traiter
 * @param {string} language - Langue ('fr' ou 'en')
 * @param {boolean} short - Format court (true) ou long (false)
 * @returns {string} - Nom du mois traduit
 */
export function getLocalizedMonthName(date, language = 'fr', short = true) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const monthIndex = d.getMonth();

    return short
        ? MONTH_NAMES[language]?.short[monthIndex] || MONTH_NAMES.fr.short[monthIndex]
        : MONTH_NAMES[language]?.full[monthIndex] || MONTH_NAMES.fr.full[monthIndex];
}

/**
 * Formate une date complète avec traduction
 * @param {Date|string} date - Date à formater
 * @param {string} language - Langue ('fr' ou 'en')
 * @param {string} format - Format ('full', 'long', 'short')
 * @returns {string} - Date formatée et traduite
 */
export function formatLocalizedDate(date, language = 'fr', format = 'full') {
    const d = typeof date === 'string' ? new Date(date) : date;

    const dayName = getLocalizedDayName(d, language, false);
    const monthName = getLocalizedMonthName(d, language, false);
    const dayNumber = d.getDate();
    const year = d.getFullYear();

    switch (format) {
        case 'full':
            return `${dayName}, ${dayNumber} ${monthName} ${year}`;
        case 'long':
            return `${dayNumber} ${monthName} ${year}`;
        case 'short':
            return `${dayNumber} ${getLocalizedMonthName(d, language, true)} ${year}`;
        case 'dayMonth':
            return `${dayNumber} ${getLocalizedMonthName(d, language, true)}`;
        default:
            return formatLocalizedDate(date, language, 'full');
    }
}

/**
 * Formate une date pour l'affichage du calendrier
 * @param {Date|string} date - Date à formater
 * @param {string} language - Langue ('fr' ou 'en')
 * @param {boolean} isMobile - Interface mobile
 * @returns {object} - Objet avec les données formatées pour le calendrier
 */
export function formatCalendarDate(date, language = 'fr', isMobile = false) {
    const d = typeof date === 'string' ? new Date(date) : date;

    return {
        dayName: getLocalizedDayName(d, language, true),
        dayNameFull: getLocalizedDayName(d, language, false),
        dayNumber: d.getDate(),
        monthName: getLocalizedMonthName(d, language, true),
        monthNameFull: getLocalizedMonthName(d, language, false),
        year: d.getFullYear(),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        isToday: d.toDateString() === new Date().toDateString(),
        fullDate: d.toISOString().split('T')[0],
        // Format pour affichage mobile/desktop
        displayShort: isMobile ?
            (d.getDay() === 0 ? getLocalizedMonthName(d, language, true).substr(0, 3) : getLocalizedDayName(d, language, true).substr(0, 1)) :
            (d.getDay() === 0 ? `${getLocalizedMonthName(d, language, true)} ${getLocalizedDayName(d, language, true)}` : getLocalizedDayName(d, language, true))
    };
}

/**
 * Remplace toLocaleDateString avec traduction personnalisée
 * @param {Date|string} date - Date à formater
 * @param {string} language - Langue ('fr' ou 'en')
 * @param {object} options - Options de formatage similaires à toLocaleDateString
 * @returns {string} - Date formatée
 */
export function localizedDateString(date, language = 'fr', options = {}) {
    const d = typeof date === 'string' ? new Date(date) : date;

    // Options par défaut
    const {
        weekday = null,
        year = 'numeric',
        month = 'long',
        day = 'numeric'
    } = options;

    let result = '';

    // Ajouter le jour de la semaine si demandé
    if (weekday) {
        const isShort = weekday === 'short';
        result += getLocalizedDayName(d, language, isShort);
        if (weekday === 'long') result += ', ';
        else result += ' ';
    }

    // Ajouter le jour
    if (day === 'numeric' || day === '2-digit') {
        result += d.getDate();
        result += ' ';
    }

    // Ajouter le mois
    if (month) {
        const isShort = month === 'short';
        result += getLocalizedMonthName(d, language, isShort);
        result += ' ';
    }

    // Ajouter l'année
    if (year === 'numeric' || year === '2-digit') {
        if (year === '2-digit') {
            result += d.getFullYear().toString().slice(-2);
        } else {
            result += d.getFullYear();
        }
    }

    return result.trim();
}

/**
 * Génère les jours continus pour le calendrier avec traduction
 * @param {Date} startDate - Date de début
 * @param {number} numberOfDays - Nombre de jours
 * @param {string} language - Langue
 * @param {boolean} isMobile - Interface mobile
 * @returns {Array} - Liste des jours formatés
 */
export function generateLocalizedDays(startDate, numberOfDays, language = 'fr', isMobile = false) {
    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < numberOfDays; i++) {
        const date = new Date(current);
        const calendarData = formatCalendarDate(date, language, isMobile);

        days.push({
            date: new Date(date),
            ...calendarData
        });

        current.setDate(current.getDate() + 1);
    }

    return days;
}

/**
 * Fonction d'aide pour remplacer toLocaleDateString en conservant la compatibilité
 * @param {Date} date - Date à formater
 * @param {string} language - Langue
 * @param {object} options - Options de formatage
 * @returns {string} - Date formatée
 */
export function compatibleLocaleDateString(date, language = 'fr', options = {}) {
    // Si des options spécifiques sont demandées, utiliser notre fonction personnalisée
    if (options.weekday || options.month || options.day) {
        return localizedDateString(date, language, options);
    }

    // Sinon, utiliser la fonction native avec locale appropriée
    const locale = language === 'en' ? 'en-US' : 'fr-FR';
    return date.toLocaleDateString(locale, options);
}