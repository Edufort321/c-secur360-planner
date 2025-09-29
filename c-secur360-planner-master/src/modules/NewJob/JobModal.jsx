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
        const newTask = {
            id: Date.now().toString(),
            name: 'Nouvelle tâche',
            duration: 8,
            startHour: 0,
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
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={addNewTask}
                                                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                                                >
                                                    ➕ Ajouter une tâche
                                                </button>
                                                <button
                                                    onClick={() => updateField('showCriticalPath', !formData.showCriticalPath)}
                                                    className={`px-3 py-1 text-sm rounded flex items-center gap-1 ${
                                                        formData.showCriticalPath
                                                            ? 'bg-red-500 text-white'
                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                                >
                                                    🚨 Chemin critique
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
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Onglet Ressources */}
                        {activeTab === 'resources' && (
                            <div className="p-6 h-full flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-6xl mb-4">👥</div>
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Gestion des Ressources</h3>
                                    <p className="text-gray-500">Personnel, équipements et planification</p>
                                </div>
                            </div>
                        )}

                        {/* Onglet Fichiers */}
                        {activeTab === 'files' && (
                            <div className="p-6 h-full flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-6xl mb-4">📎</div>
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Gestion des Fichiers</h3>
                                    <p className="text-gray-500">Documents et photos du projet</p>
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