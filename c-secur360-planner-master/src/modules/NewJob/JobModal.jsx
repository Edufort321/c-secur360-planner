import { useState, useEffect, useCallback } from 'react';
import { Icon } from '../../components/UI/Icon';
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

    const handleInputChange = (field, value) => {
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

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.numeroJob || !formData.nom || !formData.dateDebut || !formData.bureau) {
            addNotification?.('Veuillez remplir les champs obligatoires (numéro, nom, date début, bureau)', 'error');
            return;
        }

        if (formData.personnel.length === 0 && formData.sousTraitants.length === 0) {
            addNotification?.('Veuillez assigner au moins une personne ou un sous-traitant', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            const jobData = {
                ...formData,
                id: job ? job.id : Date.now(),
                dateCreation: job ? job.dateCreation : new Date().toISOString(),
                dateModification: new Date().toISOString()
            };

            onSave(jobData);
            addNotification?.(job ? 'Job modifié avec succès' : 'Job créé avec succès', 'success');
            onClose();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            addNotification?.('Erreur lors de la sauvegarde du job', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!job?.id) return;

        const confirmation = window.confirm(
            `Êtes-vous sûr de vouloir supprimer le job "${job.nom}" ?\n\nCette action est irréversible.`
        );

        if (confirmation) {
            try {
                await onDelete(job.id);
                onClose();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                alert('Erreur lors de la suppression du job');
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-purple-700">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <Icon name="briefcase" className="mr-2" size={24} />
                        {job ? 'Modifier le Job' : 'Nouveau Job'}
                        {formData.numeroJob && (
                            <span className="ml-3 text-purple-200 text-lg">#{formData.numeroJob}</span>
                        )}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
                    >
                        <Icon name="close" size={24} />
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
                <div className="p-6 overflow-y-auto max-h-[calc(95vh-180px)]">
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

                            {/* Étapes */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold">Étapes du projet</h3>
                                    <button
                                        type="button"
                                        onClick={addEtape}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        <Icon name="plus" size={16} className="mr-2" />
                                        Ajouter une étape
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {formData.etapes.map((etape, index) => (
                                        <div key={etape.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                                            <input
                                                type="checkbox"
                                                checked={etape.completed}
                                                onChange={(e) => updateEtape(index, 'completed', e.target.checked)}
                                                className="w-5 h-5"
                                            />
                                            <input
                                                type="text"
                                                value={etape.text}
                                                onChange={(e) => updateEtape(index, 'text', e.target.value)}
                                                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-purple-500"
                                                placeholder={`Étape ${index + 1}`}
                                            />
                                            <input
                                                type="number"
                                                step="0.25"
                                                min="0.25"
                                                value={etape.duration}
                                                onChange={(e) => updateEtape(index, 'duration', parseFloat(e.target.value))}
                                                className="w-20 p-2 border rounded focus:ring-2 focus:ring-purple-500"
                                                title="Durée en heures"
                                            />
                                            <span className="text-sm text-gray-500">h</span>
                                            <button
                                                type="button"
                                                onClick={() => removeEtape(index)}
                                                className="p-2 text-red-600 hover:bg-red-100 rounded"
                                            >
                                                <Icon name="trash" size={16} />
                                            </button>
                                        </div>
                                    ))}
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
                <div className="flex justify-between items-center p-6 border-t bg-gray-50">
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
                                onClick={activeTab === 'form' ? handleSubmit : undefined}
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