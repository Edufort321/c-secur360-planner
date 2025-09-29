import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '../../components/UI/Icon';
import { Logo } from '../../components/UI/Logo';
import { DropZone } from '../../components/UI/DropZone';
import { FilePreview } from '../../components/UI/FilePreview';
import { ResourceSelector } from './ResourceSelector';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import {
    formatLocalizedDate,
    getLocalizedDayName,
    localizedDateString
} from '../../utils/localizedDateUtils.js';

export function JobModal({
    isOpen,
    onClose,
    job,
    onSave,
    onDelete,
    personnel,
    equipements,
    sousTraitants,
    succursales = [],
    conges = [],
    jobs = [],
    addSousTraitant,
    selectedCell,
    addNotification,
    peutModifier = true,
    estCoordonnateur = false,
    onOpenConflictJob
}) {
    const { t, currentLanguage } = useLanguage();

    // État principal des données du formulaire
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
        personnelAssigne: [],
        equipementAssigne: [],
        horaireMode: 'global',
        lieu: '',
        priorite: 'normale',
        statut: 'planifie',
        client: '',
        succursaleEnCharge: '',
        budget: '',
        notes: '',
        documents: [],
        photos: [],
        dureePreviewHours: '',
        includeWeekendsInDuration: false,
        heuresPlanifiees: '',
        modeHoraire: 'heures-jour',
        heuresDebutJour: '08:00',
        heuresFinJour: '17:00',
        nombrePersonnelRequis: 1,
        etapes: [],
        preparation: [],
        typeHoraire: 'jour',
        horairesParJour: {},
        horairesIndividuels: {},
        horairesEquipes: {},
        horairesDepartements: {},
        assignationsParJour: {},
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
        ganttViewMode: 'day',
        equipesNumerotees: {},
        ganttMode: 'individuel',
        prochainNumeroEquipe: 1,
        equipeAutoGeneration: true,
        resourcesPersonnaliseeParJour: {}
    });

    // États pour l'interface utilisateur
    const [activeTab, setActiveTab] = useState('form');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ganttFullscreen, setGanttFullscreen] = useState(false);
    const [ganttCompactMode, setGanttCompactMode] = useState(false);
    const [newSousTraitant, setNewSousTraitant] = useState('');

    // Initialisation des données si c'est un job existant
    useEffect(() => {
        if (job) {
            setFormData(prevData => ({
                ...prevData,
                ...job
            }));
        }
    }, [job]);

    // Utilitaires Gantt
    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const getDefaultViewMode = () => {
        const totalHours = formData.etapes.reduce((sum, etape) => sum + (etape.duration || 0), 0);
        if (totalHours <= 6) return '6h';
        if (totalHours <= 12) return '12h';
        if (totalHours <= 24) return '24h';
        if (totalHours <= 168) return 'day'; // 7 jours
        if (totalHours <= 720) return 'week'; // 30 jours
        return 'month';
    };

    const getTotalProjectHours = () => {
        return formData.etapes.reduce((sum, etape) => sum + (etape.duration || 0), 0);
    };

    const generateTimeScale = () => {
        if (!formData.dateDebut) return [];

        const viewMode = formData.ganttViewMode || getDefaultViewMode();
        const startDate = new Date(formData.dateDebut);
        const scale = [];

        switch (viewMode) {
            case '6h':
                for (let hour = 0; hour < 6; hour++) {
                    const currentTime = new Date(startDate.getTime() + (hour * 60 * 60 * 1000));
                    scale.push({
                        date: currentTime,
                        label: currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                        key: `hour-${hour}`,
                        value: hour
                    });
                }
                break;
            case '12h':
                for (let hour = 0; hour < 12; hour++) {
                    const currentTime = new Date(startDate.getTime() + (hour * 60 * 60 * 1000));
                    scale.push({
                        date: currentTime,
                        label: currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                        key: `hour-${hour}`,
                        value: hour
                    });
                }
                break;
            case '24h':
                for (let hour = 0; hour < 24; hour++) {
                    const currentTime = new Date(startDate.getTime() + (hour * 60 * 60 * 1000));
                    scale.push({
                        date: currentTime,
                        label: currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                        key: `hour-${hour}`,
                        value: hour
                    });
                }
                break;
            case 'day':
            default:
                const totalHours = Math.max(1, getTotalProjectHours());
                const totalDays = Math.max(1, Math.ceil(totalHours / 8)); // 8h par jour
                for (let day = 0; day < totalDays; day++) {
                    const currentDate = new Date(startDate.getTime() + (day * 24 * 60 * 60 * 1000));
                    scale.push({
                        date: currentDate,
                        label: currentDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
                        key: `day-${day}`,
                        value: day
                    });
                }
                break;
        }

        return scale;
    };

    const addNewTask = () => {
        const lastTask = formData.etapes[formData.etapes.length - 1];
        const nextStartHour = lastTask ? lastTask.startHour + lastTask.duration : 0;

        const newTask = {
            id: Date.now().toString(),
            name: 'Nouvelle tâche',
            duration: 8,
            startHour: nextStartHour,
            description: '',
            priority: 'normale',
            status: 'planifie',
            resources: [],
            dependencies: []
        };
        setFormData(prev => ({
            ...prev,
            etapes: [...prev.etapes, newTask]
        }));

        addNotification?.('Nouvelle tâche ajoutée au planning', 'success');
    };

    const updateTask = (taskId, updates) => {
        setFormData(prev => ({
            ...prev,
            etapes: prev.etapes.map(task =>
                task.id === taskId ? { ...task, ...updates } : task
            )
        }));
    };

    const deleteTask = (taskId) => {
        setFormData(prev => ({
            ...prev,
            etapes: prev.etapes.filter(task => task.id !== taskId)
        }));
    };

    // Gestionnaires de ressources
    const toggleResource = (resourceId, resourceType) => {
        setFormData(prev => {
            const currentList = prev[resourceType] || [];
            return {
                ...prev,
                [resourceType]: currentList.includes(resourceId)
                    ? currentList.filter(id => id !== resourceId)
                    : [...currentList, resourceId]
            };
        });
    };

    const togglePersonnel = (personnelId) => toggleResource(personnelId, 'personnel');
    const toggleEquipement = (equipementId) => toggleResource(equipementId, 'equipements');
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


    const isResourceAvailable = (resourceId, resourceType, dateDebut, dateFin) => {
        // Logique de base pour vérifier la disponibilité
        // Dans une version complète, ceci vérifierait les conflits avec d'autres jobs
        return true;
    };

    const checkResourceConflicts = (resourceId, resourceType, dateDebut, dateFin, excludeJobId = null) => {
        // Logique de base pour détecter les conflits
        // Dans une version complète, ceci retournerait une liste des conflits détectés
        return [];
    };

    const handleFilesAdded = (files, type) => {
        setFormData(prev => ({
            ...prev,
            [type]: [...prev[type], ...files]
        }));
    };

    const removeFile = (index, type) => {
        setFormData(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };

    // Gestionnaires d'événements
    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce job ?')) {
            try {
                await onDelete(job.id);
                onClose();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="job-modal-wrapper">
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex-shrink-0 flex items-center justify-between p-6 bg-gray-900 rounded-t-xl">
                        <div className="flex items-center gap-4">
                            <Logo size="normal" showText={false} />
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {job ? 'Modifier le Job' : 'Nouveau Job'}
                                </h2>
                                <p className="text-gray-300 text-sm">
                                    Planification des travaux C-Secur360
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Navigation Tabs */}
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

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto">
                        {/* Onglet Formulaire */}
                        {activeTab === 'form' && (
                            <div className="p-6">
                                <div className="space-y-6">
                                    {/* Informations de base */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Numéro de Job
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.numeroJob}
                                                onChange={(e) => setFormData(prev => ({ ...prev, numeroJob: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                placeholder="Ex: G25-0101"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nom du Job
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.nom}
                                                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                placeholder="Nom du job"
                                                required
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Description
                                            </label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                rows={3}
                                                placeholder="Description du travail à effectuer"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Date de début
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.dateDebut}
                                                onChange={(e) => setFormData(prev => ({ ...prev, dateDebut: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Date de fin
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.dateFin}
                                                onChange={(e) => setFormData(prev => ({ ...prev, dateFin: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Lieu
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.lieu}
                                                onChange={(e) => setFormData(prev => ({ ...prev, lieu: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                placeholder="Lieu d'intervention"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Client
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.client}
                                                onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                placeholder="Nom du client"
                                            />
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Notes
                                        </label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            rows={3}
                                            placeholder="Notes supplémentaires"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Onglet Gantt */}
                        {activeTab === 'gantt' && (
                            <div className={`${ganttFullscreen ? 'fixed inset-0 z-50 bg-white overflow-auto p-6' : 'h-full overflow-y-auto p-6'}`}>
                                <div className="space-y-6">
                                    {/* Header Gantt */}
                                    <div className="flex items-center gap-4 p-4 bg-gray-900 rounded-lg">
                                        <Logo size="normal" showText={false} />
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-white flex items-center">
                                                📊 Diagramme de Gantt et Timeline
                                            </h3>
                                            <p className="text-sm text-gray-300">
                                                Planification temporelle ({formData.etapes.length} tâches, {getTotalProjectHours()}h total)
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setGanttFullscreen(!ganttFullscreen)}
                                            className="text-gray-400 hover:text-white transition-colors"
                                        >
                                            {ganttFullscreen ? '🗗' : '🗖'}
                                        </button>
                                    </div>

                                    {/* Contrôles Gantt */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <button
                                                    onClick={addNewTask}
                                                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                                                >
                                                    ➕ Ajouter une tâche
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const projectTemplate = [
                                                            { name: 'Inspection initiale', duration: 2, priority: 'haute' },
                                                            { name: 'Préparation matériel', duration: 1, priority: 'normale' },
                                                            { name: 'Installation système', duration: 6, priority: 'haute' },
                                                            { name: 'Tests et validation', duration: 2, priority: 'haute' },
                                                            { name: 'Formation client', duration: 1, priority: 'normale' }
                                                        ];

                                                        const newTasks = projectTemplate.map((template, index) => ({
                                                            id: (Date.now() + index).toString(),
                                                            name: template.name,
                                                            duration: template.duration,
                                                            startHour: index * template.duration,
                                                            description: `Tâche générée automatiquement: ${template.name}`,
                                                            priority: template.priority,
                                                            status: 'planifie',
                                                            resources: [],
                                                            dependencies: index > 0 ? [(Date.now() + index - 1).toString()] : []
                                                        }));

                                                        setFormData(prev => ({
                                                            ...prev,
                                                            etapes: [...prev.etapes, ...newTasks]
                                                        }));

                                                        addNotification?.(`${newTasks.length} tâches de projet type ajoutées`, 'success');
                                                    }}
                                                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                                                >
                                                    🛠️ Projet type
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const randomStatuses = ['planifie', 'en_cours', 'termine', 'bloque'];
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            etapes: prev.etapes.map(task => ({
                                                                ...task,
                                                                status: randomStatuses[Math.floor(Math.random() * randomStatuses.length)]
                                                            }))
                                                        }));
                                                        addNotification?.('Statuts mis à jour aléatoirement pour démonstration', 'info');
                                                    }}
                                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                                                >
                                                    🎲 Simulation
                                                </button>
                                                <button
                                                    onClick={() => updateField('showCriticalPath', !formData.showCriticalPath)}
                                                    className={`px-3 py-1 text-sm rounded flex items-center gap-1 ${
                                                        formData.showCriticalPath
                                                            ? 'bg-red-500 text-white'
                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                                >
                                                    🚨 Critique
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm font-medium text-gray-700">Vue:</label>
                                                <select
                                                    value={formData.ganttViewMode || getDefaultViewMode()}
                                                    onChange={(e) => updateField('ganttViewMode', e.target.value)}
                                                    className="text-sm border rounded px-2 py-1"
                                                >
                                                    <option value="6h">⏰ Vue 6h</option>
                                                    <option value="12h">🕐 Vue 12h</option>
                                                    <option value="24h">🕛 Vue 24h</option>
                                                    <option value="day">📅 Jour</option>
                                                    <option value="week">📋 Semaine</option>
                                                    <option value="month">🗓️ Mois</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline Gantt */}
                                    {formData.dateDebut && (
                                        <div className="bg-white border rounded-lg overflow-hidden">
                                            {/* En-tête timeline */}
                                            <div className="bg-gray-100 p-3 border-b">
                                                <div className="grid grid-cols-12 gap-2">
                                                    <div className="col-span-4 font-medium text-gray-700">Tâches</div>
                                                    <div className="col-span-2 font-medium text-gray-700 text-center">Durée</div>
                                                    <div className="col-span-6 font-medium text-gray-700 text-center">Timeline</div>
                                                </div>
                                            </div>

                                            {/* Échelle temporelle */}
                                            <div className="bg-gray-50 border-b">
                                                <div className="grid grid-cols-12 gap-2 p-2">
                                                    <div className="col-span-6"></div>
                                                    <div className="col-span-6">
                                                        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${generateTimeScale().length}, 1fr)` }}>
                                                            {generateTimeScale().map((item, index) => (
                                                                <div key={item.key} className="text-xs text-center text-gray-600 p-1 border-r border-gray-200">
                                                                    {item.label}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Liste des tâches */}
                                            <div className="divide-y">
                                                {formData.etapes.length === 0 ? (
                                                    <div className="p-8 text-center text-gray-500">
                                                        <div className="text-4xl mb-2">📋</div>
                                                        <p>Aucune tâche définie</p>
                                                        <p className="text-sm mt-1">Cliquez sur "Ajouter une tâche" pour commencer</p>
                                                    </div>
                                                ) : (
                                                    formData.etapes.map((task, index) => {
                                                        const timeScale = generateTimeScale();
                                                        const taskWidth = Math.max(1, (task.duration || 1) / 8 * 100); // Largeur proportionnelle
                                                        const taskStart = (task.startHour || 0) / 8 * 100; // Position de départ

                                                        return (
                                                            <div key={task.id} className="grid grid-cols-12 gap-2 p-3 hover:bg-gray-50">
                                                                {/* Nom de la tâche */}
                                                                <div className="col-span-4">
                                                                    <input
                                                                        type="text"
                                                                        value={task.name || ''}
                                                                        onChange={(e) => updateTask(task.id, { name: e.target.value })}
                                                                        className="w-full text-sm border-none bg-transparent focus:bg-white focus:border focus:border-purple-300 rounded px-2 py-1"
                                                                        placeholder="Nom de la tâche"
                                                                    />
                                                                </div>

                                                                {/* Durée */}
                                                                <div className="col-span-2 text-center">
                                                                    <input
                                                                        type="number"
                                                                        value={task.duration || 0}
                                                                        onChange={(e) => updateTask(task.id, { duration: parseInt(e.target.value) || 0 })}
                                                                        className="w-16 text-sm text-center border border-gray-300 rounded px-1 py-1"
                                                                        min="0"
                                                                        step="1"
                                                                    />
                                                                    <span className="text-xs text-gray-500 ml-1">h</span>
                                                                </div>

                                                                {/* Barre Gantt */}
                                                                <div className="col-span-6">
                                                                    <div className="relative h-8 bg-gray-100 rounded">
                                                                        <div
                                                                            className={`absolute top-1 h-6 rounded flex items-center px-2 text-xs text-white font-medium ${
                                                                                task.status === 'termine' ? 'bg-green-500' :
                                                                                task.priority === 'haute' ? 'bg-red-500' :
                                                                                task.priority === 'basse' ? 'bg-blue-400' :
                                                                                'bg-purple-500'
                                                                            }`}
                                                                            style={{
                                                                                left: `${Math.min(95, taskStart)}%`,
                                                                                width: `${Math.min(100 - taskStart, taskWidth)}%`
                                                                            }}
                                                                        >
                                                                            {task.name || 'Tâche'}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Actions */}
                                                                <div className="col-span-12 mt-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <select
                                                                            value={task.priority || 'normale'}
                                                                            onChange={(e) => updateTask(task.id, { priority: e.target.value })}
                                                                            className="text-xs border rounded px-2 py-1"
                                                                        >
                                                                            <option value="basse">🔵 Basse</option>
                                                                            <option value="normale">⚪ Normale</option>
                                                                            <option value="haute">🔴 Haute</option>
                                                                        </select>
                                                                        <select
                                                                            value={task.status || 'planifie'}
                                                                            onChange={(e) => updateTask(task.id, { status: e.target.value })}
                                                                            className="text-xs border rounded px-2 py-1"
                                                                        >
                                                                            <option value="planifie">📋 Planifié</option>
                                                                            <option value="en_cours">⚡ En cours</option>
                                                                            <option value="termine">✅ Terminé</option>
                                                                            <option value="bloque">🚫 Bloqué</option>
                                                                        </select>
                                                                        <button
                                                                            onClick={() => deleteTask(task.id)}
                                                                            className="text-red-500 hover:text-red-700 text-xs px-2 py-1"
                                                                        >
                                                                            🗑️
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Résumé du projet */}
                                    {formData.etapes.length > 0 && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h4 className="font-medium text-blue-800 mb-2">📈 Résumé du projet</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <span className="text-blue-600 font-medium">Total tâches:</span>
                                                    <div className="text-lg font-bold text-blue-800">{formData.etapes.length}</div>
                                                </div>
                                                <div>
                                                    <span className="text-blue-600 font-medium">Durée totale:</span>
                                                    <div className="text-lg font-bold text-blue-800">{getTotalProjectHours()}h</div>
                                                </div>
                                                <div>
                                                    <span className="text-blue-600 font-medium">Tâches terminées:</span>
                                                    <div className="text-lg font-bold text-green-600">
                                                        {formData.etapes.filter(t => t.status === 'termine').length}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-blue-600 font-medium">Estimation:</span>
                                                    <div className="text-lg font-bold text-blue-800">
                                                        {Math.ceil(getTotalProjectHours() / 8)} jours
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!formData.dateDebut && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                                            <div className="text-yellow-600">
                                                ⚠️ Veuillez définir une date de début dans l'onglet Formulaire pour utiliser le Gantt
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const today = new Date().toISOString().split('T')[0];
                                                    setFormData(prev => ({ ...prev, dateDebut: today }));
                                                    setActiveTab('gantt');
                                                }}
                                                className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                                            >
                                                📅 Définir aujourd'hui et voir le Gantt
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Onglet Ressources */}
                        {activeTab === 'resources' && (
                            <div className="h-full overflow-y-auto p-6">
                                <div className="space-y-6">
                                    {/* Header Ressources */}
                                    <div className="flex items-center gap-4 p-4 bg-gray-900 rounded-lg">
                                        <Logo size="normal" showText={false} />
                                        <div>
                                            <h3 className="text-lg font-bold text-white flex items-center">
                                                👥 Gestion des Ressources
                                            </h3>
                                            <p className="text-sm text-gray-300">
                                                Assignment du personnel et des équipements
                                            </p>
                                        </div>
                                    </div>

                                    {/* Personnel */}
                                    <div className="bg-white border rounded-lg overflow-hidden">
                                        <div className="bg-blue-50 p-4 border-b">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium text-blue-800 flex items-center gap-2">
                                                    👤 Personnel ({formData.personnel?.length || 0} assigné{(formData.personnel?.length || 0) > 1 ? 's' : ''})
                                                </h4>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const allPersonnelIds = personnel.map(p => p.id);
                                                            setFormData(prev => ({ ...prev, personnel: allPersonnelIds }));
                                                            addNotification?.('Tout le personnel sélectionné', 'success');
                                                        }}
                                                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                                    >
                                                        ✓ Tout sélectionner
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, personnel: [] }));
                                                            addNotification?.('Personnel désélectionné', 'info');
                                                        }}
                                                        className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                                    >
                                                        ✗ Tout désélectionner
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            {personnel && personnel.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {personnel.map(person => {
                                                        const isSelected = formData.personnel?.includes(person.id);
                                                        const isAvailable = isResourceAvailable(person.id, 'personnel', formData.dateDebut, formData.dateFin);

                                                        return (
                                                            <div
                                                                key={person.id}
                                                                onClick={() => togglePersonnel(person.id)}
                                                                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                                                    isSelected
                                                                        ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                                                                        : isAvailable
                                                                            ? 'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                                                                            : 'bg-red-50 border-red-200 opacity-60'
                                                                }`}
                                                            >
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex-1">
                                                                        <div className="font-medium text-sm">
                                                                            {person.prenom ? `${person.prenom} ${person.nom}` : person.nom}
                                                                        </div>
                                                                        <div className="text-xs text-gray-600 mt-1">{person.poste}</div>
                                                                        <div className="text-xs text-gray-500">{person.succursale}</div>
                                                                    </div>
                                                                    <div className="ml-2">
                                                                        {isSelected ? (
                                                                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                                                <span className="text-white text-xs">✓</span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <div className="text-4xl mb-2">👤</div>
                                                    <p>Aucun personnel disponible</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Équipements */}
                                    <div className="bg-white border rounded-lg overflow-hidden">
                                        <div className="bg-green-50 p-4 border-b">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium text-green-800 flex items-center gap-2">
                                                    🔧 Équipements ({formData.equipements?.length || 0} assigné{(formData.equipements?.length || 0) > 1 ? 's' : ''})
                                                </h4>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const allEquipementIds = equipements.map(e => e.id);
                                                            setFormData(prev => ({ ...prev, equipements: allEquipementIds }));
                                                            addNotification?.('Tous les équipements sélectionnés', 'success');
                                                        }}
                                                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                                    >
                                                        ✓ Tout sélectionner
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, equipements: [] }));
                                                            addNotification?.('Équipements désélectionnés', 'info');
                                                        }}
                                                        className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                                    >
                                                        ✗ Tout désélectionner
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            {equipements && equipements.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {equipements.map(equipment => {
                                                        const isSelected = formData.equipements?.includes(equipment.id);
                                                        const isAvailable = isResourceAvailable(equipment.id, 'equipement', formData.dateDebut, formData.dateFin);

                                                        return (
                                                            <div
                                                                key={equipment.id}
                                                                onClick={() => toggleEquipement(equipment.id)}
                                                                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                                                    isSelected
                                                                        ? 'bg-green-50 border-green-300 ring-2 ring-green-200'
                                                                        : isAvailable
                                                                            ? 'bg-gray-50 border-gray-200 hover:bg-green-50 hover:border-green-300'
                                                                            : 'bg-red-50 border-red-200 opacity-60'
                                                                }`}
                                                            >
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex-1">
                                                                        <div className="font-medium text-sm">{equipment.nom}</div>
                                                                        <div className="text-xs text-gray-600 mt-1">{equipment.type}</div>
                                                                        <div className="text-xs text-gray-500">{equipment.succursale}</div>
                                                                    </div>
                                                                    <div className="ml-2">
                                                                        {isSelected ? (
                                                                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                                                <span className="text-white text-xs">✓</span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <div className="text-4xl mb-2">🔧</div>
                                                    <p>Aucun équipement disponible</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Sous-traitants */}
                                    <div className="bg-white border rounded-lg overflow-hidden">
                                        <div className="bg-purple-50 p-4 border-b">
                                            <h4 className="font-medium text-purple-800 flex items-center gap-2">
                                                🏢 Sous-traitants ({formData.sousTraitants?.length || 0} assigné{(formData.sousTraitants?.length || 0) > 1 ? 's' : ''})
                                            </h4>
                                        </div>
                                        <div className="p-4">
                                            {/* Ajouter nouveau sous-traitant */}
                                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                                <div className="flex gap-2 mb-2">
                                                    <input
                                                        type="text"
                                                        value={newSousTraitant}
                                                        onChange={(e) => setNewSousTraitant(e.target.value)}
                                                        placeholder="Nom du nouveau sous-traitant"
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                        onKeyPress={(e) => e.key === 'Enter' && handleAddSousTraitant()}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleAddSousTraitant}
                                                        disabled={!newSousTraitant.trim()}
                                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        ➕ Ajouter
                                                    </button>
                                                </div>
                                                <div className="flex gap-2 text-xs">
                                                    <button
                                                        onClick={() => setNewSousTraitant('Électricien Pro')}
                                                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                                    >
                                                        ⚡ Électricien Pro
                                                    </button>
                                                    <button
                                                        onClick={() => setNewSousTraitant('Plomberie Expert')}
                                                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                                    >
                                                        🔧 Plomberie Expert
                                                    </button>
                                                    <button
                                                        onClick={() => setNewSousTraitant('Sécurité Plus')}
                                                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                                    >
                                                        🔒 Sécurité Plus
                                                    </button>
                                                </div>
                                            </div>

                                            {sousTraitants && sousTraitants.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {sousTraitants.map(sousTraitant => {
                                                        const isSelected = formData.sousTraitants?.includes(sousTraitant.id);

                                                        return (
                                                            <div
                                                                key={sousTraitant.id}
                                                                onClick={() => toggleSousTraitant(sousTraitant.id)}
                                                                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                                                    isSelected
                                                                        ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-200'
                                                                        : 'bg-gray-50 border-gray-200 hover:bg-purple-50 hover:border-purple-300'
                                                                }`}
                                                            >
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex-1">
                                                                        <div className="font-medium text-sm">{sousTraitant.nom}</div>
                                                                        <div className="text-xs text-gray-600 mt-1">{sousTraitant.specialite}</div>
                                                                        <div className="text-xs text-gray-500">{sousTraitant.contact}</div>
                                                                    </div>
                                                                    <div className="ml-2">
                                                                        {isSelected ? (
                                                                            <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                                                                <span className="text-white text-xs">✓</span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <div className="text-4xl mb-2">🏢</div>
                                                    <p>Aucun sous-traitant disponible</p>
                                                    <p className="text-sm mt-1">Ajoutez-en un ci-dessus</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Résumé des ressources */}
                                    {(formData.personnel?.length > 0 || formData.equipements?.length > 0 || formData.sousTraitants?.length > 0) && (
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-800 mb-3">📊 Résumé des ressources assignées</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-blue-600">{formData.personnel?.length || 0}</div>
                                                    <div className="text-gray-600">Personnel</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-green-600">{formData.equipements?.length || 0}</div>
                                                    <div className="text-gray-600">Équipements</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-purple-600">{formData.sousTraitants?.length || 0}</div>
                                                    <div className="text-gray-600">Sous-traitants</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Onglet Fichiers */}
                        {activeTab === 'files' && (
                            <div className="h-full overflow-y-auto p-6">
                                <div className="space-y-6">
                                    {/* Header Fichiers */}
                                    <div className="flex items-center gap-4 p-4 bg-gray-900 rounded-lg">
                                        <Logo size="normal" showText={false} />
                                        <div>
                                            <h3 className="text-lg font-bold text-white flex items-center">
                                                📁 Gestion des Documents
                                            </h3>
                                            <p className="text-sm text-gray-300">
                                                Fichiers, photos et documents du projet
                                            </p>
                                        </div>
                                    </div>

                                    {/* Documents */}
                                    <div className="bg-white border rounded-lg overflow-hidden">
                                        <div className="bg-blue-50 p-4 border-b">
                                            <h4 className="font-medium text-blue-800 flex items-center gap-2">
                                                📄 Documents ({formData.documents?.length || 0})
                                            </h4>
                                        </div>
                                        <div className="p-4">
                                            <DropZone
                                                onFilesSelected={(files) => handleFilesAdded(files, 'documents')}
                                                accept="*"
                                                multiple={true}
                                            />
                                            {formData.documents && formData.documents.length > 0 && (
                                                <div className="mt-4">
                                                    <FilePreview
                                                        files={formData.documents}
                                                        onRemove={(index) => removeFile(index, 'documents')}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Photos */}
                                    <div className="bg-white border rounded-lg overflow-hidden">
                                        <div className="bg-green-50 p-4 border-b">
                                            <h4 className="font-medium text-green-800 flex items-center gap-2">
                                                📷 Photos ({formData.photos?.length || 0})
                                            </h4>
                                        </div>
                                        <div className="p-4">
                                            <DropZone
                                                onFilesSelected={(files) => handleFilesAdded(files, 'photos')}
                                                accept="image/*"
                                                multiple={true}
                                            />
                                            {formData.photos && formData.photos.length > 0 && (
                                                <div className="mt-4">
                                                    <FilePreview
                                                        files={formData.photos}
                                                        onRemove={(index) => removeFile(index, 'photos')}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Résumé des fichiers */}
                                    {((formData.documents?.length || 0) + (formData.photos?.length || 0)) > 0 && (
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-800 mb-3">📊 Résumé des fichiers</h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-blue-600">{formData.documents?.length || 0}</div>
                                                    <div className="text-gray-600">Documents</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-green-600">{formData.photos?.length || 0}</div>
                                                    <div className="text-gray-600">Photos</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex-shrink-0 flex items-center justify-between p-6 bg-gray-50 border-t">
                        <div className="flex gap-2">
                            {job && peutModifier && (
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Supprimer
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Annuler
                            </button>
                            {peutModifier && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}