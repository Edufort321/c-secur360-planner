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

// Personnel par défaut avec authentification - VERSION ORIGINALE
export const DEFAULT_PERSONNEL = [
    {
        id: 1,
        nom: "Éric Dufort",
        poste: "1.1 -TECH",
        succursale: "MDL - Sherbrooke",
        disponible: true,
        email: "eric@mdl.com",
        telephone: "450-123-4567",
        type: "interne",
        motDePasse: "tech123",
        permissions: { peutModifier: true, estCoordonnateur: false },
        visibleChantier: true
    },
    {
        id: 2,
        nom: "Carl Lévesque",
        poste: "1.2 - ING.",
        succursale: "MDL - Terrebonne",
        disponible: true,
        email: "carl@mdl.com",
        telephone: "450-123-4568",
        type: "interne",
        motDePasse: "ing123",
        permissions: { peutModifier: true, estCoordonnateur: false },
        visibleChantier: true
    },
    {
        id: 3,
        nom: "Miguel Morin",
        poste: "1.3 - CPI",
        succursale: "MDL - Québec",
        disponible: true,
        email: "miguel@mdl.com",
        telephone: "418-123-4567",
        type: "interne",
        motDePasse: "cpi123",
        permissions: { peutModifier: true, estCoordonnateur: false },
        visibleChantier: true
    },
    {
        id: 4,
        nom: "Chad Rodrigue",
        poste: "1.4 - COORD.",
        succursale: "DUAL - Électrotech",
        disponible: true,
        email: "chad@dual.com",
        telephone: "819-123-4567",
        type: "interne",
        motDePasse: "coord123",
        permissions: { peutModifier: true, estCoordonnateur: true },
        visibleChantier: false
    },
    {
        id: 5,
        nom: "Alexandre Gariépy-Gauvin",
        poste: "1.5 - D.T.",
        succursale: "CFM",
        disponible: true,
        email: "alex@cfm.com",
        telephone: "450-123-4569",
        type: "interne",
        motDePasse: "dt123",
        permissions: { peutModifier: false, estCoordonnateur: false },
        visibleChantier: true
    },
    {
        id: 6,
        nom: "Test Admin",
        poste: "ADMIN",
        succursale: "Test",
        disponible: true,
        email: "test@test.com",
        telephone: "000-000-0000",
        type: "interne",
        motDePasse: "admin123",
        permissions: { peutModifier: true, estCoordonnateur: true },
        visibleChantier: false
    }
];

// Équipements par défaut - VERSION ORIGINALE
export const DEFAULT_EQUIPMENTS = [
    { id: 1, nom: "DOBLE M4000", type: "Analyseur de réponse", succursale: "MDL - Sherbrooke", disponible: true, numeroSerie: "DM4000-001", derniereMaintenance: "2025-08-15" },
    { id: 2, nom: "DOBLE SFRA", type: "Analyseur de réponse", succursale: "MDL - Terrebonne", disponible: true, numeroSerie: "SFRA-002", derniereMaintenance: "2025-08-10" },
    { id: 3, nom: "TTR", type: "Testeur de rapport", succursale: "MDL - Québec", disponible: true, numeroSerie: "TTR-003", derniereMaintenance: "2025-07-20" },
    { id: 4, nom: "WINDING", type: "Testeur d'enroulement", succursale: "DUAL - Électrotech", disponible: true, numeroSerie: "WIN-004", derniereMaintenance: "2025-08-01" }
];

// Jobs de test par défaut - VERSION ORIGINALE
export const DEFAULT_JOBS = [
    {
        id: 1,
        nom: 'Analyse transformateur Hydro-Québec',
        dateDebut: new Date().toISOString().split('T')[0], // Aujourd'hui
        heureDebut: '08:00',
        heureFin: '16:00',
        personnel: [1, 2], // Éric et Carl
        equipements: [1], // DOBLE M4000
        sousTraitants: [],
        priorite: 'haute',
        statut: 'planifie',
        description: 'Analyse de réponse sur transformateur 25 MVA',
        client: 'Hydro-Québec',
        localisation: 'Sherbrooke'
    },
    {
        id: 2,
        nom: 'Test rapport transformation',
        dateDebut: (() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow.toISOString().split('T')[0];
        })(),
        heureDebut: '09:00',
        heureFin: '17:00',
        personnel: [3], // Miguel
        equipements: [3], // TTR
        sousTraitants: [],
        priorite: 'normale',
        statut: 'planifie',
        description: 'Test de rapport de transformation',
        client: 'Ville de Québec',
        localisation: 'Québec'
    }
];

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