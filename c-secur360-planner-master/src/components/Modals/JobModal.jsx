// ============== JOB MODAL ULTRA-COMPLEXE VERSION ORIGINALE ==============
// Modal de gestion des jobs avec système Gantt, équipes, récurrence, etc.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal } from '../UI/Modal';
import { Icon } from '../UI/Icon';
import { DropZone } from '../UI/DropZone';
import { FilePreview } from '../UI/FilePreview';
import { PhotoCarousel } from '../UI/PhotoCarousel';

export function JobModal({
    isOpen,
    onClose,
    job,
    onSave,
    onDelete,
    personnel,
    equipements,
    sousTraitants,
    addSousTraitant,
    jobs,
    selectedCell,
    addNotification,
    peutModifier = true,
    estCoordonnateur = false
}) {
    // ===== ÉTATS PRINCIPAUX =====
    const [formData, setFormData] = useState({
        id: null,
        nom: '',
        description: '',
        client: '',
        localisation: '',
        adresse: '',
        contact: '',
        telephone: '',
        email: '',
        dateDebut: '',
        dateFin: '',
        heureDebut: '08:00',
        heureFin: '17:00',
        priorite: 'normale',
        statut: 'planifie',
        personnel: [],
        equipements: [],
        sousTraitants: [],

        // Système d'étapes Gantt
        etapes: [],
        modeGantt: false,

        // Équipes et horaires
        equipesNumerotees: {},
        typeHoraire: 'standard', // 'standard', 'nuit', '24h'
        horairesIndividuels: {},

        // Récurrence
        recurrence: 'none', // 'none', 'weekly', 'monthly', 'yearly'
        recurrenceNombre: 1,
        recurrenceJusquA: '',

        // Fichiers et photos
        fichiers: [],
        photos: [],

        // Options avancées
        includeWeekendsInDuration: false,
        tauxHoraire: '',
        coutEstime: '',

        // Champs additionnels
        numeroJob: '',
        typeJob: 'standard',
        dureeEstimee: '',
        commentaires: ''
    });

    // ===== ÉTATS UI =====
    const [activeTab, setActiveTab] = useState('general'); // 'general', 'etapes', 'equipes', 'recurrence', 'fichiers'
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newSousTraitant, setNewSousTraitant] = useState('');
    const [photoCarouselIndex, setPhotoCarouselIndex] = useState(-1);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [expandedEtape, setExpandedEtape] = useState(null);

    // ===== INITIALISATION =====
    useEffect(() => {
        if (isOpen && job) {
            // Édition d'un job existant
            setFormData({
                ...job,
                etapes: job.etapes || [],
                equipesNumerotees: job.equipesNumerotees || {},
                horairesIndividuels: job.horairesIndividuels || {},
                fichiers: job.fichiers || [],
                photos: job.photos || [],
                // Assurer la compatibilité avec l'ancien format
                personnel: Array.isArray(job.personnel) ? job.personnel : [],
                equipements: Array.isArray(job.equipements) ? job.equipements : [],
                sousTraitants: Array.isArray(job.sousTraitants) ? job.sousTraitants : []
            });
        } else if (isOpen && selectedCell) {
            // Création d'un nouveau job
            const nouveauNumeroJob = generateJobNumber();
            setFormData({
                ...formData,
                id: null,
                numeroJob: nouveauNumeroJob,
                dateDebut: selectedCell.date,
                dateFin: selectedCell.date,
                personnel: selectedCell.resourceType === 'personnel' ? [selectedCell.resourceId] : [],
                equipements: selectedCell.resourceType === 'equipement' ? [selectedCell.resourceId] : []
            });
        }
    }, [isOpen, job, selectedCell]);

    // ===== GÉNÉRATION NUMÉRO JOB =====
    const generateJobNumber = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        // Trouver le prochain numéro séquentiel pour aujourd'hui
        const todayPrefix = `${year}${month}${day}`;
        const existingJobs = jobs.filter(j => j.numeroJob && j.numeroJob.startsWith(todayPrefix));
        const maxSequence = existingJobs.reduce((max, j) => {
            const sequence = parseInt(j.numeroJob.slice(-3)) || 0;
            return Math.max(max, sequence);
        }, 0);

        return `${todayPrefix}-${String(maxSequence + 1).padStart(3, '0')}`;
    };

    // ===== GESTION DES ÉTAPES GANTT =====
    const ajouterEtape = () => {
        const nouvelleEtape = {
            id: Date.now(),
            nom: `Étape ${formData.etapes.length + 1}`,
            description: '',
            dateDebut: formData.dateDebut,
            dateFin: formData.dateDebut,
            duree: 1, // en jours
            personnel: [],
            equipements: [],
            dependances: [], // IDs des étapes dont cette étape dépend
            typeDependance: 'FS', // FS, SS, FF, SF
            delai: 0, // délai en jours (peut être négatif)
            pourcentageComplete: 0,
            couleur: '#3b82f6',
            critique: false
        };

        setFormData(prev => ({
            ...prev,
            etapes: [...prev.etapes, nouvelleEtape]
        }));
    };

    const supprimerEtape = (etapeId) => {
        setFormData(prev => ({
            ...prev,
            etapes: prev.etapes.filter(e => e.id !== etapeId)
        }));
    };

    const modifierEtape = (etapeId, modifications) => {
        setFormData(prev => ({
            ...prev,
            etapes: prev.etapes.map(e =>
                e.id === etapeId ? { ...e, ...modifications } : e
            )
        }));
    };

    // ===== CALCUL CHEMIN CRITIQUE =====
    const calculerCheminCritique = useCallback(() => {
        // Algorithme CPM (Critical Path Method) simplifié
        const etapes = formData.etapes;
        if (etapes.length === 0) return [];

        // Calcul des dates au plus tôt (ES - Earliest Start)
        const etapesAvecES = etapes.map(etape => ({
            ...etape,
            ES: 0, // Date de début au plus tôt
            EF: 0, // Date de fin au plus tôt
            LS: 0, // Date de début au plus tard
            LF: 0, // Date de fin au plus tard
            marge: 0 // Marge libre
        }));

        // Forward pass - calcul ES/EF
        etapesAvecES.forEach(etape => {
            if (etape.dependances.length === 0) {
                etape.ES = 0;
            } else {
                etape.ES = Math.max(...etape.dependances.map(depId => {
                    const depEtape = etapesAvecES.find(e => e.id === depId);
                    return depEtape ? depEtape.EF + etape.delai : 0;
                }));
            }
            etape.EF = etape.ES + etape.duree;
        });

        // Backward pass - calcul LS/LF
        const dureeProjet = Math.max(...etapesAvecES.map(e => e.EF));
        etapesAvecES.reverse().forEach(etape => {
            const dependantes = etapesAvecES.filter(e => e.dependances.includes(etape.id));
            if (dependantes.length === 0) {
                etape.LF = dureeProjet;
            } else {
                etape.LF = Math.min(...dependantes.map(depEtape => depEtape.LS - etape.delai));
            }
            etape.LS = etape.LF - etape.duree;
            etape.marge = etape.LS - etape.ES;
        });

        // Identifier le chemin critique (marge = 0)
        const cheminCritique = etapesAvecES.filter(e => e.marge === 0).map(e => e.id);

        // Marquer les étapes critiques
        setFormData(prev => ({
            ...prev,
            etapes: prev.etapes.map(e => ({
                ...e,
                critique: cheminCritique.includes(e.id)
            }))
        }));

        return cheminCritique;
    }, [formData.etapes]);

    // ===== GESTION DES ÉQUIPES =====
    const creerEquipe = () => {
        const numeroEquipe = Object.keys(formData.equipesNumerotees).length + 1;
        const nouvelleEquipe = {
            nom: `Équipe ${numeroEquipe}`,
            membres: [],
            couleur: `#${Math.floor(Math.random()*16777215).toString(16)}`,
            chef: null
        };

        setFormData(prev => ({
            ...prev,
            equipesNumerotees: {
                ...prev.equipesNumerotees,
                [numeroEquipe]: nouvelleEquipe
            }
        }));
    };

    const ajouterMembreEquipe = (numeroEquipe, personnelId) => {
        setFormData(prev => ({
            ...prev,
            equipesNumerotees: {
                ...prev.equipesNumerotees,
                [numeroEquipe]: {
                    ...prev.equipesNumerotees[numeroEquipe],
                    membres: [...(prev.equipesNumerotees[numeroEquipe]?.membres || []), personnelId]
                }
            }
        }));
    };

    // ===== GESTION DES FICHIERS =====
    const handleFilesAdded = (files) => {
        const nouveauxFichiers = Array.from(files).map(file => ({
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            file: file,
            dataUrl: null
        }));

        // Générer des data URLs pour les images
        nouveauxFichiers.forEach(fichier => {
            if (fichier.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    fichier.dataUrl = e.target.result;
                    setFormData(prev => ({
                        ...prev,
                        photos: [...prev.photos, fichier]
                    }));
                };
                reader.readAsDataURL(fichier.file);
            } else {
                setFormData(prev => ({
                    ...prev,
                    fichiers: [...prev.fichiers, fichier]
                }));
            }
        });
    };

    const supprimerFichier = (fichierId, isPhoto = false) => {
        setFormData(prev => ({
            ...prev,
            [isPhoto ? 'photos' : 'fichiers']: prev[isPhoto ? 'photos' : 'fichiers'].filter(f => f.id !== fichierId)
        }));
    };

    // ===== VALIDATION =====
    const validerFormulaire = () => {
        if (!formData.nom.trim()) {
            addNotification('Le nom du job est requis', 'error');
            return false;
        }

        if (!formData.dateDebut) {
            addNotification('La date de début est requise', 'error');
            return false;
        }

        if (formData.dateFin && formData.dateFin < formData.dateDebut) {
            addNotification('La date de fin ne peut pas être antérieure à la date de début', 'error');
            return false;
        }

        if (formData.personnel.length === 0 && formData.equipements.length === 0) {
            addNotification('Au moins une ressource (personnel ou équipement) doit être assignée', 'error');
            return false;
        }

        return true;
    };

    // ===== SAUVEGARDE =====
    const handleSave = async () => {
        if (!validerFormulaire()) return;

        setIsSubmitting(true);

        try {
            // Calculer la durée automatiquement si mode Gantt
            let jobDataToSave = { ...formData };

            if (formData.modeGantt && formData.etapes.length > 0) {
                const cheminCritique = calculerCheminCritique();
                const dureeProjet = Math.max(...formData.etapes.map(e => e.duree));

                // Ajuster les dates de fin selon la durée du projet
                const dateDebut = new Date(formData.dateDebut);
                const dateFin = new Date(dateDebut);
                dateFin.setDate(dateFin.getDate() + dureeProjet);

                jobDataToSave.dateFin = dateFin.toISOString().split('T')[0];
            }

            // Générer récurrences si nécessaire
            if (formData.recurrence !== 'none') {
                const jobsRecurrents = genererJobsRecurrents(jobDataToSave);

                // Sauvegarder tous les jobs récurrents
                for (const jobRecurrent of jobsRecurrents) {
                    await onSave(jobRecurrent);
                }

                addNotification(`${jobsRecurrents.length} jobs récurrents créés avec succès`, 'success');
            } else {
                await onSave(jobDataToSave);
                addNotification(job ? 'Job modifié avec succès' : 'Job créé avec succès', 'success');
            }

            onClose();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            addNotification('Erreur lors de la sauvegarde', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ===== GÉNÉRATION RÉCURRENCE =====
    const genererJobsRecurrents = (jobBase) => {
        const jobs = [];
        let dateActuelle = new Date(jobBase.dateDebut);

        for (let i = 0; i < formData.recurrenceNombre; i++) {
            const jobRecurrent = {
                ...jobBase,
                id: null, // Nouveau ID sera généré
                numeroJob: generateJobNumber(),
                dateDebut: dateActuelle.toISOString().split('T')[0],
                dateFin: jobBase.dateFin ?
                    new Date(dateActuelle.getTime() +
                        (new Date(jobBase.dateFin) - new Date(jobBase.dateDebut)))
                        .toISOString().split('T')[0] :
                    dateActuelle.toISOString().split('T')[0]
            };

            jobs.push(jobRecurrent);

            // Avancer à la prochaine occurrence
            switch (formData.recurrence) {
                case 'weekly':
                    dateActuelle.setDate(dateActuelle.getDate() + 7);
                    break;
                case 'monthly':
                    dateActuelle.setMonth(dateActuelle.getMonth() + 1);
                    break;
                case 'yearly':
                    dateActuelle.setFullYear(dateActuelle.getFullYear() + 1);
                    break;
            }

            // Arrêter si on dépasse la date limite
            if (formData.recurrenceJusquA && dateActuelle > new Date(formData.recurrenceJusquA)) {
                break;
            }
        }

        return jobs;
    };

    // ===== SUPPRESSION =====
    const handleDelete = () => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce job ?')) {
            onDelete(job.id);
            addNotification('Job supprimé avec succès', 'success');
            onClose();
        }
    };

    // ===== RENDU CONDITIONNEL =====
    if (!isOpen) return null;

    // ===== INTERFACE UTILISATEUR =====
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={job ? `Modifier Job - ${job.nom || 'Sans nom'}` : 'Nouveau Job'}
            size="xl"
        >
            <div className="space-y-6">
                {/* Onglets de navigation */}
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8">
                        {[
                            { id: 'general', label: 'Général', icon: 'clipboard' },
                            { id: 'etapes', label: 'Étapes Gantt', icon: 'barChart' },
                            { id: 'equipes', label: 'Équipes', icon: 'users' },
                            { id: 'recurrence', label: 'Récurrence', icon: 'clock' },
                            { id: 'fichiers', label: 'Fichiers', icon: 'paperclip' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                        <div className="space-y-4">
                            {/* Informations de base */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom du job *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nom}
                                        onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nom du projet..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Numéro job
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.numeroJob}
                                        onChange={(e) => setFormData(prev => ({ ...prev, numeroJob: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Auto-généré..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Client
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.client}
                                        onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nom du client..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Priorité
                                    </label>
                                    <select
                                        value={formData.priorite}
                                        onChange={(e) => setFormData(prev => ({ ...prev, priorite: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="faible">🟢 Faible</option>
                                        <option value="normale">🟡 Normale</option>
                                        <option value="haute">🟠 Haute</option>
                                        <option value="urgente">🔴 Urgente</option>
                                    </select>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Description détaillée du projet..."
                                />
                            </div>

                            {/* Dates et heures */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date début *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.dateDebut}
                                        onChange={(e) => setFormData(prev => ({ ...prev, dateDebut: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date fin
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.dateFin}
                                        onChange={(e) => setFormData(prev => ({ ...prev, dateFin: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Heure début
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.heureDebut}
                                        onChange={(e) => setFormData(prev => ({ ...prev, heureDebut: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Heure fin
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.heureFin}
                                        onChange={(e) => setFormData(prev => ({ ...prev, heureFin: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Assignation des ressources */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Personnel */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Personnel assigné
                                    </label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                                        {personnel.map(person => (
                                            <label key={person.id} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.personnel.includes(person.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                personnel: [...prev.personnel, person.id]
                                                            }));
                                                        } else {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                personnel: prev.personnel.filter(id => id !== person.id)
                                                            }));
                                                        }
                                                    }}
                                                    className="mr-2"
                                                />
                                                <span className="text-sm">{person.nom} - {person.poste}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Équipements */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Équipements assignés
                                    </label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                                        {equipements.map(equipement => (
                                            <label key={equipement.id} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.equipements.includes(equipement.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                equipements: [...prev.equipements, equipement.id]
                                                            }));
                                                        } else {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                equipements: prev.equipements.filter(id => id !== equipement.id)
                                                            }));
                                                        }
                                                    }}
                                                    className="mr-2"
                                                />
                                                <span className="text-sm">{equipement.nom} - {equipement.type}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ONGLET ÉTAPES GANTT */}
                    {activeTab === 'etapes' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.modeGantt}
                                            onChange={(e) => setFormData(prev => ({ ...prev, modeGantt: e.target.checked }))}
                                            className="mr-2"
                                        />
                                        <span className="text-sm font-medium">Activer le mode Gantt</span>
                                    </label>

                                    {formData.modeGantt && (
                                        <button
                                            onClick={calculerCheminCritique}
                                            className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
                                        >
                                            Calculer chemin critique
                                        </button>
                                    )}
                                </div>

                                {formData.modeGantt && (
                                    <button
                                        onClick={ajouterEtape}
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
                                    >
                                        <Icon name="plus" size={16} />
                                        Ajouter étape
                                    </button>
                                )}
                            </div>

                            {formData.modeGantt && (
                                <div className="space-y-3">
                                    {formData.etapes.map((etape, index) => (
                                        <div
                                            key={etape.id}
                                            className={`border rounded-lg p-4 ${etape.critique ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="text"
                                                        value={etape.nom}
                                                        onChange={(e) => modifierEtape(etape.id, { nom: e.target.value })}
                                                        className="font-medium text-sm border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2"
                                                        placeholder="Nom de l'étape..."
                                                    />
                                                    {etape.critique && (
                                                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                                            Critique
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setExpandedEtape(expandedEtape === etape.id ? null : etape.id)}
                                                        className="p-1 hover:bg-gray-100 rounded"
                                                    >
                                                        <Icon name={expandedEtape === etape.id ? "expand_less" : "expand_more"} size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => supprimerEtape(etape.id)}
                                                        className="p-1 hover:bg-red-100 rounded text-red-600"
                                                    >
                                                        <Icon name="trash" size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {expandedEtape === etape.id && (
                                                <div className="space-y-3 pt-3 border-t">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Date début
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={etape.dateDebut}
                                                                onChange={(e) => modifierEtape(etape.id, { dateDebut: e.target.value })}
                                                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Date fin
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={etape.dateFin}
                                                                onChange={(e) => modifierEtape(etape.id, { dateFin: e.target.value })}
                                                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Durée (jours)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={etape.duree}
                                                                onChange={(e) => modifierEtape(etape.id, { duree: parseInt(e.target.value) || 1 })}
                                                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                                                min="1"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                                            Description
                                                        </label>
                                                        <textarea
                                                            value={etape.description}
                                                            onChange={(e) => modifierEtape(etape.id, { description: e.target.value })}
                                                            rows={2}
                                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                                            placeholder="Description de l'étape..."
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {formData.etapes.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <Icon name="barChart" size={48} className="mx-auto mb-2 text-gray-300" />
                                            <p>Aucune étape créée</p>
                                            <p className="text-sm">Cliquez sur "Ajouter étape" pour commencer</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ONGLET ÉQUIPES */}
                    {activeTab === 'equipes' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium">Gestion des équipes</h3>
                                <button
                                    onClick={creerEquipe}
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
                                >
                                    <Icon name="plus" size={16} />
                                    Créer équipe
                                </button>
                            </div>

                            <div className="space-y-4">
                                {Object.entries(formData.equipesNumerotees).map(([numero, equipe]) => (
                                    <div key={numero} className="border rounded-lg p-4 bg-gray-50">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: equipe.couleur }}
                                                ></div>
                                                <input
                                                    type="text"
                                                    value={equipe.nom}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        equipesNumerotees: {
                                                            ...prev.equipesNumerotees,
                                                            [numero]: { ...equipe, nom: e.target.value }
                                                        }
                                                    }))}
                                                    className="font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2"
                                                />
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setFormData(prev => {
                                                        const newEquipes = { ...prev.equipesNumerotees };
                                                        delete newEquipes[numero];
                                                        return { ...prev, equipesNumerotees: newEquipes };
                                                    });
                                                }}
                                                className="p-1 hover:bg-red-100 rounded text-red-600"
                                            >
                                                <Icon name="trash" size={16} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Membres de l'équipe
                                                </label>
                                                <div className="max-h-32 overflow-y-auto space-y-1">
                                                    {personnel.map(person => (
                                                        <label key={person.id} className="flex items-center text-sm">
                                                            <input
                                                                type="checkbox"
                                                                checked={equipe.membres?.includes(person.id) || false}
                                                                onChange={(e) => {
                                                                    const membres = equipe.membres || [];
                                                                    const newMembres = e.target.checked
                                                                        ? [...membres, person.id]
                                                                        : membres.filter(id => id !== person.id);

                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        equipesNumerotees: {
                                                                            ...prev.equipesNumerotees,
                                                                            [numero]: { ...equipe, membres: newMembres }
                                                                        }
                                                                    }));
                                                                }}
                                                                className="mr-2"
                                                            />
                                                            {person.nom}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Chef d'équipe
                                                </label>
                                                <select
                                                    value={equipe.chef || ''}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        equipesNumerotees: {
                                                            ...prev.equipesNumerotees,
                                                            [numero]: { ...equipe, chef: e.target.value || null }
                                                        }
                                                    }))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                                >
                                                    <option value="">Aucun chef</option>
                                                    {(equipe.membres || []).map(membreId => {
                                                        const membre = personnel.find(p => p.id === membreId);
                                                        return membre ? (
                                                            <option key={membre.id} value={membre.id}>
                                                                {membre.nom}
                                                            </option>
                                                        ) : null;
                                                    })}
                                                </select>

                                                <div className="mt-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Couleur équipe
                                                    </label>
                                                    <input
                                                        type="color"
                                                        value={equipe.couleur}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            equipesNumerotees: {
                                                                ...prev.equipesNumerotees,
                                                                [numero]: { ...equipe, couleur: e.target.value }
                                                            }
                                                        }))}
                                                        className="w-full h-10 border border-gray-300 rounded-md"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {Object.keys(formData.equipesNumerotees).length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        <Icon name="users" size={48} className="mx-auto mb-2 text-gray-300" />
                                        <p>Aucune équipe créée</p>
                                        <p className="text-sm">Cliquez sur "Créer équipe" pour commencer</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ONGLET RÉCURRENCE */}
                    {activeTab === 'recurrence' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Type de récurrence
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {[
                                        { value: 'none', label: 'Aucune', icon: 'close' },
                                        { value: 'weekly', label: 'Hebdomadaire', icon: 'calendar' },
                                        { value: 'monthly', label: 'Mensuelle', icon: 'calendar' },
                                        { value: 'yearly', label: 'Annuelle', icon: 'calendar' }
                                    ].map(option => (
                                        <label key={option.value} className={`flex items-center justify-center p-4 border rounded-lg cursor-pointer transition-colors ${
                                            formData.recurrence === option.value
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-300 hover:bg-gray-50'
                                        }`}>
                                            <input
                                                type="radio"
                                                name="recurrence"
                                                value={option.value}
                                                checked={formData.recurrence === option.value}
                                                onChange={(e) => setFormData(prev => ({ ...prev, recurrence: e.target.value }))}
                                                className="sr-only"
                                            />
                                            <div className="text-center">
                                                <Icon name={option.icon} size={24} className="mx-auto mb-2" />
                                                <span className="text-sm font-medium">{option.label}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {formData.recurrence !== 'none' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nombre d'occurrences
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.recurrenceNombre}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                recurrenceNombre: parseInt(e.target.value) || 1
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            min="1"
                                            max="100"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Nombre de fois que le job sera répété
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Répéter jusqu'au (optionnel)
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.recurrenceJusquA}
                                            onChange={(e) => setFormData(prev => ({ ...prev, recurrenceJusquA: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Date limite pour arrêter la récurrence
                                        </p>
                                    </div>
                                </div>
                            )}

                            {formData.recurrence !== 'none' && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Icon name="info" size={20} className="text-blue-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-blue-900 mb-2">Aperçu de la récurrence</h4>
                                            <p className="text-sm text-blue-800">
                                                {formData.recurrence === 'weekly' && `Ce job sera répété chaque semaine, ${formData.recurrenceNombre} fois.`}
                                                {formData.recurrence === 'monthly' && `Ce job sera répété chaque mois, ${formData.recurrenceNombre} fois.`}
                                                {formData.recurrence === 'yearly' && `Ce job sera répété chaque année, ${formData.recurrenceNombre} fois.`}
                                            </p>
                                            {formData.recurrenceJusquA && (
                                                <p className="text-sm text-blue-700 mt-1">
                                                    La récurrence s'arrêtera le {new Date(formData.recurrenceJusquA).toLocaleDateString()}.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ONGLET FICHIERS */}
                    {activeTab === 'fichiers' && (
                        <div className="space-y-6">
                            {/* Zone de dépôt */}
                            <DropZone
                                onFilesAdded={handleFilesAdded}
                                acceptedTypes="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                                maxSizeMB={10}
                                multiple={true}
                            />

                            {/* Liste des fichiers */}
                            {formData.fichiers.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Documents ({formData.fichiers.length})</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {formData.fichiers.map(fichier => (
                                            <FilePreview
                                                key={fichier.id}
                                                file={fichier}
                                                onDelete={() => supprimerFichier(fichier.id, false)}
                                                showDelete={peutModifier}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Galerie de photos */}
                            {formData.photos.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Photos ({formData.photos.length})</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {formData.photos.map((photo, index) => (
                                            <div key={photo.id} className="relative group">
                                                <img
                                                    src={photo.dataUrl}
                                                    alt={photo.name}
                                                    className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                                                    onClick={() => setPhotoCarouselIndex(index)}
                                                />
                                                {peutModifier && (
                                                    <button
                                                        onClick={() => supprimerFichier(photo.id, true)}
                                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Icon name="close" size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Carrousel de photos */}
                            {photoCarouselIndex >= 0 && (
                                <PhotoCarousel
                                    photos={formData.photos}
                                    initialIndex={photoCarouselIndex}
                                    onClose={() => setPhotoCarouselIndex(-1)}
                                />
                            )}

                            {/* Message si aucun fichier */}
                            {formData.fichiers.length === 0 && formData.photos.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <Icon name="paperclip" size={48} className="mx-auto mb-2 text-gray-300" />
                                    <p>Aucun fichier ajouté</p>
                                    <p className="text-sm">Glissez-déposez des fichiers ou cliquez pour les sélectionner</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-6 border-t">
                    <div>
                        {job && peutModifier && (
                            <button
                                onClick={handleDelete}
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
                                {isSubmitting ? 'Sauvegarde...' : (job ? 'Modifier' : 'Créer')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}