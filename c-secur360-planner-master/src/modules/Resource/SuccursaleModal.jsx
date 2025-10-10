import { useState, useEffect } from 'react';
import { Icon } from '../../components/UI/Icon';
import { Logo } from '../../components/UI/Logo';
import { PersonnelModal } from './PersonnelModal';
import { EquipementModal } from './EquipementModal';

export function SuccursaleModal({
    isOpen,
    onClose,
    onSave,
    onDelete,
    succursale = null,
    succursales = [],
    personnel = [],
    equipements = [],
    onSavePersonnel,
    onDeletePersonnel,
    onSaveEquipement,
    onDeleteEquipement,
    postes = [],
    departements = [],
    addNotification
}) {
    const [formData, setFormData] = useState({
        nom: '',
        adresse: '',
        ville: '',
        province: 'QC',
        codePostal: '',
        telephone: '',
        fax: '',
        email: '',
        responsable: '',
        nombreEmployes: '',
        couleur: '#1E40AF',
        actif: true,
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeSection, setActiveSection] = useState('info'); // 'info', 'personnel' ou 'equipement'
    const [showPersonnelModal, setShowPersonnelModal] = useState(false);
    const [selectedPersonnel, setSelectedPersonnel] = useState(null);
    const [showEquipementModal, setShowEquipementModal] = useState(false);
    const [selectedEquipement, setSelectedEquipement] = useState(null);

    // Couleurs prédéfinies professionnelles
    const couleursPredefinies = [
        '#1E40AF', '#DC2626', '#059669', '#D97706', '#7C3AED',
        '#BE185D', '#0891B2', '#65A30D', '#EA580C', '#4338CA',
        '#B91C1C', '#047857', '#B45309', '#6D28D9', '#A21CAF'
    ];

    const provinces = [
        { code: 'QC', nom: 'Québec' },
        { code: 'ON', nom: 'Ontario' },
        { code: 'BC', nom: 'Colombie-Britannique' },
        { code: 'AB', nom: 'Alberta' },
        { code: 'MB', nom: 'Manitoba' },
        { code: 'SK', nom: 'Saskatchewan' },
        { code: 'NS', nom: 'Nouvelle-Écosse' },
        { code: 'NB', nom: 'Nouveau-Brunswick' },
        { code: 'PE', nom: 'Île-du-Prince-Édouard' },
        { code: 'NL', nom: 'Terre-Neuve-et-Labrador' },
        { code: 'YT', nom: 'Yukon' },
        { code: 'NT', nom: 'Territoires du Nord-Ouest' },
        { code: 'NU', nom: 'Nunavut' }
    ];

    useEffect(() => {
        if (succursale) {
            setFormData({
                nom: succursale.nom || '',
                adresse: succursale.adresse || '',
                ville: succursale.ville || '',
                province: succursale.province || 'QC',
                codePostal: succursale.codePostal || '',
                telephone: succursale.telephone || '',
                fax: succursale.fax || '',
                email: succursale.email || '',
                responsable: succursale.responsable || '',
                nombreEmployes: succursale.nombreEmployes || '',
                couleur: succursale.couleur || '#1E40AF',
                actif: succursale.actif !== false,
                notes: succursale.notes || ''
            });
        } else {
            // Réinitialiser pour nouvelle succursale
            setFormData({
                nom: '',
                adresse: '',
                ville: '',
                province: 'QC',
                codePostal: '',
                telephone: '',
                fax: '',
                email: '',
                responsable: '',
                nombreEmployes: '',
                couleur: '#1E40AF',
                actif: true,
                notes: ''
            });
        }
    }, [succursale, isOpen]);

    // Fonction pour formater le numéro de téléphone automatiquement
    const formatPhoneNumber = (value) => {
        // Retirer tous les caractères non numériques
        const cleaned = value.replace(/\D/g, '');

        // Limiter à 10 chiffres
        const limited = cleaned.substring(0, 10);

        // Appliquer le format (819) 546-6454
        if (limited.length <= 3) {
            return limited;
        } else if (limited.length <= 6) {
            return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
        } else {
            return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
        }
    };

    const handleInputChange = (field, value) => {
        // Appliquer le formatage automatique du téléphone et fax
        let finalValue = value;
        if (field === 'telephone' || field === 'fax') {
            finalValue = formatPhoneNumber(value);
        }

        setFormData(prev => ({
            ...prev,
            [field]: finalValue
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nom.trim()) {
            alert('Le nom de la succursale est requis');
            return;
        }

        if (!formData.adresse.trim()) {
            alert('L\'adresse est requise');
            return;
        }

        if (!formData.ville.trim()) {
            alert('La ville est requise');
            return;
        }

        // Vérifier si la succursale existe déjà (sauf si on modifie)
        if (!succursale && succursales.some(s => s.nom.toLowerCase() === formData.nom.toLowerCase())) {
            alert('Cette succursale existe déjà');
            return;
        }

        setIsSubmitting(true);

        try {
            const succursaleData = {
                ...formData,
                id: succursale?.id || crypto.randomUUID(),
                nom: formData.nom.trim(),
                adresse: formData.adresse.trim(),
                ville: formData.ville.trim(),
                created_at: succursale?.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            await onSave(succursaleData);
            onClose();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Erreur lors de la sauvegarde de la succursale');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!succursale?.id) return;

        const confirmation = window.confirm(
            `Êtes-vous sûr de vouloir supprimer la succursale "${succursale.nom}" ?\n\nCette action est irréversible.`
        );

        if (confirmation) {
            try {
                await onDelete(succursale.id);
                onClose();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                alert('Erreur lors de la suppression de la succursale');
            }
        }
    };

    // Fonction pour formater le code postal
    const formatCodePostal = (value) => {
        const clean = value.replace(/\s/g, '').toUpperCase();
        if (clean.length <= 3) return clean;
        return `${clean.slice(0, 3)} ${clean.slice(3, 6)}`;
    };

    // Filtrer le personnel de cette succursale
    const getPersonnelSuccursale = () => {
        if (!succursale) return [];
        return personnel.filter(p => p.succursale === succursale.nom);
    };

    // Filtrer les équipements de cette succursale
    const getEquipementsSuccursale = () => {
        if (!succursale) return [];
        return equipements.filter(e => e.succursale === succursale.nom);
    };

    // Gestion du personnel
    const handleAddPersonnel = () => {
        setSelectedPersonnel(null);
        setShowPersonnelModal(true);
    };

    const handleEditPersonnel = (person) => {
        setSelectedPersonnel(person);
        setShowPersonnelModal(true);
    };

    const handleDeletePersonnel = (personId) => {
        const person = personnel.find(p => p.id === personId);
        if (!person) return;

        if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${person.prenom} ${person.nom} ?`)) {
            onDeletePersonnel(personId);
            if (addNotification) {
                addNotification(`${person.prenom} ${person.nom} supprimé avec succès`, 'success');
            }
        }
    };

    // Gestion des équipements
    const handleAddEquipement = () => {
        setSelectedEquipement(null);
        setShowEquipementModal(true);
    };

    const handleEditEquipement = (equipement) => {
        setSelectedEquipement(equipement);
        setShowEquipementModal(true);
    };

    const handleDeleteEquipement = (equipementId) => {
        const equipement = equipements.find(e => e.id === equipementId);
        if (!equipement) return;

        if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${equipement.nom} ?`)) {
            onDeleteEquipement(equipementId);
            if (addNotification) {
                addNotification(`${equipement.nom} supprimé avec succès`, 'success');
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
                {/* Header avec logo - Navy Blue comme le principal */}
                <div className="bg-gray-900">
                    <div className="flex items-center justify-between p-6 border-b border-gray-700">
                        <div className="flex items-center gap-4">
                            <Logo size="normal" showText={false} />
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center">
                                    <Icon name="building" className="mr-2" size={24} />
                                    {succursale ? `Succursale: ${succursale.nom}` : 'Nouvelle Succursale'}
                                </h2>
                                <p className="text-sm text-gray-300">Gestion des succursales et du personnel C-Secur360</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
                            title="Fermer"
                        >
                            <Icon name="close" size={24} />
                        </button>
                    </div>

                    {/* Onglets si on modifie une succursale existante */}
                    {succursale && (
                        <div className="flex border-b border-gray-700 px-6">
                            <button
                                onClick={() => setActiveSection('info')}
                                className={`py-3 px-6 font-medium text-sm transition-all ${
                                    activeSection === 'info'
                                        ? 'text-white border-b-2 border-blue-400'
                                        : 'text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                <Icon name="info" size={16} className="inline mr-2" />
                                Informations succursale
                            </button>
                            <button
                                onClick={() => setActiveSection('personnel')}
                                className={`py-3 px-6 font-medium text-sm transition-all ${
                                    activeSection === 'personnel'
                                        ? 'text-white border-b-2 border-blue-400'
                                        : 'text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                <Icon name="user" size={16} className="inline mr-2" />
                                Personnel ({getPersonnelSuccursale().length})
                            </button>
                            <button
                                onClick={() => setActiveSection('equipement')}
                                className={`py-3 px-6 font-medium text-sm transition-all ${
                                    activeSection === 'equipement'
                                        ? 'text-white border-b-2 border-blue-400'
                                        : 'text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                <Icon name="truck" size={16} className="inline mr-2" />
                                Équipements ({getEquipementsSuccursale().length})
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
                    {/* Section Informations Succursale */}
                    {activeSection === 'info' && (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Section: Informations générales */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Icon name="info" className="mr-2" size={20} />
                                Informations générales
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nom de la succursale *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nom}
                                        onChange={(e) => handleInputChange('nom', e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ex: C-Secur360 Sherbrooke"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Responsable
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.responsable}
                                        onChange={(e) => handleInputChange('responsable', e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ex: Jean Dupont"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre d'employés
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.nombreEmployes}
                                        onChange={(e) => handleInputChange('nombreEmployes', e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ex: 15"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Statut
                                    </label>
                                    <div className="flex items-center space-x-4">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={formData.actif}
                                                onChange={() => handleInputChange('actif', true)}
                                                className="mr-2"
                                            />
                                            <span className="text-green-600">🟢 Actif</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={!formData.actif}
                                                onChange={() => handleInputChange('actif', false)}
                                                className="mr-2"
                                            />
                                            <span className="text-red-600">🔴 Inactif</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Adresse */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Icon name="location" className="mr-2" size={20} />
                                Adresse
                            </h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Adresse complète *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.adresse}
                                        onChange={(e) => handleInputChange('adresse', e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ex: 123 Rue Principale"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ville *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.ville}
                                            onChange={(e) => handleInputChange('ville', e.target.value)}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Ex: Sherbrooke"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Province
                                        </label>
                                        <select
                                            value={formData.province}
                                            onChange={(e) => handleInputChange('province', e.target.value)}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            {provinces.map(province => (
                                                <option key={province.code} value={province.code}>
                                                    {province.nom}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Code postal
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.codePostal}
                                            onChange={(e) => handleInputChange('codePostal', formatCodePostal(e.target.value))}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Ex: J1H 2G3"
                                            maxLength="7"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Contact */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Icon name="phone" className="mr-2" size={20} />
                                Informations de contact
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Téléphone
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            value={formData.telephone}
                                            onChange={(e) => handleInputChange('telephone', e.target.value)}
                                            className="w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="(819) 546-6454"
                                        />
                                        {formData.telephone && (
                                            <a
                                                href={`tel:+1${formData.telephone.replace(/\D/g, '')}`}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800"
                                                title="Appeler"
                                            >
                                                <Icon name="phone" size={20} />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Fax
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            value={formData.fax}
                                            onChange={(e) => handleInputChange('fax', e.target.value)}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="(819) 546-6455"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="sherbrooke@c-secur360.com"
                                        />
                                        {formData.email && (
                                            <a
                                                href={`mailto:${formData.email}`}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800"
                                                title="Envoyer un courriel"
                                            >
                                                <Icon name="email" size={20} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Couleur d'affichage */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Icon name="palette" className="mr-2" size={20} />
                                Couleur d'affichage calendrier
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Couleur personnalisée
                                    </label>
                                    <div className="flex items-center space-x-4">
                                        <div className="relative">
                                            <input
                                                type="color"
                                                value={formData.couleur}
                                                onChange={(e) => handleInputChange('couleur', e.target.value)}
                                                className="w-16 h-12 border-2 border-gray-300 rounded-lg cursor-pointer shadow-sm"
                                                title="Choisir une couleur personnalisée"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={formData.couleur}
                                                onChange={(e) => handleInputChange('couleur', e.target.value)}
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                                                placeholder="#1E40AF"
                                                pattern="^#[0-9A-Fa-f]{6}$"
                                            />
                                        </div>
                                        <div
                                            className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
                                            style={{ backgroundColor: formData.couleur }}
                                            title="Aperçu de la couleur"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Couleurs prédéfinies
                                    </label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {couleursPredefinies.map(couleur => (
                                            <button
                                                key={couleur}
                                                type="button"
                                                onClick={() => handleInputChange('couleur', couleur)}
                                                className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                                                    formData.couleur === couleur ? 'border-gray-800 shadow-lg' : 'border-gray-300'
                                                }`}
                                                style={{ backgroundColor: couleur }}
                                                title={couleur}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Notes */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Icon name="note" className="mr-2" size={20} />
                                Notes et commentaires
                            </h3>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                                placeholder="Ajoutez des notes sur cette succursale..."
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center pt-6 border-t bg-white sticky bottom-0">
                            {succursale && onDelete && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                >
                                    <Icon name="trash" size={16} />
                                    Supprimer
                                </button>
                            )}

                            <div className="flex space-x-4 ml-auto">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex items-center gap-2 px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    <Icon name="close" size={16} />
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Icon name="loading" size={16} className="animate-spin" />
                                            Sauvegarde...
                                        </>
                                    ) : (
                                        <>
                                            <Icon name="save" size={16} />
                                            Sauvegarder
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                    )}

                    {/* Section Personnel */}
                    {activeSection === 'personnel' && succursale && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Personnel de {succursale.nom}
                                </h3>
                                <button
                                    onClick={handleAddPersonnel}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Icon name="plus" size={16} />
                                    Ajouter un employé
                                </button>
                            </div>

                            {/* Liste du personnel */}
                            {getPersonnelSuccursale().length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <Icon name="user" size={48} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500 text-lg mb-2">Aucun employé dans cette succursale</p>
                                    <p className="text-gray-400 text-sm">Cliquez sur "Ajouter un employé" pour commencer</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {getPersonnelSuccursale().map(person => (
                                        <div
                                            key={person.id}
                                            className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-900 text-lg">
                                                        {person.prenom} {person.nom}
                                                    </h4>
                                                    <div className="mt-2 space-y-1">
                                                        <p className="text-sm text-gray-600">
                                                            <Icon name="briefcase" size={14} className="inline mr-2" />
                                                            {person.poste}
                                                        </p>
                                                        {person.departement && (
                                                            <p className="text-sm text-gray-600">
                                                                <Icon name="building" size={14} className="inline mr-2" />
                                                                {person.departement}
                                                            </p>
                                                        )}
                                                        {person.telephone && (
                                                            <p className="text-sm text-gray-600">
                                                                <Icon name="phone" size={14} className="inline mr-2" />
                                                                {person.telephone}
                                                            </p>
                                                        )}
                                                        {person.email && (
                                                            <p className="text-sm text-gray-600">
                                                                <Icon name="mail" size={14} className="inline mr-2" />
                                                                {person.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="mt-3 flex gap-2">
                                                        {person.niveauAcces && (
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                person.niveauAcces === 'administration' ? 'bg-purple-100 text-purple-800' :
                                                                person.niveauAcces === 'coordination' ? 'bg-blue-100 text-blue-800' :
                                                                person.niveauAcces === 'modification' ? 'bg-green-100 text-green-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {person.niveauAcces}
                                                            </span>
                                                        )}
                                                        {person.disponible !== false && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                Disponible
                                                            </span>
                                                        )}
                                                        {person.disponible === false && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                Indisponible
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 ml-4">
                                                    <button
                                                        onClick={() => handleEditPersonnel(person)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Modifier"
                                                    >
                                                        <Icon name="edit" size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePersonnel(person.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Supprimer"
                                                    >
                                                        <Icon name="trash" size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Section Équipements */}
                    {activeSection === 'equipement' && succursale && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Équipements de {succursale.nom}
                                </h3>
                                <button
                                    onClick={handleAddEquipement}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <Icon name="plus" size={16} />
                                    Ajouter un équipement
                                </button>
                            </div>

                            {/* Liste des équipements */}
                            {getEquipementsSuccursale().length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <Icon name="truck" size={48} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500 text-lg mb-2">Aucun équipement dans cette succursale</p>
                                    <p className="text-gray-400 text-sm">Cliquez sur "Ajouter un équipement" pour commencer</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {getEquipementsSuccursale().map(equipement => (
                                        <div
                                            key={equipement.id}
                                            className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-4 h-4 rounded-full"
                                                            style={{ backgroundColor: equipement.couleur || '#10B981' }}
                                                        />
                                                        <h4 className="font-semibold text-gray-900 text-lg">
                                                            {equipement.nom}
                                                        </h4>
                                                    </div>
                                                    <div className="mt-2 space-y-1">
                                                        {equipement.type && (
                                                            <p className="text-sm text-gray-600">
                                                                <Icon name="tag" size={14} className="inline mr-2" />
                                                                {equipement.type}
                                                            </p>
                                                        )}
                                                        {equipement.marque && (
                                                            <p className="text-sm text-gray-600">
                                                                <Icon name="briefcase" size={14} className="inline mr-2" />
                                                                {equipement.marque} {equipement.modele && `- ${equipement.modele}`}
                                                            </p>
                                                        )}
                                                        {equipement.numeroSerie && (
                                                            <p className="text-sm text-gray-600">
                                                                <Icon name="hash" size={14} className="inline mr-2" />
                                                                N/S: {equipement.numeroSerie}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="mt-3 flex gap-2">
                                                        {equipement.disponible !== false ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                Disponible
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                Indisponible
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 ml-4">
                                                    <button
                                                        onClick={() => handleEditEquipement(equipement)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Modifier"
                                                    >
                                                        <Icon name="edit" size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteEquipement(equipement.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Supprimer"
                                                    >
                                                        <Icon name="trash" size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Modal Personnel */}
                {showPersonnelModal && (
                    <PersonnelModal
                        isOpen={showPersonnelModal}
                        onClose={() => {
                            setShowPersonnelModal(false);
                            setSelectedPersonnel(null);
                        }}
                        onSave={(personnelData) => {
                            // Forcer la succursale à être celle du modal
                            const dataAvecSuccursale = {
                                ...personnelData,
                                succursale: succursale.nom
                            };
                            onSavePersonnel(dataAvecSuccursale);
                            setShowPersonnelModal(false);
                            setSelectedPersonnel(null);
                            if (addNotification) {
                                addNotification(
                                    `${personnelData.prenom} ${personnelData.nom} ${selectedPersonnel ? 'modifié' : 'ajouté'} avec succès`,
                                    'success'
                                );
                            }
                        }}
                        personnel={selectedPersonnel}
                        postes={postes}
                        succursales={succursales}
                        departements={departements}
                        forceSuccursale={succursale?.nom} // Forcer la succursale actuelle
                    />
                )}

                {/* Modal Équipement */}
                {showEquipementModal && (
                    <EquipementModal
                        isOpen={showEquipementModal}
                        onClose={() => {
                            setShowEquipementModal(false);
                            setSelectedEquipement(null);
                        }}
                        onSave={(equipementData) => {
                            // Forcer la succursale à être celle du modal
                            const dataAvecSuccursale = {
                                ...equipementData,
                                succursale: succursale.nom
                            };
                            onSaveEquipement(dataAvecSuccursale);
                            setShowEquipementModal(false);
                            setSelectedEquipement(null);
                            if (addNotification) {
                                addNotification(
                                    `${equipementData.nom} ${selectedEquipement ? 'modifié' : 'ajouté'} avec succès`,
                                    'success'
                                );
                            }
                        }}
                        equipement={selectedEquipement}
                    />
                )}
            </div>
        </div>
    );
}