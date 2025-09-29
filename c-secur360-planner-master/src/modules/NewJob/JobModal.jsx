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
    onOpenConflictJob // Nouvelle fonction pour ouvrir un job en conflit
}) {
    const { t, currentLanguage } = useLanguage();

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
        personnel: [], // Format: [{ id, dateDebut, dateFin, heureDebut, heureFin, joursTravailles }]
        equipements: [], // Format: [{ id, dateDebut, dateFin, heureDebut, heureFin, joursTravailles }]
        sousTraitants: [], // Format: [{ id, dateDebut, dateFin, heureDebut, heureFin, joursTravailles }]
        personnelAssigne: [], // IDs du personnel assigné globalement
        equipementAssigne: [], // IDs des équipements assignés globalement
        horaireMode: 'global', // 'global' ou 'personnalise'
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
        // Système d'heures planifiées
        heuresPlanifiees: '',
        modeHoraire: 'heures-jour', // 'heures-jour' ou '24h-24'
        heuresDebutJour: '08:00',
        heuresFinJour: '17:00',
        nombrePersonnelRequis: 1,
        etapes: [],
        preparation: [],
        typeHoraire: 'jour',
        horairesParJour: {}, // Format: { '2025-01-15': { heureDebut: '08:00', heureFin: '17:00' } }
        horairesIndividuels: {}, // Horaires individuels par ressource
        horairesEquipes: {}, // Horaires par équipe
        horairesDepartements: {}, // Format: { '2025-01-15': { 'Dept1': { heureDebut: '05:00', heureFin: '17:00' }, 'Dept2': { heureDebut: '07:00', heureFin: '19:00' } } }
        // Nouvelles structures pour assignations par jour
        assignationsParJour: {}, // Format: { '2025-01-15': { personnel: [id1, id2], equipements: [id3, id4] } }
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
        equipeAutoGeneration: true,
        resourcesPersonnaliseeParJour: {} // Format: { 'departement': true/false }
    });

    const [modificationMode, setModificationMode] = useState('groupe');
    const [ressourceIndividuelle, setRessourceIndividuelle] = useState(null);
    const [typeRessourceIndividuelle, setTypeRessourceIndividuelle] = useState('personnel');
    const [modificationsIndividuelles, setModificationsIndividuelles] = useState({});
    const [newSousTraitant, setNewSousTraitant] = useState('');

    // États pour les fonctionnalités Gantt avancées
    const [activeTab, setActiveTab] = useState('form');

    // États pour la gestion des horaires hiérarchiques
    const [showDailySchedules, setShowDailySchedules] = useState(false);
    const [showTeamManagement, setShowTeamManagement] = useState(false);
    const [dailyPersonnelTab, setDailyPersonnelTab] = useState('horaires'); // 'horaires', 'personnel', ou 'equipement'
    const [selectedDay, setSelectedDay] = useState(null); // Jour sélectionné pour gestion personnel
    const [personnelFilters, setPersonnelFilters] = useState({
        poste: 'tous',
        succursale: 'global',
        showAll: false // false = seulement disponibles, true = tout le personnel
    });

    // États pour les actions rapides
    const [showPersonnelQuickActions, setShowPersonnelQuickActions] = useState(false);
    const [showAvailablePersonnelQuickActions, setShowAvailablePersonnelQuickActions] = useState(false);
    const [showEquipementQuickActions, setShowEquipementQuickActions] = useState(false);
    const [showAvailableEquipementQuickActions, setShowAvailableEquipementQuickActions] = useState(false);

    // États pour le modal d'horaire personnalisé
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleModalType, setScheduleModalType] = useState(null); // 'personnel' ou 'equipement'
    const [selectedResource, setSelectedResource] = useState(null);

    // États pour le modal de configuration avancée des étapes
    const [showStepConfigModal, setShowStepConfigModal] = useState(false);
    const [selectedStep, setSelectedStep] = useState(null);
    const [ganttFullscreen, setGanttFullscreen] = useState(false);
    const [ganttCompactMode, setGanttCompactMode] = useState(false);
    const [ganttData, setGanttData] = useState({
        tasks: [],
        assignments: [],
        mode: 'global'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

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
                <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex-shrink-0 flex items-center justify-between p-6 bg-gray-900 rounded-t-xl">
                        <div className="flex items-center gap-4">
                            <Logo size="normal" showText={false} />
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {job ? 'Modifier le Job' : 'Nouveau Job'}
                                </h2>
                                <p className="text-gray-300 text-sm">
                                    Planification des travaux
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

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
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