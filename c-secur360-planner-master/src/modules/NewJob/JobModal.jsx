import { useState, useEffect, useCallback } from 'react';
import { Icon } from '../../components/UI/Icon';
import { Logo } from '../../components/UI/Logo';
import { DropZone } from '../../components/UI/DropZone';
import { FilePreview } from '../../components/UI/FilePreview';
import { PhotoCarousel } from '../../components/UI/PhotoCarousel';
import { ResourceSelector } from './ResourceSelector';

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
    const [expandedSections, setExpandedSections] = useState({
        etapes: false,
        preparation: false
    });

    const [formData, setFormData] = useState({
        numeroJob: '',
        nom: '',
        description: '',
        dateDebut: '',
        heureDebut: '08:00',
        dateFin: '',
        heureFin: '17:00',
        personnel: [],
        equipements: [],
        sousTraitants: [],
        lieu: '',
        priorite: 'normale',
        statut: 'planifie',
        bureau: '',
        client: '',
        budget: '',
        notes: '',
        documents: [],
        photos: [],
        dureePreviewHours: '',
        includeWeekendsInDuration: false,
        // Système d'heures planifiées
        heuresPlanifiees: '',
        modeHoraire: 'heures-jour', // 'heures-jour' ou '24h-24'
        heuresDebutJour: '08:00',
        heuresFinJour: '17:00',
        nombrePersonnelRequis: 1,
        etapes: [],
        preparation: [],
        typeHoraire: 'jour',
        horairesIndividuels: {},
        recurrence: {
            active: false,
            type: 'hebdomadaire',
            intervalle: 1,
            finRecurrence: 'date',
            dateFinRecurrence: '',
            nombreOccurrences: 10
        },
        equipes: [],
        assignationsEquipes: {},
        modeHoraireEquipes: 'global',
        ganttBaseline: {},
        criticalPath: [],
        showCriticalPath: false,
        ganttViewMode: 'days',
        equipesNumerotees: {},
        ganttMode: 'individuel',
        prochainNumeroEquipe: 1,
        equipeAutoGeneration: true
    });

    const [modificationMode, setModificationMode] = useState('groupe');
    const [ressourceIndividuelle, setRessourceIndividuelle] = useState(null);
    const [typeRessourceIndividuelle, setTypeRessourceIndividuelle] = useState('personnel');
    const [modificationsIndividuelles, setModificationsIndividuelles] = useState({});
    const [newSousTraitant, setNewSousTraitant] = useState('');

    // États pour les fonctionnalités Gantt avancées
    const [activeTab, setActiveTab] = useState('form');
    const [ganttFullscreen, setGanttFullscreen] = useState(false);
    const [ganttData, setGanttData] = useState({
        tasks: [],
        assignments: [],
        mode: 'global'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [photoCarouselIndex, setPhotoCarouselIndex] = useState(-1);

    const priorites = [
        { value: 'faible', label: '🟢 Faible', couleur: '#10B981' },
        { value: 'normale', label: '🟡 Normale', couleur: '#F59E0B' },
        { value: 'haute', label: '🟠 Haute', couleur: '#F97316' },
        { value: 'urgente', label: '🔴 Urgente', couleur: '#EF4444' }
    ];

    const statuts = [
        { value: 'planifie', label: '📋 Planifié', couleur: '#6B7280' },
        { value: 'en_cours', label: '🔄 En cours', couleur: '#3B82F6' },
        { value: 'termine', label: '✅ Terminé', couleur: '#10B981' },
        { value: 'annule', label: '❌ Annulé', couleur: '#EF4444' },
        { value: 'reporte', label: '⏸️ Reporté', couleur: '#F59E0B' }
    ];

    const bureaux = [
        'MDL Sherbrooke', 'MDL Terrebonne', 'MDL Québec',
        'DUAL Électrotech', 'CFM', 'Surplec'
    ];

    // Génération automatique du numéro de job
    const generateJobNumber = useCallback(() => {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const existingNumbers = jobs
            .filter(j => j.numeroJob?.startsWith(`G${year.toString().slice(-2)}-${month}`))
            .map(j => parseInt(j.numeroJob.split('-')[1]) || 0);
        const nextNumber = Math.max(0, ...existingNumbers) + 1;
        return `G${year.toString().slice(-2)}-${month}${String(nextNumber).padStart(2, '0')}`;
    }, [jobs]);

    // Initialisation du formulaire
    useEffect(() => {
        if (job) {
            setFormData({
                numeroJob: job.numeroJob || '',
                nom: job.nom || '',
                description: job.description || '',
                dateDebut: job.dateDebut ?
                    (typeof job.dateDebut === 'string' ? job.dateDebut.split('T')[0] : job.dateDebut.toISOString().split('T')[0]) : '',
                heureDebut: job.heureDebut || '08:00',
                dateFin: job.dateFin ?
                    (typeof job.dateFin === 'string' ? job.dateFin.split('T')[0] : job.dateFin.toISOString().split('T')[0]) : '',
                heureFin: job.heureFin || '17:00',
                personnel: job.personnel || [],
                equipements: job.equipements || [],
                sousTraitants: job.sousTraitants || [],
                lieu: job.lieu || '',
                priorite: job.priorite || 'normale',
                statut: job.statut || 'planifie',
                bureau: job.bureau || '',
                client: job.client || '',
                budget: job.budget || '',
                notes: job.notes || '',
                documents: job.documents || [],
                photos: job.photos || [],
                etapes: job.etapes || [],
                preparation: job.preparation || [],
                typeHoraire: job.typeHoraire || 'jour',
                ganttViewMode: job.ganttViewMode || 'days'
            });
        } else {
            const newJobNumber = generateJobNumber();
            setFormData({
                numeroJob: newJobNumber,
                nom: '',
                description: '',
                dateDebut: selectedCell ? selectedCell.date : '',
                heureDebut: '08:00',
                dateFin: '',
                heureFin: '17:00',
                personnel: [],
                equipements: [],
                sousTraitants: [],
                lieu: '',
                priorite: 'normale',
                statut: 'planifie',
                bureau: '',
                client: '',
                budget: '',
                notes: '',
                documents: [],
                photos: [],
                etapes: [],
                preparation: [],
                typeHoraire: 'jour',
                ganttViewMode: 'days'
            });
        }
    }, [job, selectedCell, generateJobNumber, isOpen]);

    // Système bidirectionnel d'heures : quand on change le personnel, ajuster les heures
    useEffect(() => {
        if (formData.personnel.length > 0 && formData.dateDebut && formData.dateFin &&
            formData.modeHoraire && formData.heuresDebutJour && formData.heuresFinJour) {

            const nouvellesHeures = calculateHeuresFromPersonnel(
                formData.personnel.length,
                formData.dateDebut,
                formData.dateFin,
                formData.modeHoraire,
                formData.heuresDebutJour,
                formData.heuresFinJour,
                formData.includeWeekendsInDuration
            );

            if (nouvellesHeures && nouvellesHeures !== formData.heuresPlanifiees) {
                setFormData(prev => ({
                    ...prev,
                    heuresPlanifiees: nouvellesHeures
                }));
            }
        }
    }, [formData.personnel.length, formData.dateDebut, formData.dateFin, formData.modeHoraire,
        formData.heuresDebutJour, formData.heuresFinJour, formData.includeWeekendsInDuration]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const updateField = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const toggleResource = (resourceId, type) => {
        setFormData(prev => {
            const field = type === 'personnel' ? 'personnel' :
                         type === 'equipement' ? 'equipements' : 'sousTraitants';
            const currentList = prev[field] || [];
            const isSelected = currentList.includes(resourceId);

            return {
                ...prev,
                [field]: isSelected
                    ? currentList.filter(id => id !== resourceId)
                    : [...currentList, resourceId]
            };
        });
    };

    const togglePersonnel = (personnelId) => toggleResource(personnelId, 'personnel');
    const toggleEquipement = (equipementId) => toggleResource(equipementId, 'equipement');
    const toggleSousTraitant = (sousTraitantId) => toggleResource(sousTraitantId, 'sousTraitants');

    const handleAddSousTraitant = () => {
        if (newSousTraitant.trim()) {
            const newId = addSousTraitant(newSousTraitant);
            if (newId) {
                setFormData(prev => ({
                    ...prev,
                    sousTraitants: [...(prev.sousTraitants || []), newId]
                }));
                setNewSousTraitant('');
                addNotification?.(`Sous-traitant "${newSousTraitant}" ajouté avec succès`, 'success');
            }
        }
    };

    const isResourceAvailable = (resource, dateDebut, dateFin) => {
        // Pour l'instant, considérer toutes les ressources comme disponibles
        // Cette logique peut être améliorée selon les besoins
        return true;
    };

    // Fonction de calcul automatique du personnel requis selon les heures
    const calculatePersonnelRequis = (heuresPlanifiees, dateDebut, dateFin, modeHoraire, heuresDebutJour, heuresFinJour, includeWeekends = false) => {
        if (!heuresPlanifiees || !dateDebut || !dateFin) return 1;

        const totalHeures = parseInt(heuresPlanifiees);
        if (isNaN(totalHeures) || totalHeures <= 0) return 1;

        // Calculer le nombre de jours de travail (incluant ou excluant les fins de semaine)
        const debut = new Date(dateDebut);
        const fin = new Date(dateFin);

        let joursOuvrables = 0;
        let currentDate = new Date(debut);

        while (currentDate <= fin) {
            const dayOfWeek = currentDate.getDay();
            if (includeWeekends || (dayOfWeek !== 0 && dayOfWeek !== 6)) {
                joursOuvrables++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        let heuresParJour;
        if (modeHoraire === '24h-24') {
            heuresParJour = 24;
        } else {
            // Calculer les heures entre début et fin de journée
            const [heureDebut, minuteDebut] = heuresDebutJour.split(':').map(Number);
            const [heureFin, minuteFin] = heuresFinJour.split(':').map(Number);
            const minutesDebut = heureDebut * 60 + minuteDebut;
            const minutesFin = heureFin * 60 + minuteFin;
            heuresParJour = (minutesFin - minutesDebut) / 60;
        }

        const heuresDisponibles = joursOuvrables * heuresParJour;
        const personnelRequis = Math.ceil(totalHeures / heuresDisponibles);

        return Math.max(1, personnelRequis);
    };

    // Fonction bidirectionnelle pour calculer les heures à partir du personnel et des dates
    const calculateHeuresFromPersonnel = (nombrePersonnel, dateDebut, dateFin, modeHoraire, heuresDebutJour, heuresFinJour, includeWeekends = false) => {
        if (!nombrePersonnel || !dateDebut || !dateFin) return '';

        const personnel = parseInt(nombrePersonnel);
        if (isNaN(personnel) || personnel <= 0) return '';

        // Calculer le nombre de jours de travail (incluant ou excluant les fins de semaine)
        const debut = new Date(dateDebut);
        const fin = new Date(dateFin);

        let joursOuvrables = 0;
        let currentDate = new Date(debut);

        while (currentDate <= fin) {
            const dayOfWeek = currentDate.getDay();
            if (includeWeekends || (dayOfWeek !== 0 && dayOfWeek !== 6)) {
                joursOuvrables++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        let heuresParJour;
        if (modeHoraire === '24h-24') {
            heuresParJour = 24;
        } else {
            // Calculer les heures entre début et fin de journée
            const [heureDebut, minuteDebut] = heuresDebutJour.split(':').map(Number);
            const [heureFin, minuteFin] = heuresFinJour.split(':').map(Number);
            const minutesDebut = heureDebut * 60 + minuteDebut;
            const minutesFin = heureFin * 60 + minuteFin;
            heuresParJour = (minutesFin - minutesDebut) / 60;
        }

        const totalHeuresDisponibles = joursOuvrables * heuresParJour * personnel;
        return totalHeuresDisponibles.toString();
    };

    // Fonction de sauvegarde
    const handleSubmit = () => {
        if (!formData.nom || !formData.dateDebut || !formData.dateFin) {
            addNotification?.('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const jobData = {
                ...formData,
                id: job?.id || Date.now().toString(),
                numeroJob: formData.numeroJob || `JOB-${Date.now()}`,
                // Calcul automatique du personnel requis si heures planifiées
                nombrePersonnelRequis: formData.heuresPlanifiees ?
                    calculatePersonnelRequis(
                        formData.heuresPlanifiees,
                        formData.dateDebut,
                        formData.dateFin,
                        formData.modeHoraire,
                        formData.heuresDebutJour,
                        formData.heuresFinJour,
                        formData.includeWeekendsInDuration
                    ) : formData.nombrePersonnelRequis
            };

            onSave(jobData);
            addNotification?.('Événement sauvegardé avec succès', 'success');
            onClose();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            addNotification?.('Erreur lors de la sauvegarde', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fonction de suppression
    const handleDelete = async () => {
        if (!job?.id) return;

        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce job ?')) {
            try {
                await onDelete(job.id);
                addNotification?.('Job supprimé avec succès', 'success');
                onClose();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                addNotification?.('Erreur lors de la suppression', 'error');
            }
        }
    };

    // Calculer le chemin critique
    const calculateCriticalPath = useCallback((tasks) => {
        if (!tasks || tasks.length === 0) return [];

        try {
            // Calcul simplifié du chemin critique
            // Pour l'instant, considérer les tâches les plus longues comme critiques
            const maxDuration = Math.max(...tasks.map(t => t.duration || 1));
            return tasks
                .filter(task => (task.duration || 1) >= maxDuration * 0.8)
                .map(task => task.id);
        } catch (error) {
            console.error('Erreur calcul chemin critique:', error);
            return [];
        }
    }, []);

    // Synchroniser les étapes avec le Gantt
    useEffect(() => {
        if (formData.etapes && formData.etapes.length > 0) {
            const tasks = formData.etapes.map((etape, index) => ({
                id: etape.id,
                name: etape.text || `Étape ${index + 1}`,
                duration: etape.duration || 1,
                completed: etape.completed || false,
                startDate: formData.dateDebut || new Date().toISOString().split('T')[0],
                endDate: formData.dateFin || new Date().toISOString().split('T')[0]
            }));

            const criticalPath = calculateCriticalPath(tasks);

            setGanttData(prev => ({
                ...prev,
                tasks,
                assignments: prev.assignments || []
            }));

            setFormData(prev => ({
                ...prev,
                criticalPath
            }));
        } else {
            setGanttData(prev => ({
                ...prev,
                tasks: []
            }));
        }
    }, [formData.etapes, formData.dateDebut, formData.dateFin, calculateCriticalPath]);

    const addEtape = () => {
        setFormData(prev => ({
            ...prev,
            etapes: [...prev.etapes, {
                id: Date.now(),
                text: '',
                completed: false,
                duration: 1,
                priority: 'normal'
            }]
        }));
    };

    const updateEtape = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            etapes: prev.etapes.map((etape, i) =>
                i === index ? { ...etape, [field]: value } : etape
            )
        }));
    };

    const removeEtape = (index) => {
        setFormData(prev => ({
            ...prev,
            etapes: prev.etapes.filter((_, i) => i !== index)
        }));
    };

    const addPreparation = () => {
        setFormData(prev => ({
            ...prev,
            preparation: [...prev.preparation, {
                id: Date.now(),
                text: '',
                statut: 'a-faire'
            }]
        }));
    };

    const updatePreparation = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            preparation: prev.preparation.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const removePreparation = (index) => {
        setFormData(prev => ({
            ...prev,
            preparation: prev.preparation.filter((_, i) => i !== index)
        }));
    };

    const handleFilesAdded = (files, type) => {
        const newFiles = files.map(file => ({
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            url: file.url,
            file: file.file
        }));

        setFormData(prev => ({
            ...prev,
            [type]: [...prev[type], ...newFiles]
        }));
    };

    const removeFile = (index, type) => {
        setFormData(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };



    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col">
                {/* Header noir comme le principal */}
                <div className="flex-shrink-0 flex items-center justify-between p-6 bg-gray-900 rounded-t-xl">
                    <div className="flex items-center gap-4">
                        <Logo size="normal" showText={false} />
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {job ? 'Modifier l\'événement' : 'Créer événement'}
                                {formData.numeroJob && (
                                    <span className="ml-3 text-gray-300 text-lg">#{formData.numeroJob}</span>
                                )}
                            </h2>
                            <p className="text-sm text-gray-300">
                                {job ? 'Modification d\'un événement existant' : 'Nouveau job dans le planificateur'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        title="Fermer"
                    >
                        <Icon name="close" size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b bg-gray-50">
                    <button
                        onClick={() => setActiveTab('form')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'form'
                                ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        📝 Formulaire
                    </button>
                    <button
                        onClick={() => setActiveTab('gantt')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'gantt'
                                ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        📊 Gantt
                    </button>
                    <button
                        onClick={() => setActiveTab('resources')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'resources'
                                ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        👥 Ressources
                    </button>
                    <button
                        onClick={() => setActiveTab('files')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'files'
                                ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        📎 Fichiers ({(formData.documents?.length || 0) + (formData.photos?.length || 0)})
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto min-h-0">
                    {/* Tab Formulaire */}
                    {activeTab === 'form' && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Informations de base */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Numéro de job *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.numeroJob}
                                        onChange={(e) => handleInputChange('numeroJob', e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nom du job *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nom}
                                        onChange={(e) => handleInputChange('nom', e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="Ex: Installation électrique"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 h-24 resize-none"
                                        placeholder="Description détaillée du job..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date de début *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.dateDebut}
                                        onChange={(e) => handleInputChange('dateDebut', e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Heure de début
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.heureDebut}
                                        onChange={(e) => handleInputChange('heureDebut', e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date de fin
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.dateFin}
                                        onChange={(e) => handleInputChange('dateFin', e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Heure de fin
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.heureFin}
                                        onChange={(e) => handleInputChange('heureFin', e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                {/* Section Heures Planifiées */}
                                <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-blue-900 mb-4">⏱️ Système d'heures planifiées</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Heures totales planifiées
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.heuresPlanifiees}
                                                onChange={(e) => handleInputChange('heuresPlanifiees', e.target.value)}
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="Ex: 150"
                                                min="0"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Nombre total d'heures à planifier</p>

                                            {/* Checkbox pour inclure les fins de semaine */}
                                            <div className="mt-2">
                                                <label className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.includeWeekendsInDuration}
                                                        onChange={(e) => handleInputChange('includeWeekendsInDuration', e.target.checked)}
                                                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                                                    />
                                                    <span className="text-gray-700">📅 Inclure les fins de semaine</span>
                                                </label>
                                                <p className="text-xs text-gray-500 ml-6">Active le travail samedi et dimanche</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Mode horaire
                                            </label>
                                            <select
                                                value={formData.modeHoraire}
                                                onChange={(e) => handleInputChange('modeHoraire', e.target.value)}
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="heures-jour">⏰ Heures par jour</option>
                                                <option value="24h-24">🌙 24h/24</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Personnel requis (calculé)
                                            </label>
                                            <div className="p-3 bg-green-100 border border-green-300 rounded-lg text-center">
                                                <span className="text-lg font-bold text-green-800">
                                                    {formData.heuresPlanifiees ?
                                                        calculatePersonnelRequis(
                                                            formData.heuresPlanifiees,
                                                            formData.dateDebut,
                                                            formData.dateFin,
                                                            formData.modeHoraire,
                                                            formData.heuresDebutJour,
                                                            formData.heuresFinJour,
                                                            formData.includeWeekendsInDuration
                                                        ) : 1
                                                    } personnes
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {formData.modeHoraire === 'heures-jour' && (
                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Heure début journée
                                                </label>
                                                <input
                                                    type="time"
                                                    value={formData.heuresDebutJour}
                                                    onChange={(e) => handleInputChange('heuresDebutJour', e.target.value)}
                                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Heure fin journée
                                                </label>
                                                <input
                                                    type="time"
                                                    value={formData.heuresFinJour}
                                                    onChange={(e) => handleInputChange('heuresFinJour', e.target.value)}
                                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {formData.heuresPlanifiees && formData.dateDebut && formData.dateFin && (
                                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <p className="text-sm text-yellow-800">
                                                💡 <strong>Calcul automatique :</strong> Avec {formData.heuresPlanifiees}h sur {
                                                    Math.ceil((new Date(formData.dateFin) - new Date(formData.dateDebut)) / (1000 * 60 * 60 * 24)) + 1
                                                } jours, il faut {
                                                    calculatePersonnelRequis(
                                                        formData.heuresPlanifiees,
                                                        formData.dateDebut,
                                                        formData.dateFin,
                                                        formData.modeHoraire,
                                                        formData.heuresDebutJour,
                                                        formData.heuresFinJour,
                                                        formData.includeWeekendsInDuration
                                                    )
                                                } personne(s) pour compléter le travail.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Lieu
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.lieu}
                                        onChange={(e) => handleInputChange('lieu', e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="Ex: 123 Rue Principale, Ville"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Bureau
                                    </label>
                                    <select
                                        value={formData.bureau}
                                        onChange={(e) => handleInputChange('bureau', e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">Sélectionner un bureau...</option>
                                        {bureaux.map(bureau => (
                                            <option key={bureau} value={bureau}>
                                                {bureau}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Client
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.client}
                                        onChange={(e) => handleInputChange('client', e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="Nom du client"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Budget
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.budget}
                                        onChange={(e) => handleInputChange('budget', e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Priorité
                                    </label>
                                    <select
                                        value={formData.priorite}
                                        onChange={(e) => handleInputChange('priorite', e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                    >
                                        {priorites.map(priorite => (
                                            <option key={priorite.value} value={priorite.value}>
                                                {priorite.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Statut
                                    </label>
                                    <select
                                        value={formData.statut}
                                        onChange={(e) => handleInputChange('statut', e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                    >
                                        {statuts.map(statut => (
                                            <option key={statut.value} value={statut.value}>
                                                {statut.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Section Étapes du projet avec scroll */}
                            <div
                                className={`p-4 bg-blue-50 rounded-lg border border-blue-200 transition-all duration-300 ${
                                    expandedSections.etapes ? 'fixed inset-4 z-50 bg-white shadow-2xl' : ''
                                }`}
                                onDoubleClick={() => {
                                    setExpandedSections(prev => ({
                                        ...prev,
                                        etapes: !prev.etapes
                                    }));
                                }}
                            >
                                <h4 className={`font-medium text-blue-800 flex items-center gap-2 mb-3 ${expandedSections.etapes ? 'text-lg' : ''}`}>
                                    <span>📋</span>
                                    Étapes du projet
                                    {expandedSections.etapes && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedSections(prev => ({
                                                    ...prev,
                                                    etapes: false
                                                }));
                                            }}
                                            className="ml-auto text-gray-500 hover:text-gray-700 text-2xl"
                                        >
                                            ×
                                        </button>
                                    )}
                                    {!expandedSections.etapes && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    addEtape();
                                                }}
                                                className="ml-auto px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                                            >
                                                <Icon name="plus" size={14} className="mr-1" />
                                                Ajouter
                                            </button>
                                            <span className="ml-2 text-xs text-blue-400">Double-clic pour agrandir</span>
                                        </>
                                    )}
                                </h4>

                                <div
                                    className={`space-y-2 mb-3 ${
                                        expandedSections.etapes
                                            ? 'overflow-y-auto max-h-[70vh]'
                                            : 'max-h-40 overflow-y-auto'
                                    }`}
                                    style={expandedSections.etapes ? { maxHeight: 'calc(100vh - 200px)' } : {}}
                                >
                                    {formData.etapes.map((etape, index) => (
                                        <div
                                            key={etape.id}
                                            className={`group flex items-center gap-2 p-2 bg-white rounded border hover:shadow-md transition-all ${
                                                expandedSections.etapes ? 'p-3 mb-2' : 'mb-1'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={etape.completed}
                                                onChange={(e) => updateEtape(index, 'completed', e.target.checked)}
                                                className="w-4 h-4"
                                            />
                                            <input
                                                type="text"
                                                value={etape.text}
                                                onChange={(e) => updateEtape(index, 'text', e.target.value)}
                                                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                                                placeholder={`Étape ${index + 1}`}
                                            />
                                            <input
                                                type="number"
                                                step="0.25"
                                                min="0.25"
                                                value={etape.duration}
                                                onChange={(e) => updateEtape(index, 'duration', parseFloat(e.target.value))}
                                                className="w-16 p-1 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                                                title="Durée en heures"
                                            />
                                            <span className="text-xs text-gray-500">h</span>
                                            <button
                                                type="button"
                                                onClick={() => removeEtape(index)}
                                                className="p-1 text-red-600 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Icon name="trash" size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {expandedSections.etapes && (
                                    <button
                                        type="button"
                                        onClick={addEtape}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Icon name="plus" size={16} className="mr-2" />
                                        Ajouter une étape
                                    </button>
                                )}
                            </div>

                            {/* Section Préparation avec scroll */}
                            <div
                                className={`p-4 bg-orange-50 rounded-lg border border-orange-200 transition-all duration-300 ${
                                    expandedSections.preparation ? 'fixed inset-4 z-50 bg-white shadow-2xl' : ''
                                }`}
                                onDoubleClick={() => {
                                    setExpandedSections(prev => ({
                                        ...prev,
                                        preparation: !prev.preparation
                                    }));
                                }}
                            >
                                <h4 className={`font-medium text-orange-800 flex items-center gap-2 mb-3 ${expandedSections.preparation ? 'text-lg' : ''}`}>
                                    <span>🛠️</span>
                                    Préparation et matériel
                                    {expandedSections.preparation && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedSections(prev => ({
                                                    ...prev,
                                                    preparation: false
                                                }));
                                            }}
                                            className="ml-auto text-gray-500 hover:text-gray-700 text-2xl"
                                        >
                                            ×
                                        </button>
                                    )}
                                    {!expandedSections.preparation && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    addPreparation();
                                                }}
                                                className="ml-auto px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
                                            >
                                                <Icon name="plus" size={14} className="mr-1" />
                                                Ajouter
                                            </button>
                                            <span className="ml-2 text-xs text-orange-400">Double-clic pour agrandir</span>
                                        </>
                                    )}
                                </h4>

                                <div
                                    className={`space-y-2 mb-3 ${
                                        expandedSections.preparation
                                            ? 'overflow-y-auto max-h-[70vh]'
                                            : 'max-h-40 overflow-y-auto'
                                    }`}
                                    style={expandedSections.preparation ? { maxHeight: 'calc(100vh - 200px)' } : {}}
                                >
                                    {formData.preparation.map((item, index) => (
                                        <div
                                            key={index}
                                            className={`group flex items-center gap-2 p-2 bg-white rounded border hover:shadow-md transition-all ${
                                                expandedSections.preparation ? 'p-3 mb-2' : 'mb-1'
                                            }`}
                                        >
                                            <select
                                                value={item.statut || 'a-faire'}
                                                onChange={(e) => updatePreparation(index, 'statut', e.target.value)}
                                                className="w-24 p-1 border rounded text-xs font-medium"
                                            >
                                                <option value="a-faire">À faire</option>
                                                <option value="en-cours">En cours</option>
                                                <option value="termine">Terminé</option>
                                            </select>
                                            <input
                                                type="text"
                                                value={item.text || ''}
                                                onChange={(e) => updatePreparation(index, 'text', e.target.value)}
                                                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-orange-500 text-sm"
                                                placeholder={`Préparation ${index + 1}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removePreparation(index)}
                                                className="p-1 text-red-600 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Icon name="trash" size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {expandedSections.preparation && (
                                    <button
                                        type="button"
                                        onClick={addPreparation}
                                        className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                    >
                                        <Icon name="plus" size={16} className="mr-2" />
                                        Ajouter une préparation
                                    </button>
                                )}
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 h-24 resize-none"
                                    placeholder="Notes additionnelles..."
                                />
                            </div>
                        </form>
                    )}

                    {/* Tab Gantt */}
                    {activeTab === 'gantt' && (
                        <div className="space-y-6">
                            {/* Options Gantt */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold">Diagramme de Gantt</h3>
                                    <div className="flex space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => updateField('showCriticalPath', !formData.showCriticalPath)}
                                            className={`px-3 py-1 text-sm rounded ${
                                                formData.showCriticalPath
                                                    ? 'bg-red-600 text-white'
                                                    : 'bg-gray-200 text-gray-700'
                                            }`}
                                        >
                                            Chemin critique
                                        </button>
                                        <select
                                            value={formData.ganttViewMode}
                                            onChange={(e) => updateField('ganttViewMode', e.target.value)}
                                            className="text-sm border rounded px-2 py-1"
                                        >
                                            <option value="hours">Heures</option>
                                            <option value="days">Jours</option>
                                            <option value="weeks">Semaines</option>
                                            <option value="months">Mois</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Vue Gantt simplifiée */}
                                <div className="bg-white border rounded-lg p-4 min-h-64">
                                    {ganttData.tasks.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <Icon name="bar-chart" size={48} className="mx-auto mb-4 opacity-50" />
                                            <p>Ajoutez des étapes au projet pour voir le diagramme de Gantt</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="text-sm font-medium text-gray-700 mb-3">
                                                Planification des tâches ({ganttData.tasks.length} tâches)
                                            </div>
                                            {ganttData.tasks.map((task, index) => (
                                                <div key={task.id} className="flex items-center space-x-3 p-2 border rounded">
                                                    <div className="w-1/3 text-sm font-medium truncate">
                                                        {task.name}
                                                    </div>
                                                    <div className="flex-1 relative h-6 bg-gray-200 rounded">
                                                        <div
                                                            className={`absolute top-0 left-0 h-full rounded transition-all ${
                                                                formData.showCriticalPath && ganttData.criticalPath?.includes(task.id)
                                                                    ? 'bg-red-500'
                                                                    : task.completed
                                                                        ? 'bg-green-500'
                                                                        : 'bg-blue-500'
                                                            }`}
                                                            style={{
                                                                width: `${Math.max(5, (task.duration || 0.25) * 10)}%`,
                                                                marginLeft: `${index * 10}%`
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="w-16 text-xs text-gray-600">
                                                        {task.duration}h
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Statistiques Gantt */}
                                {ganttData.tasks.length > 0 && (
                                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div className="bg-blue-50 p-2 rounded">
                                            <div className="font-medium text-blue-800">Total tâches</div>
                                            <div className="text-blue-600">{ganttData.tasks.length}</div>
                                        </div>
                                        <div className="bg-green-50 p-2 rounded">
                                            <div className="font-medium text-green-800">Complétées</div>
                                            <div className="text-green-600">
                                                {ganttData.tasks.filter(t => t.completed).length}
                                            </div>
                                        </div>
                                        <div className="bg-yellow-50 p-2 rounded">
                                            <div className="font-medium text-yellow-800">Durée totale</div>
                                            <div className="text-yellow-600">
                                                {ganttData.tasks.reduce((sum, t) => sum + (t.duration || 0), 0)}h
                                            </div>
                                        </div>
                                        <div className="bg-purple-50 p-2 rounded">
                                            <div className="font-medium text-purple-800">Progression</div>
                                            <div className="text-purple-600">
                                                {ganttData.tasks.length > 0
                                                    ? Math.round((ganttData.tasks.filter(t => t.completed).length / ganttData.tasks.length) * 100)
                                                    : 0}%
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab Ressources */}
                    {activeTab === 'resources' && (
                        <ResourceSelector
                            personnel={personnel}
                            equipements={equipements}
                            sousTraitants={sousTraitants}
                            selectedPersonnel={formData.personnel}
                            selectedEquipements={formData.equipements}
                            selectedSousTraitants={formData.sousTraitants}
                            onTogglePersonnel={togglePersonnel}
                            onToggleEquipement={toggleEquipement}
                            onToggleSousTraitant={toggleSousTraitant}
                            onAddSousTraitant={handleAddSousTraitant}
                            newSousTraitant={newSousTraitant}
                            setNewSousTraitant={setNewSousTraitant}
                            isResourceAvailable={isResourceAvailable}
                            dateDebut={formData.dateDebut}
                            dateFin={formData.dateFin}
                        />
                    )}

                    {/* Tab Fichiers */}
                    {activeTab === 'files' && (
                        <div className="space-y-6">
                            {/* Documents */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">
                                    📄 Documents ({formData.documents.length})
                                </h3>
                                <DropZone
                                    onFilesSelected={(files) => handleFilesAdded(files, 'documents')}
                                    accept="*"
                                    multiple={true}
                                />
                                {formData.documents.length > 0 && (
                                    <div className="mt-4">
                                        <FilePreview
                                            files={formData.documents}
                                            onRemove={(index) => removeFile(index, 'documents')}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Photos */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">
                                    📷 Photos ({formData.photos.length})
                                </h3>
                                <DropZone
                                    onFilesSelected={(files) => handleFilesAdded(files, 'photos')}
                                    accept="image/*"
                                    multiple={true}
                                />
                                {formData.photos.length > 0 && (
                                    <div className="mt-4">
                                        <FilePreview
                                            files={formData.photos}
                                            onRemove={(index) => removeFile(index, 'photos')}
                                            onPreview={(file, index) => setPhotoCarouselIndex(index)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 flex justify-between items-center p-6 border-t bg-gray-50">
                    {job && peutModifier && (
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
                        {peutModifier && (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Photo Carousel */}
            {photoCarouselIndex >= 0 && formData.photos.length > 0 && (
                <PhotoCarousel
                    photos={formData.photos}
                    startIndex={photoCarouselIndex}
                    onClose={() => setPhotoCarouselIndex(-1)}
                />
            )}
        </div>
    );
}