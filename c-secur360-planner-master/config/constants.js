// ============== CONSTANTES ET CONFIGURATIONS ==============
// Constantes et configurations globales de l'application

// Configuration Google Drive API
export const GOOGLE_CONFIG = {
    CLIENT_ID: '468550200247-ki71lktocql36l0kv4eiigpvbkv64h8i.apps.googleusercontent.com',
    API_KEY: 'AIzaSyDQJQ_ZoLY-7xHdXkK9JNNqrDlUCe-mMq0',
    DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    SCOPES: 'https://www.googleapis.com/auth/drive.file',
    FILENAME: 'c-secur360-planificateur-data.json'
};

// Configuration localStorage
export const STORAGE_CONFIG = {
    KEY: 'planificateur-data-v4',
    AUTO_SAVE_DELAY: 1000, // 1 seconde
    SYNC_DELAY: 2000 // 2 secondes pour la sync
};

// Personnel par défaut avec authentification - COMPTE ADMIN INITIAL
export const DEFAULT_PERSONNEL = [
    {
        id: 1,
        nom: "Éric Dufort",
        poste: "Administrateur",
        succursale: "C-Secur360",
        disponible: false, // Non visible dans le calendrier par défaut
        email: "eric.dufort@cerdia.ai",
        telephone: "",
        type: "interne",
        motDePasse: "321Eduf!$", // Mot de passe pour connexion
        niveau_acces: "administration",
        permissions: { peutModifier: true, estCoordonnateur: true },
        visibleChantier: false // Pas visible dans le calendrier
    }
];

// Équipements par défaut - NETTOYÉ (aucun équipement fictif)
export const DEFAULT_EQUIPMENTS = [];

// Jobs de test par défaut - NETTOYÉ (aucun job fictif)
export const DEFAULT_JOBS = [];

// Types d'équipements disponibles - VERSION ORIGINALE
export const EQUIPMENT_TYPES = [
    "Analyseur de réponse",
    "Testeur de rapport",
    "Testeur d'enroulement",
    "Analyseur de gaz dissous",
    "Mégohmmètre",
    "Testeur d'isolation",
    "Analyseur de qualité d'huile"
];

// Statuts des équipements
export const EQUIPMENT_STATUSES = [
    'Disponible',
    'En cours d\'utilisation',
    'En maintenance',
    'Hors service',
    'Réservé'
];

// Types de récurrence
export const RECURRENCE_TYPES = [
    { value: 'none', label: 'Aucune' },
    { value: 'daily', label: 'Quotidienne' },
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'monthly', label: 'Mensuelle' }
];

// Configuration d'authentification admin
export const ADMIN_CONFIG = {
    PASSWORD: 'MdlAdm321!$',
    SESSION_TIMEOUT: 3600000 // 1 heure en millisecondes
};

// Types de travaux
export const WORK_TYPES = [
    'Analyse de réponse',
    'Test de rapport',
    'Test d\'enroulement',
    'Diagnostic général',
    'Maintenance préventive',
    'Réparation',
    'Formation',
    'Inspection',
    'Autre'
];

// Priorités des tâches
export const TASK_PRIORITIES = [
    { value: 'faible', label: 'Faible', color: '#10b981' },
    { value: 'normale', label: 'Normale', color: '#f59e0b' },
    { value: 'haute', label: 'Haute', color: '#ef4444' },
    { value: 'urgente', label: 'Urgente', color: '#dc2626' }
];

// Statuts des tâches
export const TASK_STATUSES = [
    { value: 'planifie', label: 'Planifiée', color: '#6b7280' },
    { value: 'en_cours', label: 'En cours', color: '#3b82f6' },
    { value: 'termine', label: 'Terminée', color: '#10b981' },
    { value: 'annule', label: 'Annulée', color: '#ef4444' },
    { value: 'reporte', label: 'Reportée', color: '#f59e0b' }
];

// Configuration responsive
export const SCREEN_BREAKPOINTS = {
    mobile: 768,
    tablet: 1024,
    desktop: 1280
};

// Couleurs des bureaux - VERSION ORIGINALE
export const BUREAU_COLORS = {
    'MDL - Sherbrooke': { bg: '#3b82f6', text: '#ffffff', class: 'mdl-sherbrooke' },
    'MDL - Terrebonne': { bg: '#10b981', text: '#ffffff', class: 'mdl-terrebonne' },
    'MDL - Québec': { bg: '#f59e0b', text: '#ffffff', class: 'mdl-quebec' },
    'DUAL - Électrotech': { bg: '#ef4444', text: '#ffffff', class: 'dual-electrotech' },
    'CFM': { bg: '#8b5cf6', text: '#ffffff', class: 'cfm' },
    'Surplec': { bg: '#06b6d4', text: '#ffffff', class: 'surplec' }
};

// Configuration des notifications
export const NOTIFICATION_CONFIG = {
    DURATION: 3000, // 3 secondes
    MAX_NOTIFICATIONS: 5,
    TYPES: {
        success: { color: '#10b981', icon: '✅' },
        error: { color: '#ef4444', icon: '❌' },
        warning: { color: '#f59e0b', icon: '⚠️' },
        info: { color: '#3b82f6', icon: 'ℹ️' }
    }
};

// Configuration du calendrier
export const CALENDAR_CONFIG = {
    VIEWS: ['month', 'week'],
    DEFAULT_VIEW: 'month',
    FIRST_DAY_OF_WEEK: 0, // Dimanche
    TIME_FORMAT: '24h'
};