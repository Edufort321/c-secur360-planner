import { useState, useEffect } from 'react';
import { Icon } from '../../components/UI/Icon';

export function PersonnelModal({ isOpen, onClose, personnel = null, onSave, onDelete }) {
    const [formData, setFormData] = useState({
        nom: '',
        poste: '',
        specialites: [],
        disponible: true,
        couleur: '#3B82F6',
        telephone: '',
        email: '',
        dateEmbauche: '',
        salaire: '',
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [nouveauSpecialite, setNouveauSpecialite] = useState('');

    const couleursPredefinies = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
        '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ];

    const specialitesPredefinies = [
        'Électricien', 'Plombier', 'Chauffagiste', 'Menuisier', 'Peintre',
        'Carreleur', 'Maçon', 'Couvreur', 'Terrassier', 'Charpentier',
        'Technicien', 'Chef d\'équipe', 'Contremaître', 'Ingénieur',
        'Conducteur', 'Manoeuvre', 'Aide', 'Apprenti'
    ];

    const postesPredefinies = [
        'Chef de projet', 'Chef d\'équipe', 'Technicien senior', 'Technicien',
        'Apprenti', 'Stagiaire', 'Consultant', 'Superviseur', 'Coordinateur',
        'Responsable', 'Directeur', 'Adjoint', 'Assistant'
    ];

    useEffect(() => {
        if (personnel) {
            setFormData({
                nom: personnel.nom || '',
                poste: personnel.poste || '',
                specialites: personnel.specialites || [],
                disponible: personnel.disponible !== false,
                couleur: personnel.couleur || '#3B82F6',
                telephone: personnel.telephone || '',
                email: personnel.email || '',
                dateEmbauche: personnel.dateEmbauche ?
                    (typeof personnel.dateEmbauche === 'string' ?
                        personnel.dateEmbauche.split('T')[0] :
                        personnel.dateEmbauche.toISOString().split('T')[0]
                    ) : '',
                salaire: personnel.salaire || '',
                notes: personnel.notes || ''
            });
        } else {
            // Réinitialiser pour nouveau personnel
            setFormData({
                nom: '',
                poste: '',
                specialites: [],
                disponible: true,
                couleur: couleursPredefinies[Math.floor(Math.random() * couleursPredefinies.length)],
                telephone: '',
                email: '',
                dateEmbauche: '',
                salaire: '',
                notes: ''
            });
        }
        setNouveauSpecialite('');
    }, [personnel, isOpen]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
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
            alert('Le nom est requis');
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
            alert('Erreur lors de la sauvegarde du personnel');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!personnel?.id) return;

        const confirmation = window.confirm(
            `Êtes-vous sûr de vouloir supprimer ${personnel.nom} ?\n\nCette action est irréversible.`
        );

        if (confirmation) {
            try {
                await onDelete(personnel.id);
                onClose();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                alert('Erreur lors de la suppression du personnel');
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <Icon name="user" className="mr-2" size={24} />
                        {personnel ? 'Modifier le Personnel' : 'Nouveau Personnel'}
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
                                    Nom complet *
                                </label>
                                <input
                                    type="text"
                                    value={formData.nom}
                                    onChange={(e) => handleInputChange('nom', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: Jean Dupont"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Poste
                                </label>
                                <input
                                    type="text"
                                    list="postes-list"
                                    value={formData.poste}
                                    onChange={(e) => handleInputChange('poste', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: Chef d'équipe"
                                />
                                <datalist id="postes-list">
                                    {postesPredefinies.map(poste => (
                                        <option key={poste} value={poste} />
                                    ))}
                                </datalist>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Téléphone
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
                                    Email
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
                                    Date d'embauche
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
                                    Salaire (optionnel)
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
                                Spécialités
                            </label>

                            <div className="flex space-x-2 mb-3">
                                <input
                                    type="text"
                                    list="specialites-list"
                                    value={nouveauSpecialite}
                                    onChange={(e) => setNouveauSpecialite(e.target.value)}
                                    className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ajouter une spécialité..."
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

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                                placeholder="Ajoutez des notes sur ce personnel..."
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
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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