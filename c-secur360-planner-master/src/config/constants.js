// ============== CONFIGURATION C-SECUR360 PLANIFICATEUR ==============

// Configuration de stockage
export const STORAGE_CONFIG = {
    SYNC_DELAY: 2000, // Délai avant synchronisation automatique (ms)
    LOCAL_STORAGE_PREFIX: 'c_secur360_',
    GOOGLE_DRIVE_FOLDER: 'C-Secur360-Data',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    SUPPORTED_DOC_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

// Configuration des bureaux
export const BUREAUX = [
    { id: 'mdl-sherbrooke', nom: 'MDL Sherbrooke', couleur: '#3B82F6', emoji: '🔵' },
    { id: 'mdl-terrebonne', nom: 'MDL Terrebonne', couleur: '#10B981', emoji: '🟢' },
    { id: 'mdl-quebec', nom: 'MDL Québec', couleur: '#F59E0B', emoji: '🟠' },
    { id: 'dual-electrotech', nom: 'DUAL Électrotech', couleur: '#EF4444', emoji: '🔴' },
    { id: 'cfm', nom: 'CFM', couleur: '#8B5CF6', emoji: '🟣' },
    { id: 'surplec', nom: 'Surplec', couleur: '#06B6D4', emoji: '🔷' }
];

// Utilisateurs par défaut
export const DEFAULT_USERS = [
    {
        id: 'alex-desrochers',
        nom: 'Alexandre Desrochers',
        email: 'alexandre@csecur360.com',
        password: 'Alex123!',
        poste: 'Coordinateur Principal',
        permissions: ['admin', 'coordinateur'],
        bureau: 'mdl-sherbrooke',
        couleur: '#3B82F6'
    },
    {
        id: 'marc-bisson',
        nom: 'Marc-André Bisson',
        email: 'marc@csecur360.com',
        password: 'Marc456!',
        poste: 'Technicien Senior',
        permissions: ['modification'],
        bureau: 'mdl-terrebonne',
        couleur: '#10B981'
    },
    {
        id: 'jf-lemieux',
        nom: 'Jean-François Lemieux',
        email: 'jf@csecur360.com',
        password: 'JF789!',
        poste: 'Électricien',
        permissions: ['modification'],
        bureau: 'mdl-quebec',
        couleur: '#F59E0B'
    },
    {
        id: 'simon-dubois',
        nom: 'Simon Dubois',
        email: 'simon@csecur360.com',
        password: 'Simon321!',
        poste: 'Technicien',
        permissions: ['lecture'],
        bureau: 'dual-electrotech',
        couleur: '#EF4444'
    },
    {
        id: 'patrick-tremblay',
        nom: 'Patrick Tremblay',
        email: 'patrick@csecur360.com',
        password: 'Pat654!',
        poste: 'Coordinateur',
        permissions: ['admin', 'coordinateur'],
        bureau: 'cfm',
        couleur: '#8B5CF6'
    },
    {
        id: 'michel-gagnon',
        nom: 'Michel Gagnon',
        email: 'michel@csecur360.com',
        password: 'Mich987!',
        poste: 'Technicien Senior',
        permissions: ['modification'],
        bureau: 'surplec',
        couleur: '#06B6D4'
    }
];

// Configuration Admin
export const ADMIN_CONFIG = {
    password: 'MdlAdm321!$',
    sessionTimeout: 60 * 60 * 1000, // 1 heure en ms
    permissions: ['admin', 'coordinateur', 'modification', 'lecture']
};

// Configuration des priorités de jobs
export const JOB_PRIORITIES = {
    urgente: { label: '🔴 Urgente', couleur: '#EF4444', ordre: 1 },
    haute: { label: '🟠 Haute', couleur: '#F97316', ordre: 2 },
    normale: { label: '🟡 Normale', couleur: '#F59E0B', ordre: 3 },
    faible: { label: '🟢 Faible', couleur: '#10B981', ordre: 4 }
};

// Configuration des statuts de jobs
export const JOB_STATUSES = {
    planifie: { label: '📋 Planifié', couleur: '#6B7280' },
    en_cours: { label: '🔄 En cours', couleur: '#3B82F6' },
    termine: { label: '✅ Terminé', couleur: '#10B981' },
    annule: { label: '❌ Annulé', couleur: '#EF4444' },
    reporte: { label: '⏸️ Reporté', couleur: '#F59E0B' }
};

// Configuration des types de congés
export const CONGE_TYPES = {
    vacances: { label: '🏖️ Vacances', couleur: '#3B82F6' },
    maladie: { label: '🤒 Maladie', couleur: '#EF4444' },
    personnel: { label: '👨‍👩‍👧‍👦 Personnel', couleur: '#8B5CF6' },
    formation: { label: '📚 Formation', couleur: '#10B981' },
    maternite: { label: '👶 Maternité/Paternité', couleur: '#F59E0B' },
    autre: { label: '📝 Autre', couleur: '#6B7280' }
};

// Configuration PWA
export const PWA_CONFIG = {
    name: 'C-Secur360 Planificateur',
    shortName: 'C-Secur360',
    description: 'Planificateur de projets et équipes C-Secur360',
    themeColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    startUrl: '/',
    display: 'standalone',
    orientation: 'portrait'
};

export default {
    STORAGE_CONFIG,
    BUREAUX,
    DEFAULT_USERS,
    ADMIN_CONFIG,
    JOB_PRIORITIES,
    JOB_STATUSES,
    CONGE_TYPES,
    PWA_CONFIG
};