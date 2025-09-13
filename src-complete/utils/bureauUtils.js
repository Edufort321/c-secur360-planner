/**
 * Utilitaires pour la gestion des bureaux et succursales
 * EXTRAIT DE LA VERSION COMPLÈTE B3hoWdZQh
 * Fonctions de mapping et de coloration des bureaux
 */

export const getBureauFromSuccursale = (succursale) => {
    if (!succursale) return '';
    const lower = succursale.toLowerCase();
    if (lower.includes('sherbrooke')) return 'mdl-sherbrooke';
    if (lower.includes('terrebonne')) return 'mdl-terrebonne';
    if (lower.includes('québec')) return 'mdl-quebec';
    if (lower.includes('dual') || lower.includes('électrotech')) return 'dual-electrotech';
    if (lower.includes('cfm')) return 'cfm';
    if (lower.includes('surplec')) return 'surplec';
    return '';
};

export const getBureauColor = (succursale) => {
    const bureau = getBureauFromSuccursale(succursale);
    switch (bureau) {
        case 'mdl-sherbrooke': return 'text-white ' + bureau;
        case 'mdl-terrebonne': return 'text-white ' + bureau;
        case 'mdl-quebec': return 'text-white ' + bureau;
        case 'dual-electrotech': return 'text-white ' + bureau;
        case 'cfm': return 'text-white ' + bureau;
        case 'surplec': return 'text-white ' + bureau;
        default: return 'bg-gray-500 text-white';
    }
};

export const getBureauOptions = () => [
    { value: 'tous', label: 'Tous les bureaux' },
    { value: 'MDL - Sherbrooke', label: 'MDL - Sherbrooke' },
    { value: 'MDL - Terrebonne', label: 'MDL - Terrebonne' },
    { value: 'MDL - Québec', label: 'MDL - Québec' },
    { value: 'DUAL - Électrotech', label: 'DUAL - Électrotech' },
    { value: 'CFM', label: 'CFM' },
    { value: 'Surplec', label: 'Surplec' }
];