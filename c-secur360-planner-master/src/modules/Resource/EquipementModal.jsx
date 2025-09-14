import { useState, useEffect } from 'react';
import { Icon } from '../../components/UI/Icon';

export function EquipementModal({ isOpen, onClose, equipement = null, onSave, onDelete }) {
    const [formData, setFormData] = useState({
        nom: '',
        type: '',
        disponible: true,
        couleur: '#10B981',
        numeroSerie: '',
        marque: '',
        modele: '',
        dateAchat: '',
        coutLocation: '',
        prochaineMaintenance: '',
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const couleursPredefinies = [
        '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6',
        '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ];

    const typesPredefinies = [
        'Véhicule', 'Outil électrique', 'Outil manuel', 'Équipement sécurité',
        'Matériel électrique', 'Matériel plomberie', 'Échafaudage',
        'Grue', 'Compresseur', 'Générateur', 'Pompe', 'Soudure',
        'Mesure', 'Informatique', 'Autre'
    ];

    const marquesPredefinies = [
        'Bosch', 'Makita', 'DeWalt', 'Milwaukee', 'Hilti', 'Festool',
        'Metabo', 'Ryobi', 'Black & Decker', 'Stanley', 'Klein Tools',
        'Fluke', 'Caterpillar', 'John Deere', 'Ford', 'Chevrolet',
        'RAM', 'Isuzu', 'Freightliner', 'Peterbilt'
    ];

    useEffect(() => {
        if (equipement) {
            setFormData({
                nom: equipement.nom || '',
                type: equipement.type || '',
                disponible: equipement.disponible !== false,
                couleur: equipement.couleur || '#10B981',
                numeroSerie: equipement.numeroSerie || '',
                marque: equipement.marque || '',
                modele: equipement.modele || '',
                dateAchat: equipement.dateAchat ?
                    (typeof equipement.dateAchat === 'string' ?
                        equipement.dateAchat.split('T')[0] :
                        equipement.dateAchat.toISOString().split('T')[0]
                    ) : '',
                coutLocation: equipement.coutLocation || '',
                prochaineMaintenance: equipement.prochaineMaintenance ?
                    (typeof equipement.prochaineMaintenance === 'string' ?
                        equipement.prochaineMaintenance.split('T')[0] :
                        equipement.prochaineMaintenance.toISOString().split('T')[0]
                    ) : '',
                notes: equipement.notes || ''
            });
        } else {
            // Réinitialiser pour nouvel équipement
            setFormData({
                nom: '',
                type: '',
                disponible: true,
                couleur: couleursPredefinies[Math.floor(Math.random() * couleursPredefinies.length)],
                numeroSerie: '',
                marque: '',
                modele: '',
                dateAchat: '',
                coutLocation: '',
                prochaineMaintenance: '',
                notes: ''
            });
        }
    }, [equipement, isOpen]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nom.trim()) {
            alert('Le nom de l\'équipement est requis');
            return;
        }

        setIsSubmitting(true);

        try {
            const equipementData = {
                ...formData,
                nom: formData.nom.trim(),
                id: equipement?.id || Date.now(),
                dateAchat: formData.dateAchat ? new Date(formData.dateAchat) : null,
                prochaineMaintenance: formData.prochaineMaintenance ? new Date(formData.prochaineMaintenance) : null,
                dateModification: new Date()
            };

            await onSave(equipementData);
            onClose();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Erreur lors de la sauvegarde de l\'équipement');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!equipement?.id) return;

        const confirmation = window.confirm(
            `Êtes-vous sûr de vouloir supprimer ${equipement.nom} ?\n\nCette action est irréversible.`
        );

        if (confirmation) {
            try {
                await onDelete(equipement.id);
                onClose();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                alert('Erreur lors de la suppression de l\'équipement');
            }
        }
    };

    const getIconByType = (type) => {
        switch (type?.toLowerCase()) {
            case 'véhicule': return 'truck';
            case 'outil électrique': return 'tool';
            case 'outil manuel': return 'tool';
            case 'équipement sécurité': return 'shield';
            case 'matériel électrique': return 'zap';
            case 'informatique': return 'laptop';
            case 'mesure': return 'target';
            default: return 'tool';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-600 to-green-700">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <Icon name={getIconByType(formData.type)} className="mr-2" size={24} />
                        {equipement ? 'Modifier l\'Équipement' : 'Nouvel Équipement'}
                    </h2>
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
                                    Nom de l'équipement *
                                </label>
                                <input
                                    type="text"
                                    value={formData.nom}
                                    onChange={(e) => handleInputChange('nom', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="Ex: Perceuse sans fil Makita"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type
                                </label>
                                <input
                                    type="text"
                                    list="types-list"
                                    value={formData.type}
                                    onChange={(e) => handleInputChange('type', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="Ex: Outil électrique"
                                />
                                <datalist id="types-list">
                                    {typesPredefinies.map(type => (
                                        <option key={type} value={type} />
                                    ))}
                                </datalist>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Marque
                                </label>
                                <input
                                    type="text"
                                    list="marques-list"
                                    value={formData.marque}
                                    onChange={(e) => handleInputChange('marque', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="Ex: Makita"
                                />
                                <datalist id="marques-list">
                                    {marquesPredefinies.map(marque => (
                                        <option key={marque} value={marque} />
                                    ))}
                                </datalist>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Modèle
                                </label>
                                <input
                                    type="text"
                                    value={formData.modele}
                                    onChange={(e) => handleInputChange('modele', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="Ex: XDT131"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Numéro de série
                                </label>
                                <input
                                    type="text"
                                    value={formData.numeroSerie}
                                    onChange={(e) => handleInputChange('numeroSerie', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="Ex: SNJ123456789"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date d'achat
                                </label>
                                <input
                                    type="date"
                                    value={formData.dateAchat}
                                    onChange={(e) => handleInputChange('dateAchat', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Coût de location ($/jour)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.coutLocation}
                                    onChange={(e) => handleInputChange('coutLocation', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="Ex: 25.50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Prochaine maintenance
                                </label>
                                <input
                                    type="date"
                                    value={formData.prochaineMaintenance}
                                    onChange={(e) => handleInputChange('prochaineMaintenance', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>

                        {/* Couleur et disponibilité */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Couleur d'affichage
                                </label>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="color"
                                        value={formData.couleur}
                                        onChange={(e) => handleInputChange('couleur', e.target.value)}
                                        className="w-12 h-10 border rounded cursor-pointer"
                                    />
                                    <div className="flex flex-wrap gap-1">
                                        {couleursPredefinies.map(couleur => (
                                            <button
                                                key={couleur}
                                                type="button"
                                                onClick={() => handleInputChange('couleur', couleur)}
                                                className={`w-6 h-6 rounded border-2 ${
                                                    formData.couleur === couleur ? 'border-gray-800' : 'border-gray-300'
                                                }`}
                                                style={{ backgroundColor: couleur }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Statut
                                </label>
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={formData.disponible}
                                            onChange={() => handleInputChange('disponible', true)}
                                            className="mr-2"
                                        />
                                        <span className="text-green-600">🟢 Disponible</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!formData.disponible}
                                            onChange={() => handleInputChange('disponible', false)}
                                            className="mr-2"
                                        />
                                        <span className="text-red-600">🔴 Indisponible</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Alert maintenance si proche */}
                        {formData.prochaineMaintenance && (
                            (() => {
                                const maintenanceDate = new Date(formData.prochaineMaintenance);
                                const today = new Date();
                                const diffTime = maintenanceDate - today;
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                if (diffDays <= 30 && diffDays >= 0) {
                                    return (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <div className="flex items-center">
                                                <Icon name="alert-triangle" className="text-yellow-600 mr-2" size={20} />
                                                <span className="text-yellow-800">
                                                    ⚠️ Maintenance prévue dans {diffDays} jour{diffDays > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                } else if (diffDays < 0) {
                                    return (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <div className="flex items-center">
                                                <Icon name="alert-triangle" className="text-red-600 mr-2" size={20} />
                                                <span className="text-red-800">
                                                    🚨 Maintenance en retard de {Math.abs(diffDays)} jour{Math.abs(diffDays) > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()
                        )}

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 h-24 resize-none"
                                placeholder="Ajoutez des notes sur cet équipement (maintenance, problèmes, etc.)"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between pt-4 border-t">
                            {equipement && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    🗑️ Supprimer
                                </button>
                            )}

                            <div className="flex space-x-3 ml-auto">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}