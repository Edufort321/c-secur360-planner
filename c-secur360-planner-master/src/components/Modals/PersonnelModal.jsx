// ============== MODAL GESTION DU PERSONNEL VERSION ORIGINALE ==============
// Reproduction exacte du système de gestion du personnel avec photos et permissions

import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { Icon } from '../UI/Icon';
import { DropZone } from '../UI/DropZone';

export function PersonnelModal({
    isOpen,
    onClose,
    personnel,
    onSave,
    onDelete,
    addNotification,
    utilisateurConnecte,
    peutModifier = true,
    estCoordonnateur = false
}) {
    // ===== ÉTATS PRINCIPAUX =====
    const [formData, setFormData] = useState({
        id: null,
        nom: '',
        prenom: '',
        poste: '',
        succursale: 'Thetford',
        telephone: '',
        cellulaire: '',
        email: '',
        dateEmbauche: '',
        salaire: '',
        tauxHoraire: '',
        statut: 'actif', // 'actif', 'inactif', 'conge', 'maladie'
        competences: [],
        certifications: [],
        formations: [],
        photo: null,
        photoUrl: '',

        // Disponibilité
        heuresNormales: {
            lundi: { debut: '08:00', fin: '17:00', actif: true },
            mardi: { debut: '08:00', fin: '17:00', actif: true },
            mercredi: { debut: '08:00', fin: '17:00', actif: true },
            jeudi: { debut: '08:00', fin: '17:00', actif: true },
            vendredi: { debut: '08:00', fin: '17:00', actif: true },
            samedi: { debut: '08:00', fin: '17:00', actif: false },
            dimanche: { debut: '08:00', fin: '17:00', actif: false }
        },
        disponibleWeekendsUrgence: false,
        disponibleNuit: false,
        disponibleVoyage: true,

        // Permissions et accès
        permissions: {
            peutModifier: false,
            estCoordonnateur: false,
            peutApprouverConges: false,
            peutVoirRapports: false,
            peutGererPersonnel: false,
            peutGererEquipements: false
        },
        motDePasse: '',
        dernierAcces: null,

        // Informations supplémentaires
        adresse: '',
        ville: '',
        codePostal: '',
        personneContact: '',
        telephoneUrgence: '',
        notesMedicales: '',
        allergies: '',

        // Système
        visibleChantier: true,
        couleurCalendrier: '#3b82f6',
        dateCreation: new Date().toISOString(),
        derniereModification: new Date().toISOString()
    });

    const [activeTab, setActiveTab] = useState('general');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [nouvelleCompetence, setNouvelleCompetence] = useState('');
    const [nouvelleCertification, setNouvelleCertification] = useState('');
    const [nouvelleFormation, setNouvelleFormation] = useState('');

    // ===== POSTES DISPONIBLES =====
    const postesDisponibles = [
        'Technicien Électrique',
        'Ingénieur',
        'Contremaître',
        'Apprenti',
        'Coordinateur',
        'Gestionnaire',
        'Secrétaire',
        'Autre'
    ];

    const succursalesDisponibles = [
        'Thetford',
        'Quebec',
        'Sherbrooke',
        'Trois-Rivières',
        'Montréal',
        'Gatineau'
    ];

    // ===== INITIALISATION =====
    useEffect(() => {
        if (isOpen && personnel) {
            // Édition d'un personnel existant
            setFormData({
                ...personnel,
                // Assurer la compatibilité avec les nouveaux champs
                permissions: {
                    peutModifier: false,
                    estCoordonnateur: false,
                    peutApprouverConges: false,
                    peutVoirRapports: false,
                    peutGererPersonnel: false,
                    peutGererEquipements: false,
                    ...personnel.permissions
                },
                heuresNormales: {
                    lundi: { debut: '08:00', fin: '17:00', actif: true },
                    mardi: { debut: '08:00', fin: '17:00', actif: true },
                    mercredi: { debut: '08:00', fin: '17:00', actif: true },
                    jeudi: { debut: '08:00', fin: '17:00', actif: true },
                    vendredi: { debut: '08:00', fin: '17:00', actif: true },
                    samedi: { debut: '08:00', fin: '17:00', actif: false },
                    dimanche: { debut: '08:00', fin: '17:00', actif: false },
                    ...personnel.heuresNormales
                },
                competences: personnel.competences || [],
                certifications: personnel.certifications || [],
                formations: personnel.formations || []
            });
        } else if (isOpen) {
            // Nouveau personnel - réinitialiser
            setFormData({
                ...formData,
                id: null,
                nom: '',
                prenom: '',
                poste: '',
                telephone: '',
                cellulaire: '',
                email: '',
                motDePasse: '',
                couleurCalendrier: `#${Math.floor(Math.random()*16777215).toString(16)}`
            });
        }
        setActiveTab('general');
    }, [isOpen, personnel]);

    // ===== GESTION DES PHOTOS =====
    const handlePhotoAdded = (files) => {
        const file = files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setFormData(prev => ({
                    ...prev,
                    photo: file,
                    photoUrl: e.target.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const supprimerPhoto = () => {
        setFormData(prev => ({
            ...prev,
            photo: null,
            photoUrl: ''
        }));
    };

    // ===== GESTION DES LISTES =====
    const ajouterCompetence = () => {
        if (nouvelleCompetence.trim() && !formData.competences.includes(nouvelleCompetence.trim())) {
            setFormData(prev => ({
                ...prev,
                competences: [...prev.competences, nouvelleCompetence.trim()]
            }));
            setNouvelleCompetence('');
        }
    };

    const supprimerCompetence = (competence) => {
        setFormData(prev => ({
            ...prev,
            competences: prev.competences.filter(c => c !== competence)
        }));
    };

    const ajouterCertification = () => {
        if (nouvelleCertification.trim() && !formData.certifications.includes(nouvelleCertification.trim())) {
            setFormData(prev => ({
                ...prev,
                certifications: [...prev.certifications, nouvelleCertification.trim()]
            }));
            setNouvelleCertification('');
        }
    };

    const supprimerCertification = (certification) => {
        setFormData(prev => ({
            ...prev,
            certifications: prev.certifications.filter(c => c !== certification)
        }));
    };

    const ajouterFormation = () => {
        if (nouvelleFormation.trim() && !formData.formations.includes(nouvelleFormation.trim())) {
            setFormData(prev => ({
                ...prev,
                formations: [...prev.formations, nouvelleFormation.trim()]
            }));
            setNouvelleFormation('');
        }
    };

    const supprimerFormation = (formation) => {
        setFormData(prev => ({
            ...prev,
            formations: prev.formations.filter(f => f !== formation)
        }));
    };

    // ===== VALIDATION =====
    const validerFormulaire = () => {
        if (!formData.nom.trim()) {
            addNotification('Le nom est requis', 'error');
            return false;
        }

        if (!formData.prenom.trim()) {
            addNotification('Le prénom est requis', 'error');
            return false;
        }

        if (!formData.poste.trim()) {
            addNotification('Le poste est requis', 'error');
            return false;
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            addNotification('Format d\'email invalide', 'error');
            return false;
        }

        if (!personnel && !formData.motDePasse.trim()) {
            addNotification('Un mot de passe est requis pour un nouvel employé', 'error');
            return false;
        }

        return true;
    };

    // ===== SAUVEGARDE =====
    const handleSave = async () => {
        if (!validerFormulaire()) return;

        setIsSubmitting(true);

        try {
            const personnelData = {
                ...formData,
                derniereModification: new Date().toISOString(),
                // Générer un nom complet pour l'affichage
                nomComplet: `${formData.prenom} ${formData.nom}`
            };

            await onSave(personnelData);
            addNotification(
                `${personnel ? 'Personnel modifié' : 'Personnel créé'}: ${formData.prenom} ${formData.nom}`,
                'success'
            );
            onClose();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            addNotification('Erreur lors de la sauvegarde', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ===== SUPPRESSION =====
    const handleDelete = async () => {
        try {
            await onDelete(personnel.id);
            addNotification(`Personnel supprimé: ${personnel.prenom} ${personnel.nom}`, 'success');
            onClose();
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            addNotification('Erreur lors de la suppression', 'error');
        }
        setShowDeleteConfirm(false);
    };

    // ===== RENDU =====
    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={personnel ? `Modifier - ${personnel.prenom} ${personnel.nom}` : 'Nouveau Personnel'}
            size="xl"
        >
            <div className="space-y-6">
                {/* Onglets */}
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8">
                        {[
                            { id: 'general', label: 'Général', icon: 'user' },
                            { id: 'competences', label: 'Compétences', icon: 'star' },
                            { id: 'horaires', label: 'Horaires', icon: 'clock' },
                            { id: 'permissions', label: 'Permissions', icon: 'shield' },
                            { id: 'contact', label: 'Contact', icon: 'phone' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Icon name={tab.icon} size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Contenu des onglets */}
                <div className="min-h-[500px]">
                    {/* ONGLET GÉNÉRAL */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            {/* Photo et informations de base */}
                            <div className="flex gap-6">
                                {/* Photo */}
                                <div className="flex-shrink-0">
                                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                                        {formData.photoUrl ? (
                                            <div className="relative w-full h-full">
                                                <img
                                                    src={formData.photoUrl}
                                                    alt="Photo personnel"
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    onClick={supprimerPhoto}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                >
                                                    <Icon name="close" size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <DropZone
                                                onFilesAdded={handlePhotoAdded}
                                                acceptedTypes="image/*"
                                                maxSizeMB={5}
                                                multiple={false}
                                                className="w-full h-full flex items-center justify-center text-center"
                                            >
                                                <div>
                                                    <Icon name="camera" size={24} className="mx-auto mb-2 text-gray-400" />
                                                    <p className="text-xs text-gray-500">Photo</p>
                                                </div>
                                            </DropZone>
                                        )}
                                    </div>
                                </div>

                                {/* Informations de base */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Prénom *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.prenom}
                                            onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Prénom..."
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nom *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.nom}
                                            onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Nom de famille..."
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Poste *
                                        </label>
                                        <select
                                            value={formData.poste}
                                            onChange={(e) => setFormData(prev => ({ ...prev, poste: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        >
                                            <option value="">Sélectionner un poste...</option>
                                            {postesDisponibles.map(poste => (
                                                <option key={poste} value={poste}>{poste}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Succursale
                                        </label>
                                        <select
                                            value={formData.succursale}
                                            onChange={(e) => setFormData(prev => ({ ...prev, succursale: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {succursalesDisponibles.map(succursale => (
                                                <option key={succursale} value={succursale}>{succursale}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Date d'embauche
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.dateEmbauche}
                                            onChange={(e) => setFormData(prev => ({ ...prev, dateEmbauche: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Statut
                                        </label>
                                        <select
                                            value={formData.statut}
                                            onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="actif">✅ Actif</option>
                                            <option value="inactif">⏸️ Inactif</option>
                                            <option value="conge">🏖️ En congé</option>
                                            <option value="maladie">🤒 Maladie</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Informations financières */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Taux horaire ($)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.tauxHoraire}
                                        onChange={(e) => setFormData(prev => ({ ...prev, tauxHoraire: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ex: 25.00"
                                        step="0.01"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Salaire annuel ($)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.salaire}
                                        onChange={(e) => setFormData(prev => ({ ...prev, salaire: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ex: 50000"
                                    />
                                </div>
                            </div>

                            {/* Authentification */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-medium text-gray-900 mb-3">Accès système</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mot de passe {!personnel && '*'}
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.motDePasse}
                                            onChange={(e) => setFormData(prev => ({ ...prev, motDePasse: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            placeholder={personnel ? "Laisser vide pour ne pas changer" : "Mot de passe..."}
                                            required={!personnel}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Couleur calendrier
                                        </label>
                                        <input
                                            type="color"
                                            value={formData.couleurCalendrier}
                                            onChange={(e) => setFormData(prev => ({ ...prev, couleurCalendrier: e.target.value }))}
                                            className="w-full h-10 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mt-3">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.visibleChantier}
                                            onChange={(e) => setFormData(prev => ({ ...prev, visibleChantier: e.target.checked }))}
                                            className="mr-2"
                                        />
                                        <span className="text-sm">Visible sur le calendrier</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ONGLET COMPÉTENCES */}
                    {activeTab === 'competences' && (
                        <div className="space-y-6">
                            {/* Compétences */}
                            <div>
                                <h3 className="font-medium text-gray-900 mb-3">Compétences</h3>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={nouvelleCompetence}
                                        onChange={(e) => setNouvelleCompetence(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ajouter une compétence..."
                                        onKeyPress={(e) => e.key === 'Enter' && ajouterCompetence()}
                                    />
                                    <button
                                        onClick={ajouterCompetence}
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        <Icon name="plus" size={16} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.competences.map(competence => (
                                        <span key={competence} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                                            {competence}
                                            <button
                                                onClick={() => supprimerCompetence(competence)}
                                                className="hover:text-blue-600"
                                            >
                                                <Icon name="close" size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Certifications */}
                            <div>
                                <h3 className="font-medium text-gray-900 mb-3">Certifications</h3>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={nouvelleCertification}
                                        onChange={(e) => setNouvelleCertification(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ajouter une certification..."
                                        onKeyPress={(e) => e.key === 'Enter' && ajouterCertification()}
                                    />
                                    <button
                                        onClick={ajouterCertification}
                                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                    >
                                        <Icon name="plus" size={16} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.certifications.map(certification => (
                                        <span key={certification} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-2">
                                            {certification}
                                            <button
                                                onClick={() => supprimerCertification(certification)}
                                                className="hover:text-green-600"
                                            >
                                                <Icon name="close" size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Formations */}
                            <div>
                                <h3 className="font-medium text-gray-900 mb-3">Formations</h3>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={nouvelleFormation}
                                        onChange={(e) => setNouvelleFormation(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ajouter une formation..."
                                        onKeyPress={(e) => e.key === 'Enter' && ajouterFormation()}
                                    />
                                    <button
                                        onClick={ajouterFormation}
                                        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                                    >
                                        <Icon name="plus" size={16} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.formations.map(formation => (
                                        <span key={formation} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center gap-2">
                                            {formation}
                                            <button
                                                onClick={() => supprimerFormation(formation)}
                                                className="hover:text-purple-600"
                                            >
                                                <Icon name="close" size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ONGLET HORAIRES */}
                    {activeTab === 'horaires' && (
                        <div className="space-y-6">
                            <h3 className="font-medium text-gray-900 mb-4">Horaires de travail</h3>

                            <div className="space-y-3">
                                {Object.entries(formData.heuresNormales).map(([jour, horaire]) => (
                                    <div key={jour} className="flex items-center gap-4 p-3 border rounded-lg">
                                        <div className="w-20">
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={horaire.actif}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        heuresNormales: {
                                                            ...prev.heuresNormales,
                                                            [jour]: { ...horaire, actif: e.target.checked }
                                                        }
                                                    }))}
                                                    className="mr-2"
                                                />
                                                <span className="text-sm font-medium capitalize">{jour}</span>
                                            </label>
                                        </div>

                                        {horaire.actif && (
                                            <>
                                                <div>
                                                    <input
                                                        type="time"
                                                        value={horaire.debut}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            heuresNormales: {
                                                                ...prev.heuresNormales,
                                                                [jour]: { ...horaire, debut: e.target.value }
                                                            }
                                                        }))}
                                                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                                                    />
                                                </div>
                                                <span className="text-gray-500">à</span>
                                                <div>
                                                    <input
                                                        type="time"
                                                        value={horaire.fin}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            heuresNormales: {
                                                                ...prev.heuresNormales,
                                                                [jour]: { ...horaire, fin: e.target.value }
                                                            }
                                                        }))}
                                                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-900">Disponibilités spéciales</h4>
                                <div className="space-y-2">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.disponibleWeekendsUrgence}
                                            onChange={(e) => setFormData(prev => ({ ...prev, disponibleWeekendsUrgence: e.target.checked }))}
                                            className="mr-2"
                                        />
                                        <span className="text-sm">Disponible weekends (urgence)</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.disponibleNuit}
                                            onChange={(e) => setFormData(prev => ({ ...prev, disponibleNuit: e.target.checked }))}
                                            className="mr-2"
                                        />
                                        <span className="text-sm">Disponible travail de nuit</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.disponibleVoyage}
                                            onChange={(e) => setFormData(prev => ({ ...prev, disponibleVoyage: e.target.checked }))}
                                            className="mr-2"
                                        />
                                        <span className="text-sm">Disponible pour voyager</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ONGLET PERMISSIONS */}
                    {activeTab === 'permissions' && (
                        <div className="space-y-6">
                            <h3 className="font-medium text-gray-900 mb-4">Permissions et accès</h3>

                            {estCoordonnateur ? (
                                <div className="space-y-4">
                                    {[
                                        { key: 'peutModifier', label: 'Peut modifier les données', desc: 'Créer, modifier et supprimer des jobs' },
                                        { key: 'estCoordonnateur', label: 'Coordinateur', desc: 'Accès complet à toutes les fonctionnalités' },
                                        { key: 'peutApprouverConges', label: 'Peut approuver les congés', desc: 'Valider ou refuser les demandes de congés' },
                                        { key: 'peutVoirRapports', label: 'Peut voir les rapports', desc: 'Accès aux statistiques et rapports' },
                                        { key: 'peutGererPersonnel', label: 'Peut gérer le personnel', desc: 'Ajouter, modifier et supprimer des employés' },
                                        { key: 'peutGererEquipements', label: 'Peut gérer les équipements', desc: 'Gérer les équipements et leur maintenance' }
                                    ].map(permission => (
                                        <div key={permission.key} className="flex items-start gap-3 p-3 border rounded-lg">
                                            <input
                                                type="checkbox"
                                                checked={formData.permissions[permission.key]}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    permissions: {
                                                        ...prev.permissions,
                                                        [permission.key]: e.target.checked
                                                    }
                                                }))}
                                                className="mt-1"
                                            />
                                            <div>
                                                <div className="font-medium text-gray-900">{permission.label}</div>
                                                <div className="text-sm text-gray-600">{permission.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <p className="text-sm text-yellow-800">
                                        Seuls les coordinateurs peuvent modifier les permissions d'accès.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ONGLET CONTACT */}
                    {activeTab === 'contact' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Téléphone bureau
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.telephone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="(418) 123-4567"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cellulaire
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.cellulaire}
                                        onChange={(e) => setFormData(prev => ({ ...prev, cellulaire: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="(418) 123-4567"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="nom@example.com"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Adresse
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.adresse}
                                        onChange={(e) => setFormData(prev => ({ ...prev, adresse: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="123 Rue Example"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ville
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.ville}
                                        onChange={(e) => setFormData(prev => ({ ...prev, ville: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Thetford Mines"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Code postal
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.codePostal}
                                        onChange={(e) => setFormData(prev => ({ ...prev, codePostal: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="G1X 1X1"
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-medium text-gray-900 mb-3">Contact d'urgence</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Personne à contacter
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.personneContact}
                                            onChange={(e) => setFormData(prev => ({ ...prev, personneContact: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Nom du contact..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Téléphone d'urgence
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.telephoneUrgence}
                                            onChange={(e) => setFormData(prev => ({ ...prev, telephoneUrgence: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="(418) 123-4567"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-medium text-gray-900 mb-3">Informations médicales</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Notes médicales
                                        </label>
                                        <textarea
                                            value={formData.notesMedicales}
                                            onChange={(e) => setFormData(prev => ({ ...prev, notesMedicales: e.target.value }))}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Restrictions, limitations..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Allergies
                                        </label>
                                        <textarea
                                            value={formData.allergies}
                                            onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Allergies connues..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-6 border-t">
                    <div>
                        {personnel && peutModifier && (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Supprimer
                            </button>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                        >
                            Annuler
                        </button>

                        {peutModifier && (
                            <button
                                onClick={handleSave}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Sauvegarde...' : (personnel ? 'Modifier' : 'Créer')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Modal de confirmation de suppression */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Confirmer la suppression
                            </h3>
                            <p className="text-sm text-gray-600 mb-6">
                                Êtes-vous sûr de vouloir supprimer {personnel?.prenom} {personnel?.nom} ? Cette action est irréversible.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}