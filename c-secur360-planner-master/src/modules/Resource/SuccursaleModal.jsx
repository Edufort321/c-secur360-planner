import { useState, useEffect } from 'react';
import { Icon } from '../../components/UI/Icon';
import { Logo } from '../../components/UI/Logo';

export function SuccursaleModal({ isOpen, onClose, onSave, onDelete, succursale = null, succursales = [] }) {
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

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
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
                id: succursale?.id || Date.now(),
                nom: formData.nom.trim(),
                adresse: formData.adresse.trim(),
                ville: formData.ville.trim(),
                dateCreation: succursale?.dateCreation || new Date().toISOString(),
                dateModification: new Date().toISOString()
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
                {/* Header avec logo - Navy Blue comme le principal */}
                <div className="flex items-center justify-between p-6 border-b bg-gray-900">
                    <div className="flex items-center gap-4">
                        <Logo size="normal" showText={false} />
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center">
                                <Icon name="building" className="mr-2" size={24} />
                                {succursale ? 'Modifier la Succursale' : 'Nouvelle Succursale'}
                            </h2>
                            <p className="text-sm text-gray-300">Gestion des succursales C-Secur360</p>
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

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
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
                                    <input
                                        type="tel"
                                        value={formData.telephone}
                                        onChange={(e) => handleInputChange('telephone', e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ex: (819) 555-0123"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Fax
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.fax}
                                        onChange={(e) => handleInputChange('fax', e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ex: (819) 555-0124"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ex: sherbrooke@c-secur360.com"
                                    />
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
                </div>
            </div>
        </div>
    );
}