// ============== MODAL GESTION DES ÉQUIPEMENTS VERSION ORIGINALE ==============
// Reproduction exacte du système de gestion des équipements avec maintenance et statuts

import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { Icon } from '../UI/Icon';
import { DropZone } from '../UI/DropZone';

export function EquipementModal({
    isOpen,
    onClose,
    equipement,
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
        type: '',
        marque: '',
        modele: '',
        numeroSerie: '',
        anneeAcquisition: '',
        prixAchat: '',
        valeurActuelle: '',
        statut: 'disponible', // 'disponible', 'utilise', 'maintenance', 'hors_service', 'reserve'
        emplacement: '',
        responsable: null,

        // Caractéristiques techniques
        specifications: {
            puissance: '',
            voltage: '',
            poids: '',
            dimensions: '',
            capacite: '',
            precision: '',
            plageTemperature: '',
            autres: ''
        },

        // Maintenance
        maintenances: [],
        prochaineMaintenance: '',
        frequenceMaintenanceJours: 365,
        dernierEtalonnage: '',
        prochainEtalonnage: '',
        certificats: [],

        // Utilisation
        heuresUtilisation: 0,
        derniereUtilisation: null,
        utilisateurActuel: null,
        historiqueUtilisation: [],

        // Documentation
        manuels: [],
        photos: [],
        garantie: {
            dateExpiration: '',
            fournisseur: '',
            numeroContrat: '',
            couverture: ''
        },

        // Accessoires
        accessoires: [],
        consommables: [],

        // Système
        couleurCalendrier: '#10b981',
        visibleChantier: true,
        alertesActives: [],
        commentaires: '',
        dateCreation: new Date().toISOString(),
        derniereModification: new Date().toISOString()
    });

    const [activeTab, setActiveTab] = useState('general');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [nouvelAccessoire, setNouvelAccessoire] = useState('');
    const [nouveauConsommable, setNouveauConsommable] = useState('');
    const [nouvelleMaintenance, setNouvelleMaintenance] = useState({
        date: '',
        type: '',
        description: '',
        cout: '',
        technicien: ''
    });

    // ===== TYPES D'ÉQUIPEMENTS =====
    const typesEquipements = [
        { value: 'test_electrique', label: '⚡ Test Électrique', couleur: '#3b82f6' },
        { value: 'mesure', label: '📏 Mesure', couleur: '#10b981' },
        { value: 'securite', label: '🛡️ Sécurité', couleur: '#f59e0b' },
        { value: 'communication', label: '📡 Communication', couleur: '#8b5cf6' },
        { value: 'informatique', label: '💻 Informatique', couleur: '#06b6d4' },
        { value: 'vehicule', label: '🚗 Véhicule', couleur: '#84cc16' },
        { value: 'outillage', label: '🔧 Outillage', couleur: '#6b7280' },
        { value: 'autre', label: '📦 Autre', couleur: '#6b7280' }
    ];

    const statutsEquipement = [
        { value: 'disponible', label: '✅ Disponible', couleur: '#10b981' },
        { value: 'utilise', label: '🔄 Utilisé', couleur: '#3b82f6' },
        { value: 'maintenance', label: '🔧 Maintenance', couleur: '#f59e0b' },
        { value: 'hors_service', label: '❌ Hors service', couleur: '#ef4444' },
        { value: 'reserve', label: '📅 Réservé', couleur: '#8b5cf6' }
    ];

    // ===== INITIALISATION =====
    useEffect(() => {
        if (isOpen && equipement) {
            // Édition d'un équipement existant
            setFormData({
                ...equipement,
                // Assurer la compatibilité avec les nouveaux champs
                specifications: {
                    puissance: '',
                    voltage: '',
                    poids: '',
                    dimensions: '',
                    capacite: '',
                    precision: '',
                    plageTemperature: '',
                    autres: '',
                    ...equipement.specifications
                },
                garantie: {
                    dateExpiration: '',
                    fournisseur: '',
                    numeroContrat: '',
                    couverture: '',
                    ...equipement.garantie
                },
                maintenances: equipement.maintenances || [],
                accessoires: equipement.accessoires || [],
                consommables: equipement.consommables || [],
                photos: equipement.photos || [],
                manuels: equipement.manuels || [],
                certificats: equipement.certificats || [],
                alertesActives: equipement.alertesActives || [],
                historiqueUtilisation: equipement.historiqueUtilisation || []
            });
        } else if (isOpen) {
            // Nouvel équipement - réinitialiser
            const aujourdhui = new Date().toISOString().split('T')[0];
            setFormData({
                ...formData,
                id: null,
                nom: '',
                type: '',
                marque: '',
                modele: '',
                numeroSerie: '',
                anneeAcquisition: new Date().getFullYear().toString(),
                prochaineMaintenance: aujourdhui,
                couleurCalendrier: `#${Math.floor(Math.random()*16777215).toString(16)}`
            });
        }
        setActiveTab('general');
    }, [isOpen, equipement]);

    // ===== CALCULS ET ALERTES =====
    const calculerProchaineMaintenance = () => {
        if (!formData.prochaineMaintenance && formData.maintenances.length > 0) {
            const derniereMaintenance = new Date(Math.max(...formData.maintenances.map(m => new Date(m.date))));
            const prochaine = new Date(derniereMaintenance);
            prochaine.setDate(prochaine.getDate() + formData.frequenceMaintenanceJours);
            return prochaine.toISOString().split('T')[0];
        }
        return formData.prochaineMaintenance;
    };

    const verifierAlertes = () => {
        const alertes = [];
        const aujourd_hui = new Date();

        // Maintenance due
        if (formData.prochaineMaintenance) {
            const dateMaintenance = new Date(formData.prochaineMaintenance);
            const joursRestants = Math.ceil((dateMaintenance - aujourd_hui) / (1000 * 60 * 60 * 24));

            if (joursRestants <= 7 && joursRestants >= 0) {
                alertes.push({
                    type: 'maintenance',
                    niveau: 'warning',
                    message: `Maintenance due dans ${joursRestants} jours`
                });
            } else if (joursRestants < 0) {
                alertes.push({
                    type: 'maintenance',
                    niveau: 'error',
                    message: `Maintenance en retard de ${Math.abs(joursRestants)} jours`
                });
            }
        }

        // Étalonnage dû
        if (formData.prochainEtalonnage) {
            const dateEtalonnage = new Date(formData.prochainEtalonnage);
            const joursRestants = Math.ceil((dateEtalonnage - aujourd_hui) / (1000 * 60 * 60 * 24));

            if (joursRestants <= 30 && joursRestants >= 0) {
                alertes.push({
                    type: 'etalonnage',
                    niveau: 'warning',
                    message: `Étalonnage dû dans ${joursRestants} jours`
                });
            } else if (joursRestants < 0) {
                alertes.push({
                    type: 'etalonnage',
                    niveau: 'error',
                    message: `Étalonnage en retard de ${Math.abs(joursRestants)} jours`
                });
            }
        }

        // Garantie expirée
        if (formData.garantie.dateExpiration) {
            const dateGarantie = new Date(formData.garantie.dateExpiration);
            const joursRestants = Math.ceil((dateGarantie - aujourd_hui) / (1000 * 60 * 60 * 24));

            if (joursRestants <= 30 && joursRestants >= 0) {
                alertes.push({
                    type: 'garantie',
                    niveau: 'info',
                    message: `Garantie expire dans ${joursRestants} jours`
                });
            } else if (joursRestants < 0) {
                alertes.push({
                    type: 'garantie',
                    niveau: 'warning',
                    message: 'Garantie expirée'
                });
            }
        }

        return alertes;
    };

    // ===== GESTION DES MAINTENANCES =====
    const ajouterMaintenance = () => {
        if (!nouvelleMaintenance.date || !nouvelleMaintenance.type || !nouvelleMaintenance.description) {
            addNotification('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        const maintenance = {
            id: Date.now(),
            ...nouvelleMaintenance,
            cout: parseFloat(nouvelleMaintenance.cout) || 0,
            dateAjout: new Date().toISOString()
        };

        setFormData(prev => ({
            ...prev,
            maintenances: [...prev.maintenances, maintenance]
        }));

        setNouvelleMaintenance({
            date: '',
            type: '',
            description: '',
            cout: '',
            technicien: ''
        });
    };

    const supprimerMaintenance = (maintenanceId) => {
        setFormData(prev => ({
            ...prev,
            maintenances: prev.maintenances.filter(m => m.id !== maintenanceId)
        }));
    };

    // ===== GESTION DES LISTES =====
    const ajouterAccessoire = () => {
        if (nouvelAccessoire.trim() && !formData.accessoires.includes(nouvelAccessoire.trim())) {
            setFormData(prev => ({
                ...prev,
                accessoires: [...prev.accessoires, nouvelAccessoire.trim()]
            }));
            setNouvelAccessoire('');
        }
    };

    const supprimerAccessoire = (accessoire) => {
        setFormData(prev => ({
            ...prev,
            accessoires: prev.accessoires.filter(a => a !== accessoire)
        }));
    };

    const ajouterConsommable = () => {
        if (nouveauConsommable.trim() && !formData.consommables.includes(nouveauConsommable.trim())) {
            setFormData(prev => ({
                ...prev,
                consommables: [...prev.consommables, nouveauConsommable.trim()]
            }));
            setNouveauConsommable('');
        }
    };

    const supprimerConsommable = (consommable) => {
        setFormData(prev => ({
            ...prev,
            consommables: prev.consommables.filter(c => c !== consommable)
        }));
    };

    // ===== GESTION DES FICHIERS =====
    const handleFilesAdded = (files, type = 'manuels') => {
        const nouveauxFichiers = Array.from(files).map(file => ({
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            file: file,
            dataUrl: null,
            dateAjout: new Date().toISOString()
        }));

        // Générer des data URLs pour les images
        nouveauxFichiers.forEach(fichier => {
            if (fichier.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    fichier.dataUrl = e.target.result;
                    setFormData(prev => ({
                        ...prev,
                        photos: type === 'photos' ? [...prev.photos, fichier] : prev.photos,
                        manuels: type === 'manuels' && !fichier.type.startsWith('image/') ? [...prev.manuels, fichier] : prev.manuels,
                        certificats: type === 'certificats' ? [...prev.certificats, fichier] : prev.certificats
                    }));
                };
                reader.readAsDataURL(fichier.file);
            } else {
                setFormData(prev => ({
                    ...prev,
                    manuels: type === 'manuels' ? [...prev.manuels, fichier] : prev.manuels,
                    certificats: type === 'certificats' ? [...prev.certificats, fichier] : prev.certificats
                }));
            }
        });
    };

    const supprimerFichier = (fichierId, type) => {
        setFormData(prev => ({
            ...prev,
            [type]: prev[type].filter(f => f.id !== fichierId)
        }));
    };

    // ===== VALIDATION =====
    const validerFormulaire = () => {
        if (!formData.nom.trim()) {
            addNotification('Le nom de l\'équipement est requis', 'error');
            return false;
        }

        if (!formData.type) {
            addNotification('Le type d\'équipement est requis', 'error');
            return false;
        }

        return true;
    };

    // ===== SAUVEGARDE =====
    const handleSave = async () => {
        if (!validerFormulaire()) return;

        setIsSubmitting(true);

        try {
            const typeEquipement = typesEquipements.find(t => t.value === formData.type);
            const equipementData = {
                ...formData,
                derniereModification: new Date().toISOString(),
                couleur: typeEquipement?.couleur || formData.couleurCalendrier,
                alertesActives: verifierAlertes(),
                prochaineMaintenance: calculerProchaineMaintenance() || formData.prochaineMaintenance
            };

            await onSave(equipementData);
            addNotification(
                `${equipement ? 'Équipement modifié' : 'Équipement créé'}: ${formData.nom}`,
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
            await onDelete(equipement.id);
            addNotification(`Équipement supprimé: ${equipement.nom}`, 'success');
            onClose();
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            addNotification('Erreur lors de la suppression', 'error');
        }
        setShowDeleteConfirm(false);
    };

    // ===== RENDU =====
    if (!isOpen) return null;

    const alertes = verifierAlertes();
    const typeEquipementActuel = typesEquipements.find(t => t.value === formData.type);
    const statutActuel = statutsEquipement.find(s => s.value === formData.statut);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={equipement ? `Modifier - ${equipement.nom}` : 'Nouvel Équipement'}
            size="xl"
        >
            <div className="space-y-6">
                {/* Alertes */}
                {alertes.length > 0 && (
                    <div className="space-y-2">
                        {alertes.map((alerte, index) => (
                            <div key={index} className={`p-3 rounded-lg border ${
                                alerte.niveau === 'error' ? 'bg-red-50 border-red-200' :
                                alerte.niveau === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                                'bg-blue-50 border-blue-200'
                            }`}>
                                <div className="flex items-center gap-2">
                                    <Icon name="warning" size={16} className={
                                        alerte.niveau === 'error' ? 'text-red-600' :
                                        alerte.niveau === 'warning' ? 'text-yellow-600' :
                                        'text-blue-600'
                                    } />
                                    <span className={`text-sm font-medium ${
                                        alerte.niveau === 'error' ? 'text-red-800' :
                                        alerte.niveau === 'warning' ? 'text-yellow-800' :
                                        'text-blue-800'
                                    }`}>
                                        {alerte.message}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Onglets */}
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8">
                        {[
                            { id: 'general', label: 'Général', icon: 'wrench' },
                            { id: 'specifications', label: 'Spécifications', icon: 'document' },
                            { id: 'maintenance', label: 'Maintenance', icon: 'tool' },
                            { id: 'utilisation', label: 'Utilisation', icon: 'barChart' },
                            { id: 'documents', label: 'Documents', icon: 'paperclip' }
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
                            {/* Informations de base */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom de l'équipement *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nom}
                                        onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nom de l'équipement..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Type *
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Sélectionner un type...</option>
                                        {typesEquipements.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Marque
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.marque}
                                        onChange={(e) => setFormData(prev => ({ ...prev, marque: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Marque..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Modèle
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.modele}
                                        onChange={(e) => setFormData(prev => ({ ...prev, modele: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Modèle..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Numéro de série
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.numeroSerie}
                                        onChange={(e) => setFormData(prev => ({ ...prev, numeroSerie: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Numéro de série..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Année d'acquisition
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.anneeAcquisition}
                                        onChange={(e) => setFormData(prev => ({ ...prev, anneeAcquisition: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        min="1900"
                                        max={new Date().getFullYear()}
                                    />
                                </div>
                            </div>

                            {/* Statut et emplacement */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Statut
                                    </label>
                                    <select
                                        value={formData.statut}
                                        onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {statutsEquipement.map(statut => (
                                            <option key={statut.value} value={statut.value}>
                                                {statut.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Emplacement
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.emplacement}
                                        onChange={(e) => setFormData(prev => ({ ...prev, emplacement: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ex: Entrepôt A, Étagère 3..."
                                    />
                                </div>
                            </div>

                            {/* Valeurs financières */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Prix d'achat ($)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.prixAchat}
                                        onChange={(e) => setFormData(prev => ({ ...prev, prixAchat: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        step="0.01"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Valeur actuelle ($)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.valeurActuelle}
                                        onChange={(e) => setFormData(prev => ({ ...prev, valeurActuelle: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            {/* Commentaires */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Commentaires
                                </label>
                                <textarea
                                    value={formData.commentaires}
                                    onChange={(e) => setFormData(prev => ({ ...prev, commentaires: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Notes, commentaires..."
                                />
                            </div>

                            {/* Options d'affichage */}
                            <div className="flex items-center gap-6">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.visibleChantier}
                                        onChange={(e) => setFormData(prev => ({ ...prev, visibleChantier: e.target.checked }))}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">Visible sur le calendrier</span>
                                </label>

                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        Couleur:
                                    </label>
                                    <input
                                        type="color"
                                        value={formData.couleurCalendrier}
                                        onChange={(e) => setFormData(prev => ({ ...prev, couleurCalendrier: e.target.value }))}
                                        className="w-8 h-8 border border-gray-300 rounded"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ONGLET SPÉCIFICATIONS */}
                    {activeTab === 'specifications' && (
                        <div className="space-y-6">
                            <h3 className="font-medium text-gray-900 mb-4">Caractéristiques techniques</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Puissance
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.specifications.puissance}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            specifications: { ...prev.specifications, puissance: e.target.value }
                                        }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ex: 500W, 2kW..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Voltage
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.specifications.voltage}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            specifications: { ...prev.specifications, voltage: e.target.value }
                                        }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ex: 120V, 240V..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Poids
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.specifications.poids}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            specifications: { ...prev.specifications, poids: e.target.value }
                                        }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ex: 5kg, 25lbs..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Dimensions
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.specifications.dimensions}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            specifications: { ...prev.specifications, dimensions: e.target.value }
                                        }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ex: 30x20x15cm..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Capacité
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.specifications.capacite}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            specifications: { ...prev.specifications, capacite: e.target.value }
                                        }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ex: 100A, 50L..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Précision
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.specifications.precision}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            specifications: { ...prev.specifications, precision: e.target.value }
                                        }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ex: ±0.1%, ±5V..."
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Plage de température
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.specifications.plageTemperature}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            specifications: { ...prev.specifications, plageTemperature: e.target.value }
                                        }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ex: -20°C à +60°C..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Autres spécifications
                                </label>
                                <textarea
                                    value={formData.specifications.autres}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        specifications: { ...prev.specifications, autres: e.target.value }
                                    }))}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Autres caractéristiques techniques..."
                                />
                            </div>

                            {/* Accessoires et consommables */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Accessoires</h4>
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={nouvelAccessoire}
                                            onChange={(e) => setNouvelAccessoire(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Ajouter un accessoire..."
                                            onKeyPress={(e) => e.key === 'Enter' && ajouterAccessoire()}
                                        />
                                        <button
                                            onClick={ajouterAccessoire}
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            <Icon name="plus" size={16} />
                                        </button>
                                    </div>
                                    <div className="space-y-1">
                                        {formData.accessoires.map(accessoire => (
                                            <div key={accessoire} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <span className="text-sm">{accessoire}</span>
                                                <button
                                                    onClick={() => supprimerAccessoire(accessoire)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Icon name="trash" size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Consommables</h4>
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={nouveauConsommable}
                                            onChange={(e) => setNouveauConsommable(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Ajouter un consommable..."
                                            onKeyPress={(e) => e.key === 'Enter' && ajouterConsommable()}
                                        />
                                        <button
                                            onClick={ajouterConsommable}
                                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                        >
                                            <Icon name="plus" size={16} />
                                        </button>
                                    </div>
                                    <div className="space-y-1">
                                        {formData.consommables.map(consommable => (
                                            <div key={consommable} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <span className="text-sm">{consommable}</span>
                                                <button
                                                    onClick={() => supprimerConsommable(consommable)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Icon name="trash" size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ONGLET MAINTENANCE */}
                    {activeTab === 'maintenance' && (
                        <div className="space-y-6">
                            {/* Planning de maintenance */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Prochaine maintenance
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.prochaineMaintenance}
                                        onChange={(e) => setFormData(prev => ({ ...prev, prochaineMaintenance: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fréquence (jours)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.frequenceMaintenanceJours}
                                        onChange={(e) => setFormData(prev => ({ ...prev, frequenceMaintenanceJours: parseInt(e.target.value) || 365 }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        min="1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Prochain étalonnage
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.prochainEtalonnage}
                                        onChange={(e) => setFormData(prev => ({ ...prev, prochainEtalonnage: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Ajouter une maintenance */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-3">Ajouter une maintenance</h4>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
                                    <div>
                                        <input
                                            type="date"
                                            value={nouvelleMaintenance.date}
                                            onChange={(e) => setNouvelleMaintenance(prev => ({ ...prev, date: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <select
                                            value={nouvelleMaintenance.type}
                                            onChange={(e) => setNouvelleMaintenance(prev => ({ ...prev, type: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                            required
                                        >
                                            <option value="">Type...</option>
                                            <option value="preventive">Préventive</option>
                                            <option value="corrective">Corrective</option>
                                            <option value="etalonnage">Étalonnage</option>
                                            <option value="reparation">Réparation</option>
                                        </select>
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            value={nouvelleMaintenance.description}
                                            onChange={(e) => setNouvelleMaintenance(prev => ({ ...prev, description: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                            placeholder="Description..."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            value={nouvelleMaintenance.cout}
                                            onChange={(e) => setNouvelleMaintenance(prev => ({ ...prev, cout: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                            placeholder="Coût ($)"
                                            step="0.01"
                                        />
                                    </div>
                                    <div>
                                        <button
                                            onClick={ajouterMaintenance}
                                            className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                                        >
                                            Ajouter
                                        </button>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={nouvelleMaintenance.technicien}
                                    onChange={(e) => setNouvelleMaintenance(prev => ({ ...prev, technicien: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    placeholder="Technicien responsable..."
                                />
                            </div>

                            {/* Historique des maintenances */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Historique des maintenances</h4>
                                <div className="space-y-2">
                                    {formData.maintenances.length === 0 ? (
                                        <p className="text-gray-500 text-sm">Aucune maintenance enregistrée</p>
                                    ) : (
                                        formData.maintenances
                                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                                            .map(maintenance => (
                                            <div key={maintenance.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-medium text-sm">
                                                            {new Date(maintenance.date).toLocaleDateString()}
                                                        </span>
                                                        <span className={`px-2 py-1 rounded text-xs ${
                                                            maintenance.type === 'preventive' ? 'bg-green-100 text-green-800' :
                                                            maintenance.type === 'corrective' ? 'bg-red-100 text-red-800' :
                                                            maintenance.type === 'etalonnage' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {maintenance.type}
                                                        </span>
                                                        {maintenance.cout > 0 && (
                                                            <span className="text-sm text-gray-600">
                                                                {maintenance.cout.toFixed(2)}$
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">{maintenance.description}</p>
                                                    {maintenance.technicien && (
                                                        <p className="text-xs text-gray-500">Par: {maintenance.technicien}</p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => supprimerMaintenance(maintenance.id)}
                                                    className="p-1 text-red-600 hover:text-red-800"
                                                >
                                                    <Icon name="trash" size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ONGLET UTILISATION */}
                    {activeTab === 'utilisation' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <h4 className="font-medium text-blue-900 mb-2">Heures d'utilisation</h4>
                                    <p className="text-2xl font-bold text-blue-700">{formData.heuresUtilisation}h</p>
                                </div>

                                <div className="bg-green-50 rounded-lg p-4">
                                    <h4 className="font-medium text-green-900 mb-2">Dernière utilisation</h4>
                                    <p className="text-sm text-green-700">
                                        {formData.derniereUtilisation
                                            ? new Date(formData.derniereUtilisation).toLocaleDateString()
                                            : 'Jamais utilisé'
                                        }
                                    </p>
                                </div>

                                <div className="bg-yellow-50 rounded-lg p-4">
                                    <h4 className="font-medium text-yellow-900 mb-2">Utilisateur actuel</h4>
                                    <p className="text-sm text-yellow-700">
                                        {formData.utilisateurActuel || 'Non assigné'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Historique d'utilisation</h4>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600">
                                        L'historique d'utilisation sera automatiquement rempli lors de l'assignation de l'équipement aux jobs.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ONGLET DOCUMENTS */}
                    {activeTab === 'documents' && (
                        <div className="space-y-6">
                            {/* Garantie */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-3">Informations de garantie</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Date d'expiration
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.garantie.dateExpiration}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                garantie: { ...prev.garantie, dateExpiration: e.target.value }
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Fournisseur
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.garantie.fournisseur}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                garantie: { ...prev.garantie, fournisseur: e.target.value }
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Nom du fournisseur..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Numéro de contrat
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.garantie.numeroContrat}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                garantie: { ...prev.garantie, numeroContrat: e.target.value }
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Numéro de contrat..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Couverture
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.garantie.couverture}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                garantie: { ...prev.garantie, couverture: e.target.value }
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Ex: Pièces et main d'oeuvre..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Upload de fichiers */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Manuels</h4>
                                    <DropZone
                                        onFilesAdded={(files) => handleFilesAdded(files, 'manuels')}
                                        acceptedTypes=".pdf,.doc,.docx"
                                        maxSizeMB={10}
                                        multiple={true}
                                    />
                                    <div className="mt-3 space-y-1">
                                        {formData.manuels.map(manuel => (
                                            <div key={manuel.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                                <span>{manuel.name}</span>
                                                <button
                                                    onClick={() => supprimerFichier(manuel.id, 'manuels')}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Icon name="trash" size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Certificats</h4>
                                    <DropZone
                                        onFilesAdded={(files) => handleFilesAdded(files, 'certificats')}
                                        acceptedTypes=".pdf,.jpg,.jpeg,.png"
                                        maxSizeMB={10}
                                        multiple={true}
                                    />
                                    <div className="mt-3 space-y-1">
                                        {formData.certificats.map(certificat => (
                                            <div key={certificat.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                                <span>{certificat.name}</span>
                                                <button
                                                    onClick={() => supprimerFichier(certificat.id, 'certificats')}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Icon name="trash" size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Photos</h4>
                                    <DropZone
                                        onFilesAdded={(files) => handleFilesAdded(files, 'photos')}
                                        acceptedTypes="image/*"
                                        maxSizeMB={5}
                                        multiple={true}
                                    />
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        {formData.photos.map(photo => (
                                            <div key={photo.id} className="relative">
                                                <img
                                                    src={photo.dataUrl}
                                                    alt={photo.name}
                                                    className="w-full h-16 object-cover rounded"
                                                />
                                                <button
                                                    onClick={() => supprimerFichier(photo.id, 'photos')}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                                                >
                                                    <Icon name="close" size={10} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-6 border-t">
                    <div>
                        {equipement && peutModifier && (
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
                                {isSubmitting ? 'Sauvegarde...' : (equipement ? 'Modifier' : 'Créer')}
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
                                Êtes-vous sûr de vouloir supprimer {equipement?.nom} ? Cette action est irréversible.
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