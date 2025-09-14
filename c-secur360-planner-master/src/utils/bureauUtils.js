// ============== UTILITAIRES BUREAU ==============
// Fonctions utilitaires pour la gestion des bureaux/succursales

/**
 * Extrait le bureau depuis une chaîne de succursale
 * @param {string} succursale - Nom de la succursale
 * @returns {string} - Bureau extrait
 */
export function getBureauFromSuccursale(succursale) {
    if (!succursale) return 'Non spécifié';

    const lower = succursale.toLowerCase();

    if (lower.includes('mdl') && lower.includes('sherbrooke')) return 'MDL Sherbrooke';
    if (lower.includes('mdl') && lower.includes('terrebonne')) return 'MDL Terrebonne';
    if (lower.includes('mdl') && lower.includes('québec')) return 'MDL Québec';
    if (lower.includes('dual')) return 'DUAL Électrotech';
    if (lower.includes('cfm')) return 'CFM';
    if (lower.includes('surplec')) return 'Surplec';

    return succursale;
}

/**
 * Retourne la couleur associée à un bureau
 * @param {string} bureau - Nom du bureau
 * @returns {string} - Classe CSS de couleur
 */
export function getBureauColor(bureau) {
    const bureauLower = bureau.toLowerCase();

    if (bureauLower.includes('sherbrooke')) return 'mdl-sherbrooke';
    if (bureauLower.includes('terrebonne')) return 'mdl-terrebonne';
    if (bureauLower.includes('québec')) return 'mdl-quebec';
    if (bureauLower.includes('dual')) return 'dual-electrotech';
    if (bureauLower.includes('cfm')) return 'cfm';
    if (bureauLower.includes('surplec')) return 'surplec';

    return 'mdl-sherbrooke'; // défaut
}

/**
 * Retourne les options de bureaux pour les sélecteurs
 * @returns {Array} - Liste des options de bureaux
 */
export function getBureauOptions() {
    return [
        { value: 'MDL Sherbrooke', label: 'MDL Sherbrooke', color: 'mdl-sherbrooke' },
        { value: 'MDL Terrebonne', label: 'MDL Terrebonne', color: 'mdl-terrebonne' },
        { value: 'MDL Québec', label: 'MDL Québec', color: 'mdl-quebec' },
        { value: 'DUAL Électrotech', label: 'DUAL Électrotech', color: 'dual-electrotech' },
        { value: 'CFM', label: 'CFM', color: 'cfm' },
        { value: 'Surplec', label: 'Surplec', color: 'surplec' }
    ];
}

/**
 * Vérifie si un bureau est valide
 * @param {string} bureau - Nom du bureau à vérifier
 * @returns {boolean} - True si le bureau est valide
 */
export function isValidBureau(bureau) {
    const validBureaux = getBureauOptions().map(b => b.value);
    return validBureaux.includes(bureau);
}