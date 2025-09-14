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

// Personnel par défaut avec authentification
export const DEFAULT_PERSONNEL = [
    {
        id: 'user1',
        nom: 'Alexandre Desrochers',
        succursale: 'MDL Sherbrooke',
        specialites: ['Analyse de réponse', 'Testeur de rapport de transformation'],
        password: 'Alex123!',
        canModify: true,
        isCoordinator: true
    },
    {
        id: 'user2',
        nom: 'Marc-André Bisson',
        succursale: 'MDL Terrebonne',
        specialites: ['Testeur d\'enroulement', 'Analyse de réponse'],
        password: 'Marc456!',
        canModify: true,
        isCoordinator: false
    },
    {
        id: 'user3',
        nom: 'Jean-François Lemieux',
        succursale: 'MDL Québec',
        specialites: ['Testeur de rapport de transformation', 'Testeur d\'enroulement'],
        password: 'JF789!',
        canModify: true,
        isCoordinator: false
    },
    {
        id: 'user4',
        nom: 'Simon Dubois',
        succursale: 'DUAL Électrotech',
        specialites: ['Analyse de réponse', 'Diagnostic'],
        password: 'Simon321!',
        canModify: false,
        isCoordinator: false
    },
    {
        id: 'user5',
        nom: 'Patrick Tremblay',
        succursale: 'CFM',
        specialites: ['Testeur d\'enroulement', 'Maintenance'],
        password: 'Pat654!',
        canModify: true,
        isCoordinator: true
    },
    {
        id: 'user6',
        nom: 'Michel Gagnon',
        succursale: 'Surplec',
        specialites: ['Diagnostic avancé', 'Formation'],
        password: 'Mich987!',
        canModify: true,
        isCoordinator: false
    }
];

// Équipements par défaut
export const DEFAULT_EQUIPMENTS = [
    {
        id: 'eq1',
        nom: 'Analyseur CABA Win',
        type: 'Analyseur de réponse',
        numeroSerie: 'CW-2019-001',
        derniereMaintenance: '2024-01-15',
        prochaineMaintenance: '2024-07-15',
        statut: 'Disponible',
        localisation: 'MDL Sherbrooke'
    },
    {
        id: 'eq2',
        nom: 'Testeur Ratio TTR-300',
        type: 'Testeur de rapport',
        numeroSerie: 'TTR-2020-045',
        derniereMaintenance: '2024-02-20',
        prochaineMaintenance: '2024-08-20',
        statut: 'Disponible',
        localisation: 'MDL Terrebonne'
    },
    {
        id: 'eq3',
        nom: 'Testeur Enroulement EW-50',
        type: 'Testeur d\'enroulement',
        numeroSerie: 'EW-2021-078',
        derniereMaintenance: '2024-03-10',
        prochaineMaintenance: '2024-09-10',
        statut: 'En maintenance',
        localisation: 'MDL Québec'
    },
    {
        id: 'eq4',
        nom: 'Kit Diagnostic Mobile',
        type: 'Diagnostic portable',
        numeroSerie: 'KDM-2023-012',
        derniereMaintenance: '2024-04-05',
        prochaineMaintenance: '2024-10-05',
        statut: 'Disponible',
        localisation: 'DUAL Électrotech'
    }
];

// Types d'équipements disponibles
export const EQUIPMENT_TYPES = [
    'Analyseur de réponse',
    'Testeur de rapport',
    'Testeur d\'enroulement',
    'Diagnostic portable',
    'Multimètre avancé',
    'Oscilloscope',
    'Autre'
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
    { value: 'low', label: 'Basse', color: '#10b981' },
    { value: 'medium', label: 'Moyenne', color: '#f59e0b' },
    { value: 'high', label: 'Haute', color: '#ef4444' },
    { value: 'urgent', label: 'Urgente', color: '#dc2626' }
];

// Statuts des tâches
export const TASK_STATUSES = [
    { value: 'planned', label: 'Planifiée', color: '#6b7280' },
    { value: 'in_progress', label: 'En cours', color: '#3b82f6' },
    { value: 'completed', label: 'Terminée', color: '#10b981' },
    { value: 'cancelled', label: 'Annulée', color: '#ef4444' },
    { value: 'postponed', label: 'Reportée', color: '#f59e0b' }
];

// Configuration responsive
export const SCREEN_BREAKPOINTS = {
    mobile: 768,
    tablet: 1024,
    desktop: 1280
};

// Couleurs des bureaux
export const BUREAU_COLORS = {
    'MDL Sherbrooke': { bg: '#3b82f6', text: '#ffffff', class: 'mdl-sherbrooke' },
    'MDL Terrebonne': { bg: '#10b981', text: '#ffffff', class: 'mdl-terrebonne' },
    'MDL Québec': { bg: '#f59e0b', text: '#ffffff', class: 'mdl-quebec' },
    'DUAL Électrotech': { bg: '#ef4444', text: '#ffffff', class: 'dual-electrotech' },
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
