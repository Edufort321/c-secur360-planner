// ============== MODAL GESTION DES POSTES ==============
// Modal pour créer et modifier les postes de l'entreprise

import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { Icon } from '../UI/Icon';
import { Logo } from '../UI/Logo';

export function PosteModal({
    isOpen,
    onClose,
    onSave,
    poste = null,
    addNotification
}) {
    const [formData, setFormData] = useState({
        nom: '',
        departement: '',
        salaireMin: '',
        salaireMax: '',
        description: '',
        competencesRequises: [],
        responsabilites: []
    });

    const [nouvelleCompetence, setNouvelleCompetence] = useState('');
    const [nouvelleResponsabilite, setNouvelleResponsabilite] = useState('');
    const [nouveauDepartement, setNouveauDepartement] = useState('');
    const [departements, setDepartements] = useState([]);

    // Charger les départements depuis localStorage
    useEffect(() => {
        const savedDepartements = JSON.parse(localStorage.getItem('departements') || '[]');
        setDepartements(savedDepartements);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            if (poste) {
                // Mode édition
                setFormData({
                    id: poste.id,
                    nom: poste.nom || '',
                    departement: poste.departement || '',
                    salaireMin: poste.salaireMin || '',
                    salaireMax: poste.salaireMax || '',
                    description: poste.description || '',
                    competencesRequises: poste.competencesRequises || [],
                    responsabilites: poste.responsabilites || []
                });
            } else {
                // Mode création
                setFormData({
                    nom: '',
                    departement: '',
                    salaireMin: '',
                    salaireMax: '',
                    description: '',
                    competencesRequises: [],
                    responsabilites: []
                });
            }
        }
    }, [isOpen, poste]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const ajouterCompetence = () => {
        if (nouvelleCompetence.trim() && !formData.competencesRequises.includes(nouvelleCompetence.trim())) {
            setFormData(prev => ({
                ...prev,
                competencesRequises: [...prev.competencesRequises, nouvelleCompetence.trim()]
            }));
            setNouvelleCompetence('');
        }
    };

    const supprimerCompetence = (competence) => {
        setFormData(prev => ({
            ...prev,
            competencesRequises: prev.competencesRequises.filter(c => c !== competence)
        }));
    };

    const ajouterResponsabilite = () => {
        if (nouvelleResponsabilite.trim() && !formData.responsabilites.includes(nouvelleResponsabilite.trim())) {
            setFormData(prev => ({
                ...prev,
                responsabilites: [...prev.responsabilites, nouvelleResponsabilite.trim()]
            }));
            setNouvelleResponsabilite('');
        }
    };

    const supprimerResponsabilite = (responsabilite) => {
        setFormData(prev => ({
            ...prev,
            responsabilites: prev.responsabilites.filter(r => r !== responsabilite)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.nom.trim()) {
            addNotification('Le nom du poste est requis', 'error');
            return;
        }

        if (!formData.departement.trim()) {
            addNotification('Le département est requis', 'error');
            return;
        }

        onSave(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gray-900">
                    <div className="flex items-center gap-4">
                        <Logo size="normal" showText={false} />
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center">
                                <Icon name="briefcase" className="mr-2" size={24} />
                                {poste ? 'Modifier le Poste' : 'Nouveau Poste'}
                            </h2>
                            <p className="text-sm text-gray-300">Gestion des postes C-Secur360</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nom du poste *
                        </label>
                        <input
                            type="text"
                            name="nom"
                            value={formData.nom}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Ex: Technicien Électrique Senior"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Département *
                        </label>
                        <div className="flex gap-2">
                            <select
                                name="departement"
                                value={formData.departement}
                                onChange={handleInputChange}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Sélectionner un département</option>
                                {departements.map(dept => (
                                    <option key={dept.id || dept} value={dept.nom || dept}>{dept.nom || dept}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => {
                                    const nomDept = prompt('Nom du nouveau département:');
                                    if (nomDept && nomDept.trim()) {
                                        const nouveauDept = { id: Date.now(), nom: nomDept.trim() };
                                        const nouveauxDepartements = [...departements, nouveauDept];
                                        setDepartements(nouveauxDepartements);
                                        localStorage.setItem('departements', JSON.stringify(nouveauxDepartements));
                                        setFormData(prev => ({ ...prev, departement: nomDept.trim() }));
                                    }
                                }}
                                className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                                title="Ajouter un département"
                            >
                                <Icon name="plus" size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Salaire Min ($)
                            </label>
                            <input
                                type="number"
                                name="salaireMin"
                                value={formData.salaireMin}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="45000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Salaire Max ($)
                            </label>
                            <input
                                type="number"
                                name="salaireMax"
                                value={formData.salaireMax}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="75000"
                            />
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description du poste
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Description détaillée du poste, missions principales..."
                    />
                </div>

                {/* Compétences requises */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Compétences requises
                    </label>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={nouvelleCompetence}
                            onChange={(e) => setNouvelleCompetence(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Ex: Électricité industrielle, PLC..."
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterCompetence())}
                        />
                        <button
                            type="button"
                            onClick={ajouterCompetence}
                            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                        >
                            <Icon name="plus" size={16} />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.competencesRequises.map(competence => (
                            <span
                                key={competence}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                            >
                                {competence}
                                <button
                                    type="button"
                                    onClick={() => supprimerCompetence(competence)}
                                    className="text-indigo-600 hover:text-indigo-800"
                                >
                                    <Icon name="close" size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Responsabilités */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Responsabilités principales
                    </label>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={nouvelleResponsabilite}
                            onChange={(e) => setNouvelleResponsabilite(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Ex: Maintenance préventive des équipements..."
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterResponsabilite())}
                        />
                        <button
                            type="button"
                            onClick={ajouterResponsabilite}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                            <Icon name="plus" size={16} />
                        </button>
                    </div>
                    <div className="space-y-1">
                        {formData.responsabilites.map((responsabilite, index) => (
                            <div
                                key={responsabilite}
                                className="flex items-center justify-between p-2 bg-green-50 rounded border-l-4 border-green-400"
                            >
                                <span className="text-sm">{index + 1}. {responsabilite}</span>
                                <button
                                    type="button"
                                    onClick={() => supprimerResponsabilite(responsabilite)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    <Icon name="trash" size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-6 border-t">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                {poste ? '📝 Modifier' : '✨ Créer'} le Poste
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}