import { useState, useEffect } from 'react';
import { Icon } from '../../components/UI/Icon';
import { Logo } from '../../components/UI/Logo';
import { getBureauOptions } from '../../utils/bureauUtils';
import { useAppData } from '../../hooks/useAppData';
import { useLanguage } from '../../contexts/LanguageContext';

export function PersonnelModal({ isOpen, onClose, personnel = null, onSave, onDelete }) {
    const { postes, succursales } = useAppData();
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        poste: '',
        departement: '',
        succursale: '',
        specialites: [],
        disponible: true,
        telephone: '',
        email: '',
        dateEmbauche: '',
        salaire: '',
        notes: '',
        password: '',
        niveauAcces: 'consultation', // consultation, modification, coordination, administration
        visibleChantier: true, // Affichage au calendrier
        permissions: {
            admin: false,
            coordonnateur: false,
            gestionPersonnel: false,
            gestionEquipement: false,
            gestionJobs: false,
            gestionSuccursales: false,
            export: false,
            import: false,
            configuration: false,
            demandeConge: true, // Par défaut activé pour tous les employés
            autorisationConge: false
        }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [nouveauSpecialite, setNouveauSpecialite] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const bureauOptions = getBureauOptions();

    const specialitesPredefinies = [];

    // Générateur de mot de passe automatique
    const generatePassword = () => {
        const nom = formData.nom.trim();
        const prenom = formData.prenom.trim();

        if (!nom || !prenom) {
            alert(t('personnel.fillNameFirstName'));
            return;
        }

        // Prendre les 2 premières lettres du prénom (capitalisées)
        const premierePrenomPart = prenom.charAt(0).toUpperCase() + prenom.charAt(1).toLowerCase();

        // Prendre les 3 premières lettres du nom (première en majuscule)
        const nomPart = nom.charAt(0).toUpperCase() + nom.substring(1, 3).toLowerCase();

        // Générer 3 chiffres aléatoires
        const chiffres = Math.floor(100 + Math.random() * 900); // 100-999

        // Symboles possibles
        const symboles = ['!', '$', '#', '@', '%', '&', '*'];
        const symbole = symboles[Math.floor(Math.random() * symboles.length)];

        // Format: 321Eduf!$
        const motDePasse = `${chiffres}${premierePrenomPart}${nomPart}${symbole}$`;

        setFormData(prev => ({
            ...prev,
            password: motDePasse
        }));
    };

    // Les données sont maintenant disponibles directement via le hook useAppData
    useEffect(() => {
        if (isOpen) {
            console.log('Postes disponibles:', postes);
            console.log('Succursales disponibles:', succursales);
        }
    }, [isOpen, postes, succursales]);

    useEffect(() => {
        if (personnel) {
            setFormData({
                nom: personnel.nom || '',
                prenom: personnel.prenom || '',
                poste: personnel.poste || '',
                departement: personnel.departement || '',
                succursale: personnel.succursale || '',
                specialites: personnel.specialites || [],
                disponible: personnel.disponible !== false,
                telephone: personnel.telephone || '',
                email: personnel.email || '',
                dateEmbauche: personnel.dateEmbauche ?
                    (typeof personnel.dateEmbauche === 'string' ?
                        personnel.dateEmbauche.split('T')[0] :
                        personnel.dateEmbauche.toISOString().split('T')[0]
                    ) : '',
                salaire: personnel.salaire || '',
                notes: personnel.notes || '',
                password: personnel.password || '',
                niveauAcces: personnel.niveauAcces || 'consultation',
                visibleChantier: personnel.visibleChantier !== false, // Par défaut true
                permissions: {
                    admin: false,
                    coordonnateur: false,
                    gestionPersonnel: false,
                    gestionEquipement: false,
                    gestionJobs: false,
                    gestionSuccursales: false,
                    export: false,
                    import: false,
                    configuration: false,
                    demandeConge: true, // Par défaut activé pour tous les employés
                    autorisationConge: false,
                    ...personnel.permissions // Conserver les permissions existantes si elles existent
                }
            });
        } else {
            // Réinitialiser pour nouveau personnel
            setFormData({
                nom: '',
                prenom: '',
                poste: '',
                departement: '',
                succursale: '',
                specialites: [],
                disponible: true,
                telephone: '',
                email: '',
                dateEmbauche: '',
                salaire: '',
                notes: '',
                password: '',
                niveauAcces: 'consultation',
                visibleChantier: true,
                permissions: {
                    admin: false,
                    coordonnateur: false,
                    gestionPersonnel: false,
                    gestionEquipement: false,
                    gestionJobs: false,
                    gestionSuccursales: false,
                    export: false,
                    import: false,
                    configuration: false,
                    demandeConge: true, // Par défaut activé pour tous les employés
                    autorisationConge: false
                }
            });
        }
        setNouveauSpecialite('');
    }, [personnel, isOpen]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Auto-remplir le département quand un poste est sélectionné
        if (field === 'poste' && value) {
            if (value.includes('|')) {
                // Le format est "nom|departement"
                const [nomPoste, departementPoste] = value.split('|');
                setFormData(prev => ({
                    ...prev,
                    poste: nomPoste, // Stocker seulement le nom du poste
                    departement: departementPoste || '' // Stocker le département correspondant
                }));
            } else {
                // Ancien format ou valeur sans département
                setFormData(prev => ({
                    ...prev,
                    poste: value,
                    departement: ''
                }));
            }
        }

        // Auto-ajuster les permissions selon le niveau d'accès
        if (field === 'niveauAcces') {
            let newPermissions = {
                admin: false,
                coordonnateur: false,
                gestionPersonnel: false,
                gestionEquipement: false,
                gestionJobs: false,
                gestionSuccursales: false,
                export: false,
                import: false,
                configuration: false,
                demandeConge: true, // Toujours activé pour tous
                autorisationConge: false
            };

            switch (value) {
                case 'administration':
                    newPermissions = {
                        ...newPermissions,
                        admin: true,
                        coordonnateur: true,
                        gestionPersonnel: true,
                        gestionEquipement: true,
                        gestionJobs: true,
                        gestionSuccursales: true,
                        export: true,
                        import: true,
                        configuration: true,
                        autorisationConge: true
                    };
                    break;
                case 'coordination':
                    newPermissions = {
                        ...newPermissions,
                        coordonnateur: true,
                        gestionPersonnel: true,
                        gestionJobs: true,
                        autorisationConge: true // Les coordonnateurs peuvent autoriser les congés
                    };
                    break;
                case 'modification':
                    newPermissions = {
                        ...newPermissions,
                        gestionJobs: true
                    };
                    break;
                // 'consultation' garde les permissions par défaut
            }

            setFormData(prev => ({
                ...prev,
                permissions: newPermissions
            }));
        }
    };

    const ajouterSpecialite = () => {
        if (nouveauSpecialite.trim() && !formData.specialites.includes(nouveauSpecialite.trim())) {
            setFormData(prev => ({
                ...prev,
                specialites: [...prev.specialites, nouveauSpecialite.trim()]
            }));
            setNouveauSpecialite('');
        }
    };

    const retirerSpecialite = (specialite) => {
        setFormData(prev => ({
            ...prev,
            specialites: prev.specialites.filter(s => s !== specialite)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nom.trim()) {
            alert(t('personnel.nameRequired'));
            return;
        }

        if (!formData.prenom.trim()) {
            alert(t('personnel.firstNameRequired'));
            return;
        }

        if (!formData.succursale) {
            alert(t('personnel.branchRequired'));
            return;
        }

        setIsSubmitting(true);

        try {
            const personnelData = {
                ...formData,
                nom: formData.nom.trim(),
                id: personnel?.id || Date.now(),
                dateEmbauche: formData.dateEmbauche ? new Date(formData.dateEmbauche) : null,
                dateModification: new Date()
            };

            await onSave(personnelData);
            onClose();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert(t('personnel.saveError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!personnel?.id) return;

        const confirmation = window.confirm(
            t('personnel.confirmDeleteMessageSimple').replace('{name}', personnel.nom)
        );

        if (confirmation) {
            try {
                await onDelete(personnel.id);
                onClose();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                alert(t('personnel.deleteError'));
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gray-900">
                    <div className="flex items-center gap-4">
                        <Logo size="normal" showText={false} />
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center">
                                <Icon name="user" className="mr-2" size={24} />
                                {personnel ? t('personnel.modifyPersonnel') : t('personnel.newPersonnel')}
                            </h2>
                            <p className="text-sm text-gray-300">{t('personnel.managementC-Secur360')}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
                    >
                        <Icon name="close" size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Informations de base */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('personnel.lastName')} *
                                </label>
                                <input
                                    type="text"
                                    value={formData.nom}
                                    onChange={(e) => handleInputChange('nom', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder={t('personnel.lastNameExample')}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('personnel.firstName')} *
                                </label>
                                <input
                                    type="text"
                                    value={formData.prenom}
                                    onChange={(e) => handleInputChange('prenom', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder={t('personnel.firstNameExample')}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('personnel.position')}
                                </label>
                                <select
                                    value={formData.poste && formData.departement ? `${formData.poste}|${formData.departement}` : formData.poste}
                                    onChange={(e) => handleInputChange('poste', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">{t('personnel.selectPosition')}</option>
                                    {postes.map(poste => (
                                        <option key={poste.id || `${poste.nom}-${poste.departement}`} value={`${poste.nom}|${poste.departement}`}>
                                            {poste.nom} {poste.departement ? `- ${poste.departement}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('personnel.department')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.departement}
                                    onChange={(e) => handleInputChange('departement', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder={t('personnel.departmentPlaceholder')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('personnel.branch')} *
                                </label>
                                <select
                                    value={formData.succursale}
                                    onChange={(e) => handleInputChange('succursale', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">{t('personnel.selectBranch')}</option>
                                    {succursales.map(succursale => (
                                        <option key={succursale.id || succursale.nom} value={succursale.nom}>
                                            {succursale.nom}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('personnel.phone')}
                                </label>
                                <input
                                    type="tel"
                                    value={formData.telephone}
                                    onChange={(e) => handleInputChange('telephone', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: 514-555-0123"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('personnel.email')}
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: jean.dupont@email.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('personnel.authPassword')}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                        className="w-full p-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder={t('personnel.authPasswordPlaceholder')}
                                    />
                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                            title={showPassword ? t('personnel.hidePassword') : t('personnel.showPassword')}
                                        >
                                            <Icon name={showPassword ? "eye_off" : "eye"} size={16} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {t('personnel.passwordInfo')}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs text-blue-500">
                                        {t('personnel.generatePasswordHint')}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={generatePassword}
                                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors flex items-center gap-1"
                                        title={t('personnel.generateAutoPassword')}
                                    >
                                        <Icon name="refresh" size={14} />
                                        {t('personnel.generate')}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('personnel.accessLevel')} *
                                </label>
                                <select
                                    value={formData.niveauAcces}
                                    onChange={(e) => handleInputChange('niveauAcces', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="consultation">{t('personnel.accessConsultation')}</option>
                                    <option value="modification">{t('personnel.accessModification')}</option>
                                    <option value="coordination">{t('personnel.accessCoordination')}</option>
                                    <option value="administration">{t('personnel.accessAdministration')}</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {t('personnel.accessLevelInfo')}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('personnel.hireDate')}
                                </label>
                                <input
                                    type="date"
                                    value={formData.dateEmbauche}
                                    onChange={(e) => handleInputChange('dateEmbauche', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('personnel.salaryOptional')}
                                </label>
                                <input
                                    type="number"
                                    value={formData.salaire}
                                    onChange={(e) => handleInputChange('salaire', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: 65000"
                                />
                            </div>
                        </div>

                        {/* Spécialités */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('personnel.specialties')}
                            </label>

                            <div className="flex space-x-2 mb-3">
                                <input
                                    type="text"
                                    list="specialites-list"
                                    value={nouveauSpecialite}
                                    onChange={(e) => setNouveauSpecialite(e.target.value)}
                                    className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder={t('personnel.addSpecialty')}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterSpecialite())}
                                />
                                <button
                                    type="button"
                                    onClick={ajouterSpecialite}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Icon name="plus" size={16} />
                                </button>
                            </div>

                            <datalist id="specialites-list">
                                {specialitesPredefinies.map(spec => (
                                    <option key={spec} value={spec} />
                                ))}
                            </datalist>

                            <div className="flex flex-wrap gap-2">
                                {formData.specialites.map((specialite, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                    >
                                        {specialite}
                                        <button
                                            type="button"
                                            onClick={() => retirerSpecialite(specialite)}
                                            className="ml-2 text-blue-600 hover:text-blue-800"
                                        >
                                            <Icon name="close" size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Statut disponibilité */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('personnel.status')}
                            </label>
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={formData.disponible}
                                        onChange={() => handleInputChange('disponible', true)}
                                        className="mr-2"
                                    />
                                    <span className="text-green-600">{t('personnel.statusAvailable')}</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={!formData.disponible}
                                        onChange={() => handleInputChange('disponible', false)}
                                        className="mr-2"
                                    />
                                    <span className="text-red-600">{t('personnel.statusUnavailable')}</span>
                                </label>
                            </div>
                        </div>

                        {/* Visibilité au calendrier */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('personnel.display')}
                            </label>
                            <div className="flex items-center">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.visibleChantier}
                                        onChange={(e) => handleInputChange('visibleChantier', e.target.checked)}
                                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="text-gray-700">{t('personnel.visibleOnCalendar')}</span>
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {t('personnel.visibilityInfo')}
                            </p>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('personnel.notes')}
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                                placeholder={t('personnel.notesPlaceholder')}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between pt-4 border-t">
                            {personnel && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    {t('personnel.delete')}
                                </button>
                            )}

                            <div className="flex space-x-3 ml-auto">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    {t('personnel.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? t('personnel.saving') : t('personnel.save')}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
