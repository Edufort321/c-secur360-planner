// ============== UTILITAIRE DE TRADUCTION AUTOMATIQUE ==============
// Script pour appliquer les traductions automatiquement dans tous les composants

import { useLanguage } from '../contexts/LanguageContext.jsx';

// Dictionnaire de traductions automatiques pour les textes courants
export const AUTO_TRANSLATIONS = {
    // Boutons et actions courants
    'Se connecter': { key: 'login.submit', fr: 'Se connecter', en: 'Login' },
    'Se déconnecter': { key: 'login.logout', fr: 'Se déconnecter', en: 'Logout' },
    'Connexion': { key: 'login.title', fr: 'Connexion', en: 'Login' },
    'Enregistrer': { key: 'form.save', fr: 'Enregistrer', en: 'Save' },
    'Annuler': { key: 'form.cancel', fr: 'Annuler', en: 'Cancel' },
    'Fermer': { key: 'form.close', fr: 'Fermer', en: 'Close' },
    'Ajouter': { key: 'form.add', fr: 'Ajouter', en: 'Add' },
    'Modifier': { key: 'form.edit', fr: 'Modifier', en: 'Edit' },
    'Supprimer': { key: 'form.delete', fr: 'Supprimer', en: 'Delete' },
    'Rechercher': { key: 'form.search', fr: 'Rechercher', en: 'Search' },
    'Filtrer': { key: 'form.filter', fr: 'Filtrer', en: 'Filter' },
    'Confirmer': { key: 'modal.confirm', fr: 'Confirmer', en: 'Confirm' },
    'Oui': { key: 'modal.yes', fr: 'Oui', en: 'Yes' },
    'Non': { key: 'modal.no', fr: 'Non', en: 'No' },
    'OK': { key: 'modal.ok', fr: 'OK', en: 'OK' },

    // Messages et statuts
    'Chargement': { key: 'app.loading', fr: 'Chargement', en: 'Loading' },
    'Erreur': { key: 'notification.error', fr: 'Erreur', en: 'Error' },
    'Succès': { key: 'notification.success', fr: 'Succès', en: 'Success' },
    'Attention': { key: 'notification.warning', fr: 'Attention', en: 'Warning' },
    'Information': { key: 'notification.info', fr: 'Information', en: 'Information' },
    'Disponible': { key: 'status.available', fr: 'Disponible', en: 'Available' },
    'Occupé': { key: 'status.busy', fr: 'Occupé', en: 'Busy' },
    'Indisponible': { key: 'status.unavailable', fr: 'Indisponible', en: 'Unavailable' },

    // Navigation et vues
    'Calendrier': { key: 'nav.calendar', fr: 'Calendrier', en: 'Calendar' },
    'Personnel': { key: 'nav.personnel', fr: 'Personnel', en: 'Personnel' },
    'Équipements': { key: 'nav.equipment', fr: 'Équipements', en: 'Equipment' },
    'Tâches': { key: 'nav.jobs', fr: 'Tâches', en: 'Tasks' },
    'Mois': { key: 'header.month', fr: 'Mois', en: 'Month' },
    'Semaine': { key: 'header.week', fr: 'Semaine', en: 'Week' },
    'Aujourd\'hui': { key: 'calendar.today', fr: 'Aujourd\'hui', en: 'Today' },

    // Jobs et événements
    'Titre': { key: 'job.title', fr: 'Titre', en: 'Title' },
    'Description': { key: 'job.description', fr: 'Description', en: 'Description' },
    'Date de début': { key: 'job.startDate', fr: 'Date de début', en: 'Start Date' },
    'Date de fin': { key: 'job.endDate', fr: 'Date de fin', en: 'End Date' },
    'Heure de début': { key: 'job.startTime', fr: 'Heure de début', en: 'Start Time' },
    'Heure de fin': { key: 'job.endTime', fr: 'Heure de fin', en: 'End Time' },
    'Priorité': { key: 'job.priority', fr: 'Priorité', en: 'Priority' },
    'Statut': { key: 'job.status', fr: 'Statut', en: 'Status' },

    // Personnel et équipes
    'Nom': { key: 'personnel.name', fr: 'Nom', en: 'Last Name' },
    'Prénom': { key: 'personnel.firstName', fr: 'Prénom', en: 'First Name' },
    'Poste': { key: 'personnel.position', fr: 'Poste', en: 'Position' },
    'Département': { key: 'personnel.department', fr: 'Département', en: 'Department' },

    // Temps et dates
    'Lundi': { key: 'day.monday', fr: 'Lundi', en: 'Monday' },
    'Mardi': { key: 'day.tuesday', fr: 'Mardi', en: 'Tuesday' },
    'Mercredi': { key: 'day.wednesday', fr: 'Mercredi', en: 'Wednesday' },
    'Jeudi': { key: 'day.thursday', fr: 'Jeudi', en: 'Thursday' },
    'Vendredi': { key: 'day.friday', fr: 'Vendredi', en: 'Friday' },
    'Samedi': { key: 'day.saturday', fr: 'Samedi', en: 'Saturday' },
    'Dimanche': { key: 'day.sunday', fr: 'Dimanche', en: 'Sunday' },

    'Janvier': { key: 'month.january', fr: 'Janvier', en: 'January' },
    'Février': { key: 'month.february', fr: 'Février', en: 'February' },
    'Mars': { key: 'month.march', fr: 'Mars', en: 'March' },
    'Avril': { key: 'month.april', fr: 'Avril', en: 'April' },
    'Mai': { key: 'month.may', fr: 'Mai', en: 'May' },
    'Juin': { key: 'month.june', fr: 'Juin', en: 'June' },
    'Juillet': { key: 'month.july', fr: 'Juillet', en: 'July' },
    'Août': { key: 'month.august', fr: 'Août', en: 'August' },
    'Septembre': { key: 'month.september', fr: 'Septembre', en: 'September' },
    'Octobre': { key: 'month.october', fr: 'Octobre', en: 'October' },
    'Novembre': { key: 'month.november', fr: 'Novembre', en: 'November' },
    'Décembre': { key: 'month.december', fr: 'Décembre', en: 'December' }
};

// Hook pour l'auto-traduction
export function useAutoTranslate() {
    const { t } = useLanguage();

    // Fonction pour auto-traduire un texte
    const at = (text, fallback = null) => {
        if (!text) return fallback || '';

        // Chercher dans le dictionnaire de traductions automatiques
        const translation = AUTO_TRANSLATIONS[text];
        if (translation) {
            return t(translation.key, text);
        }

        // Si pas trouvé, retourner le texte original ou le fallback
        return fallback || text;
    };

    return { at, t };
}

// Fonction utilitaire pour remplacer automatiquement les textes hardcodés
export function replaceWithTranslation(text) {
    const translation = AUTO_TRANSLATIONS[text];
    return translation ? `t('${translation.key}')` : `'${text}'`;
}

export default { AUTO_TRANSLATIONS, useAutoTranslate, replaceWithTranslation };