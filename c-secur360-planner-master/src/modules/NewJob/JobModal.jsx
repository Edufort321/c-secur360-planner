// ============== JOB MODAL - Gestion avancée des tâches ==============
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
        ganttViewMode: 'auto',
        equipesNumerotees: {},
        ganttMode: 'individuel',
        prochainNumeroEquipe: 1,
        equipeAutoGeneration: true,
        resourcesPersonnaliseeParJour: {}
    });

    // États avancés manquants du backup
    const [expandedSections, setExpandedSections] = useState({
        etapes: false,
        preparation: false
    });

    const [modificationMode, setModificationMode] = useState('groupe');
    const [ressourceIndividuelle, setRessourceIndividuelle] = useState(null);
    const [typeRessourceIndividuelle, setTypeRessourceIndividuelle] = useState('personnel');
    const [modificationsIndividuelles, setModificationsIndividuelles] = useState({});
    const [newSousTraitant, setNewSousTraitant] = useState('');

    // États pour l'interface utilisateur
    const [activeTab, setActiveTab] = useState('form');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ganttFullscreen, setGanttFullscreen] = useState(false);
    const [ganttCompactMode, setGanttCompactMode] = useState(false);
    const [showMobileTabMenu, setShowMobileTabMenu] = useState(false);
    const [showGanttMenu, setShowGanttMenu] = useState(false);

    // États pour la navigation temporelle du Gantt
    const [ganttViewOffset, setGanttViewOffset] = useState(0); // Décalage en jours/heures selon le mode
    const [editingGanttTask, setEditingGanttTask] = useState(null); // ID de la tâche en cours d'édition dans Gantt

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

    // États pour les modals avancés
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleModalType, setScheduleModalType] = useState(null); // 'personnel' ou 'equipement'
    const [selectedResource, setSelectedResource] = useState(null);
    const [showStepConfigModal, setShowStepConfigModal] = useState(false);
    const [selectedStep, setSelectedStep] = useState(null);

    // Données Gantt avancées
    const [ganttData, setGanttData] = useState({
        tasks: [],
        assignments: [],
        mode: 'global'
    });

    // Constantes et données de référence avancées
    const priorites = [
        { value: 'faible', label: `🟢 Faible`, couleur: '#10B981' },
        { value: 'normale', label: `🟡 Normale`, couleur: '#F59E0B' },
        { value: 'haute', label: `🟠 Haute`, couleur: '#F97316' },
        { value: 'urgente', label: `🔴 Urgente`, couleur: '#EF4444' }
    ];

    const statuts = [
        { value: 'planifie', label: `📋 Planifié`, couleur: '#6B7280' },
        { value: 'en_cours', label: `🔄 En cours`, couleur: '#3B82F6' },
        { value: 'termine', label: `✅ Terminé`, couleur: '#10B981' },
        { value: 'annule', label: `❌ Annulé`, couleur: '#EF4444' },
        { value: 'reporte', label: `⏸️ Reporté`, couleur: '#F59E0B' }
    ];

    const bureaux = [
        'MDL Sherbrooke', 'MDL Terrebonne', 'MDL Québec',
        'DUAL Électrotech', 'CFM', 'Surplec'
    ];

    // Génération automatique du numéro de job
    const generateJobNumber = useCallback(() => {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const existingNumbers = (jobs || [])
            .filter(j => j.numeroJob?.startsWith(`G${year.toString().slice(-2)}-${month}`))
            .map(j => parseInt(j.numeroJob.split('-')[1]) || 0);
        const nextNumber = Math.max(0, ...existingNumbers) + 1;
        return `G${year.toString().slice(-2)}-${month}${String(nextNumber).padStart(2, '0')}`;
    }, [jobs]);

    // Déterminer automatiquement le mode de vue optimal
    const getDefaultViewMode = () => {
        const totalTaskHours = formData.etapes.reduce((sum, etape) => sum + (etape.duration || 0), 0);

        // Auto-ajustement intelligent selon la durée du projet
        if (totalTaskHours === 0) return '6h'; // Par défaut si pas d'étapes
        if (totalTaskHours <= 6) return '6h'; // 0-6h → vue 6h
        if (totalTaskHours <= 12) return '12h'; // 6-12h → vue 12h
        if (totalTaskHours <= 24) return '24h'; // 12-24h → vue 24h (1 jour)
        if (totalTaskHours <= 168) return 'day'; // 24h-168h (1 semaine) → vue par jour
        if (totalTaskHours <= 720) return 'week'; // 1 semaine - 1 mois → vue par semaine
        if (totalTaskHours <= 8760) return 'month'; // 1 mois - 1 an → vue par mois
        return 'year'; // Plus d'1 an → vue annuelle
    };

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


    const getTotalProjectHours = () => {
        return formData.etapes.reduce((sum, etape) => sum + (etape.duration || 0), 0);
    };

    // Fonctions WBS avancées
    const generateWBSCode = (taskId, tasks) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return '';

        if (!task.parentId) {
            // Tâche de niveau racine
            const rootTasks = tasks.filter(t => !t.parentId);
            const index = rootTasks.findIndex(t => t.id === taskId) + 1;
            return index.toString();
        } else {
            // Sous-tâche
            const siblings = tasks.filter(t => t.parentId === task.parentId);
            const index = siblings.findIndex(t => t.id === taskId) + 1;
            const parentCode = generateWBSCode(task.parentId, tasks);
            return `${parentCode}.${index}`;
        }
    };

    const calculateWorkPackageEffort = (taskId, tasks) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return 0;

        const children = tasks.filter(t => t.parentId === taskId);
        if (children.length === 0) {
            // Tâche feuille - retourner sa propre durée
            return task.duration || 0;
        } else {
            // Tâche parent - sommer les efforts des enfants
            return children.reduce((total, child) =>
                total + calculateWorkPackageEffort(child.id, tasks), 0
            );
        }
    };

    const generateProjectDecomposition = (rootTaskId, tasks) => {
        const decomposition = [];
        const rootTask = tasks.find(t => t.id === rootTaskId);
        if (!rootTask) return decomposition;

        const processTask = (task, level = 0) => {
            const wbsCode = generateWBSCode(task.id, tasks);
            const effort = calculateWorkPackageEffort(task.id, tasks);
            const children = tasks.filter(t => t.parentId === task.id);

            decomposition.push({
                id: task.id,
                name: task.name,
                wbsCode,
                level,
                effort,
                isWorkPackage: children.length === 0,
                childCount: children.length,
                description: task.description || '',
                deliverables: task.deliverables || [],
                acceptanceCriteria: task.acceptanceCriteria || [],
                skills: task.requiredSkills || []
            });

            children.forEach(child => processTask(child, level + 1));
        };

        processTask(rootTask);
        return decomposition;
    };

    const addNewTask = (parentId = null) => {
        const level = parentId ? calculateTaskLevel(parentId, formData.etapes) + 1 : 0;
        const lastTask = formData.etapes[formData.etapes.length - 1];
        const nextStartHour = lastTask ? lastTask.startHour + (lastTask.duration || 1) : 0;

        const newTask = {
            id: Date.now().toString(),
            name: parentId ? 'Nouvelle sous-tâche' : 'Nouvelle tâche',
            duration: level > 0 ? 4 : 8, // Sous-tâches plus courtes par défaut
            startHour: nextStartHour,
            description: '',
            priority: 'normale',
            status: 'planifie',
            resources: [],
            dependencies: [],
            parallelWith: [],
            assignedResources: { personnel: [], equipements: [], equipes: [], sousTraitants: [] },
            parentId: parentId,
            level: level,
            // Propriétés WBS avancées
            wbsCode: '', // Calculé automatiquement
            deliverables: [], // Livrables attendus
            acceptanceCriteria: [], // Critères d'acceptation
            requiredSkills: [], // Compétences requises
            riskLevel: 'faible', // Niveau de risque
            complexity: 'simple', // Complexité (simple, modérée, complexe)
            estimationMethod: 'expert', // Méthode d'estimation (expert, analogique, paramétrique)
            confidenceLevel: 'moyenne', // Niveau de confiance (faible, moyenne, élevée)
            assumptions: [], // Hypothèses
            constraints: [], // Contraintes
            workPackageType: level > 2 ? 'executable' : 'planification' // Type de paquet de travail
        };

        setFormData(prev => {
            const newEtapes = [...prev.etapes, newTask];
            // Recalculer les codes WBS pour toutes les tâches
            newEtapes.forEach(task => {
                task.wbsCode = generateWBSCode(task.id, newEtapes);
            });
            return {
                ...prev,
                etapes: newEtapes
            };
        });

        addNotification?.(`${parentId ? 'Sous-tâche' : 'Tâche'} ajoutée au planning WBS`, 'success');
        return newTask;
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

    // ============== FONCTIONS UTILITAIRES RESTAURÉES DE OLD ==============
    // 21 fonctions critiques restaurées depuis OLD

    // Fonction pour gérer les changements de champs du formulaire
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Fonction pour générer les horaires par défaut pour tous les jours de l'événement
    const generateDefaultDailySchedules = (inclureFinsSemaine = null) => {
        if (!formData.dateDebut || !formData.dateFin) return {};

        // Utiliser la case à cocher globale si pas spécifié
        const includeWeekends = inclureFinsSemaine !== null ? inclureFinsSemaine : formData.includeWeekendsInDuration;

        const defaultSchedules = {};
        const startDate = new Date(formData.dateDebut);
        const endDate = new Date(formData.dateFin);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateString = d.toISOString().split('T')[0];
            const dayOfWeek = d.getDay(); // 0 = dimanche, 6 = samedi
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            // Inclure le jour seulement si ce n'est pas un week-end, ou si on inclut les fins de semaine
            if (!isWeekend || includeWeekends) {
                defaultSchedules[dateString] = {
                    heureDebut: formData.heureDebut || '08:00',
                    heureFin: formData.heureFin || '17:00',
                    mode: 'jour', // 'jour' ou '24h'
                    isWeekend: isWeekend,
                    dayName: getLocalizedDayName(d, currentLanguage, false)
                };
            }
        }

        return defaultSchedules;
    };

    // Fonction pour ouvrir le modal de personnalisation d'horaire
    const openScheduleModal = (resourceType, resourceId, resourceData) => {
        setScheduleModalType(resourceType);
        setSelectedResource({ id: resourceId, data: resourceData });
        setShowScheduleModal(true);
    };

    // Fonction pour fermer le modal de personnalisation d'horaire
    const closeScheduleModal = () => {
        setShowScheduleModal(false);
        setScheduleModalType(null);
        setSelectedResource(null);
    };

    // Fonction pour sauvegarder l'horaire personnalisé
    const saveCustomSchedule = (scheduleData) => {
        const resourceKey = `${selectedResource.id}`;

        setFormData(prev => ({
            ...prev,
            horairesIndividuels: {
                ...prev.horairesIndividuels,
                [resourceKey]: {
                    ...scheduleData,
                    resourceType: scheduleModalType,
                    resourceId: selectedResource.id,
                    lastModified: new Date().toISOString()
                }
            }
        }));

        addNotification?.(`Horaire personnalisé sauvegardé pour ${selectedResource.data.nom || selectedResource.data.prenom}`, 'success');
        closeScheduleModal();
    };

    // Fonction pour obtenir l'horaire par défaut basé sur "horaire par jour"
    const getDefaultScheduleForResource = (resourceId, resourceType) => {
        const defaultSchedule = {};

        // Utiliser les horaires par jour définis dans la section "horaire par jour"
        getAllDays().forEach(day => {
            if (day.included) {
                const daySchedule = formData.horairesParJour[day.date];
                if (daySchedule) {
                    defaultSchedule[day.date] = {
                        heureDebut: daySchedule.heureDebut,
                        heureFin: daySchedule.heureFin,
                        active: true
                    };
                } else {
                    // Fallback sur l'horaire global
                    defaultSchedule[day.date] = {
                        heureDebut: formData.heureDebut,
                        heureFin: formData.heureFin,
                        active: true
                    };
                }
            }
        });

        return defaultSchedule;
    };

    // Fonction pour obtenir l'horaire effectif d'une ressource pour un jour donné
    const getEffectiveSchedule = (resourceId, resourceType, date, equipeId = null) => {
        // 1. Priorité maximale : Horaire individuel spécifique à l'équipe
        if (equipeId) {
            const teamSpecificKey = `${resourceType}_${resourceId}_equipe_${equipeId}`;
            const teamSpecificSchedule = formData.horairesIndividuels[teamSpecificKey];

            if (teamSpecificSchedule && teamSpecificSchedule.mode === 'personnalise') {
                if (teamSpecificSchedule.joursTravailles && !teamSpecificSchedule.joursTravailles.includes(date)) {
                    return null; // Ressource ne travaille pas ce jour dans cette équipe
                }
                return {
                    heureDebut: teamSpecificSchedule.heureDebut,
                    heureFin: teamSpecificSchedule.heureFin,
                    source: 'individuel-equipe'
                };
            }
        }

        // 2. Priorité haute : Horaire individuel global
        const resourceKey = `${resourceType}_${resourceId}`;
        const individualSchedule = formData.horairesIndividuels[resourceKey];

        if (individualSchedule && individualSchedule.mode === 'personnalise') {
            if (individualSchedule.joursTravailles && !individualSchedule.joursTravailles.includes(date)) {
                return null; // Ressource ne travaille pas ce jour
            }
            return {
                heureDebut: individualSchedule.heureDebut,
                heureFin: individualSchedule.heureFin,
                source: 'individuel'
            };
        }

        // 3. Priorité moyenne : Horaire d'équipe (si la ressource est dans une équipe)
        if (equipeId) {
            const teamSchedule = formData.horairesEquipes?.[equipeId];
            if (teamSchedule && teamSchedule.mode === 'personnalise') {
                if (teamSchedule.joursTravailles && !teamSchedule.joursTravailles.includes(date)) {
                    return null;
                }
                return {
                    heureDebut: teamSchedule.heureDebut,
                    heureFin: teamSchedule.heureFin,
                    source: 'equipe'
                };
            }
        }

        // 4. Priorité moyenne : Horaire spécifique du jour
        const dailySchedule = formData.horairesParJour?.[date];
        if (dailySchedule) {
            return {
                heureDebut: dailySchedule.heureDebut,
                heureFin: dailySchedule.heureFin,
                source: 'jour'
            };
        }

        // 5. Priorité basse : Horaire global de l'événement
        return {
            heureDebut: formData.heureDebut || '08:00',
            heureFin: formData.heureFin || '17:00',
            source: 'global'
        };
    };

    // Fonction pour naviguer vers un onglet avec jour pré-sélectionné
    const goToResourceTab = (tab, dateString) => {
        setDailyPersonnelTab(tab);
        setSelectedDay(dateString);
    };

    // Fonction pour mettre à jour l'horaire d'une ressource spécifique
    const onUpdateResourceSchedule = (resourceType, resourceId, scheduleData) => {
        const resourceKey = `${resourceType}_${resourceId}`;

        console.log('🕐 Mise à jour horaire:', { resourceKey, scheduleData });

        setFormData(prev => {
            const newData = {
                ...prev,
                horairesIndividuels: {
                    ...prev.horairesIndividuels,
                    [resourceKey]: {
                        resourceId,
                        resourceType,
                        ...scheduleData,
                        dateModification: new Date().toISOString()
                    }
                }
            };

            console.log('📋 Nouveaux horairesIndividuels:', newData.horairesIndividuels);
            return newData;
        });

        // Notification de succès
        if (addNotification) {
            const resourceName = (() => {
                if (resourceType === 'personnel') {
                    const person = personnel.find(p => p.id === resourceId);
                    return person ? `${person.prenom ? `${person.prenom} ${person.nom}` : person.nom}` : 'Personnel';
                } else if (resourceType === 'equipements') {
                    const equipement = equipements.find(e => e.id === resourceId);
                    return equipement ? equipement.nom : 'Équipement';
                } else if (resourceType === 'sousTraitants') {
                    const sousTraitant = sousTraitants.find(s => s.id === resourceId);
                    return sousTraitant ? sousTraitant.nom : 'Sous-traitant';
                }
                return 'Ressource';
            })();

            addNotification(
                `Horaire personnalisé sauvegardé pour ${resourceName}`,
                'success'
            );
        }
    };

    // ============== FONCTIONS POUR LA GESTION DES ÉTAPES ==============

    // Fonctions pour le parallélisme
    const addParallelTask = (etapeId, parallelEtapeId) => {
        setFormData(prev => ({
            ...prev,
            etapes: prev.etapes.map(etape => {
                if (etape.id === etapeId) {
                    return {
                        ...etape,
                        parallelWith: etape.parallelWith.includes(parallelEtapeId)
                            ? etape.parallelWith
                            : [...etape.parallelWith, parallelEtapeId]
                    };
                }
                if (etape.id === parallelEtapeId) {
                    return {
                        ...etape,
                        parallelWith: etape.parallelWith.includes(etapeId)
                            ? etape.parallelWith
                            : [...etape.parallelWith, etapeId]
                    };
                }
                return etape;
            })
        }));
    };

    const removeParallelTask = (etapeId, parallelEtapeId) => {
        setFormData(prev => ({
            ...prev,
            etapes: prev.etapes.map(etape => {
                if (etape.id === etapeId || etape.id === parallelEtapeId) {
                    return {
                        ...etape,
                        parallelWith: etape.parallelWith.filter(id => id !== (etape.id === etapeId ? parallelEtapeId : etapeId))
                    };
                }
                return etape;
            })
        }));
    };

    // Fonction pour créer une sous-tâche
    const addSubTask = (parentId) => {
        addEtape(parentId);
    };

    // Fonction pour générer les options hiérarchiques dans les sélecteurs
    const generateHierarchicalOptions = (excludeId = null, existingDeps = []) => {
        const availableSteps = formData.etapes.filter(e =>
            e.id !== excludeId && !existingDeps.some(d => d.id === e.id)
        );

        const renderHierarchicalOptions = (parentId = null, level = 0) => {
            return availableSteps
                .filter(etape => etape.parentId === parentId)
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .flatMap(etape => {
                    const prefix = '  '.repeat(level); // Indentation avec des espaces
                    const hasChildren = availableSteps.some(e => e.parentId === etape.id);
                    const displayText = `${prefix}${hasChildren ? '📁' : '📄'} ${etape.text || `Étape ${etape.id}`}`;

                    return [
                        <option key={etape.id} value={etape.id}>
                            {displayText}
                        </option>,
                        ...renderHierarchicalOptions(etape.id, level + 1)
                    ];
                });
        };

        return renderHierarchicalOptions();
    };

    // Fonction pour générer les checkboxes hiérarchiques (tâches parallèles)
    const generateHierarchicalCheckboxes = (selectedStep) => {
        const availableSteps = formData.etapes.filter(e => e.id !== selectedStep.id);

        const renderHierarchicalCheckboxes = (parentId = null, level = 0) => {
            return availableSteps
                .filter(etape => etape.parentId === parentId)
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .flatMap(etape => {
                    const indent = level * 20; // Indentation en pixels
                    const hasChildren = availableSteps.some(e => e.parentId === etape.id);
                    const isParallel = selectedStep.parallelWith?.includes(etape.id);

                    return [
                        <label key={etape.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded">
                            <div style={{ marginLeft: `${indent}px` }} className="flex items-center gap-2">
                                <span className="text-xs">
                                    {hasChildren ? '📁' : '📄'}
                                </span>
                                <input
                                    type="checkbox"
                                    checked={isParallel}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            addParallelTask(selectedStep.id, etape.id);
                                        } else {
                                            removeParallelTask(selectedStep.id, etape.id);
                                        }
                                    }}
                                    className="rounded border-gray-300"
                                />
                                <span className="text-sm">{etape.text || `Étape ${etape.id}`}</span>
                            </div>
                        </label>,
                        ...renderHierarchicalCheckboxes(etape.id, level + 1)
                    ];
                });
        };

        return renderHierarchicalCheckboxes();
    };

    // Fonction pour calculer l'échelle temporelle automatique
    const calculateTimeScale = () => {
        if (!formData.dateDebut || !formData.dateFin) return 'days';

        const startDate = new Date(formData.dateDebut);
        const endDate = new Date(formData.dateFin);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Calcul de la durée totale des tâches en heures
        const totalHours = formData.etapes.reduce((sum, etape) => sum + (etape.duration || 0), 0);

        // Logique adaptative selon la durée
        if (totalHours <= 24 && diffDays <= 1) return 'hours';
        if (diffDays <= 7) return 'days';
        if (diffDays <= 60) return 'weeks';
        return 'months';
    };

    // Fonction pour ouvrir le modal de configuration avancée d'une étape
    const openStepConfigModal = (etapeId) => {
        const etape = formData.etapes.find(e => e.id === etapeId);
        if (etape) {
            setSelectedStep(etape);
            setShowStepConfigModal(true);
        }
    };

    // Fonction pour fermer le modal de configuration avancée
    const closeStepConfigModal = () => {
        setShowStepConfigModal(false);
        setSelectedStep(null);
    };

    // Fonction pour générer les options hiérarchiques du select (dépendances, jalons, parallélisme)
    const generateHierarchicalSelectOptions = (currentStep) => {
        const renderOptions = (parentId = null, level = 0) => {
            return formData.etapes
                .filter(etape => etape.parentId === parentId && etape.id !== currentStep?.id)
                .map(etape => {
                    const indent = '\u00A0\u00A0'.repeat(level); // Espaces insécables pour indentation
                    const icon = formData.etapes.some(e => e.parentId === etape.id) ? '📁' : '📄';
                    return (
                        <>
                            <option key={etape.id} value={etape.id}>
                                {indent}{icon} {etape.text || `Étape ${etape.order + 1}`}
                            </option>
                            {renderOptions(etape.id, level + 1)}
                        </>
                    );
                });
        };
        return renderOptions();
    };

    // ============== FONCTIONS POUR LA PRÉPARATION ==============

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

    // ============== SYSTÈME DE DÉTECTION DE CONFLITS COMPLET ==============
    // Restauré depuis OLD version - Détecte conflits avec jobs, congés, maintenances

    const checkResourceConflicts = (resourceId, resourceType, dateDebut, dateFin, excludeJobId = null) => {
        if (!dateDebut || !dateFin) return [];

        const conflicts = [];
        const startDate = new Date(dateDebut);
        const endDate = new Date(dateFin);

        // 1. Vérifier les conflits avec d'autres événements
        jobs.forEach(job => {
            // Exclure le job actuel si on modifie
            if (excludeJobId && job.id === excludeJobId) return;

            const jobStart = new Date(job.dateDebut);
            const jobEnd = new Date(job.dateFin);

            // Vérifier s'il y a chevauchement de dates
            const hasDateOverlap = startDate < jobEnd && endDate > jobStart;

            if (hasDateOverlap) {
                let hasResourceConflict = false;

                // Vérifier selon le type de ressource
                if (resourceType === 'personnel' && job.personnel.includes(resourceId)) {
                    hasResourceConflict = true;
                } else if (resourceType === 'equipement' && job.equipements.includes(resourceId)) {
                    hasResourceConflict = true;
                } else if (resourceType === 'sousTraitant' && job.sousTraitants.includes(resourceId)) {
                    hasResourceConflict = true;
                }

                if (hasResourceConflict) {
                    conflicts.push({
                        type: 'event',
                        priority: 'normal',
                        jobId: job.id,
                        jobNom: job.nom || job.numeroJob,
                        dateDebut: job.dateDebut,
                        dateFin: job.dateFin,
                        resourceType,
                        resourceId
                    });
                }
            }
        });

        // 2. Vérifier les conflits avec les congés selon leur statut d'autorisation
        if (resourceType === 'personnel' && conges) {
            conges.forEach(conge => {
                if (conge.personnelId === resourceId) {
                    const congeStart = new Date(conge.dateDebut);
                    const congeEnd = new Date(conge.dateFin);

                    const hasDateOverlap = startDate < congeEnd && endDate > congeStart;

                    if (hasDateOverlap) {
                        // Déterminer la priorité selon le statut du congé
                        let priority = 'normal';
                        let conflictType = 'conge_pending';
                        let jobNom = `Demande de congé ${conge.type || 'vacances'}`;

                        if (conge.statut === 'approuve') {
                            priority = 'high';
                            conflictType = 'conge_approved';
                            jobNom = `Congé ${conge.type || 'vacances'} (Approuvé)`;
                        } else if (conge.statut === 'en_attente') {
                            priority = 'medium';
                            conflictType = 'conge_pending';
                            jobNom = `Demande de congé ${conge.type || 'vacances'} (En attente)`;
                        } else if (conge.statut === 'refuse') {
                            // Les congés refusés ne créent pas de conflit
                            return;
                        }

                        conflicts.push({
                            type: conflictType,
                            priority: priority,
                            congeId: conge.id,
                            typeConge: conge.type || 'vacances',
                            statutConge: conge.statut,
                            jobNom: jobNom,
                            dateDebut: conge.dateDebut,
                            dateFin: conge.dateFin,
                            resourceType,
                            resourceId,
                            motif: conge.motif,
                            peutEtreAutorise: conge.statut === 'en_attente'
                        });
                    }
                }
            });
        }

        // 3. Vérifier les conflits avec les maintenances d'équipements (PRIORITÉ HAUTE)
        if (resourceType === 'equipement') {
            const equipement = equipements.find(eq => eq.id === resourceId);
            if (equipement && equipement.maintenances) {
                equipement.maintenances.forEach(maintenance => {
                    const maintenanceStart = new Date(maintenance.dateDebut);
                    const maintenanceEnd = new Date(maintenance.dateFin || maintenance.dateDebut);

                    const hasDateOverlap = startDate < maintenanceEnd && endDate > maintenanceStart;

                    if (hasDateOverlap) {
                        conflicts.push({
                            type: 'maintenance',
                            priority: 'high',
                            maintenanceId: maintenance.id,
                            jobNom: `Maintenance ${maintenance.type || 'préventive'}`,
                            dateDebut: maintenance.dateDebut,
                            dateFin: maintenance.dateFin || maintenance.dateDebut,
                            resourceType,
                            resourceId,
                            description: maintenance.description
                        });
                    }
                });
            }

            // Vérifier aussi si l'équipement est hors service
            if (equipement && equipement.statut === 'hors_service') {
                conflicts.push({
                    type: 'hors_service',
                    priority: 'critical',
                    jobNom: 'Équipement hors service',
                    dateDebut: dateDebut,
                    dateFin: dateFin,
                    resourceType,
                    resourceId,
                    description: 'Cet équipement est actuellement hors service'
                });
            }
        }

        // Trier les conflits par priorité (critical > high > medium > normal)
        return conflicts.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, normal: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    };

    const isResourceAvailable = (resourceId, resourceType, dateDebut, dateFin) => {
        const conflicts = checkResourceConflicts(resourceId, resourceType, dateDebut, dateFin, job?.id);
        return conflicts.length === 0;
    };

    // ============== FONCTIONS GANTT HIÉRARCHIQUE AVANCÉ ==============
    // Restauré depuis OLD - Gestion complète du Gantt avec dépendances MS Project

    // ============== CONVERSION HEURES TRAVAIL → DATES RÉELLES ==============
    // Convertit des heures de travail en date réelle en tenant compte des horaires configurés
    const convertWorkHoursToRealDate = (workHours, baseDate, workStartHour, workEndHour) => {
        // Extraire les heures de travail configurées (ex: "08:00" → 8)
        const [startH, startM] = (workStartHour || '08:00').split(':').map(Number);
        const [endH, endM] = (workEndHour || '17:00').split(':').map(Number);

        const workDayStart = startH + (startM / 60); // ex: 8.0
        const workDayEnd = endH + (endM / 60);       // ex: 17.0
        const hoursPerDay = workDayEnd - workDayStart; // ex: 9h

        // Calculer combien de jours complets et heures restantes
        const fullDays = Math.floor(workHours / hoursPerDay);
        const remainingHours = workHours % hoursPerDay;

        // Créer la date de début (baseDate à l'heure de début de journée)
        const resultDate = new Date(baseDate);
        resultDate.setHours(startH, startM, 0, 0);

        // Ajouter les jours complets
        resultDate.setDate(resultDate.getDate() + fullDays);

        // Ajouter les heures restantes
        resultDate.setHours(resultDate.getHours() + Math.floor(remainingHours));
        resultDate.setMinutes(resultDate.getMinutes() + Math.round((remainingHours % 1) * 60));

        console.log(`⏰ CONVERT - ${workHours}h travail = ${fullDays}j + ${remainingHours.toFixed(1)}h → ${resultDate.toLocaleString('fr-FR')}`);

        return resultDate;
    };

    // Fonction pour calculer les dates d'une tâche selon ses dépendances
    const calculateTaskDates = (task, processedTasks, allTasksSorted, projectStart) => {
        const taskDuration = task.duration || 1;
        let calculatedStartHours = 0;
        let calculatedEndHours = taskDuration;

        console.log(`📅 CALC - Calcul pour "${task.text}" (durée: ${taskDuration}h)`);

        // 1. Vérifier les dépendances explicites
        if (task.dependencies && task.dependencies.length > 0) {
            console.log(`📎 DEPS - ${task.dependencies.length} dépendance(s) trouvée(s)`);

            task.dependencies.forEach(dep => {
                const depTask = processedTasks.find(t => t.id === dep.id);
                if (depTask) {
                    const depStartHours = depTask.startHours || 0;
                    const depEndHours = depTask.endHours || 0;
                    const lag = dep.lag || 0;

                    switch (dep.type || 'FS') {
                        case 'FS': // Fin → Début (défaut)
                            calculatedStartHours = Math.max(calculatedStartHours, depEndHours + lag);
                            console.log(`🔗 FS - "${task.text}" commence après fin de "${depTask.text}" à ${depEndHours + lag}h`);
                            break;
                        case 'SS': // Début → Début
                            calculatedStartHours = Math.max(calculatedStartHours, depStartHours + lag);
                            console.log(`🔗 SS - "${task.text}" commence avec "${depTask.text}" à ${depStartHours + lag}h`);
                            break;
                        case 'FF': // Fin → Fin
                            calculatedStartHours = Math.max(calculatedStartHours, depEndHours - taskDuration + lag);
                            console.log(`🔗 FF - "${task.text}" finit avec "${depTask.text}" à ${depEndHours + lag}h`);
                            break;
                        case 'SF': // Début → Fin (rare)
                            calculatedStartHours = Math.max(calculatedStartHours, depStartHours - taskDuration + lag);
                            console.log(`🔗 SF - "${task.text}" finit quand "${depTask.text}" commence`);
                            break;
                    }
                }
            });
        }
        // 2. Gestion du mode parallèle explicite
        else if (task.isParallel && task.parallelWith && task.parallelWith.length > 0) {
            const parallelTasks = processedTasks.filter(t => task.parallelWith.includes(t.id));
            if (parallelTasks.length > 0) {
                // Démarrer en même temps que la première tâche parallèle
                const firstParallelStart = Math.min(...parallelTasks.map(t => t.startHours || 0));
                calculatedStartHours = firstParallelStart;
                console.log(`🔄 PARALLEL - "${task.text}" démarre en parallèle à ${calculatedStartHours}h`);
            }
        }
        // 3. Succession séquentielle par défaut (cas par défaut)
        else {
            if (task.parentId) {
                // C'est une sous-tâche : suit la précédente sous-tâche du même parent
                const siblingTasks = processedTasks.filter(t => t.parentId === task.parentId);
                if (siblingTasks.length > 0) {
                    const lastSibling = siblingTasks[siblingTasks.length - 1];
                    calculatedStartHours = Math.max(calculatedStartHours, lastSibling.endHours || 0);
                    console.log(`➡️  SUB-SEQ - "${task.text}" suit sa sous-tâche précédente "${lastSibling.text}" à ${calculatedStartHours}h`);
                } else {
                    // Première sous-tâche : hérite de la position de son parent
                    const parent = processedTasks.find(t => t.id === task.parentId);
                    if (parent) {
                        calculatedStartHours = Math.max(calculatedStartHours, parent.startHours || 0);
                        console.log(`🔢 FIRST-SUB - "${task.text}" première sous-tâche hérite du parent à ${calculatedStartHours}h`);
                    } else {
                        // Parent pas encore calculé, on restera à 0 pour l'instant
                        calculatedStartHours = 0;
                        console.log(`⏳ FIRST-SUB - "${task.text}" parent pas encore calculé, démarre à ${calculatedStartHours}h`);
                    }
                }
            } else {
                // C'est une tâche parent : suit la précédente tâche parent
                const parentTasks = processedTasks.filter(t => !t.parentId);
                if (parentTasks.length > 0) {
                    const lastParent = parentTasks[parentTasks.length - 1];
                    calculatedStartHours = Math.max(calculatedStartHours, lastParent.endHours || 0);
                    console.log(`➡️  PARENT-SEQ - "${task.text}" suit le parent précédent "${lastParent.text}" à ${calculatedStartHours}h`);
                }
            }
        }

        calculatedEndHours = calculatedStartHours + taskDuration;

        // NOUVEAU : Convertir les heures de travail en dates réelles selon la configuration
        const workStartTime = formData.heuresDebutJour || '08:00';
        const workEndTime = formData.heuresFinJour || '17:00';

        const calculatedStart = convertWorkHoursToRealDate(calculatedStartHours, projectStart, workStartTime, workEndTime);
        const calculatedEnd = convertWorkHoursToRealDate(calculatedEndHours, projectStart, workStartTime, workEndTime);

        console.log(`✅ FINAL - "${task.text}": ${calculatedStartHours}h → ${calculatedEndHours}h (${calculatedStart.toLocaleString('fr-FR')} → ${calculatedEnd.toLocaleString('fr-FR')})`);

        return {
            calculatedStart,
            calculatedEnd,
            startHours: calculatedStartHours,
            endHours: calculatedEndHours
        };
    };

    // ============== FONCTIONS DE PERSONNALISATION AUTOMATIQUE ==============
    // Placé après checkResourceConflicts pour éviter l'erreur de hoisting

    // Fonction pour obtenir les conflits de l'événement actuel
    const getCurrentEventConflicts = () => {
        let allConflicts = [];

        // Vérifier les conflits pour chaque personnel sélectionné
        (formData.personnel || []).forEach(personnelId => {
            const conflicts = checkResourceConflicts(personnelId, 'personnel', formData.dateDebut, formData.dateFin, job?.id);
            allConflicts = [...allConflicts, ...conflicts];
        });

        // Vérifier les conflits pour chaque équipement sélectionné
        (formData.equipements || []).forEach(equipementId => {
            const conflicts = checkResourceConflicts(equipementId, 'equipement', formData.dateDebut, formData.dateFin, job?.id);
            allConflicts = [...allConflicts, ...conflicts];
        });

        // Vérifier les conflits pour chaque sous-traitant sélectionné
        (formData.sousTraitants || []).forEach(sousTraitantId => {
            const conflicts = checkResourceConflicts(sousTraitantId, 'sousTraitant', formData.dateDebut, formData.dateFin, job?.id);
            allConflicts = [...allConflicts, ...conflicts];
        });

        return allConflicts;
    };

    const currentConflicts = getCurrentEventConflicts();

    // Fonction pour personnaliser automatiquement l'événement selon les conflits prioritaires
    const autoPersonalizeEventForConflicts = () => {
        if (!formData.dateDebut || !formData.dateFin) return;

        const highPriorityConflicts = currentConflicts.filter(c => c.priority === 'high' || c.priority === 'critical');

        if (highPriorityConflicts.length > 0) {
            // Basculer automatiquement en mode personnalisé si en mode global
            if (formData.horaireMode === 'global') {
                setFormData(prev => ({
                    ...prev,
                    horaireMode: 'personnalise'
                }));
            }

            // Créer des horaires personnalisés pour chaque ressource en conflit
            const personalizedSchedules = {};

            highPriorityConflicts.forEach(conflict => {
                const resourceKey = `${conflict.resourceType}_${conflict.resourceId}`;

                if (!personalizedSchedules[resourceKey]) {
                    personalizedSchedules[resourceKey] = {
                        resourceId: conflict.resourceId,
                        resourceType: conflict.resourceType,
                        dateDebut: formData.dateDebut,
                        dateFin: formData.dateFin,
                        heureDebut: formData.heureDebut,
                        heureFin: formData.heureFin,
                        joursTravailles: [],
                        excludedDates: [],
                        reason: `Conflit avec ${conflict.jobNom}`
                    };
                }

                // Exclure les dates en conflit
                const conflictStart = new Date(conflict.dateDebut);
                const conflictEnd = new Date(conflict.dateFin);

                for (let d = new Date(conflictStart); d <= conflictEnd; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    if (!personalizedSchedules[resourceKey].excludedDates.includes(dateStr)) {
                        personalizedSchedules[resourceKey].excludedDates.push(dateStr);
                    }
                }
            });

            // Appliquer les horaires personnalisés
            setFormData(prev => ({
                ...prev,
                horairesIndividuels: {
                    ...prev.horairesIndividuels,
                    ...personalizedSchedules
                }
            }));

            // Notifier l'utilisateur
            if (addNotification) {
                addNotification(
                    `Événement personnalisé automatiquement pour éviter ${highPriorityConflicts.length} conflit${highPriorityConflicts.length > 1 ? 's' : ''} prioritaire${highPriorityConflicts.length > 1 ? 's' : ''}`,
                    'warning'
                );
            }
        }
    };

    // Déclencher la personnalisation automatique quand des conflits prioritaires sont détectés
    useEffect(() => {
        const highPriorityConflicts = currentConflicts.filter(c => c.priority === 'high' || c.priority === 'critical');
        if (highPriorityConflicts.length > 0 && formData.horaireMode === 'global') {
            autoPersonalizeEventForConflicts();
        }
    }, [currentConflicts.length, formData.dateDebut, formData.dateFin]);

    // ============== AUTO-AJUSTEMENT DATE FIN ==============
    // Calculer automatiquement la date de fin selon les étapes et la config horaire
    useEffect(() => {
        if (formData.dateDebut && formData.etapes.length > 0) {
            const calculatedEndDate = calculateProjectEndDate();
            if (calculatedEndDate) {
                const currentEndDate = new Date(formData.dateFin);

                // Ne mettre à jour que si la date calculée est différente de l'actuelle
                if (Math.abs(calculatedEndDate - currentEndDate) > 60000) { // Plus de 1 minute de différence
                    console.log('🔄 AUTO-UPDATE dateFin:', calculatedEndDate.toLocaleString('fr-FR'));
                    updateField('dateFin', calculatedEndDate.toISOString().slice(0, 16));
                }
            }
        }
    }, [formData.etapes, formData.dateDebut, formData.heuresDebutJour, formData.heuresFinJour]);

    // Fonction utilitaire pour calculer le niveau hiérarchique d'une tâche
    const calculateTaskLevel = (taskId, allTasks, level = 0) => {
        const task = allTasks.find(t => t.id === taskId);
        if (!task || !task.parentId) return level;
        return calculateTaskLevel(task.parentId, allTasks, level + 1);
    };

    // Fonction pour mettre à jour les dates des tâches parent selon leurs enfants
    const updateParentTasks = (tasks) => {
        const taskMap = new Map(tasks.map(t => [t.id, { ...t }]));

        // Traiter de bas en haut (niveaux décroissants)
        const maxLevel = Math.max(...tasks.map(t => t.level));
        for (let level = maxLevel; level >= 0; level--) {
            const tasksAtLevel = tasks.filter(t => t.level === level && t.hasChildren);

            tasksAtLevel.forEach(parentTask => {
                const children = tasks.filter(t => t.parentId === parentTask.id);
                if (children.length > 0) {
                    // Le parent couvre du début du premier à la fin du dernier enfant
                    const childHours = children.map(c => ({
                        start: taskMap.get(c.id).startHours || 0,
                        end: taskMap.get(c.id).endHours || 0
                    }));

                    const earliestStartHours = Math.min(...childHours.map(c => c.start));
                    const latestEndHours = Math.max(...childHours.map(c => c.end));

                    const updatedParent = taskMap.get(parentTask.id);

                    // Mettre à jour les heures du parent
                    updatedParent.startHours = earliestStartHours;
                    updatedParent.endHours = latestEndHours;
                    updatedParent.duration = latestEndHours - earliestStartHours;

                    // Mettre à jour aussi les dates pour compatibilité
                    const projectStart = new Date(tasks[0].calculatedStart).getTime() - (tasks[0].startHours * 60 * 60 * 1000);
                    updatedParent.calculatedStart = new Date(projectStart + (earliestStartHours * 60 * 60 * 1000));
                    updatedParent.calculatedEnd = new Date(projectStart + (latestEndHours * 60 * 60 * 1000));
                    updatedParent.dateDebut = updatedParent.calculatedStart.toISOString();
                    updatedParent.dateFin = updatedParent.calculatedEnd.toISOString();

                    console.log(`👨‍👩‍👧‍👦 PARENT - "${parentTask.text}": ${earliestStartHours}h → ${latestEndHours}h (durée: ${updatedParent.duration}h)`);

                    // Ajuster les positions des enfants par rapport au parent
                    const parentStartHours = updatedParent.startHours;
                    children.forEach(child => {
                        const childTask = taskMap.get(child.id);
                        const relativeStart = childTask.startHours - parentStartHours;
                        console.log(`🔧 ADJUST - Enfant "${child.text}": ${childTask.startHours}h → relatif au parent: +${relativeStart}h`);
                    });
                }
            });
        }

        return Array.from(taskMap.values());
    };

    // Fonction pour générer les données Gantt hiérarchiques avec gestion complète des dépendances
    const generateHierarchicalGanttData = () => {
        if (!formData.etapes || formData.etapes.length === 0) {
            return [];
        }

        console.log('🚀 GANTT - Génération des données Gantt avec dépendances MS Project');
        console.log('📋 GANTT - Étapes reçues:', formData.etapes.length, formData.etapes);
        console.log('🔍 GANTT - Structure des parentId:', formData.etapes.map(e => ({ id: e.id, parentId: e.parentId, name: e.name })));
        const projectStart = new Date(formData.dateDebut || new Date());

        // 1. Préparer les tâches avec leur structure hiérarchique
        const taskList = formData.etapes.map((etape, index) => {
            // Normaliser le parentId - convertir "undefined", "[object Object]", etc en vraie valeur
            const normalizedParentId = (() => {
                if (!etape.parentId ||
                    etape.parentId === 'undefined' ||
                    etape.parentId === 'null' ||
                    etape.parentId === '[object Object]' ||
                    etape.parentId === '') {
                    return null;
                }
                return etape.parentId;
            })();

            const hasChildren = formData.etapes.some(e => {
                const childParentId = !e.parentId || e.parentId === 'undefined' || e.parentId === 'null' || e.parentId === '[object Object]' || e.parentId === '' ? null : e.parentId;
                return childParentId === etape.id;
            });
            const level = calculateTaskLevel(etape.id, formData.etapes);
            const isCritical = etape.isCritical || formData.criticalPath?.includes(etape.id);

            // Calculer la numérotation hiérarchique correcte (multi-niveaux)
            let displayName = etape.text;
            if (!displayName) {
                // Fonction récursive pour construire le chemin de numérotation
                const buildNumberPath = (taskId, allTasks) => {
                    const task = allTasks.find(t => t.id === taskId);
                    if (!task) return [];

                    if (!task.parentId) {
                        // Tâche racine : trouver son index parmi les racines
                        const rootIndex = allTasks.filter(t => !t.parentId).findIndex(t => t.id === taskId);
                        return [rootIndex + 1];
                    } else {
                        // Sous-tâche : trouver son index parmi ses frères, puis récursion sur le parent
                        const siblings = allTasks.filter(t => t.parentId === task.parentId);
                        const siblingIndex = siblings.findIndex(s => s.id === taskId);
                        const parentPath = buildNumberPath(task.parentId, allTasks);
                        return [...parentPath, siblingIndex + 1];
                    }
                };

                const numberPath = buildNumberPath(etape.id, formData.etapes);
                displayName = `Étape ${numberPath.join('.')}`;
            }

            return {
                ...etape,
                parentId: normalizedParentId, // Utiliser le parentId normalisé
                level,
                hasChildren,
                isCritical,
                indent: level * 20,
                displayName,
                order: etape.order ?? index, // Assurer un ordre par défaut
                // Initialisation temporaire
                calculatedStart: projectStart,
                calculatedEnd: new Date(projectStart.getTime() + ((etape.duration || 1) * 60 * 60 * 1000))
            };
        });

        console.log('🔧 GANTT - Tâches normalisées:', taskList.map(t => ({ id: t.id, parentId: t.parentId, name: t.name })));

        // 2. Créer un parcours hiérarchique en profondeur (pré-ordre)
        const createHierarchicalOrder = (tasks, parentId = null, currentOrder = []) => {
            console.log(`🔍 createHierarchicalOrder - Recherche enfants de parentId:`, parentId);

            // Trouver les enfants directs du parent actuel
            // Les parentId sont déjà normalisés (null pour les racines)
            const children = tasks
                .filter(task => {
                    const isMatch = task.parentId === parentId;
                    console.log(`  - Tâche ${task.id} (${task.name}): parentId="${task.parentId}" === "${parentId}" => ${isMatch}`);
                    return isMatch;
                })
                .sort((a, b) => (a.order || 0) - (b.order || 0)); // Trier par ordre utilisateur

            console.log(`✅ Trouvé ${children.length} enfants pour parentId=${parentId}`);

            children.forEach(child => {
                // Ajouter le parent d'abord
                currentOrder.push(child);
                // Puis récursivement ses enfants
                createHierarchicalOrder(tasks, child.id, currentOrder);
            });

            return currentOrder;
        };

        const sortedTasks = createHierarchicalOrder(taskList);
        console.log('📊 GANTT - Tâches après tri hiérarchique:', sortedTasks.length);

        // 3. Calculer les dates pour chaque tâche (ordre de dépendance)
        const processedTasks = [];
        sortedTasks.forEach(task => {
            const { calculatedStart, calculatedEnd, startHours, endHours } = calculateTaskDates(task, processedTasks, sortedTasks, projectStart);

            const finalTask = {
                ...task,
                dateDebut: calculatedStart.toISOString(),
                dateFin: calculatedEnd.toISOString(),
                calculatedStart,
                calculatedEnd,
                startHours,
                endHours
            };

            processedTasks.push(finalTask);
        });

        // 4. Mise à jour des tâches parent (propagation hiérarchique)
        const finalTasks = updateParentTasks(processedTasks);

        console.log('✅ GANTT - Génération terminée:', finalTasks.length, 'tâches');
        return finalTasks;
    };

    // ============== CALCUL AUTO DATE FIN PROJET ==============
    // Calcule la date de fin réelle du projet basée sur les étapes et la configuration horaire
    const calculateProjectEndDate = () => {
        if (!formData.dateDebut || formData.etapes.length === 0) {
            return null;
        }

        const hierarchicalTasks = generateHierarchicalGanttData();

        // Trouver la date de fin la plus tardive parmi toutes les tâches
        let latestEndDate = new Date(formData.dateDebut);

        hierarchicalTasks.forEach(task => {
            if (task.calculatedEnd && task.calculatedEnd > latestEndDate) {
                latestEndDate = task.calculatedEnd;
            }
        });

        console.log('📅 AUTO DATE FIN - Calculée:', latestEndDate.toLocaleString('fr-FR'));
        return latestEndDate;
    };

    // Fonction pour dessiner les flèches de dépendances
    const renderDependencyArrows = (tasks) => {
        const arrows = [];

        tasks.forEach((task, taskIndex) => {
            if (task.dependencies && task.dependencies.length > 0) {
                task.dependencies.forEach(dep => {
                    const depTaskIndex = tasks.findIndex(t => t.id === dep.id);
                    if (depTaskIndex !== -1) {
                        arrows.push({
                            from: depTaskIndex,
                            to: taskIndex,
                            type: dep.type,
                            lag: dep.lag || 0
                        });
                    }
                });
            }
        });

        return arrows;
    };

    // Fonction pour générer le contenu d'impression détaillé avec Gantt visuel
    const generatePrintContent = () => {
        const hierarchicalTasks = generateHierarchicalGanttData();
        let effectiveViewMode = formData.ganttViewMode || 'auto';
        const currentViewMode = (effectiveViewMode === 'auto') ? getDefaultViewMode() : effectiveViewMode;
        const timeScale = generateTimeScale(currentViewMode, ganttViewOffset);

        // Calculer les couleurs des tâches
        const getTaskColor = (task) => {
            if (task.isCritical) return '#ef4444';
            if (task.completed) return '#10b981';
            const parentColors = ['#3b82f6', '#10b981', '#a855f7', '#f97316', '#14b8a6', '#ec4899', '#6366f1', '#eab308'];
            if (task.parentId) {
                const rootParent = hierarchicalTasks.find(t => t.id === task.parentId);
                if (rootParent) {
                    const parentIndex = hierarchicalTasks.filter(t => !t.parentId).findIndex(t => t.id === rootParent.id);
                    return parentColors[parentIndex % parentColors.length];
                }
            }
            const parentIndex = hierarchicalTasks.filter(t => !t.parentId).findIndex(t => t.id === task.id);
            return parentColors[parentIndex % parentColors.length];
        };

        // Générer le Gantt visuel pour l'impression
        const ganttVisual = `
            <div class="gantt-visual">
                <!-- En-tête Timeline -->
                <div class="timeline-header">
                    <div class="task-column">Tâche</div>
                    <div class="gantt-timeline">
                        ${timeScale.map(period => `
                            <div class="time-cell">${period.label}</div>
                        `).join('')}
                    </div>
                    <div class="duration-column">Durée</div>
                </div>

                <!-- Tâches avec barres Gantt -->
                ${hierarchicalTasks.map(task => {
                    const projectStart = new Date(formData.dateDebut || new Date());
                    const taskStartHours = task.startHours || 0;
                    const taskDurationHours = task.duration || 1;

                    // Calculer la durée totale de la vue
                    let totalViewHours = 0;
                    switch(currentViewMode) {
                        case '6h': totalViewHours = 6; break;
                        case '12h': totalViewHours = 12; break;
                        case '24h': totalViewHours = 24; break;
                        case 'day': totalViewHours = 24 * timeScale.length; break;
                        case 'week': totalViewHours = 7 * 24 * timeScale.length; break;
                        case 'month': totalViewHours = 30 * 24 * timeScale.length; break;
                        case 'year': totalViewHours = 365 * 24 * timeScale.length; break;
                        default: totalViewHours = Math.max(...hierarchicalTasks.map(t => (t.endHours || 0)));
                    }

                    const startPercent = (taskStartHours / totalViewHours) * 100;
                    const widthPercent = (taskDurationHours / totalViewHours) * 100;
                    const taskProgress = calculateTaskProgress(task.id, formData.etapes);
                    const taskColor = getTaskColor(task);

                    return `
                        <div class="gantt-row ${task.isCritical ? 'critical-row' : ''}">
                            <div class="task-column" style="padding-left: ${task.level * 20}px;">
                                <input type="checkbox" ${task.completed ? 'checked' : ''} disabled />
                                ${task.hasChildren ? '📁' : '📄'}
                                <strong>${task.displayName || task.text || `Étape ${task.order + 1}`}</strong>
                                ${task.autoCalculated ? '<span class="auto-badge">📊</span>' : ''}
                            </div>
                            <div class="gantt-bar-container">
                                <div class="gantt-bar-bg" style="left: ${startPercent}%; width: ${widthPercent}%; background-color: ${taskColor}40;">
                                    <div class="gantt-bar-progress" style="width: ${taskProgress}%; background-color: ${taskColor};"></div>
                                    ${widthPercent > 8 ? `<span class="progress-text">${taskProgress}%</span>` : ''}
                                </div>
                            </div>
                            <div class="duration-column">${task.duration}h (${taskProgress}%)</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        return `
            <div class="page-header">
                <div class="logo-container">
                    <svg width="50" height="50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="45" fill="#1a1a1a"/>
                        <circle cx="50" cy="50" r="35" fill="none" stroke="#3b82f6" stroke-width="4"/>
                        <path d="M30 50 L45 65 L70 35" stroke="#3b82f6" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                    </svg>
                </div>
                <div class="header-info">
                    <h1>C-SECUR360 - Rapport de Projet</h1>
                    <h2>${formData.nom || 'Sans titre'}</h2>
                    <p>Numéro: ${formData.numeroJob || 'N/A'} | Période: ${new Date(formData.dateDebut || new Date()).toLocaleDateString('fr-FR')} - ${new Date(formData.dateFin || new Date()).toLocaleDateString('fr-FR')}</p>
                    <p>Imprimé le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
                </div>
            </div>

            <div class="section">
                <h2>📋 Informations Générales</h2>
                <div class="info-grid">
                    <div class="info-item"><strong>Description:</strong> ${formData.description || 'N/A'}</div>
                    <div class="info-item"><strong>Lieu:</strong> ${formData.lieu || 'N/A'}</div>
                    <div class="info-item"><strong>Contact:</strong> ${formData.contact || 'N/A'}</div>
                    <div class="info-item"><strong>Total Heures:</strong> ${getTotalProjectHours()}h</div>
                    <div class="info-item"><strong>Nombre de Tâches:</strong> ${formData.etapes.length}</div>
                    <div class="info-item"><strong>Vue Gantt:</strong> ${currentViewMode}</div>
                </div>
            </div>

            <div class="section gantt-section">
                <h2>📊 Diagramme de Gantt - Vue Détaillée</h2>
                ${ganttVisual}
            </div>

            <div class="section page-break">
                <h2>📝 Détails des Étapes</h2>
                ${hierarchicalTasks.map(task => `
                    <div class="task-detail" style="margin-left: ${task.level * 20}px; border-left: 3px solid ${getTaskColor(task)};">
                        <h4>
                            ${task.hasChildren ? '📁' : '📄'}
                            ${task.text || task.displayName || `Étape ${task.order + 1}`}
                            ${task.completed ? ' ✓' : ''}
                            ${task.isCritical ? ' 🎯 (CRITIQUE)' : ''}
                        </h4>
                        ${task.description ? `<p><strong>Description:</strong> ${task.description}</p>` : ''}
                        <p><strong>Durée:</strong> ${task.duration}h | <strong>Avancement:</strong> ${calculateTaskProgress(task.id, formData.etapes)}% | <strong>Priorité:</strong> ${task.priority}</p>
                        ${task.dependencies?.length ? `<p><strong>Dépendances:</strong> ${task.dependencies.map(d => {
                            const depTask = formData.etapes.find(e => e.id === d.id);
                            return depTask ? depTask.text || 'Sans nom' : 'Inconnue';
                        }).join(', ')}</p>` : ''}
                        ${task.assignedResources?.personnel?.length || task.assignedResources?.equipements?.length || task.assignedResources?.equipes?.length ?
                            `<p><strong>Ressources:</strong>
                                ${task.assignedResources.personnel?.length || 0} personnel,
                                ${task.assignedResources.equipements?.length || 0} équipement(s),
                                ${task.assignedResources.equipes?.length || 0} équipe(s)
                            </p>` : ''}
                        ${task.notes ? `<p><strong>Notes:</strong> ${task.notes}</p>` : ''}
                    </div>
                `).join('')}
            </div>

            <div class="page-footer">
                <p>Document généré par C-SECUR360 Planificateur</p>
            </div>
        `;
    };

    // Fonction pour imprimer le Gantt et les formulaires
    const printGanttAndForms = () => {
        const printWindow = window.open('', '_blank');
        const printContent = generatePrintContent();

        printWindow.document.write(`
            <html>
                <head>
                    <title>Rapport de Projet - ${formData.nom || 'Sans titre'}</title>
                    <meta charset="UTF-8">
                    <style>
                        /* Styles généraux */
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            font-size: 11pt;
                            line-height: 1.5;
                            color: #333;
                            background: white;
                        }

                        /* Header avec logo */
                        .page-header {
                            display: flex;
                            align-items: center;
                            gap: 20px;
                            padding: 20px;
                            border-bottom: 3px solid #1a1a1a;
                            margin-bottom: 20px;
                            background: linear-gradient(135deg, #f5f7fa 0%, #e8edf2 100%);
                        }
                        .logo-container {
                            flex-shrink: 0;
                        }
                        .header-info h1 {
                            font-size: 20pt;
                            color: #1a1a1a;
                            margin-bottom: 5px;
                        }
                        .header-info h2 {
                            font-size: 16pt;
                            color: #3b82f6;
                            margin-bottom: 10px;
                        }
                        .header-info p {
                            font-size: 9pt;
                            color: #666;
                            margin: 2px 0;
                        }

                        /* Sections */
                        .section {
                            margin: 20px 0;
                            padding: 15px;
                            border-radius: 8px;
                            background: white;
                        }
                        .section h2 {
                            font-size: 14pt;
                            color: #1a1a1a;
                            margin-bottom: 15px;
                            padding-bottom: 5px;
                            border-bottom: 2px solid #3b82f6;
                        }

                        /* Info grid */
                        .info-grid {
                            display: grid;
                            grid-template-columns: repeat(2, 1fr);
                            gap: 10px;
                        }
                        .info-item {
                            padding: 8px;
                            background: #f8f9fa;
                            border-radius: 4px;
                            font-size: 10pt;
                        }

                        /* Gantt visuel */
                        .gantt-section {
                            background: #f8f9fa;
                        }
                        .gantt-visual {
                            width: 100%;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            overflow: hidden;
                        }
                        .timeline-header {
                            display: flex;
                            background: #1a1a1a;
                            color: white;
                            font-weight: bold;
                            font-size: 9pt;
                            border-bottom: 2px solid #3b82f6;
                        }
                        .task-column {
                            width: 250px;
                            padding: 8px;
                            border-right: 1px solid #ddd;
                            flex-shrink: 0;
                            display: flex;
                            align-items: center;
                            gap: 5px;
                        }
                        .gantt-timeline {
                            flex: 1;
                            display: flex;
                            border-right: 1px solid #ddd;
                        }
                        .time-cell {
                            flex: 1;
                            padding: 8px 4px;
                            text-align: center;
                            border-right: 1px solid #444;
                            font-size: 8pt;
                        }
                        .duration-column {
                            width: 100px;
                            padding: 8px;
                            text-align: center;
                            flex-shrink: 0;
                        }
                        .gantt-row {
                            display: flex;
                            border-bottom: 1px solid #eee;
                            min-height: 32px;
                            align-items: center;
                        }
                        .gantt-row:hover {
                            background: #f8f9fa;
                        }
                        .critical-row {
                            background: #fef2f2;
                        }
                        .gantt-bar-container {
                            flex: 1;
                            position: relative;
                            height: 24px;
                            border-right: 1px solid #ddd;
                        }
                        .gantt-bar-bg {
                            position: absolute;
                            top: 2px;
                            height: 20px;
                            border-radius: 3px;
                            overflow: hidden;
                        }
                        .gantt-bar-progress {
                            height: 100%;
                            transition: width 0.3s;
                        }
                        .progress-text {
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            color: white;
                            font-size: 8pt;
                            font-weight: bold;
                            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                        }
                        .auto-badge {
                            font-size: 8pt;
                            color: #3b82f6;
                        }

                        /* Détails des tâches */
                        .task-detail {
                            margin: 10px 0;
                            padding: 10px;
                            padding-left: 15px;
                            background: white;
                            border-radius: 4px;
                            font-size: 10pt;
                        }
                        .task-detail h4 {
                            font-size: 11pt;
                            margin-bottom: 5px;
                            color: #1a1a1a;
                        }
                        .task-detail p {
                            margin: 3px 0;
                            font-size: 9pt;
                            color: #555;
                        }

                        /* Footer */
                        .page-footer {
                            margin-top: 40px;
                            padding-top: 20px;
                            border-top: 2px solid #1a1a1a;
                            text-align: center;
                            color: #666;
                            font-size: 9pt;
                        }

                        /* Pagination automatique */
                        .page-break {
                            page-break-before: always;
                        }

                        /* Print styles */
                        @media print {
                            body { margin: 0; padding: 15mm; }
                            .section { page-break-inside: avoid; }
                            .gantt-row { page-break-inside: avoid; }
                            .task-detail { page-break-inside: avoid; }
                            @page {
                                margin: 15mm;
                                size: landscape;
                            }
                        }
                    </style>
                </head>
                <body>
                    ${printContent}
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.print();
    };

    // Fonction pour passer en mode plein écran
    const toggleGanttFullscreen = () => {
        setGanttFullscreen(!ganttFullscreen);
    };

    // ============== STATISTIQUES PERSONNEL ==============
    // Restauré depuis OLD - Dashboard statistiques ressources

    const getPersonnelStats = () => {
        const stats = {
            total: personnel.length,
            selected: formData.personnel.length,
            'byDépartement/Succursale': {},
            byPoste: {},
            available: personnel.length - formData.personnel.length
        };

        // Statistiques par département/succursale
        personnel.forEach(person => {
            const departement = person.succursale || 'Non assigné';
            if (!stats['byDépartement/Succursale'][departement]) {
                stats['byDépartement/Succursale'][departement] = { total: 0, selected: 0, available: 0 };
            }
            stats['byDépartement/Succursale'][departement].total++;

            if (formData.personnel.includes(person.id)) {
                stats['byDépartement/Succursale'][departement].selected++;
            } else {
                stats['byDépartement/Succursale'][departement].available++;
            }
        });

        // Statistiques par poste
        personnel.forEach(person => {
            const poste = person.poste || 'Non défini';
            if (!stats.byPoste[poste]) {
                stats.byPoste[poste] = { total: 0, selected: 0, available: 0 };
            }
            stats.byPoste[poste].total++;

            if (formData.personnel.includes(person.id)) {
                stats.byPoste[poste].selected++;
            } else {
                stats.byPoste[poste].available++;
            }
        });

        return stats;
    };

    // ============== CALCUL PROGRESS HIÉRARCHIQUE ==============
    // Calcule le progress d'une tâche parent depuis ses sous-tâches
    const calculateTaskProgress = (taskId, allTasks) => {
        const task = allTasks.find(t => t.id === taskId);
        if (!task) return 0;

        // Si la tâche a un progress défini manuellement et n'a pas d'enfants, utiliser celui-ci
        const children = allTasks.filter(t => t.parentId === taskId);

        if (children.length === 0) {
            // Tâche feuille : utiliser son propre progress (ou 0 par défaut)
            return task.progress || 0;
        }

        // Tâche parent : calculer la moyenne pondérée du progress des enfants
        let totalProgress = 0;
        let totalWeight = 0;

        children.forEach(child => {
            const childProgress = calculateTaskProgress(child.id, allTasks);
            const childDuration = child.duration || 1;

            totalProgress += childProgress * childDuration;
            totalWeight += childDuration;
        });

        return totalWeight > 0 ? Math.round(totalProgress / totalWeight) : 0;
    };

    // ============== GESTION HORAIRES PAR JOUR (Partie 1/2) ==============
    // Restauré depuis OLD - Gestion complète jour-par-jour des ressources

    const getAllDays = () => {
        if (!formData.dateDebut || !formData.dateFin) return [];

        const allDays = [];
        const startDate = new Date(formData.dateDebut);
        const endDate = new Date(formData.dateFin);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateString = d.toISOString().split('T')[0];
            const dayOfWeek = d.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            // Un jour est inclus par défaut sauf si:
            // 1. C'est un week-end ET la case "inclure fins de semaine" n'est pas cochée
            // 2. Il a été explicitement exclu (horairesParJour[date] === null)
            let included = true;
            let isExplicitlyExcluded = false;

            if (formData.horairesParJour[dateString] === null) {
                // Explicitement exclu
                included = false;
                isExplicitlyExcluded = true;
            } else if (isWeekend && !formData.includeWeekendsInDuration && !formData.horairesParJour[dateString]) {
                // Week-end pas inclus et pas de personnalisation
                included = false;
            }

            allDays.push({
                date: dateString,
                dayName: d.toLocaleDateString('fr-FR', { weekday: 'long' }),
                dayNumber: d.getDate(),
                isWeekend: isWeekend,
                included: included,
                isExplicitlyExcluded: isExplicitlyExcluded,
                hasCustomSchedule: formData.horairesParJour[dateString] !== undefined && formData.horairesParJour[dateString] !== null
            });
        }

        return allDays;
    };

    const getDayWeekendStatus = (dateString) => {
        const date = new Date(dateString);
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6; // Dimanche ou samedi
    };

    const getDayStats = (dateString) => {
        const daySchedule = formData.horairesParJour[dateString];
        const dayAssignations = formData.assignationsParJour[dateString];

        // Compter le personnel planifié pour ce jour
        let personnelPlanifie = 0;
        if (daySchedule || (!getDayWeekendStatus(dateString) || formData.includeWeekendsInDuration)) {
            // Si il y a des assignations spécifiques pour ce jour, les utiliser
            if (dayAssignations && dayAssignations.personnel.length > 0) {
                personnelPlanifie = dayAssignations.personnel.length;
            } else {
                // Sinon, utiliser les assignations globales
                personnelPlanifie = formData.personnel.length;
            }
        }

        return {
            personnelPlanifie,
            available: personnel.length - personnelPlanifie,
            mode: daySchedule?.mode || 'jour',
            heureDebut: daySchedule?.heureDebut,
            heureFin: daySchedule?.heureFin
        };
    };

    const getAvailablePersonnelForDay = (dateString) => {
        return personnel.filter(person => {
            // Vérifier si la personne est disponible ce jour-là (pas de conflit)
            const conflicts = checkResourceConflicts(person.id, 'personnel', dateString, dateString, formData.id);
            return conflicts.length === 0;
        });
    };

    const filterPersonnelByDay = (dateString, personnelList) => {
        return personnelList.filter(person => {
            // Filtre par département/succursale
            if (personnelFilters && personnelFilters.succursale !== 'global' && person.succursale !== personnelFilters.succursale) {
                return false;
            }

            // Filtre par poste
            if (personnelFilters && personnelFilters.poste !== 'tous' && person.poste !== personnelFilters.poste) {
                return false;
            }

            // Filtre disponible vs tout le personnel
            if (personnelFilters && !personnelFilters.showAll) {
                const conflicts = checkResourceConflicts(person.id, 'personnel', dateString, dateString, formData.id);
                return conflicts.length === 0;
            }

            return true;
        });
    };

    const getAssignedPersonnelForDay = (dateString) => {
        const dayAssignations = formData.assignationsParJour[dateString];
        if (dayAssignations && dayAssignations.personnel.length > 0) {
            // Utiliser les assignations spécifiques au jour
            return dayAssignations.personnel.map(personnelId =>
                personnel.find(p => p.id === personnelId)
            ).filter(Boolean);
        }

        // Si pas d'assignations spécifiques, utiliser les assignations globales
        return formData.personnel.map(personnelId => personnel.find(p => p.id === personnelId)).filter(Boolean);
    };

    const togglePersonnelForDay = (dateString, personnelId) => {
        setFormData(prev => {
            const dayAssignations = prev.assignationsParJour[dateString] || { personnel: [], equipements: [] };
            const isCurrentlyAssigned = dayAssignations.personnel.includes(personnelId);

            if (isCurrentlyAssigned) {
                // Désassigner du personnel pour ce jour spécifique
                const updatedPersonnel = dayAssignations.personnel.filter(id => id !== personnelId);
                return {
                    ...prev,
                    assignationsParJour: {
                        ...prev.assignationsParJour,
                        [dateString]: {
                            ...dayAssignations,
                            personnel: updatedPersonnel
                        }
                    }
                };
            } else {
                // Assigner au personnel pour ce jour spécifique
                const updatedPersonnel = [...dayAssignations.personnel, personnelId];
                return {
                    ...prev,
                    assignationsParJour: {
                        ...prev.assignationsParJour,
                        [dateString]: {
                            ...dayAssignations,
                            personnel: updatedPersonnel
                        }
                    }
                };
            }
        });
    };

    // ============== GESTION HORAIRES PAR JOUR (Partie 2/2) ==============
    // Fonctions équipements + gestion jours

    const getAvailableEquipementForDay = (dateString) => {
        return equipements.filter(equipement => {
            const conflicts = checkResourceConflicts(equipement.id, 'equipement', dateString, dateString, formData.id);
            return conflicts.length === 0;
        });
    };

    const filterEquipementByDay = (dateString, equipementList) => {
        return equipementList.filter(equipement => {
            // Filtre par département/succursale
            if (personnelFilters && personnelFilters.succursale !== 'global' && equipement.succursale !== personnelFilters.succursale) {
                return false;
            }

            // Filtre disponible vs tout l'équipement
            if (personnelFilters && !personnelFilters.showAll) {
                const conflicts = checkResourceConflicts(equipement.id, 'equipement', dateString, dateString, formData.id);
                return conflicts.length === 0;
            }

            return true;
        });
    };

    const getAssignedEquipementForDay = (dateString) => {
        const dayAssignations = formData.assignationsParJour[dateString];
        if (dayAssignations && dayAssignations.equipements.length > 0) {
            // Utiliser les assignations spécifiques au jour
            return dayAssignations.equipements.map(equipementId =>
                equipements.find(e => e.id === equipementId)
            ).filter(Boolean);
        }

        // Si pas d'assignations spécifiques, utiliser les assignations globales
        return formData.equipements.map(equipementId => equipements.find(e => e.id === equipementId)).filter(Boolean);
    };

    const toggleEquipementForDay = (dateString, equipementId) => {
        setFormData(prev => {
            const dayAssignations = prev.assignationsParJour[dateString] || { personnel: [], equipements: [] };
            const isCurrentlyAssigned = dayAssignations.equipements.includes(equipementId);

            if (isCurrentlyAssigned) {
                // Désassigner l'équipement pour ce jour spécifique
                const updatedEquipements = dayAssignations.equipements.filter(id => id !== equipementId);
                return {
                    ...prev,
                    assignationsParJour: {
                        ...prev.assignationsParJour,
                        [dateString]: {
                            ...dayAssignations,
                            equipements: updatedEquipements
                        }
                    }
                };
            } else {
                // Assigner à l'équipement pour ce jour spécifique
                const updatedEquipements = [...dayAssignations.equipements, equipementId];
                return {
                    ...prev,
                    assignationsParJour: {
                        ...prev.assignationsParJour,
                        [dateString]: {
                            ...dayAssignations,
                            equipements: updatedEquipements
                        }
                    }
                };
            }
        });
    };

    const updateDailySchedule = (date, heureDebut, heureFin, mode = 'jour') => {
        setFormData(prev => ({
            ...prev,
            horairesParJour: {
                ...prev.horairesParJour,
                [date]: {
                    heureDebut: mode === '24h' ? '00:00' : heureDebut,
                    heureFin: mode === '24h' ? '23:59' : heureFin,
                    mode: mode
                }
            }
        }));
    };

    const toggleDay24h = (date) => {
        const currentSchedule = formData.horairesParJour[date];
        const is24h = currentSchedule?.mode === '24h';

        updateDailySchedule(
            date,
            is24h ? formData.heureDebut : '00:00',
            is24h ? formData.heureFin : '23:59',
            is24h ? 'jour' : '24h'
        );
    };

    const toggleDayInclusion = (date) => {
        if (formData.horairesParJour[date] === null) {
            // Jour explicitement exclu → l'inclure avec horaires par défaut
            updateDailySchedule(date, formData.heureDebut, formData.heureFin, 'jour');
        } else if (formData.horairesParJour[date]) {
            // Jour avec horaire personnalisé → l'exclure explicitement
            setFormData(prev => ({
                ...prev,
                horairesParJour: {
                    ...prev.horairesParJour,
                    [date]: null  // null = explicitement exclu
                }
            }));
        } else {
            // Jour avec horaire global par défaut → l'exclure explicitement
            setFormData(prev => ({
                ...prev,
                horairesParJour: {
                    ...prev.horairesParJour,
                    [date]: null  // null = explicitement exclu
                }
            }));
        }
    };

    const excludeDay = (date) => {
        setFormData(prev => ({
            ...prev,
            horairesParJour: {
                ...prev.horairesParJour,
                [date]: null  // null = explicitement exclu
            }
        }));
    };

    // ============== P1-4: HIÉRARCHIE TÂCHES AVANCÉE ==============
    // 10 fonctions pour gérer la structure WBS des étapes

    const addEtape = (parentId = null) => {
        setFormData(prev => {
            const parentEtape = parentId ? prev.etapes.find(e => e.id === parentId) : null;
            const level = parentEtape ? (parentEtape.level || 0) + 1 : 0;

            const newEtape = {
                id: Date.now(),
                text: '',
                description: '',
                completed: false,
                duration: 1,
                priority: 'normal',
                dependencies: [],
                assignedResources: {
                    personnel: [],
                    equipements: [],
                    equipes: [],
                    sousTraitants: []
                },
                schedulingMode: 'auto',
                startDate: null,
                endDate: null,
                parallelWith: [],
                parentId: parentId,
                level: level,
                children: [],
                isCollapsed: false,
                progress: 0,
                actualStart: null,
                actualEnd: null,
                actualDuration: null,
                isCritical: false,
                slack: 0,
                tags: [],
                notes: '',
                color: '#3B82F6',
                order: prev.etapes.length
            };

            const updatedEtapes = [...prev.etapes, newEtape];

            if (parentId) {
                const parentIndex = updatedEtapes.findIndex(e => e.id === parentId);
                if (parentIndex !== -1) {
                    updatedEtapes[parentIndex] = {
                        ...updatedEtapes[parentIndex],
                        children: [...updatedEtapes[parentIndex].children, newEtape.id]
                    };
                }
            }

            const finalEtapes = recalculateParentDurations(updatedEtapes);

            return {
                ...prev,
                etapes: finalEtapes
            };
        });
    };

    const recalculateParentDurations = (etapes) => {
        const updatedEtapes = [...etapes];

        const calculateParentDuration = (parentId) => {
            const children = updatedEtapes.filter(e => e.parentId === parentId);
            if (children.length === 0) return;

            let totalDuration = 0;
            let hasChildren = false;

            children.forEach(child => {
                calculateParentDuration(child.id);
                totalDuration += parseFloat(child.duration) || 0;
                hasChildren = true;
            });

            if (hasChildren) {
                const parentIndex = updatedEtapes.findIndex(e => e.id === parentId);
                if (parentIndex !== -1) {
                    updatedEtapes[parentIndex] = {
                        ...updatedEtapes[parentIndex],
                        duration: totalDuration,
                        autoCalculated: true
                    };
                }
            }
        };

        const rootTasks = updatedEtapes.filter(e => !e.parentId);
        rootTasks.forEach(root => calculateParentDuration(root.id));

        updatedEtapes.forEach(etape => {
            if (updatedEtapes.some(e => e.parentId === etape.id)) {
                calculateParentDuration(etape.id);
            }
        });

        return updatedEtapes;
    };

    const updateEtape = (index, field, value) => {
        setFormData(prev => {
            let updatedEtapes = prev.etapes.map((etape, i) =>
                i === index ? { ...etape, [field]: value } : etape
            );

            if (field === 'duration') {
                updatedEtapes = recalculateParentDurations(updatedEtapes);
            }

            return {
                ...prev,
                etapes: updatedEtapes
            };
        });
    };

    const removeEtape = (index) => {
        setFormData(prev => {
            const etapeToRemove = prev.etapes[index];
            if (!etapeToRemove) return prev;

            let updatedEtapes = [...prev.etapes];

            const removeChildren = (parentId) => {
                const children = updatedEtapes.filter(e => e.parentId === parentId);
                children.forEach(child => {
                    removeChildren(child.id);
                    updatedEtapes = updatedEtapes.filter(e => e.id !== child.id);
                });
            };

            removeChildren(etapeToRemove.id);

            if (etapeToRemove.parentId) {
                const parentIndex = updatedEtapes.findIndex(e => e.id === etapeToRemove.parentId);
                if (parentIndex !== -1) {
                    updatedEtapes[parentIndex] = {
                        ...updatedEtapes[parentIndex],
                        children: updatedEtapes[parentIndex].children.filter(id => id !== etapeToRemove.id)
                    };
                }
            }

            updatedEtapes = updatedEtapes.filter((_, i) => i !== index);

            updatedEtapes = updatedEtapes.map(etape => ({
                ...etape,
                dependencies: etape.dependencies.filter(dep => dep.id !== etapeToRemove.id),
                parallelWith: etape.parallelWith.filter(id => id !== etapeToRemove.id)
            }));

            const finalEtapes = recalculateParentDurations(updatedEtapes);

            return {
                ...prev,
                etapes: finalEtapes
            };
        });
    };

    const addDependency = (etapeId, dependencyId, type = 'FS', lag = 0) => {
        setFormData(prev => ({
            ...prev,
            etapes: prev.etapes.map(etape =>
                etape.id === etapeId
                    ? {
                        ...etape,
                        dependencies: [...etape.dependencies, { id: dependencyId, type, lag }]
                    }
                    : etape
            )
        }));
    };

    const removeDependency = (etapeId, dependencyId) => {
        setFormData(prev => ({
            ...prev,
            etapes: prev.etapes.map(etape =>
                etape.id === etapeId
                    ? {
                        ...etape,
                        dependencies: etape.dependencies.filter(dep => dep.id !== dependencyId)
                    }
                    : etape
            )
        }));
    };

    const assignResourceToEtape = (etapeId, resourceId, resourceType) => {
        setFormData(prev => ({
            ...prev,
            etapes: prev.etapes.map(etape =>
                etape.id === etapeId
                    ? {
                        ...etape,
                        assignedResources: {
                            ...etape.assignedResources,
                            [resourceType]: etape.assignedResources[resourceType].includes(resourceId)
                                ? etape.assignedResources[resourceType]
                                : [...etape.assignedResources[resourceType], resourceId]
                        }
                    }
                    : etape
            )
        }));
    };

    const unassignResourceFromEtape = (etapeId, resourceId, resourceType) => {
        setFormData(prev => ({
            ...prev,
            etapes: prev.etapes.map(etape =>
                etape.id === etapeId
                    ? {
                        ...etape,
                        assignedResources: {
                            ...etape.assignedResources,
                            [resourceType]: etape.assignedResources[resourceType].filter(id => id !== resourceId)
                        }
                    }
                    : etape
            )
        }));
    };

    const moveEtape = (dragIndex, hoverIndex) => {
        setFormData(prev => {
            const draggedEtape = prev.etapes[dragIndex];
            const newEtapes = [...prev.etapes];
            newEtapes.splice(dragIndex, 1);
            newEtapes.splice(hoverIndex, 0, draggedEtape);

            return {
                ...prev,
                etapes: newEtapes.map((etape, index) => ({
                    ...etape,
                    order: index
                }))
            };
        });
    };

    const toggleEtapeCollapse = (etapeId) => {
        setFormData(prev => ({
            ...prev,
            etapes: prev.etapes.map(etape =>
                etape.id === etapeId
                    ? { ...etape, isCollapsed: !etape.isCollapsed }
                    : etape
            )
        }));
    };

    // ============== P1-5: CALCUL CHEMIN CRITIQUE (CPM) ==============
    const calculateCriticalPath = useCallback((tasks) => {
        if (!tasks || tasks.length === 0) return [];

        try {
            const taskMap = {};
            tasks.forEach(task => {
                taskMap[task.id] = {
                    ...task,
                    earlyStart: 0,
                    earlyFinish: task.duration || 1,
                    lateStart: 0,
                    lateFinish: task.duration || 1,
                    slack: 0
                };
            });

            // Forward Pass - Calculate Early Start/Finish
            const calculateEarlyDates = () => {
                const visited = new Set();
                const processTask = (taskId) => {
                    if (visited.has(taskId)) return;
                    visited.add(taskId);

                    const task = taskMap[taskId];
                    let maxEarlyFinish = 0;
                    const etape = formData.etapes.find(e => e.id === taskId);

                    if (etape && etape.dependencies) {
                        etape.dependencies.forEach(dep => {
                            processTask(dep.id);
                            const depTask = taskMap[dep.id];
                            if (depTask) {
                                let depFinish = depTask.earlyFinish;
                                depFinish += (dep.lag || 0);

                                switch (dep.type) {
                                    case 'FS':
                                        maxEarlyFinish = Math.max(maxEarlyFinish, depFinish);
                                        break;
                                    case 'SS':
                                        maxEarlyFinish = Math.max(maxEarlyFinish, depTask.earlyStart + (dep.lag || 0));
                                        break;
                                    case 'FF':
                                        maxEarlyFinish = Math.max(maxEarlyFinish, depFinish - task.duration);
                                        break;
                                    case 'SF':
                                        maxEarlyFinish = Math.max(maxEarlyFinish, depTask.earlyStart + (dep.lag || 0) - task.duration);
                                        break;
                                    default:
                                        maxEarlyFinish = Math.max(maxEarlyFinish, depFinish);
                                }
                            }
                        });
                    }

                    task.earlyStart = maxEarlyFinish;
                    task.earlyFinish = task.earlyStart + task.duration;
                };

                tasks.forEach(task => processTask(task.id));
            };

            // Backward Pass - Calculate Late Start/Finish
            const calculateLateDates = () => {
                const projectFinish = Math.max(...Object.values(taskMap).map(t => t.earlyFinish));

                Object.values(taskMap).forEach(task => {
                    const hasSuccessors = formData.etapes.some(e =>
                        e.dependencies && e.dependencies.some(dep => dep.id === task.id)
                    );

                    if (!hasSuccessors) {
                        task.lateFinish = projectFinish;
                        task.lateStart = task.lateFinish - task.duration;
                    }
                });

                const visited = new Set();
                const processTaskBackward = (taskId) => {
                    if (visited.has(taskId)) return;
                    visited.add(taskId);

                    const task = taskMap[taskId];
                    const successors = formData.etapes.filter(e =>
                        e.dependencies && e.dependencies.some(dep => dep.id === taskId)
                    );

                    let minLateStart = task.lateStart;

                    successors.forEach(successor => {
                        processTaskBackward(successor.id);
                        const succTask = taskMap[successor.id];
                        const dep = successor.dependencies.find(d => d.id === taskId);

                        if (succTask && dep) {
                            let lateStartCandidate;
                            const lag = dep.lag || 0;

                            switch (dep.type) {
                                case 'FS':
                                    lateStartCandidate = succTask.lateStart - task.duration - lag;
                                    break;
                                case 'SS':
                                    lateStartCandidate = succTask.lateStart - lag;
                                    break;
                                case 'FF':
                                    lateStartCandidate = succTask.lateFinish - task.duration - lag;
                                    break;
                                case 'SF':
                                    lateStartCandidate = succTask.lateFinish - lag;
                                    break;
                                default:
                                    lateStartCandidate = succTask.lateStart - task.duration - lag;
                            }

                            if (minLateStart === task.lateStart || lateStartCandidate < minLateStart) {
                                minLateStart = lateStartCandidate;
                            }
                        }
                    });

                    task.lateStart = minLateStart;
                    task.lateFinish = task.lateStart + task.duration;
                    task.slack = task.lateStart - task.earlyStart;
                };

                tasks.forEach(task => processTaskBackward(task.id));
            };

            calculateEarlyDates();
            calculateLateDates();

            // Identify critical path (slack ≈ 0)
            const criticalTasks = Object.values(taskMap)
                .filter(task => Math.abs(task.slack) <= 0.001)
                .map(task => task.id);

            return criticalTasks;
        } catch (error) {
            console.error('Erreur calcul chemin critique:', error);
            return [];
        }
    }, [formData.etapes]);

    // ============== P1-6 & P1-8: CALCULS BIDIRECTIONNELS HEURES/PERSONNEL ==============
    // Calcul du personnel requis à partir des heures planifiées
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
            if (!heuresDebutJour || !heuresFinJour) {
                heuresParJour = 8; // Valeur par défaut 8h de travail
                return Math.max(1, Math.ceil(totalHeures / (joursOuvrables * heuresParJour)));
            }
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
            if (!heuresDebutJour || !heuresFinJour) {
                heuresParJour = 8; // Valeur par défaut 8h de travail
            } else {
                const [heureDebut, minuteDebut] = heuresDebutJour.split(':').map(Number);
                const [heureFin, minuteFin] = heuresFinJour.split(':').map(Number);
                const minutesDebut = heureDebut * 60 + minuteDebut;
                const minutesFin = heureFin * 60 + minuteFin;
                heuresParJour = (minutesFin - minutesDebut) / 60;
            }
        }

        const totalHeuresDisponibles = joursOuvrables * heuresParJour * personnel;
        return totalHeuresDisponibles.toString();
    };

    // ============== P1-7: VALIDATION TIMELINE + SOLUTIONS ==============
    const validateProjectEndDate = () => {
        if (!formData.dateDebut || !formData.dateFin || formData.etapes.length === 0) {
            return { isValid: true, warnings: [] };
        }

        const projectStart = new Date(formData.dateDebut);
        const projectEnd = new Date(formData.dateFin);
        const totalTaskHours = formData.etapes.reduce((sum, etape) => sum + (etape.duration || 0), 0);

        // Calculer la date de fin réelle du timeline basé sur les étapes
        const timelineEnd = new Date(projectStart.getTime() + (totalTaskHours * 60 * 60 * 1000));

        const warnings = [];
        let isValid = true;

        if (timelineEnd > projectEnd) {
            isValid = false;
            const overlapHours = Math.ceil((timelineEnd - projectEnd) / (1000 * 60 * 60));
            const overlapDays = Math.ceil(overlapHours / 24);

            warnings.push({
                type: 'timeline_overflow',
                severity: 'error',
                message: `Le projet dépasse la date de fin prévue de ${overlapDays} jour${overlapDays > 1 ? 's' : ''} (${overlapHours}h)`,
                suggestedEndDate: timelineEnd,
                overlapHours,
                overlapDays,
                solutions: [
                    {
                        type: 'add_resources',
                        label: '👥 Ajouter des ressources pour réduire la durée',
                        description: 'Assigner plus de personnel aux tâches critiques'
                    },
                    {
                        type: 'extend_deadline',
                        label: '📅 Ajuster la date de fin du projet',
                        description: `Reporter la date de fin au ${timelineEnd.toLocaleDateString('fr-FR')}`
                    },
                    {
                        type: 'optimize_tasks',
                        label: '⚡ Optimiser les durées des étapes',
                        description: 'Réduire les durées ou paralléliser certaines tâches'
                    }
                ]
            });
        }

        return { isValid, warnings, timelineEnd, projectEnd };
    };

    // Fonction pour appliquer une solution de dépassement
    const applyTimelineSolution = (solutionType) => {
        const validation = validateProjectEndDate();
        if (!validation.warnings.length) return;

        const warning = validation.warnings[0];

        switch (solutionType) {
            case 'extend_deadline':
                updateField('dateFin', warning.suggestedEndDate.toISOString().slice(0, 16));
                addNotification('Date de fin du projet ajustée selon le timeline des étapes', 'success');
                break;

            case 'add_resources':
                // Ouvrir un modal ou section pour ajouter des ressources
                addNotification('Fonctionnalité d\'ajout de ressources à implémenter', 'info');
                break;

            case 'optimize_tasks':
                addNotification('Révisez les durées des étapes pour optimiser le planning', 'info');
                // Mettre en évidence les étapes les plus longues
                break;
        }
    };

    // ============== P2-2: GÉNÉRATION ÉCHELLE TEMPS GANTT ==============
    const generateTimeScale = (viewMode = null, offset = 0) => {
        console.log('🐛 DEBUG generateTimeScale called with viewMode:', viewMode, 'offset:', offset);
        console.log('🐛 DEBUG formData.dateDebut:', formData.dateDebut);
        console.log('🐛 DEBUG formData.ganttViewMode:', formData.ganttViewMode);

        if (!formData.dateDebut) return [];

        // **FORCER LA VUE AUTOMATIQUE** pour corriger le problème
        const autoViewMode = getDefaultViewMode();
        const currentViewMode = (viewMode === 'auto' || !viewMode) ? autoViewMode : viewMode;
        console.log('🐛 DEBUG auto view mode:', autoViewMode);
        console.log('🐛 DEBUG currentViewMode selected:', currentViewMode);

        // NOUVEAU : Aligner la date de début avec l'heure de travail configurée
        const workStartTime = formData.heuresDebutJour || '08:00';
        const [startH, startM] = workStartTime.split(':').map(Number);

        const startDate = new Date(formData.dateDebut);
        startDate.setHours(startH, startM, 0, 0); // Définir l'heure de début de journée

        const scale = [];

        switch (currentViewMode) {
            case '6h':
                // Vue 6 heures fixe - toujours 6 cellules d'1h chacune (avec offset)
                console.log('🐛 DEBUG - Generating 6h fixed view with offset:', offset, 'starting at', workStartTime);
                for (let hour = 0; hour < 6; hour++) {
                    const actualHour = hour + (offset * 6); // Décaler par fenêtre de 6h
                    const currentTime = new Date(startDate.getTime() + (actualHour * 60 * 60 * 1000));
                    const timeLabel = currentTime.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    scale.push({
                        date: currentTime,
                        label: timeLabel,
                        key: `hour-${actualHour}`,
                        value: actualHour
                    });
                }
                break;

            case '12h':
                // Vue 12 heures fixe - toujours 12 cellules d'1h chacune (avec offset)
                console.log('🐛 DEBUG - Generating 12h fixed view with offset:', offset, 'starting at', workStartTime);
                for (let hour = 0; hour < 12; hour++) {
                    const actualHour = hour + (offset * 12); // Décaler par fenêtre de 12h
                    const currentTime = new Date(startDate.getTime() + (actualHour * 60 * 60 * 1000));
                    const timeLabel = currentTime.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    scale.push({
                        date: currentTime,
                        label: timeLabel,
                        key: `hour-${actualHour}`,
                        value: actualHour
                    });
                }
                break;

            case '24h':
                // Vue 24 heures fixe - toujours 24 cellules d'1h chacune (avec offset)
                console.log('🐛 DEBUG - Generating 24h fixed view with offset:', offset, 'starting at', workStartTime);
                for (let hour = 0; hour < 24; hour++) {
                    const actualHour = hour + (offset * 24); // Décaler par fenêtre de 24h
                    const currentTime = new Date(startDate.getTime() + (actualHour * 60 * 60 * 1000));
                    const timeLabel = currentTime.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    scale.push({
                        date: currentTime,
                        label: timeLabel,
                        key: `hour-${actualHour}`,
                        value: actualHour
                    });
                }
                break;

            case 'day':
                // Vue journalière adaptative selon la durée du projet (avec offset)
                const totalTaskHours = formData.etapes.reduce((sum, etape) => sum + (etape.duration || 0), 0);
                const totalDays = Math.max(1, Math.ceil(totalTaskHours / 24));
                const visibleDays = Math.min(7, totalDays); // Afficher max 7 jours à la fois
                console.log('🐛 DEBUG - Generating day view with totalDays:', totalDays, 'offset:', offset);
                for (let day = 0; day < visibleDays; day++) {
                    const actualDay = day + (offset * visibleDays);
                    if (actualDay >= totalDays) break; // Ne pas dépasser la durée totale
                    const currentDate = new Date(startDate.getTime() + (actualDay * 24 * 60 * 60 * 1000));
                    scale.push({
                        date: currentDate,
                        label: currentDate.toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short'
                        }),
                        key: `day-${actualDay}`,
                        value: actualDay
                    });
                }
                break;

            case 'week':
                // Vue hebdomadaire adaptative selon la durée du projet (avec offset)
                const totalTaskHoursWeek = formData.etapes.reduce((sum, etape) => sum + (etape.duration || 0), 0);
                const totalWeeks = Math.max(1, Math.ceil(totalTaskHoursWeek / (7 * 24)));
                const visibleWeeks = Math.min(4, totalWeeks); // Afficher max 4 semaines à la fois
                console.log('🐛 DEBUG - Generating week view with totalWeeks:', totalWeeks, 'offset:', offset);
                for (let week = 0; week < visibleWeeks; week++) {
                    const actualWeek = week + (offset * visibleWeeks);
                    if (actualWeek >= totalWeeks) break;
                    const weekStart = new Date(startDate.getTime() + (actualWeek * 7 * 24 * 60 * 60 * 1000));
                    scale.push({
                        date: weekStart,
                        label: `S${actualWeek + 1}`,
                        longLabel: weekStart.toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short'
                        }),
                        key: `week-${actualWeek}`,
                        value: actualWeek
                    });
                }
                break;

            case 'month':
                // Vue mensuelle adaptative selon la durée du projet (avec offset)
                const totalTaskHoursMonth = formData.etapes.reduce((sum, etape) => sum + (etape.duration || 0), 0);
                const totalMonths = Math.max(1, Math.ceil(totalTaskHoursMonth / (30 * 24)));
                const visibleMonths = Math.min(6, totalMonths); // Afficher max 6 mois à la fois
                console.log('🐛 DEBUG - Generating month view with totalMonths:', totalMonths, 'offset:', offset);
                for (let month = 0; month < visibleMonths; month++) {
                    const actualMonth = month + (offset * visibleMonths);
                    if (actualMonth >= totalMonths) break;
                    const monthStart = new Date(startDate.getTime() + (actualMonth * 30 * 24 * 60 * 60 * 1000));
                    scale.push({
                        date: monthStart,
                        label: monthStart.toLocaleDateString('fr-FR', {
                            month: 'short',
                            year: '2-digit'
                        }),
                        key: `month-${actualMonth}`,
                        value: actualMonth
                    });
                }
                break;

            case 'year':
                // Vue annuelle adaptative selon la durée du projet (avec offset)
                const totalTaskHoursYear = formData.etapes.reduce((sum, etape) => sum + (etape.duration || 0), 0);
                const totalYears = Math.max(1, Math.ceil(totalTaskHoursYear / (365 * 24)));
                const visibleYears = Math.min(3, totalYears); // Afficher max 3 ans à la fois
                console.log('🐛 DEBUG - Generating year view with totalYears:', totalYears, 'offset:', offset);
                for (let year = 0; year < visibleYears; year++) {
                    const actualYear = year + (offset * visibleYears);
                    if (actualYear >= totalYears) break;
                    const yearStart = new Date(startDate.getTime() + (actualYear * 365 * 24 * 60 * 60 * 1000));
                    scale.push({
                        date: yearStart,
                        label: yearStart.getFullYear().toString(),
                        key: `year-${actualYear}`,
                        value: actualYear
                    });
                }
                break;
        }

        return scale;
    };

    // ============== P2-3: POSITIONNEMENT TÂCHES DANS GANTT ==============
    const calculateTaskPosition = (task, timeScale, viewMode = null, offset = 0) => {
        if (!formData.dateDebut || !task.calculatedStart || !task.calculatedEnd || timeScale.length === 0) {
            return { startIndex: -1, endIndex: -1, duration: 0 };
        }

        const currentViewMode = viewMode || formData.ganttViewMode || getDefaultViewMode();

        // NOUVEAU : Aligner projectStart avec l'heure de début configurée
        const workStartTime = formData.heuresDebutJour || '08:00';
        const [startH, startM] = workStartTime.split(':').map(Number);

        const projectStart = new Date(formData.dateDebut);
        projectStart.setHours(startH, startM, 0, 0);

        const taskStart = task.calculatedStart;
        const taskEnd = task.calculatedEnd;

        // Position en heures depuis le début du projet (aligné sur heures de travail)
        const taskStartHours = Math.floor((taskStart - projectStart) / (1000 * 60 * 60));
        const taskDurationHours = Math.ceil((taskEnd - taskStart) / (1000 * 60 * 60));

        let startIndex = -1;
        let endIndex = -1;

        switch (currentViewMode) {
            case '6h':
            case '12h':
            case '24h':
                // Vues horaires fixes - calcul précis proportionnel avec offset
                const totalHours = parseInt(currentViewMode.replace('h', ''));
                const windowOffsetHours = offset * totalHours; // Décalage en heures
                const adjustedStartHours = taskStartHours - windowOffsetHours;
                const hourlyUnitWidth = 100 / totalHours; // % par heure

                // Position de début (en % de la timeline visible)
                const startPercent = Math.max(0, (adjustedStartHours / totalHours) * 100);
                // Largeur proportionnelle (en % de la timeline)
                const widthPercent = (taskDurationHours / totalHours) * 100;

                console.log(`🎯 GANTT - Tâche "${task.text}": ${taskStartHours}h→${taskStartHours + taskDurationHours}h (${taskDurationHours}h) offset:${windowOffsetHours}h = ${startPercent.toFixed(1)}%→${widthPercent.toFixed(1)}%`);

                return {
                    startIndex: startPercent,
                    endIndex: startPercent + widthPercent,
                    duration: widthPercent,
                    startPercent: startPercent,
                    widthPercent: widthPercent
                };

            case 'day':
                // Mode jour adaptatif - chaque index = 1 jour (24h) avec offset
                const visibleDaysCalc = Math.min(7, Math.ceil(formData.etapes.reduce((sum, e) => sum + (e.duration || 0), 0) / 24));
                const dayOffset = offset * visibleDaysCalc;
                startIndex = Math.max(0, Math.floor(taskStartHours / 24) - dayOffset);
                endIndex = Math.max(startIndex, Math.floor((taskStartHours + taskDurationHours - 1) / 24) - dayOffset);
                break;

            case 'week':
                // Mode semaine - chaque index = 1 semaine (168h) avec offset
                const visibleWeeksCalc = Math.min(4, Math.ceil(formData.etapes.reduce((sum, e) => sum + (e.duration || 0), 0) / (7 * 24)));
                const weekOffset = offset * visibleWeeksCalc;
                startIndex = Math.max(0, Math.floor(taskStartHours / (7 * 24)) - weekOffset);
                endIndex = Math.max(startIndex, Math.floor((taskStartHours + taskDurationHours - 1) / (7 * 24)) - weekOffset);
                break;

            case 'month':
                // Mode mois - chaque index = 1 mois (720h) avec offset
                const visibleMonthsCalc = Math.min(6, Math.ceil(formData.etapes.reduce((sum, e) => sum + (e.duration || 0), 0) / (30 * 24)));
                const monthOffset = offset * visibleMonthsCalc;
                startIndex = Math.max(0, Math.floor(taskStartHours / (30 * 24)) - monthOffset);
                endIndex = Math.max(startIndex, Math.floor((taskStartHours + taskDurationHours - 1) / (30 * 24)) - monthOffset);
                break;

            case 'years':
                // Mode année - chaque index = 1 année (8760h) avec offset
                const visibleYearsCalc = Math.min(3, Math.ceil(formData.etapes.reduce((sum, e) => sum + (e.duration || 0), 0) / (365 * 24)));
                const yearOffset = offset * visibleYearsCalc;
                startIndex = Math.max(0, Math.floor(taskStartHours / (365 * 24)) - yearOffset);
                endIndex = Math.max(startIndex, Math.floor((taskStartHours + taskDurationHours - 1) / (365 * 24)) - yearOffset);
                break;
        }

        return {
            startIndex: Math.max(0, startIndex),
            endIndex: Math.min(timeScale.length - 1, Math.max(startIndex, endIndex)),
            duration: Math.max(1, endIndex - startIndex + 1)
        };
    };

    // ============== P2-4: CALCUL DATES TÂCHES AVEC DÉPENDANCES ==============
    const DEPENDENCY_TYPES = {
        FS: 'FS', // Finish to Start (défaut) - Fin → Début
        SS: 'SS', // Start to Start - Début → Début
        FF: 'FF', // Finish to Finish - Fin → Fin
        SF: 'SF'  // Start to Finish - Début → Fin (rare)
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

    // Fonctions pour gestion d'équipes
    const createTeam = (teamName, memberIds) => {
        const newTeam = {
            id: `team-${Date.now()}`,
            nom: teamName,
            membres: memberIds,
            dateCreation: new Date().toISOString()
        };

        setFormData(prev => ({
            ...prev,
            equipes: [...prev.equipes, newTeam]
        }));

        addNotification?.(`Équipe "${teamName}" créée avec succès`, 'success');
        return newTeam.id;
    };

    const updateTeam = (teamId, updates) => {
        setFormData(prev => ({
            ...prev,
            equipes: prev.equipes.map(team =>
                team.id === teamId ? { ...team, ...updates } : team
            )
        }));
    };

    const deleteTeam = (teamId) => {
        const team = formData.equipes.find(t => t.id === teamId);
        setFormData(prev => ({
            ...prev,
            equipes: prev.equipes.filter(team => team.id !== teamId),
            horairesEquipes: {
                ...prev.horairesEquipes,
                [teamId]: undefined
            }
        }));
        addNotification?.(`Équipe "${team?.nom}" supprimée`, 'info');
    };

    const setTeamSchedule = (teamId, scheduleData) => {
        setFormData(prev => ({
            ...prev,
            horairesEquipes: {
                ...prev.horairesEquipes,
                [teamId]: scheduleData
            }
        }));
    };

    const addPersonnelToTeam = (teamId, personnelId) => {
        const team = formData.equipes.find(t => t.id === teamId);
        if (team && !team.membres.includes(personnelId)) {
            updateTeam(teamId, {
                membres: [...team.membres, personnelId]
            });
        }
    };

    const removePersonnelFromTeam = (teamId, personnelId) => {
        const team = formData.equipes.find(t => t.id === teamId);
        if (team) {
            updateTeam(teamId, {
                membres: team.membres.filter(id => id !== personnelId)
            });
        }
    };

    // Handler pour la soumission du formulaire
    const handleSubmit = () => {
        if (!formData.nom || !formData.dateDebut || !formData.dateFin) {
            addNotification?.('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        if (typeof onSave !== 'function') {
            console.error('❌ onSave is not a function:', onSave);
            addNotification?.('Erreur: fonction de sauvegarde non disponible', 'error');
            return;
        }

        onSave(formData);
        onClose();
    };

    // Handler pour la suppression du job
    const handleDelete = () => {
        if (!job?.id) {
            addNotification?.('Erreur: impossible de supprimer un job sans ID', 'error');
            return;
        }

        if (typeof onDelete !== 'function') {
            console.error('❌ onDelete is not a function:', onDelete);
            addNotification?.('Erreur: fonction de suppression non disponible', 'error');
            return;
        }

        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce job ?')) {
            onDelete(job.id);
            onClose();
        }
    };

    // Handler pour sauvegarder la baseline du Gantt
    const saveBaseline = () => {
        const baseline = {
            etapes: formData.etapes.map(etape => ({
                id: etape.id,
                name: etape.name,
                duration: etape.duration,
                startHour: etape.startHour,
                dependencies: etape.dependencies || [],
                assignedPersonnel: etape.assignedPersonnel || [],
                assignedEquipement: etape.assignedEquipement || []
            })),
            dateDebut: formData.dateDebut,
            dateFin: formData.dateFin,
            savedAt: new Date().toISOString()
        };

        setFormData(prev => ({
            ...prev,
            ganttBaseline: baseline
        }));

        addNotification?.('Baseline sauvegardée avec succès', 'success');
    };

    // Fonction pour optimiser l'assignation du personnel
    const optimizePersonnelAssignment = () => {
        if (!formData.dateDebut || !formData.dateFin) {
            addNotification?.('Veuillez définir les dates du projet', 'warning');
            return;
        }

        const allDays = getAllDays();
        const optimizedAssignations = {};
        let assignedCount = 0;

        allDays.forEach(day => {
            if (!day.isWeekend || formData.includeWeekendsInDuration) {
                const availablePersonnel = getAvailablePersonnelForDay(day.dateString);

                const personnelToAssign = availablePersonnel
                    .filter(person => formData.personnel.includes(person.id))
                    .slice(0, formData.nombrePersonnelRequis || 1)
                    .map(p => p.id);

                if (personnelToAssign.length > 0) {
                    optimizedAssignations[day.dateString] = {
                        personnel: personnelToAssign,
                        equipements: formData.assignationsParJour[day.dateString]?.equipements || []
                    };
                    assignedCount++;
                }
            }
        });

        setFormData(prev => ({
            ...prev,
            assignationsParJour: {
                ...prev.assignationsParJour,
                ...optimizedAssignations
            }
        }));

        addNotification?.(`Optimisation terminée : ${assignedCount} jour(s) optimisé(s)`, 'success');
    };

    // Fonction pour résoudre les conflits d'horaire
    const resolveScheduleConflicts = () => {
        const conflicts = getCurrentEventConflicts();

        if (conflicts.length === 0) {
            addNotification?.('Aucun conflit détecté', 'info');
            return;
        }

        let resolvedCount = 0;
        const updatedPersonnel = [...formData.personnel];
        const updatedEquipements = [...formData.equipements];
        const updatedSousTraitants = [...formData.sousTraitants];

        conflicts.forEach(conflict => {
            if (conflict.type === 'personnel') {
                const index = updatedPersonnel.indexOf(conflict.resourceId);
                if (index > -1) {
                    updatedPersonnel.splice(index, 1);
                    resolvedCount++;
                }
            } else if (conflict.type === 'equipement') {
                const index = updatedEquipements.indexOf(conflict.resourceId);
                if (index > -1) {
                    updatedEquipements.splice(index, 1);
                    resolvedCount++;
                }
            } else if (conflict.type === 'sousTraitant') {
                const index = updatedSousTraitants.indexOf(conflict.resourceId);
                if (index > -1) {
                    updatedSousTraitants.splice(index, 1);
                    resolvedCount++;
                }
            }
        });

        setFormData(prev => ({
            ...prev,
            personnel: updatedPersonnel,
            equipements: updatedEquipements,
            sousTraitants: updatedSousTraitants
        }));

        addNotification?.(`${resolvedCount} conflit(s) résolu(s)`, 'success');
    };

    // Fonction pour appliquer le personnel à tous les jours
    const applyPersonnelToAllDays = (personnelIds) => {
        if (!personnelIds || personnelIds.length === 0) {
            addNotification?.('Aucun personnel à appliquer', 'warning');
            return;
        }

        const allDays = getAllDays();
        const updatedAssignations = {};
        let appliedCount = 0;

        allDays.forEach(day => {
            if (!day.isWeekend || formData.includeWeekendsInDuration) {
                const availablePersonnel = personnelIds.filter(personnelId => {
                    const conflicts = checkResourceConflicts(personnelId, 'personnel', day.dateString, day.dateString, job?.id);
                    return conflicts.length === 0;
                });

                if (availablePersonnel.length > 0) {
                    updatedAssignations[day.dateString] = {
                        personnel: availablePersonnel,
                        equipements: formData.assignationsParJour[day.dateString]?.equipements || []
                    };
                    appliedCount++;
                }
            }
        });

        setFormData(prev => ({
            ...prev,
            assignationsParJour: {
                ...prev.assignationsParJour,
                ...updatedAssignations
            }
        }));

        addNotification?.(`Personnel appliqué à ${appliedCount} jour(s)`, 'success');
    };

    if (!isOpen) return null;

    return (
        <div className="job-modal-wrapper">
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[98vh] sm:max-h-[95vh] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex-shrink-0 flex items-center justify-between px-3 sm:px-6 py-2 sm:py-4 bg-gray-900 border-b border-gray-700 rounded-t-xl">
                        <div className="flex items-center gap-2 sm:gap-4">
                            <Logo size="normal" showText={false} className="sm:block" />
                            <div>
                                <h2 className="text-base sm:text-xl font-bold text-white">
                                    {job ? 'Modifier le Job' : 'Nouveau Job'}
                                </h2>
                                <p className="text-gray-300 text-xs sm:text-sm hidden sm:block">
                                    Planification des travaux C-Secur360
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg p-1 sm:p-2 transition-colors"
                        >
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Tabs - Responsive comme OLD */}
                    <div className="flex-shrink-0 border-b bg-gray-50 sticky top-0 z-20 shadow-sm">
                        {/* Afficher tous les onglets sur desktop et tablet */}
                        <div className="hidden sm:flex w-full overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('form')}
                                className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                                    activeTab === 'form'
                                        ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                📝 Formulaire
                            </button>
                            <button
                                onClick={() => setActiveTab('gantt')}
                                className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                                    activeTab === 'gantt'
                                        ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                📊 Gantt
                            </button>
                            <button
                                onClick={() => setActiveTab('customization')}
                                className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                                    activeTab === 'customization'
                                        ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                ⚙️ <span className="hidden md:inline">Personnalisation</span> {formData.horaireMode === 'personnalise' ? '✓' : ''}
                            </button>
                            <button
                                onClick={() => setActiveTab('resources')}
                                className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                                    activeTab === 'resources'
                                        ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                👥 Ressources
                            </button>
                            <button
                                onClick={() => setActiveTab('files')}
                                className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                                    activeTab === 'files'
                                        ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                📎 <span className="hidden sm:inline">Fichiers</span> ({(formData.documents?.length || 0) + (formData.photos?.length || 0)})
                            </button>
                            <button
                                onClick={() => setActiveTab('recurrence')}
                                className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                                    activeTab === 'recurrence'
                                        ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                🔄 <span className="hidden md:inline">Récurrence</span> {formData.recurrence?.active ? '✓' : ''}
                            </button>
                        </div>
                        {/* Mode mobile - Menu hamburger avec onglet actif */}
                        <div className="flex sm:hidden w-full items-center border-b-2 border-purple-600 bg-white">
                            <button
                                onClick={() => setActiveTab(activeTab)}
                                className="flex-1 px-4 py-3 font-medium text-purple-600 flex items-center justify-center gap-2"
                            >
                                {activeTab === 'form' && '📝 Formulaire'}
                                {activeTab === 'gantt' && '📊 Gantt'}
                                {activeTab === 'customization' && '⚙️ Personnalisation'}
                                {activeTab === 'resources' && '👥 Ressources'}
                                {activeTab === 'files' && `📎 Fichiers (${(formData.documents?.length || 0) + (formData.photos?.length || 0)})`}
                                {activeTab === 'recurrence' && '🔄 Récurrence'}
                            </button>
                            <div className="relative">
                                <button
                                    onClick={() => setShowMobileTabMenu(!showMobileTabMenu)}
                                    className="px-3 py-3 text-purple-600 hover:bg-purple-50 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>

                                {/* Menu déroulant mobile */}
                                {showMobileTabMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowMobileTabMenu(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-300 rounded-lg shadow-xl z-50 overflow-hidden">
                                            <button
                                                onClick={() => { setActiveTab('form'); setShowMobileTabMenu(false); }}
                                                className={`w-full px-4 py-3 text-left font-medium transition-colors flex items-center gap-2 ${
                                                    activeTab === 'form' ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                📝 Formulaire
                                            </button>
                                            <button
                                                onClick={() => { setActiveTab('gantt'); setShowMobileTabMenu(false); }}
                                                className={`w-full px-4 py-3 text-left font-medium transition-colors flex items-center gap-2 ${
                                                    activeTab === 'gantt' ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                📊 Gantt
                                            </button>
                                            <button
                                                onClick={() => { setActiveTab('customization'); setShowMobileTabMenu(false); }}
                                                className={`w-full px-4 py-3 text-left font-medium transition-colors flex items-center gap-2 ${
                                                    activeTab === 'customization' ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                ⚙️ Personnalisation {formData.horaireMode === 'personnalise' ? '✓' : ''}
                                            </button>
                                            <button
                                                onClick={() => { setActiveTab('resources'); setShowMobileTabMenu(false); }}
                                                className={`w-full px-4 py-3 text-left font-medium transition-colors flex items-center gap-2 ${
                                                    activeTab === 'resources' ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                👥 Ressources
                                            </button>
                                            <button
                                                onClick={() => { setActiveTab('files'); setShowMobileTabMenu(false); }}
                                                className={`w-full px-4 py-3 text-left font-medium transition-colors flex items-center gap-2 ${
                                                    activeTab === 'files' ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                📎 Fichiers ({(formData.documents?.length || 0) + (formData.photos?.length || 0)})
                                            </button>
                                            <button
                                                onClick={() => { setActiveTab('recurrence'); setShowMobileTabMenu(false); }}
                                                className={`w-full px-4 py-3 text-left font-medium transition-colors flex items-center gap-2 ${
                                                    activeTab === 'recurrence' ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                🔄 Récurrence {formData.recurrence?.active ? '✓' : ''}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto">
                        {/* Onglet Formulaire */}
                        {activeTab === 'form' && (
                            <div className="p-3 sm:p-6">
                                {/* ============== UI ALERTES DE CONFLITS ============== */}
                                {currentConflicts.length > 0 && (
                                    <div className="mb-6 space-y-3">
                                        {/* Conflits critiques (équipements hors service) */}
                                        {currentConflicts.filter(c => c.priority === 'critical').length > 0 && (
                                            <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
                                                <div className="flex items-start gap-3">
                                                    <div className="text-red-700 mt-1">🚨</div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-red-900 mb-2">
                                                            Conflits critiques - Action immédiate requise
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {currentConflicts.filter(c => c.priority === 'critical').map((conflict, index) => {
                                                                const resource = (() => {
                                                                    if (conflict.resourceType === 'equipement') {
                                                                        const equipement = equipements.find(e => e.id === conflict.resourceId);
                                                                        return equipement ? equipement.nom : 'Équipement inconnu';
                                                                    }
                                                                    return 'Ressource inconnue';
                                                                })();

                                                                return (
                                                                    <div key={index} className="text-sm text-red-800 font-medium">
                                                                        <strong>{resource}</strong> : {conflict.description}
                                                                        <div className="text-xs text-red-600 ml-4 font-normal">
                                                                            Conflit avec: {conflict.type === 'hors_service' ? 'Équipement hors service' : 'Maintenance'}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Conflits haute priorité (congés approuvés, maintenances) */}
                                        {currentConflicts.filter(c => c.priority === 'high').length > 0 && (
                                            <div className="p-4 bg-orange-50 border border-orange-300 rounded-lg">
                                                <div className="flex items-start gap-3">
                                                    <div className="text-orange-600 mt-1">⚠️</div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-orange-900 mb-2">
                                                            Conflits prioritaires - Personnalisation automatique activée
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {currentConflicts.filter(c => c.priority === 'high').map((conflict, index) => {
                                                                const resource = (() => {
                                                                    if (conflict.resourceType === 'personnel') {
                                                                        const person = personnel.find(p => p.id === conflict.resourceId);
                                                                        return person ? `${person.prenom ? `${person.prenom} ${person.nom}` : person.nom}` : 'Personnel inconnu';
                                                                    } else if (conflict.resourceType === 'equipement') {
                                                                        const equipement = equipements.find(e => e.id === conflict.resourceId);
                                                                        return equipement ? equipement.nom : 'Équipement inconnu';
                                                                    }
                                                                    return 'Ressource inconnue';
                                                                })();

                                                                const conflictIcon = (() => {
                                                                    if (conflict.type === 'conge_approved') return '🏖️';
                                                                    if (conflict.type === 'maintenance') return '🔧';
                                                                    return '⚠️';
                                                                })();

                                                                return (
                                                                    <div key={index} className="text-sm text-orange-800">
                                                                        {conflictIcon} <strong>{resource}</strong> : {conflict.jobNom} du{' '}
                                                                        {formatLocalizedDate(new Date(conflict.dateDebut), currentLanguage, 'short')} au{' '}
                                                                        {formatLocalizedDate(new Date(conflict.dateFin), currentLanguage, 'short')}
                                                                        <div className="text-xs text-orange-600 ml-4">
                                                                            Conflit avec: {conflict.type === 'conge_approved' ? `Congé ${conflict.typeConge}` :
                                                                                          conflict.type === 'maintenance' ? `Maintenance ${conflict.description}` :
                                                                                          'Autre'}
                                                                            {conflict.motif && (
                                                                                <div className="mt-1">Motif: {conflict.motif}</div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        <p className="text-xs text-orange-700 mt-2 font-medium">
                                                            ✅ L'événement a été automatiquement personnalisé pour respecter ces priorités.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Conflits priorité moyenne (demandes de congés en attente) */}
                                        {currentConflicts.filter(c => c.priority === 'medium').length > 0 && (
                                            <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
                                                <div className="flex items-start gap-3">
                                                    <div className="text-blue-600 mt-1">🕒</div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-blue-900 mb-2">
                                                            Demandes de congés en attente d'autorisation
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {currentConflicts.filter(c => c.priority === 'medium').map((conflict, index) => {
                                                                const resource = (() => {
                                                                    if (conflict.resourceType === 'personnel') {
                                                                        const person = personnel.find(p => p.id === conflict.resourceId);
                                                                        return person ? `${person.prenom ? `${person.prenom} ${person.nom}` : person.nom}` : 'Personnel inconnu';
                                                                    }
                                                                    return 'Ressource inconnue';
                                                                })();

                                                                return (
                                                                    <div key={index} className="text-sm text-blue-800">
                                                                        <div className="flex items-center justify-between">
                                                                            <div>
                                                                                🏖️ <strong>{resource}</strong> : {conflict.jobNom} du{' '}
                                                                                {formatLocalizedDate(new Date(conflict.dateDebut), currentLanguage, 'short')} au{' '}
                                                                                {formatLocalizedDate(new Date(conflict.dateFin), currentLanguage, 'short')}
                                                                                <div className="text-xs text-blue-600 ml-4">
                                                                                    Conflit avec: Demande de congé {conflict.typeConge}
                                                                                    {conflict.motif && (
                                                                                        <div className="mt-1">Motif: {conflict.motif}</div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                                                                                En attente
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        <p className="text-xs text-blue-700 mt-2">
                                                            ⏳ Ces demandes doivent être autorisées par un coordonnateur. En cas d'approbation, l'événement sera automatiquement personnalisé.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Conflits normaux (autres événements) */}
                                        {currentConflicts.filter(c => c.priority === 'normal').length > 0 && (
                                            <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                                                <div className="flex items-start gap-3">
                                                    <div className="text-yellow-600 mt-1">⚠️</div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-yellow-900 mb-2">
                                                            Conflits d'événements détectés
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {currentConflicts.filter(c => c.priority === 'normal').map((conflict, index) => {
                                                                const resource = (() => {
                                                                    if (conflict.resourceType === 'personnel') {
                                                                        const person = personnel.find(p => p.id === conflict.resourceId);
                                                                        return person ? `${person.prenom ? `${person.prenom} ${person.nom}` : person.nom} (Personnel)` : 'Personnel inconnu';
                                                                    } else if (conflict.resourceType === 'equipement') {
                                                                        const equipement = equipements.find(e => e.id === conflict.resourceId);
                                                                        return equipement ? `${equipement.nom} (Équipement)` : 'Équipement inconnu';
                                                                    } else if (conflict.resourceType === 'sousTraitant') {
                                                                        const sousTraitant = sousTraitants.find(s => s.id === conflict.resourceId);
                                                                        return sousTraitant ? `${sousTraitant.nom} (Sous-traitant)` : 'Sous-traitant inconnu';
                                                                    }
                                                                    return 'Ressource inconnue';
                                                                })();

                                                                const jobInConflict = jobs.find(j => j.id === conflict.jobId);
                                                                const clientInfo = jobInConflict?.client ? ` - Client: ${jobInConflict.client}` : '';

                                                                return (
                                                                    <div key={index} className="text-sm text-yellow-800">
                                                                        <div className="flex items-start justify-between">
                                                                            <div className="flex-1">
                                                                                📅 <strong>{resource}</strong> est déjà assigné(e) à l'événement{' '}
                                                                                <strong>"{conflict.jobNom}"</strong> du{' '}
                                                                                {formatLocalizedDate(new Date(conflict.dateDebut), currentLanguage, 'short')} au{' '}
                                                                                {formatLocalizedDate(new Date(conflict.dateFin), currentLanguage, 'short')}
                                                                                {clientInfo && (
                                                                                    <div className="text-xs text-yellow-600 ml-4">
                                                                                        Conflit avec: Projet{clientInfo}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            {onOpenConflictJob && jobInConflict && (
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        onClose();
                                                                                        setTimeout(() => {
                                                                                            onOpenConflictJob(jobInConflict);
                                                                                        }, 150);
                                                                                    }}
                                                                                    className="ml-3 px-3 py-1 text-xs bg-yellow-100 text-yellow-800 border border-yellow-300 rounded hover:bg-yellow-200 transition-colors flex items-center gap-1"
                                                                                    title="Ouvrir l'événement en conflit"
                                                                                >
                                                                                    Voir l'événement
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        <p className="text-xs text-yellow-700 mt-2">
                                                            💡 Vérifiez la planification ou utilisez le mode personnalisé pour gérer ces conflits.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {/* Informations de base */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Client *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.client}
                                                onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                placeholder="Nom du client"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nom du Job *
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
                                                        onChange={(e) => setFormData(prev => ({ ...prev, heuresPlanifiees: e.target.value }))}
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
                                                                onChange={(e) => setFormData(prev => ({ ...prev, includeWeekendsInDuration: e.target.checked }))}
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
                                                        onChange={(e) => setFormData(prev => ({ ...prev, modeHoraire: e.target.value }))}
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
                                                            onChange={(e) => setFormData(prev => ({ ...prev, heuresDebutJour: e.target.value }))}
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
                                                            onChange={(e) => setFormData(prev => ({ ...prev, heuresFinJour: e.target.value }))}
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

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Lieu d'intervention
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.lieu}
                                                onChange={(e) => setFormData(prev => ({ ...prev, lieu: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                placeholder="Adresse complète du lieu d'intervention"
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

                                    {/* Section Étapes du projet avec scroll */}
                                    <div
                                        className={`p-4 bg-blue-50 rounded-lg border border-blue-200 transition-all duration-300 ${
                                            expandedSections.etapes ? 'fixed inset-4 z-50 bg-white shadow-2xl' : ''
                                        }`}
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
                                                <div className="jsx-fragment-wrapper">
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
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setExpandedSections(prev => ({
                                                                ...prev,
                                                                etapes: !prev.etapes
                                                            }));
                                                        }}
                                                        className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                                                        title="Agrandir la section"
                                                    >
                                                        <Icon name="chevronDown" size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </h4>

                                        {/* Affichage différent selon l'état d'expansion */}
                                        {expandedSections.etapes ? (
                                            <div className="flex flex-col h-[80vh]">
                                                {/* Header standardisé avec logo */}
                                                <div className="flex items-center gap-4 p-4 bg-gray-900 border-b border-gray-700 rounded-t-lg mb-4 flex-shrink-0">
                                                    <Logo size="normal" showText={false} />
                                                    <div className="flex-1">
                                                        <h3 className="text-xl font-bold text-white">Gestion des étapes du projet</h3>
                                                        <p className="text-sm text-gray-300">Configuration et visualisation Gantt</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
                                                    {/* Colonne gauche - Étapes */}
                                                    <div className="flex flex-col h-full min-h-0 border border-gray-300 rounded-lg bg-white shadow-sm">
                                                        <div className="flex items-center justify-between p-3 border-b bg-gray-50 flex-shrink-0">
                                                            <span className="font-medium text-gray-700">📝 Configuration des étapes</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => addEtape()}
                                                                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                                            >
                                                                <Icon name="plus" size={14} className="mr-1" />
                                                                Ajouter
                                                            </button>
                                                        </div>
                                                    <div className="flex-1 min-h-0 overflow-y-auto p-3">
                                                        {(() => {
                                                            // Fonction pour rendre les étapes avec structure WBS
                                                            // Filtrer et organiser les étapes selon la hiérarchie WBS
                                                            const renderEtapes = (parentId = null, level = 0) => {
                                                                return formData.etapes
                                                                    .filter(etape => etape.parentId === parentId)
                                                                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                                                                    .map((etape, index) => {
                                                                        const globalIndex = formData.etapes.findIndex(e => e.id === etape.id);
                                                                        const hasChildren = formData.etapes.some(e => e.parentId === etape.id);
                                                                        const isCritical = etape.isCritical || formData.criticalPath?.includes(etape.id);

                                                                        return (
                                                                            <div key={etape.id}>
                                                                                {/* Étape principale */}
                                                                                <div
                                                                                    className={`group flex items-center gap-2 p-2 bg-white rounded border hover:shadow-md transition-all ${
                                                                                        expandedSections.etapes ? 'p-3 mb-2' : 'mb-1'
                                                                                    } ${
                                                                                        isCritical ? 'border-red-400 bg-red-50' : 'border-gray-200'
                                                                                    }`}
                                                                                    style={{ marginLeft: level * 20 }}
                                                                                >
                                                                                    {/* Indicateur de hiérarchie et collapse */}
                                                                                    {hasChildren && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => toggleEtapeCollapse(etape.id)}
                                                                                            className="p-1 hover:bg-gray-200 rounded text-gray-600"
                                                                                        >
                                                                                            <Icon name={etape.isCollapsed ? "chevronRight" : "chevronDown"} size={12} />
                                                                                        </button>
                                                                                    )}
                                                                                    {!hasChildren && level > 0 && (
                                                                                        <div className="w-6 h-4 flex items-center justify-center">
                                                                                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Checkbox de completion */}
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={etape.completed || false}
                                                                                        onChange={(e) => updateEtape(globalIndex, 'completed', e.target.checked)}
                                                                                        className="w-4 h-4"
                                                                                    />

                                                                                    {/* Indicateur de priorité */}
                                                                                    <div className={`w-2 h-8 rounded-full ${
                                                                                        etape.priority === 'critical' ? 'bg-red-500' :
                                                                                        etape.priority === 'high' ? 'bg-orange-500' :
                                                                                        etape.priority === 'normal' ? 'bg-blue-500' : 'bg-green-500'
                                                                                    }`} title={`Priorité: ${etape.priority}`}></div>

                                                                                    {/* Nom de l'étape */}
                                                                                    <input
                                                                                        type="text"
                                                                                        value={etape.text || ''}
                                                                                        onChange={(e) => updateEtape(globalIndex, 'text', e.target.value)}
                                                                                        className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                                                                                        placeholder={`Étape ${level > 0 ? `${level}.` : ''}${index + 1}`}
                                                                                    />

                                                                                    {/* Durée */}
                                                                                    <div className="flex items-center gap-1">
                                                                                        <input
                                                                                            type="number"
                                                                                            step="0.25"
                                                                                            min="0.25"
                                                                                            value={etape.duration || 1}
                                                                                            onChange={(e) => updateEtape(globalIndex, 'duration', parseFloat(e.target.value))}
                                                                                            readOnly={etape.autoCalculated}
                                                                                            className={`w-16 p-1 border rounded text-sm ${
                                                                                                etape.autoCalculated
                                                                                                    ? 'bg-blue-50 border-blue-300 text-blue-700 cursor-default'
                                                                                                    : 'focus:ring-2 focus:ring-blue-500'
                                                                                            }`}
                                                                                            title={etape.autoCalculated ? "Durée calculée automatiquement depuis les sous-tâches" : "Durée en heures"}
                                                                                        />
                                                                                        <span className="text-xs text-gray-500">h</span>
                                                                                        {etape.autoCalculated && (
                                                                                            <span
                                                                                                className="text-xs text-blue-600"
                                                                                                title="Calculé automatiquement"
                                                                                            >
                                                                                                📊
                                                                                            </span>
                                                                                        )}
                                                                                    </div>

                                                                                    {/* Progress input et barre */}
                                                                                    {expandedSections.etapes && (
                                                                                        <div className="flex items-center gap-1">
                                                                                            <input
                                                                                                type="number"
                                                                                                min="0"
                                                                                                max="100"
                                                                                                step="5"
                                                                                                value={etape.progress || 0}
                                                                                                onChange={(e) => updateEtape(globalIndex, 'progress', parseInt(e.target.value) || 0)}
                                                                                                className="w-12 p-1 border rounded text-sm text-center focus:ring-2 focus:ring-green-500"
                                                                                                title="Avancement en %"
                                                                                            />
                                                                                            <span className="text-xs text-gray-500">%</span>
                                                                                            <div className="w-16 bg-gray-200 rounded-full h-2">
                                                                                                <div
                                                                                                    className="bg-green-500 h-2 rounded-full transition-all"
                                                                                                    style={{ width: `${etape.progress || 0}%` }}
                                                                                                    title={`${etape.progress || 0}% complété`}
                                                                                                ></div>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Indicateurs d'état */}
                                                                                    {expandedSections.etapes && (
                                                                                        <div className="flex gap-1">
                                                                                            {/* Ressources assignées */}
                                                                                            {(etape.assignedResources?.personnel?.length > 0 ||
                                                                                              etape.assignedResources?.equipements?.length > 0 ||
                                                                                              etape.assignedResources?.equipes?.length > 0) && (
                                                                                                <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded" title="Ressources assignées">
                                                                                                    👥 {(etape.assignedResources?.personnel?.length || 0) +
                                                                                                         (etape.assignedResources?.equipements?.length || 0) +
                                                                                                         (etape.assignedResources?.equipes?.length || 0)}
                                                                                                </span>
                                                                                            )}

                                                                                            {/* Dépendances */}
                                                                                            {etape.dependencies?.length > 0 && (
                                                                                                <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded" title="A des dépendances">
                                                                                                    🔗 {etape.dependencies.length}
                                                                                                </span>
                                                                                            )}

                                                                                            {/* Parallélisme */}
                                                                                            {etape.parallelWith?.length > 0 && (
                                                                                                <span className="text-xs bg-purple-100 text-purple-800 px-1 rounded" title="Tâches parallèles">
                                                                                                    ⚡ {etape.parallelWith.length}
                                                                                                </span>
                                                                                            )}

                                                                                            {/* Chemin critique */}
                                                                                            {isCritical && (
                                                                                                <span className="text-xs bg-red-100 text-red-800 px-1 rounded" title="Chemin critique">
                                                                                                    🎯
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Actions */}
                                                                                    <div className={`flex gap-1 ${
                                                                                        expandedSections.etapes ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                                                    } transition-opacity`}>
                                                                                        {/* Bouton pour ajouter une sous-tâche */}
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => addSubTask(etape.id)}
                                                                                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                                                                            title="Ajouter une sous-tâche"
                                                                                        >
                                                                                            <Icon name="plus" size={12} />
                                                                                        </button>

                                                                                        {/* Bouton de configuration avancée */}
                                                                                        {expandedSections.etapes && (
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => openStepConfigModal(etape.id)}
                                                                                                className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                                                                                                title="Configuration avancée"
                                                                                            >
                                                                                                <Icon name="settings" size={12} />
                                                                                            </button>
                                                                                        )}

                                                                                        {/* Bouton de suppression */}
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => removeEtape(globalIndex)}
                                                                                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                                                            title="Supprimer l'étape"
                                                                                        >
                                                                                            <Icon name="trash" size={12} />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Sous-tâches (récursif) */}
                                                                                {hasChildren && !etape.isCollapsed && (
                                                                                    <div className="ml-4">
                                                                                        {renderEtapes(etape.id, level + 1)}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    });
                                                            };

                                                            // Rendre toutes les étapes en commençant par les racines
                                                            return renderEtapes();
                                                        })()}
                                                    </div>
                                                </div>

                                                {/* Colonne droite - Aperçu Gantt */}
                                                <div className="flex flex-col h-full min-h-0 border border-gray-300 rounded-lg bg-white shadow-sm">
                                                    {formData.etapes && formData.etapes.length > 0 ? (
                                                        <div className="flex flex-col h-full min-h-0">
                                                            <div className="flex items-center justify-between p-3 border-b bg-gray-50 flex-shrink-0">
                                                                <span className="font-medium text-gray-700">📊 Aperçu Gantt</span>
                                                                <div className="text-xs text-gray-500">
                                                                    {formData.etapes.length} étape{formData.etapes.length > 1 ? 's' : ''}
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
                                                                <div className="space-y-1 p-2 inline-block" style={{minWidth: '100%'}}>
                                                                    {(() => {
                                                                        const hierarchicalTasks = generateHierarchicalGanttData();
                                                                        let effectiveViewMode = formData.ganttViewMode || 'auto';
                                                                        const currentViewMode = (effectiveViewMode === 'auto') ? getDefaultViewMode() : effectiveViewMode;
                                                                        const timeScale = generateTimeScale(currentViewMode, ganttViewOffset);

                                                                        return (
                                                                            <div className="jsx-fragment-wrapper">
                                                                                {/* En-tête mini échelle avec vraies heures/dates */}
                                                                                {timeScale.length > 0 && (
                                                                                    <div className="flex text-xs text-gray-500 mb-1 bg-gray-100 sticky top-0 z-20 py-1 border-b">
                                                                                        <div className="w-32 text-left font-medium bg-gray-100 sticky left-0 z-10 border-r border-gray-400 pr-2 flex-shrink-0">Tâche</div>
                                                                                        <div className="flex border-l border-gray-400 flex-shrink-0" style={{ width: `${timeScale.length * 64}px` }}>
                                                                                            {timeScale.map(period => (
                                                                                                <div
                                                                                                    key={period.key}
                                                                                                    className="w-16 text-center border-r border-gray-300 py-0.5 font-medium flex-shrink-0"
                                                                                                    title={currentViewMode === 'weeks' && period.longLabel ? period.longLabel : period.label}
                                                                                                >
                                                                                                    {period.label}
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                        <div className="w-12 text-center font-medium bg-gray-100 sticky right-0 z-10 border-l border-gray-400 pl-1 flex-shrink-0">Dur</div>
                                                                                    </div>
                                                                                )}

                                                                                {/* Barres mini Gantt */}
                                                                                {hierarchicalTasks.map((task, index) => {
                                                                                    const taskPosition = calculateTaskPosition(task, timeScale, currentViewMode, ganttViewOffset);
                                                                                    return (
                                                                                        <div
                                                                                            key={task.id}
                                                                                            className="flex items-center text-xs hover:bg-blue-50 transition-colors py-0.5"
                                                                                        >
                                                                                            <div
                                                                                                className="w-32 truncate text-left bg-white sticky left-0 z-10 border-r border-gray-300 pr-2 flex-shrink-0"
                                                                                                style={{ paddingLeft: `${task.level * 8}px` }}
                                                                                                title={task.displayName || task.text || `Étape ${index + 1}`}
                                                                                            >
                                                                                                <span className="mr-1">
                                                                                                    {task.hasChildren ? '📁' : '📄'}
                                                                                                </span>
                                                                                                <span className={`${task.isCritical ? 'text-red-600 font-medium' : 'text-gray-700'} ${task.hasChildren ? 'font-semibold' : ''}`}>
                                                                                                    {(task.displayName || task.text || `Étape ${index + 1}`).substring(0, 10)}
                                                                                                </span>
                                                                                            </div>

                                                                                            <div className="relative h-4 bg-gray-100 border-l border-gray-400 flex-shrink-0" style={{ width: `${timeScale.length * 64}px` }}>
                                                                                                {(() => {
                                                                                                    // Utiliser la même logique que le Gantt complet qui fonctionne
                                                                                                    const projectStart = new Date(formData.dateDebut || new Date());

                                                                                                    // Calculer la durée de référence selon le mode de vue sélectionné
                                                                                                    let effectiveViewMode = formData.ganttViewMode || 'auto';
                                                                                                    const currentViewMode = (effectiveViewMode === 'auto') ? getDefaultViewMode() : effectiveViewMode;
                                                                                                    const getViewDurationHours = (viewMode) => {
                                                                                                        switch(viewMode) {
                                                                                                            case '6h': return 6;
                                                                                                            case '12h': return 12;
                                                                                                            case '24h': return 24;
                                                                                                            case 'day': return 24;
                                                                                                            case 'week': return 7 * 24;
                                                                                                            case 'month': return 30 * 24;
                                                                                                            case 'year': return 365 * 24;
                                                                                                            default:
                                                                                                                const allTasks = hierarchicalTasks;
                                                                                                                return Math.max(1, allTasks.reduce((maxHours, t) => {
                                                                                                                    const taskEndHours = t.endHours || 0;
                                                                                                                    return Math.max(maxHours, taskEndHours);
                                                                                                                }, 0));
                                                                                                        }
                                                                                                    };

                                                                                                    const totalViewHours = getViewDurationHours(currentViewMode);

                                                                                                    // Position et largeur de cette tâche
                                                                                                    const taskStartHours = task.startHours || 0;
                                                                                                    const taskDurationHours = task.duration || 1;

                                                                                                    const startPercent = Math.max(0, (taskStartHours / totalViewHours) * 100);
                                                                                                    const widthPercent = Math.max(1, (taskDurationHours / totalViewHours) * 100);

                                                                                                    // Utilise le même système de couleurs que le Gantt complet
                                                                                                    const getTaskColors = (task, hierarchicalTasks) => {
                                                                                                        const parentColors = [
                                                                                                            { bg: 'bg-blue-400', hover: 'hover:bg-blue-500' },
                                                                                                            { bg: 'bg-green-400', hover: 'hover:bg-green-500' },
                                                                                                            { bg: 'bg-purple-400', hover: 'hover:bg-purple-500' },
                                                                                                            { bg: 'bg-orange-400', hover: 'hover:bg-orange-500' },
                                                                                                            { bg: 'bg-teal-400', hover: 'hover:bg-teal-500' },
                                                                                                            { bg: 'bg-pink-400', hover: 'hover:bg-pink-500' },
                                                                                                            { bg: 'bg-indigo-400', hover: 'hover:bg-indigo-500' },
                                                                                                            { bg: 'bg-yellow-400', hover: 'hover:bg-yellow-500' }
                                                                                                        ];

                                                                                                        if (task.isCritical) return { bg: 'bg-red-400', hover: 'hover:bg-red-500' };
                                                                                                        if (task.completed) return { bg: 'bg-gray-400', hover: 'hover:bg-gray-500' };

                                                                                                        if (task.parentId) {
                                                                                                            // Trouve le parent racine pour les sous-sous-tâches
                                                                                                            const findRootParent = (taskId) => {
                                                                                                                const parent = hierarchicalTasks.find(t => t.id === taskId);
                                                                                                                if (!parent) return null;
                                                                                                                if (!parent.parentId) return parent;
                                                                                                                return findRootParent(parent.parentId);
                                                                                                            };

                                                                                                            const rootParent = findRootParent(task.parentId);
                                                                                                            if (rootParent) {
                                                                                                                const parentIndex = hierarchicalTasks.filter(t => !t.parentId).findIndex(t => t.id === rootParent.id);
                                                                                                                const colorSet = parentColors[Math.max(0, parentIndex) % parentColors.length];
                                                                                                                return { bg: colorSet.bg.replace('400', '300'), hover: colorSet.hover }; // Plus clair pour les enfants
                                                                                                            }
                                                                                                        } else {
                                                                                                            const parentIndex = hierarchicalTasks.filter(t => !t.parentId).findIndex(t => t.id === task.id);
                                                                                                            return parentColors[Math.max(0, parentIndex) % parentColors.length];
                                                                                                        }

                                                                                                        return parentColors[0]; // Couleur par défaut
                                                                                                    };

                                                                                                    const taskColors = getTaskColors(task, hierarchicalTasks);
                                                                                                    const taskProgress = calculateTaskProgress(task.id, formData.etapes);

                                                                                                    console.log(`🎯 APERÇU [${currentViewMode}] - "${task.text}": ${taskStartHours}h→${taskStartHours + taskDurationHours}h (${startPercent.toFixed(1)}% → ${(startPercent + widthPercent).toFixed(1)}%) [Vue: ${totalViewHours}h] Progress: ${taskProgress}%`);

                                                                                                    return (
                                                                                                        <div
                                                                                                            className="absolute top-0.5 h-3 rounded-sm overflow-hidden"
                                                                                                            style={{
                                                                                                                left: `${startPercent}%`,
                                                                                                                width: `${widthPercent}%`
                                                                                                            }}
                                                                                                            title={`${task.displayName || task.text} - ${task.duration}h (${taskStartHours.toFixed(1)}h → ${(taskStartHours + taskDurationHours).toFixed(1)}h) ${taskProgress}% complété ${task.isCritical ? '(Critique)' : ''}`}
                                                                                                        >
                                                                                                            {/* Barre de fond */}
                                                                                                            <div className={`absolute inset-0 ${taskColors.bg} ${task.hasChildren ? 'opacity-40' : 'opacity-30'} transition-all`} />

                                                                                                            {/* Barre de progression */}
                                                                                                            <div
                                                                                                                className={`absolute top-0 left-0 bottom-0 ${taskColors.bg} ${taskColors.hover} transition-all`}
                                                                                                                style={{ width: `${taskProgress}%` }}
                                                                                                            />
                                                                                                        </div>
                                                                                                    );
                                                                                                })()}
                                                                                            </div>

                                                                                            <div className="w-12 text-center text-gray-600 font-mono bg-white sticky right-0 z-10 border-l border-gray-300 pl-1 flex-shrink-0">
                                                                                                {task.duration}h
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}

                                                                                {hierarchicalTasks.length > 10 && (
                                                                                    <div className="text-center text-xs text-gray-500 py-2 border-t bg-gray-50 mt-2 sticky bottom-0">
                                                                                        Total: {hierarchicalTasks.length} étapes |
                                                                                        Durée totale: {hierarchicalTasks.reduce((sum, task) => sum + (task.duration || 0), 0)}h |
                                                                                        Critiques: {hierarchicalTasks.filter(task => task.isCritical).length}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </div>

                                                            {/* Alerte de dépassement de timeline */}
                                                            {(() => {
                                                                const validation = validateProjectEndDate();
                                                                if (!validation.warnings.length) return null;

                                                                const warning = validation.warnings[0];
                                                                return (
                                                                    <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                                                                        <div className="flex items-start justify-between">
                                                                            <div className="flex items-start gap-2">
                                                                                <div className="text-red-500 mt-0.5">⚠️</div>
                                                                                <div className="flex-1">
                                                                                    <div className="text-sm font-medium text-red-800 mb-1">
                                                                                        Dépassement de délai détecté
                                                                                    </div>
                                                                                    <div className="text-xs text-red-700 mb-2">
                                                                                        {warning.message}
                                                                                    </div>
                                                                                    <div className="text-xs text-red-600 mb-3">
                                                                                        📅 Fin prévue: {validation.projectEnd?.toLocaleDateString('fr-FR')} à {validation.projectEnd?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                                                        <br />
                                                                                        📅 Fin réelle: {validation.timelineEnd?.toLocaleDateString('fr-FR')} à {validation.timelineEnd?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                                                    </div>
                                                                                    <div className="flex flex-wrap gap-1">
                                                                                        {warning.solutions?.map(solution => (
                                                                                            <button
                                                                                                key={solution.type}
                                                                                                onClick={() => applyTimelineSolution(solution.type)}
                                                                                                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                                                                                title={solution.description}
                                                                                            >
                                                                                                {solution.label}
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}

                                                            <div className="mt-2 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setActiveTab('gantt')}
                                                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                                                >
                                                                    🔗 Voir le Gantt complet
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
                                                            <div className="text-center">
                                                                <div className="text-2xl mb-2">📊</div>
                                                                <div className="text-sm">L'aperçu Gantt</div>
                                                                <div className="text-xs mt-1">apparaîtra ici</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        ) : (
                                            <div className="max-h-96 overflow-y-auto space-y-2 mb-3 border rounded-lg p-3 bg-gray-50">
                                                {(() => {
                                                    // Fonction pour rendre les étapes avec structure WBS
                                                    const renderEtapes = (parentId = null, level = 0) => {
                                                        return formData.etapes
                                                            .filter(etape => etape.parentId === parentId)
                                                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                                                            .map((etape, index) => {
                                                                const globalIndex = formData.etapes.findIndex(e => e.id === etape.id);
                                                                const hasChildren = formData.etapes.some(e => e.parentId === etape.id);
                                                                const isCritical = etape.isCritical || formData.criticalPath?.includes(etape.id);

                                                                return (
                                                                    <div key={etape.id}>
                                                                        <div
                                                                            className={`group flex items-center gap-2 p-2 bg-white rounded border hover:shadow-md transition-all mb-1 ${
                                                                                isCritical ? 'border-red-400 bg-red-50' : 'border-gray-200'
                                                                            }`}
                                                                            style={{ marginLeft: level * 20 }}
                                                                        >
                                                                            <input
                                                                                type="text"
                                                                                value={etape.text || ''}
                                                                                onChange={(e) => updateEtape(globalIndex, 'text', e.target.value)}
                                                                                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                                                                                placeholder={`Étape ${level > 0 ? `${level}.` : ''}${index + 1}`}
                                                                            />
                                                                            <input
                                                                                type="number"
                                                                                value={etape.duration || ''}
                                                                                onChange={(e) => updateEtape(globalIndex, 'duration', parseFloat(e.target.value) || 0)}
                                                                                className="w-16 p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                                                                                placeholder="h"
                                                                                min="0"
                                                                                step="0.5"
                                                                            />
                                                                        </div>
                                                                        {!etape.isCollapsed && renderEtapes(etape.id, level + 1)}
                                                                    </div>
                                                                );
                                                            });
                                                    };
                                                    return renderEtapes();
                                                })()}
                                            </div>
                                        )}

                                        {!expandedSections.etapes && (
                                            <div className="jsx-fragment-wrapper">
                                                <button
                                                    type="button"
                                                    onClick={() => addEtape()}
                                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-4"
                                                >
                                                    <Icon name="plus" size={16} className="mr-2" />
                                                    Ajouter une étape
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Section Préparation avec scroll */}
                                    <div
                                        className={`p-4 bg-orange-50 rounded-lg border border-orange-200 transition-all duration-300 ${
                                            expandedSections.preparation ? 'fixed inset-4 z-50 bg-white shadow-2xl' : ''
                                        }`}
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
                                                <div className="jsx-fragment-wrapper">
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
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setExpandedSections(prev => ({
                                                                ...prev,
                                                                preparation: !prev.preparation
                                                            }));
                                                        }}
                                                        className="ml-2 px-2 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors"
                                                        title="Agrandir la section"
                                                    >
                                                        <Icon name="chevronDown" size={14} />
                                                    </button>
</div>
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
                                </div>
                            </div>
                        )}

                        {/* Onglet Gantt */}
                        {activeTab === 'gantt' && (
                            <div className={`${ganttFullscreen ? 'fixed inset-0 z-50 bg-white overflow-auto p-2 sm:p-6' : 'h-full overflow-y-auto p-2 sm:p-6'}`}>
                                <div className="space-y-3 sm:space-y-6">
                                    {/* Header Gantt - Responsive */}
                                    <div className="flex items-center gap-2 sm:gap-4 p-2 sm:p-4 bg-gray-900 rounded-lg">
                                        <Logo size="normal" showText={false} className="hidden sm:block" />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm sm:text-lg font-bold text-white flex items-center truncate">
                                                📊 <span className="hidden sm:inline">Diagramme de Gantt et Chronologie</span>
                                                <span className="sm:hidden">Gantt</span>
                                            </h3>
                                            <p className="text-xs sm:text-sm text-gray-300 truncate">
                                                {formData.etapes.length} tâche{formData.etapes.length > 1 ? 's' : ''} • {getTotalProjectHours()}h
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setGanttFullscreen(!ganttFullscreen)}
                                            className="p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                                        >
                                            {ganttFullscreen ? '🗗' : '🗖'}
                                        </button>
                                    </div>

                                    {/* Contrôles Gantt - Desktop */}
                                    <div className="hidden sm:block bg-gradient-to-r from-gray-700 to-gray-600 p-4 rounded-lg shadow-lg">
                                        {/* Ligne 1: Actions principales */}
                                        <div className="flex items-center gap-2 flex-wrap mb-3">
                                            <button
                                                onClick={addNewTask}
                                                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium flex items-center gap-2"
                                            >
                                                <Icon name="plus" size={16} />
                                                Ajouter tâche
                                            </button>

                                            <div className="h-8 w-px bg-white opacity-30"></div>

                                            <button
                                                onClick={() => {
                                                    const criticalPath = calculateCriticalPath();
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        criticalPath,
                                                        etapes: prev.etapes.map(task => ({
                                                            ...task,
                                                            isCritical: criticalPath.includes(task.id)
                                                        }))
                                                    }));
                                                    addNotification?.(`Chemin critique: ${criticalPath.length} tâche(s)`, 'info');
                                                }}
                                                className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2 text-sm"
                                            >
                                                🎯 Calculer critique
                                            </button>

                                            <button
                                                onClick={saveBaseline}
                                                className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2 text-sm"
                                            >
                                                💾 Référence
                                            </button>

                                            <button
                                                onClick={printGanttAndForms}
                                                className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2 text-sm"
                                            >
                                                🖨️ Imprimer
                                            </button>
                                        </div>

                                        {/* Ligne 2: Vue et modes */}
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                                                <span className="text-xs text-white font-medium">Vue:</span>
                                                <select
                                                    value={formData.ganttViewMode || getDefaultViewMode()}
                                                    onChange={(e) => updateField('ganttViewMode', e.target.value)}
                                                    className="bg-gray-900 text-white text-sm rounded px-2 py-1 font-medium border border-gray-600"
                                                >
                                                    <option value="auto">🎯 Auto (Adaptatif)</option>
                                                    <option value="6h">⏰ 6 heures</option>
                                                    <option value="12h">🕐 12 heures</option>
                                                    <option value="24h">🕛 24 heures</option>
                                                    <option value="day">📅 Jour</option>
                                                    <option value="week">📋 Semaine</option>
                                                    <option value="month">🗓️ Mois</option>
                                                </select>
                                            </div>

                                            <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                                                <span className="text-xs text-white font-medium">📆 Date:</span>
                                                <input
                                                    type="date"
                                                    value={formData.dateDebut || ''}
                                                    onChange={(e) => updateField('dateDebut', e.target.value)}
                                                    className="bg-gray-900 text-white text-sm rounded px-2 py-1 font-medium border border-gray-600"
                                                />
                                            </div>

                                            {/* Navigation temporelle pour gros événements */}
                                            {(() => {
                                                const totalHours = formData.etapes.reduce((sum, e) => sum + (e.duration || 0), 0);
                                                // Afficher seulement pour événements > 24h
                                                if (totalHours > 24) {
                                                    return (
                                                        <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-2 py-1">
                                                            <button
                                                                onClick={() => setGanttViewOffset(Math.max(0, ganttViewOffset - 1))}
                                                                className="px-2 py-1 text-white hover:bg-gray-700 rounded text-sm"
                                                                title="Période précédente"
                                                            >
                                                                ◀
                                                            </button>
                                                            <span className="text-xs text-white px-1">
                                                                {ganttViewOffset > 0 ? `+${ganttViewOffset}` : 'Début'}
                                                            </span>
                                                            <button
                                                                onClick={() => setGanttViewOffset(ganttViewOffset + 1)}
                                                                className="px-2 py-1 text-white hover:bg-gray-700 rounded text-sm"
                                                                title="Période suivante"
                                                            >
                                                                ▶
                                                            </button>
                                                            {ganttViewOffset > 0 && (
                                                                <button
                                                                    onClick={() => setGanttViewOffset(0)}
                                                                    className="px-2 py-1 text-xs text-white hover:bg-gray-700 rounded ml-1"
                                                                    title="Retour au début"
                                                                >
                                                                    ⏮
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}

                                            <button
                                                onClick={() => updateField('showCriticalPath', !formData.showCriticalPath)}
                                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                                    formData.showCriticalPath
                                                        ? 'bg-red-600 text-white font-medium'
                                                        : 'bg-gray-800 text-white hover:bg-gray-900'
                                                }`}
                                            >
                                                🚨 {formData.showCriticalPath ? 'Critique ACTIVÉ' : 'Critique'}
                                            </button>

                                            <button
                                                onClick={() => setGanttCompactMode(!ganttCompactMode)}
                                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                                    ganttCompactMode
                                                        ? 'bg-purple-600 text-white font-medium'
                                                        : 'bg-gray-800 text-white hover:bg-gray-900'
                                                }`}
                                            >
                                                📄 {ganttCompactMode ? 'Normal' : 'Compact'}
                                            </button>

                                            <button
                                                onClick={toggleGanttFullscreen}
                                                className="px-3 py-1.5 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                                            >
                                                {ganttFullscreen ? '🗗 Quitter plein écran' : '⛶ Plein écran'}
                                            </button>

                                            <div className="ml-auto text-xs text-white bg-gray-800 px-3 py-1.5 rounded-lg">
                                                {formData.etapes.length} tâche{formData.etapes.length > 1 ? 's' : ''} • {getTotalProjectHours()}h total
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contrôles Gantt - Mobile */}
                                    <div className="sm:hidden">
                                        <div className="bg-gradient-to-r from-gray-700 to-gray-600 p-3 rounded-lg shadow-lg">
                                            <div className="flex items-center gap-2">
                                                {/* Bouton principal: Ajouter tâche */}
                                                <button
                                                    onClick={addNewTask}
                                                    className="flex-1 px-3 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium flex items-center justify-center gap-2 touch-manipulation active:scale-95"
                                                >
                                                    <Icon name="plus" size={16} />
                                                    <span className="text-sm">Ajouter</span>
                                                </button>

                                                {/* Menu hamburger pour autres contrôles */}
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setShowGanttMenu(!showGanttMenu)}
                                                        className="px-3 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors touch-manipulation active:scale-95"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                                        </svg>
                                                    </button>

                                                    {showGanttMenu && (
                                                        <>
                                                            <div className="fixed inset-0 z-40" onClick={() => setShowGanttMenu(false)} />
                                                            <div className="absolute right-0 top-full mt-2 w-72 bg-white border rounded-lg shadow-xl z-50 max-h-[70vh] overflow-y-auto">
                                                                {/* Vue et Date */}
                                                                <div className="p-3 border-b bg-gray-50">
                                                                    <div className="text-xs font-medium text-gray-600 mb-2">Vue Gantt</div>
                                                                    <select
                                                                        value={formData.ganttViewMode || getDefaultViewMode()}
                                                                        onChange={(e) => updateField('ganttViewMode', e.target.value)}
                                                                        className="w-full px-3 py-2 bg-white border rounded-lg text-sm mb-2"
                                                                    >
                                                                        <option value="auto">🎯 Auto (Adaptatif)</option>
                                                                        <option value="6h">⏰ 6 heures</option>
                                                                        <option value="12h">🕐 12 heures</option>
                                                                        <option value="24h">🕛 24 heures</option>
                                                                        <option value="day">📅 Jour</option>
                                                                        <option value="week">📋 Semaine</option>
                                                                        <option value="month">🗓️ Mois</option>
                                                                    </select>
                                                                    <input
                                                                        type="date"
                                                                        value={formData.dateDebut || ''}
                                                                        onChange={(e) => updateField('dateDebut', e.target.value)}
                                                                        className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                                                                    />
                                                                </div>

                                                                {/* Actions */}
                                                                <button
                                                                    onClick={() => {
                                                                        const criticalPath = calculateCriticalPath();
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            criticalPath,
                                                                            etapes: prev.etapes.map(task => ({
                                                                                ...task,
                                                                                isCritical: criticalPath.includes(task.id)
                                                                            }))
                                                                        }));
                                                                        addNotification?.(`Chemin critique: ${criticalPath.length} tâche(s)`, 'info');
                                                                        setShowGanttMenu(false);
                                                                    }}
                                                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b flex items-center gap-3"
                                                                >
                                                                    <span>🎯</span>
                                                                    <span className="text-sm font-medium">Calculer chemin critique</span>
                                                                </button>

                                                                <button
                                                                    onClick={() => {
                                                                        updateField('showCriticalPath', !formData.showCriticalPath);
                                                                        setShowGanttMenu(false);
                                                                    }}
                                                                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b flex items-center gap-3 ${formData.showCriticalPath ? 'bg-red-50' : ''}`}
                                                                >
                                                                    <span>🚨</span>
                                                                    <span className="text-sm font-medium">
                                                                        {formData.showCriticalPath ? 'Masquer chemin critique' : 'Afficher chemin critique'}
                                                                    </span>
                                                                </button>

                                                                <button
                                                                    onClick={() => {
                                                                        setGanttCompactMode(!ganttCompactMode);
                                                                        setShowGanttMenu(false);
                                                                    }}
                                                                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b flex items-center gap-3 ${ganttCompactMode ? 'bg-purple-50' : ''}`}
                                                                >
                                                                    <span>📄</span>
                                                                    <span className="text-sm font-medium">
                                                                        Mode {ganttCompactMode ? 'Normal' : 'Compact'}
                                                                    </span>
                                                                </button>

                                                                <button
                                                                    onClick={() => {
                                                                        saveBaseline();
                                                                        setShowGanttMenu(false);
                                                                    }}
                                                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b flex items-center gap-3"
                                                                >
                                                                    <span>💾</span>
                                                                    <span className="text-sm font-medium">Enregistrer référence</span>
                                                                </button>

                                                                <button
                                                                    onClick={() => {
                                                                        toggleGanttFullscreen();
                                                                        setShowGanttMenu(false);
                                                                    }}
                                                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b flex items-center gap-3"
                                                                >
                                                                    <span>{ganttFullscreen ? '🗗' : '⛶'}</span>
                                                                    <span className="text-sm font-medium">
                                                                        {ganttFullscreen ? 'Quitter plein écran' : 'Plein écran'}
                                                                    </span>
                                                                </button>

                                                                <button
                                                                    onClick={() => {
                                                                        printGanttAndForms();
                                                                        setShowGanttMenu(false);
                                                                    }}
                                                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
                                                                >
                                                                    <span>🖨️</span>
                                                                    <span className="text-sm font-medium">Imprimer</span>
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vue Gantt avancée avec hiérarchie - AVEC SCROLL CONTENEUR */}
                                    <div className={`bg-white border rounded-lg ${ganttFullscreen ? 'h-[calc(100vh-250px)]' : 'h-[400px] sm:h-[600px]'} ${ganttCompactMode ? 'print:overflow-visible print:max-h-none' : ''} overflow-auto`}>
                                        {formData.etapes.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                <div className="text-5xl mb-4 opacity-50">📊</div>
                                                <p>Ajoutez des étapes au projet pour voir le diagramme de Gantt</p>
                                            </div>
                                        ) : (() => {
                                            console.log(`🔍 DEBUG GANTT - Mode plein écran: ${ganttFullscreen}, Nombre d'étapes: ${formData.etapes.length}`, formData.etapes);
                                            const hierarchicalTasks = generateHierarchicalGanttData();
                                            const dependencyArrows = renderDependencyArrows(hierarchicalTasks);
                                            console.log(`🔍 DEBUG GANTT - Tâches générées:`, hierarchicalTasks);

                                            return (
                                                <div className="p-4 min-w-max">{/* min-w-max permet le scroll horizontal */}
                                                    {/* En-tête du timeline */}
                                                    <div className="flex items-center mb-4 pb-2 border-b">
                                                        <div className="w-1/3 font-medium text-gray-700">
                                                            Tâches hiérarchiques
                                                        </div>
                                                        <div className="flex-1 text-center font-medium text-gray-700">
                                                            Timeline ({(() => {
                                                                const mode = formData.ganttViewMode || getDefaultViewMode();
                                                                const modeLabels = {
                                                                    '6h': '6 heures',
                                                                    '12h': '12 heures',
                                                                    '24h': '24 heures',
                                                                    'day': 'Jours',
                                                                    'week': 'Semaines',
                                                                    'month': 'Mois',
                                                                    'year': 'Années'
                                                                };
                                                                return modeLabels[mode] || mode;
                                                            })()})
                                                        </div>
                                                        <div className="w-20 text-center font-medium text-gray-700">
                                                            Durée
                                                        </div>
                                                    </div>

                                                    {/* Grille de l'échelle de temps avec vraies heures/dates */}
                                                    {(() => {
                                                        let effectiveViewMode = formData.ganttViewMode || 'auto';
                                                        const currentViewMode = (effectiveViewMode === 'auto') ? getDefaultViewMode() : effectiveViewMode;
                                                        const timeScale = generateTimeScale(currentViewMode, ganttViewOffset);
                                                        if (timeScale.length > 0) {
                                                            return (
                                                                <div className="flex items-center mb-2 text-xs text-gray-600 border-b pb-1">
                                                                    <div className="w-1/3 flex-shrink-0"></div>
                                                                    <div className="flex-1 flex overflow-x-auto">
                                                                        <div className="flex" style={{ minWidth: '100%' }}>
                                                                            {timeScale.map(period => (
                                                                                <div
                                                                                    key={period.key}
                                                                                    className="text-center border-r border-gray-200 py-1 flex-shrink-0"
                                                                                    style={{
                                                                                        width: `${100 / timeScale.length}%`,
                                                                                        minWidth: '80px'
                                                                                    }}
                                                                                    title={currentViewMode === 'weeks' && period.longLabel ? period.longLabel : period.label}
                                                                                >
                                                                                    {period.label}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-20 flex-shrink-0"></div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}

                                                    {/* SVG pour les flèches de dépendances */}
                                                    <div className="relative">
                                                        <svg
                                                            className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
                                                            style={{ height: `${hierarchicalTasks.length * 40 + 20}px` }}
                                                        >
                                                            {dependencyArrows.map((arrow, index) => {
                                                                const fromY = arrow.from * 40 + 20;
                                                                const toY = arrow.to * 40 + 20;
                                                                const startX = '33.33%';
                                                                const endX = '33.33%';

                                                                return (
                                                                    <g key={index}>
                                                                        <defs>
                                                                            <marker
                                                                                id={`arrowhead-${index}`}
                                                                                markerWidth="8"
                                                                                markerHeight="6"
                                                                                refX="7"
                                                                                refY="3"
                                                                                orient="auto"
                                                                            >
                                                                                <polygon
                                                                                    points="0 0, 8 3, 0 6"
                                                                                    fill="#6366f1"
                                                                                />
                                                                            </marker>
                                                                        </defs>
                                                                        <path
                                                                            d={`M ${startX} ${fromY} Q ${startX} ${(fromY + toY) / 2} ${endX} ${toY}`}
                                                                            stroke="#6366f1"
                                                                            strokeWidth="2"
                                                                            fill="none"
                                                                            markerEnd={`url(#arrowhead-${index})`}
                                                                            opacity="0.7"
                                                                        />
                                                                        <text
                                                                            x={startX}
                                                                            y={(fromY + toY) / 2}
                                                                            fill="#6366f1"
                                                                            fontSize="10"
                                                                            textAnchor="middle"
                                                                        >
                                                                            {arrow.type}
                                                                        </text>
                                                                    </g>
                                                                );
                                                            })}
                                                        </svg>

                                                        {/* Tâches hiérarchiques */}
                                                        {hierarchicalTasks.map((task, index) => (
                                                            <div
                                                                key={task.id}
                                                                className={`flex items-center space-x-3 ${ganttCompactMode ? 'p-1' : 'p-2'} border-b hover:bg-gray-50 transition-all ${
                                                                    task.isCritical ? 'bg-red-50 border-red-200' : ''
                                                                }`}
                                                                style={{ height: ganttCompactMode ? '24px' : '38px' }}
                                                            >
                                                                {/* Nom de la tâche avec hiérarchie - ÉDITABLE */}
                                                                <div
                                                                    className={`w-1/3 ${ganttCompactMode ? 'text-xs' : 'text-sm'} font-medium flex items-center gap-1 group`}
                                                                    style={{ paddingLeft: `${task.indent}px` }}
                                                                >
                                                                    {/* Checkbox de completion */}
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={task.completed || false}
                                                                        onChange={(e) => {
                                                                            const etapeIndex = formData.etapes.findIndex(et => et.id === task.id);
                                                                            if (etapeIndex !== -1) {
                                                                                updateEtape(etapeIndex, 'completed', e.target.checked);
                                                                            }
                                                                        }}
                                                                        className="w-3 h-3 flex-shrink-0"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />

                                                                    <span className={`${ganttCompactMode ? 'mr-1 text-xs' : 'mr-1'} flex-shrink-0`}>
                                                                        {task.hasChildren ? '📁' : '📄'}
                                                                    </span>

                                                                    {editingGanttTask === task.id ? (
                                                                        <input
                                                                            type="text"
                                                                            value={task.text || ''}
                                                                            onChange={(e) => {
                                                                                const etapeIndex = formData.etapes.findIndex(et => et.id === task.id);
                                                                                if (etapeIndex !== -1) {
                                                                                    updateEtape(etapeIndex, 'text', e.target.value);
                                                                                }
                                                                            }}
                                                                            onBlur={() => setEditingGanttTask(null)}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') setEditingGanttTask(null);
                                                                                if (e.key === 'Escape') setEditingGanttTask(null);
                                                                            }}
                                                                            autoFocus
                                                                            className="flex-1 px-1 py-0.5 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        />
                                                                    ) : (
                                                                        <span
                                                                            className={`${task.hasChildren ? 'font-bold' : ''} ${task.isCritical ? 'text-red-700' : ''} truncate flex-1 cursor-pointer hover:text-blue-600`}
                                                                            onDoubleClick={() => setEditingGanttTask(task.id)}
                                                                            title="Double-cliquer pour éditer"
                                                                        >
                                                                            {task.displayName || task.text || `Étape ${task.order + 1}`}
                                                                        </span>
                                                                    )}

                                                                    {task.autoCalculated && (
                                                                        <span className="text-xs text-blue-600 flex-shrink-0" title="Durée calculée automatiquement">
                                                                            📊
                                                                        </span>
                                                                    )}

                                                                    {/* Boutons d'action - visibles au survol */}
                                                                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                addSubTask(task.id);
                                                                            }}
                                                                            className="p-0.5 text-blue-600 hover:bg-blue-100 rounded text-xs"
                                                                            title="Ajouter une sous-tâche"
                                                                        >
                                                                            <Icon name="plus" size={10} />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                openStepConfigModal(task.id);
                                                                            }}
                                                                            className="p-0.5 text-purple-600 hover:bg-purple-100 rounded text-xs"
                                                                            title="Configuration avancée"
                                                                        >
                                                                            <Icon name="settings" size={10} />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                const etapeIndex = formData.etapes.findIndex(et => et.id === task.id);
                                                                                if (etapeIndex !== -1) {
                                                                                    removeEtape(etapeIndex);
                                                                                }
                                                                            }}
                                                                            className="p-0.5 text-red-600 hover:bg-red-100 rounded text-xs"
                                                                            title="Supprimer l'étape"
                                                                        >
                                                                            <Icon name="trash" size={10} />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Barre de Gantt avec échelle de temps réaliste */}
                                                                <div className={`flex-1 relative ${ganttCompactMode ? 'h-4' : 'h-6'} bg-gray-100 rounded-sm border`}>
                                                                    {(() => {
                                                                        // Calcul simple basé sur les dates calculées
                                                                        const projectStart = new Date(formData.dateDebut || new Date());

                                                                        // Calculer la durée de référence selon le mode de vue sélectionné
                                                                        let effectiveViewMode = formData.ganttViewMode || 'auto';
                                                                        const currentViewMode = (effectiveViewMode === 'auto') ? getDefaultViewMode() : effectiveViewMode;
                                                                        const getViewDurationHours = (viewMode) => {
                                                                            switch(viewMode) {
                                                                                case '6h': return 6;
                                                                                case '12h': return 12;
                                                                                case '24h': return 24;
                                                                                case 'day': return 24; // 1 jour
                                                                                case 'week': return 7 * 24; // 1 semaine = 168h
                                                                                case 'month': return 30 * 24; // 1 mois = 720h
                                                                                case 'year': return 365 * 24; // 1 année = 8760h
                                                                                default:
                                                                                    // Mode automatique : utilise la durée réelle du projet
                                                                                    const allTasks = hierarchicalTasks;
                                                                                    return Math.max(1, allTasks.reduce((maxHours, t) => {
                                                                                        const taskEndHours = t.endHours || 0;
                                                                                        return Math.max(maxHours, taskEndHours);
                                                                                    }, 0));
                                                                            }
                                                                        };

                                                                        const totalViewHours = getViewDurationHours(currentViewMode);

                                                                        // Position et largeur de cette tâche - utiliser les heures calculées directement avec offset
                                                                        const taskStartHours = task.startHours || 0;
                                                                        const taskDurationHours = task.duration || 1;

                                                                        // Appliquer l'offset selon le mode de vue
                                                                        let windowOffsetHours = 0;
                                                                        switch(currentViewMode) {
                                                                            case '6h': windowOffsetHours = ganttViewOffset * 6; break;
                                                                            case '12h': windowOffsetHours = ganttViewOffset * 12; break;
                                                                            case '24h': windowOffsetHours = ganttViewOffset * 24; break;
                                                                            case 'day': windowOffsetHours = ganttViewOffset * 7 * 24; break; // fenêtre de 7 jours
                                                                            case 'week': windowOffsetHours = ganttViewOffset * 4 * 7 * 24; break; // fenêtre de 4 semaines
                                                                            case 'month': windowOffsetHours = ganttViewOffset * 6 * 30 * 24; break; // fenêtre de 6 mois
                                                                            case 'year': windowOffsetHours = ganttViewOffset * 3 * 365 * 24; break; // fenêtre de 3 ans
                                                                            default: windowOffsetHours = 0;
                                                                        }

                                                                        const adjustedStartHours = taskStartHours - windowOffsetHours;
                                                                        const startPercent = Math.max(0, (adjustedStartHours / totalViewHours) * 100);
                                                                        const widthPercent = Math.max(1, (taskDurationHours / totalViewHours) * 100);

                                                                        // Système de couleurs pour les parents et leurs enfants
                                                                        const getTaskColors = (task, hierarchicalTasks) => {
                                                                            const parentColors = [
                                                                                { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', light: 'bg-blue-400' },
                                                                                { bg: 'bg-green-500', hover: 'hover:bg-green-600', light: 'bg-green-400' },
                                                                                { bg: 'bg-purple-500', hover: 'hover:bg-purple-600', light: 'bg-purple-400' },
                                                                                { bg: 'bg-orange-500', hover: 'hover:bg-orange-600', light: 'bg-orange-400' },
                                                                                { bg: 'bg-teal-500', hover: 'hover:bg-teal-600', light: 'bg-teal-400' },
                                                                                { bg: 'bg-pink-500', hover: 'hover:bg-pink-600', light: 'bg-pink-400' },
                                                                                { bg: 'bg-indigo-500', hover: 'hover:bg-indigo-600', light: 'bg-indigo-400' },
                                                                                { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', light: 'bg-yellow-400' }
                                                                            ];

                                                                            if (task.isCritical) {
                                                                                return { bg: 'bg-red-500', hover: 'hover:bg-red-600', light: 'bg-red-400' };
                                                                            }

                                                                            if (task.completed) {
                                                                                return { bg: 'bg-gray-500', hover: 'hover:bg-gray-600', light: 'bg-gray-400' };
                                                                            }

                                                                            if (task.parentId) {
                                                                                // C'est une sous-tâche : trouve le parent racine pour la couleur
                                                                                const findRootParent = (taskId) => {
                                                                                    const parent = hierarchicalTasks.find(t => t.id === taskId);
                                                                                    if (!parent) return null;
                                                                                    if (!parent.parentId) return parent; // C'est une racine
                                                                                    return findRootParent(parent.parentId); // Récursif pour sous-sous-tâches
                                                                                };

                                                                                const rootParent = findRootParent(task.parentId);
                                                                                if (rootParent) {
                                                                                    const parentIndex = hierarchicalTasks.filter(t => !t.parentId).findIndex(t => t.id === rootParent.id);
                                                                                    const colorSet = parentColors[parentIndex % parentColors.length];
                                                                                    return { bg: colorSet.light, hover: colorSet.hover, light: colorSet.light }; // Couleur plus claire pour les enfants
                                                                                }
                                                                            } else {
                                                                                // C'est un parent : attribue une couleur selon son index
                                                                                const parentIndex = hierarchicalTasks.filter(t => !t.parentId).findIndex(t => t.id === task.id);
                                                                                return parentColors[parentIndex % parentColors.length];
                                                                            }

                                                                            return parentColors[0]; // Couleur par défaut
                                                                        };

                                                                        const taskColors = getTaskColors(task, hierarchicalTasks);
                                                                        const taskProgress = calculateTaskProgress(task.id, formData.etapes);

                                                                        console.log(`🎯 RENDER [${currentViewMode}] - "${task.text}": ${taskStartHours}h→${taskStartHours + taskDurationHours}h (${startPercent.toFixed(1)}% → ${(startPercent + widthPercent).toFixed(1)}%) [Vue: ${totalViewHours}h] Progress: ${taskProgress}%`);

                                                                        return (
                                                                            <div
                                                                                className="absolute top-0 h-full rounded-sm overflow-hidden"
                                                                                style={{
                                                                                    left: `${startPercent}%`,
                                                                                    width: `${widthPercent}%`
                                                                                }}
                                                                                title={`${task.displayName} - ${task.duration}h (${taskStartHours.toFixed(1)}h → ${(taskStartHours + taskDurationHours).toFixed(1)}h) ${taskProgress}% complété ${task.isCritical ? '(Critique)' : ''}`}
                                                                            >
                                                                                {/* Barre de fond (couleur principale) */}
                                                                                <div className={`absolute inset-0 ${taskColors.bg} ${task.hasChildren ? 'opacity-40' : 'opacity-30'} transition-all`} />

                                                                                {/* Barre de progression (avancement réel) */}
                                                                                <div
                                                                                    className={`absolute top-0 left-0 bottom-0 ${taskColors.bg} ${taskColors.hover} transition-all`}
                                                                                    style={{ width: `${taskProgress}%` }}
                                                                                />

                                                                                {/* Texte % (affiché si barre assez large) */}
                                                                                {widthPercent > 8 && (
                                                                                    <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold drop-shadow-lg">
                                                                                        {taskProgress}%
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );

                                                                    })()}

                                                                    {/* Indicateurs de dépendances */}
                                                                    {task.dependencies?.length > 0 && (
                                                                        <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 z-20">
                                                                            <div className="w-3 h-3 bg-indigo-500 rounded-full text-xs text-white flex items-center justify-center border border-white">
                                                                                {task.dependencies.length}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Durée - ÉDITABLE */}
                                                                <div className={`${ganttCompactMode ? 'w-24' : 'w-32'} ${ganttCompactMode ? 'text-xs' : 'text-xs'} text-gray-600 flex flex-col items-center justify-center gap-0.5 px-1`}>
                                                                    <div className="flex items-center gap-1">
                                                                        <input
                                                                            type="number"
                                                                            step="0.25"
                                                                            min="0.25"
                                                                            value={task.duration || 1}
                                                                            onChange={(e) => {
                                                                                const etapeIndex = formData.etapes.findIndex(et => et.id === task.id);
                                                                                if (etapeIndex !== -1) {
                                                                                    updateEtape(etapeIndex, 'duration', parseFloat(e.target.value));
                                                                                }
                                                                            }}
                                                                            readOnly={task.autoCalculated}
                                                                            className={`w-12 p-0.5 border rounded text-xs text-center ${
                                                                                task.autoCalculated
                                                                                    ? 'bg-blue-50 border-blue-300 text-blue-700 cursor-default'
                                                                                    : 'focus:ring-1 focus:ring-blue-500'
                                                                            }`}
                                                                            title={task.autoCalculated ? "Durée calculée automatiquement depuis les sous-tâches" : "Durée en heures"}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        />
                                                                        <span className="text-xs">h</span>
                                                                    </div>
                                                                    {!ganttCompactMode && (
                                                                        <div className="flex items-center gap-1 w-full">
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                max="100"
                                                                                step="5"
                                                                                value={task.progress || 0}
                                                                                onChange={(e) => {
                                                                                    const etapeIndex = formData.etapes.findIndex(et => et.id === task.id);
                                                                                    if (etapeIndex !== -1) {
                                                                                        updateEtape(etapeIndex, 'progress', parseInt(e.target.value) || 0);
                                                                                    }
                                                                                }}
                                                                                className="w-10 p-0.5 border rounded text-xs text-center focus:ring-1 focus:ring-green-500"
                                                                                title="Avancement en %"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            />
                                                                            <span className="text-xs">%</span>
                                                                        </div>
                                                                    )}
                                                                    {task.hasChildren && !ganttCompactMode && (
                                                                        <div className="text-xs text-gray-400">
                                                                            ({formData.etapes.filter(e => e.parentId === task.id).length} sub)
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Alerte de dépassement de timeline dans Gantt principal - VERSION OLD */}
                                    {(() => {
                                        const validation = validateProjectEndDate();
                                        if (!validation.warnings.length) return null;

                                        const warning = validation.warnings[0];
                                        return (
                                            <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="text-red-400 text-2xl">
                                                        ⚠️
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-lg font-medium text-red-800 mb-2">
                                                            ⚠️ Dépassement de délai détecté
                                                        </h4>
                                                        <p className="text-sm text-red-700 mb-3">
                                                            {warning.message}
                                                        </p>
                                                        <div className="bg-red-100 rounded-lg p-3 mb-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                                <div>
                                                                    <span className="font-medium text-red-800">📅 Date de fin prévue :</span>
                                                                    <br />
                                                                    <span className="text-red-700">
                                                                        {validation.projectEnd?.toLocaleDateString('fr-FR')} à {validation.projectEnd?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium text-red-800">📅 Date de fin réelle :</span>
                                                                    <br />
                                                                    <span className="text-red-700 font-medium">
                                                                        {validation.timelineEnd?.toLocaleDateString('fr-FR')} à {validation.timelineEnd?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {warning.solutions?.map(solution => (
                                                                <button
                                                                    key={solution.type}
                                                                    onClick={() => applyTimelineSolution(solution.type)}
                                                                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                                                                    title={solution.description}
                                                                >
                                                                    {solution.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Statistiques avancées - Responsive */}
                                    {formData.etapes.length > 0 && (
                                        <div className="mt-3 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 text-xs sm:text-sm">
                                            <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
                                                <div className="font-medium text-blue-800 text-xs sm:text-sm">📋 <span className="hidden sm:inline">Total </span>Tâches</div>
                                                <div className="text-blue-600 text-base sm:text-lg font-bold">{formData.etapes.length}</div>
                                            </div>
                                            <div className="bg-green-50 p-2 sm:p-3 rounded-lg">
                                                <div className="font-medium text-green-800 text-xs sm:text-sm">✅ <span className="hidden sm:inline">Complétées</span><span className="sm:hidden">OK</span></div>
                                                <div className="text-green-600 text-base sm:text-lg font-bold">
                                                    {formData.etapes.filter(t => t.completed).length}
                                                </div>
                                            </div>
                                            <div className="bg-yellow-50 p-2 sm:p-3 rounded-lg">
                                                <div className="font-medium text-yellow-800 text-xs sm:text-sm">⏰ <span className="hidden sm:inline">Durée</span><span className="sm:hidden">Temps</span></div>
                                                <div className="text-yellow-600 text-base sm:text-lg font-bold">
                                                    {formData.etapes.reduce((sum, t) => sum + (t.duration || 0), 0)}h
                                                </div>
                                            </div>
                                            <div className="bg-purple-50 p-2 sm:p-3 rounded-lg">
                                                <div className="font-medium text-purple-800 text-xs sm:text-sm">📊 <span className="hidden sm:inline">Progression</span><span className="sm:hidden">%</span></div>
                                                <div className="text-purple-600 text-base sm:text-lg font-bold">
                                                    {formData.etapes.length > 0
                                                        ? Math.round((formData.etapes.filter(t => t.completed).length / formData.etapes.length) * 100)
                                                        : 0}%
                                                </div>
                                            </div>
                                            <div className="bg-red-50 p-2 sm:p-3 rounded-lg">
                                                <div className="font-medium text-red-800 text-xs sm:text-sm">🚨 <span className="hidden sm:inline">Critiques</span><span className="sm:hidden">!</span></div>
                                                <div className="text-red-600 text-base sm:text-lg font-bold">
                                                    {formData.etapes.filter(t => t.isCritical).length}
                                                </div>
                                            </div>
                                            <div className="bg-indigo-50 p-2 sm:p-3 rounded-lg">
                                                <div className="font-medium text-indigo-800 text-xs sm:text-sm">🔗 <span className="hidden sm:inline">Dépendances</span><span className="sm:hidden">Liens</span></div>
                                                <div className="text-indigo-600 text-base sm:text-lg font-bold">
                                                    {formData.etapes.reduce((sum, t) => sum + (t.dependencies?.length || 0), 0)}
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

                                    {/* Gestion des Équipes */}
                                    <div className="bg-white border rounded-lg overflow-hidden">
                                        <div className="bg-orange-50 p-4 border-b">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium text-orange-800 flex items-center gap-2">
                                                    💼 Équipes ({formData.equipes?.length || 0} équipe{(formData.equipes?.length || 0) > 1 ? 's' : ''})
                                                </h4>
                                                <button
                                                    onClick={() => {
                                                        const teamName = prompt('Nom de la nouvelle équipe:');
                                                        if (teamName?.trim()) {
                                                            createTeam(teamName.trim(), []);
                                                        }
                                                    }}
                                                    className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                                                >
                                                    ➕ Nouvelle équipe
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            {formData.equipes && formData.equipes.length > 0 ? (
                                                <div className="space-y-4">
                                                    {formData.equipes.map(equipe => {
                                                        const membresEquipe = equipe.membres
                                                            .map(membreId => personnel?.find(p => p.id === membreId))
                                                            .filter(Boolean);

                                                        return (
                                                            <div key={equipe.id} className="border rounded-lg p-4 bg-orange-50">
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <div>
                                                                        <h5 className="font-medium text-orange-800">{equipe.nom}</h5>
                                                                        <p className="text-sm text-orange-600">
                                                                            {membresEquipe.length} membre{membresEquipe.length > 1 ? 's' : ''}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => {
                                                                                const newName = prompt('Éditer le nom:', equipe.nom);
                                                                                if (newName?.trim() && newName !== equipe.nom) {
                                                                                    updateTeam(equipe.id, { nom: newName.trim() });
                                                                                }
                                                                            }}
                                                                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                                                        >
                                                                            ✏️ Éditer
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                if (confirm(`Supprimer l'équipe "${equipe.nom}" ?`)) {
                                                                                    deleteTeam(equipe.id);
                                                                                }
                                                                            }}
                                                                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                                                        >
                                                                            🗑️ Supprimer
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Membres de l'équipe */}
                                                                <div className="space-y-2">
                                                                    <h6 className="text-sm font-medium text-gray-700">Membres de l'équipe:</h6>
                                                                    {membresEquipe.length > 0 ? (
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                            {membresEquipe.map(membre => (
                                                                                <div
                                                                                    key={membre.id}
                                                                                    className="flex items-center justify-between p-2 bg-white border rounded"
                                                                                >
                                                                                    <div>
                                                                                        <div className="font-medium text-sm">
                                                                                            {membre.prenom ? `${membre.prenom} ${membre.nom}` : membre.nom}
                                                                                        </div>
                                                                                        <div className="text-xs text-gray-600">{membre.poste}</div>
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={() => removePersonnelFromTeam(equipe.id, membre.id)}
                                                                                        className="text-red-500 hover:text-red-700 text-xs"
                                                                                        title="Retirer de l'équipe"
                                                                                    >
                                                                                        ✗
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-sm text-gray-500 italic">Aucun membre assigné</div>
                                                                    )}

                                                                    {/* Ajouter du personnel à l'équipe */}
                                                                    {personnel && personnel.length > 0 && (
                                                                        <div className="mt-3">
                                                                            <h6 className="text-sm font-medium text-gray-600 mb-2">Ajouter du personnel:</h6>
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                                {personnel
                                                                                    .filter(person => !equipe.membres.includes(person.id))
                                                                                    .map(person => (
                                                                                        <div
                                                                                            key={person.id}
                                                                                            onClick={() => addPersonnelToTeam(equipe.id, person.id)}
                                                                                            className="flex items-center justify-between p-2 bg-gray-50 border rounded cursor-pointer hover:bg-orange-50 hover:border-orange-300 transition-colors"
                                                                                            title="Cliquer pour ajouter à l'équipe"
                                                                                        >
                                                                                            <div>
                                                                                                <div className="font-medium text-sm">
                                                                                                    {person.prenom ? `${person.prenom} ${person.nom}` : person.nom}
                                                                                                </div>
                                                                                                <div className="text-xs text-gray-600">{person.poste}</div>
                                                                                            </div>
                                                                                            <div className="text-gray-400">+</div>
                                                                                        </div>
                                                                                    ))
                                                                                }
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <div className="text-4xl mb-2">💼</div>
                                                    <p>Aucune équipe créée</p>
                                                    <p className="text-sm mt-1">Cliquez sur "Nouvelle équipe" pour commencer</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

{/* Section Horaires par jour */}
                                <div className="md:col-span-2">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900">📅 {t('form.schedulesByDay', 'Horaires par jour')}</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowDailySchedules(!showDailySchedules)}
                                            className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                                        >
                                            {showDailySchedules ? t('ui.hide', '🔼 Masquer') : t('event.customizeByDay', '🔽 Personnaliser par jour')}
                                        </button>
                                    </div>

                                    {showDailySchedules && (
                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                            <div className="mb-4">
                                                <p className="text-sm text-purple-700 mb-3">
                                                    💡 {t('form.customizeSchedulesHint', 'Personnalisez les horaires pour des jours spécifiques. La case "Inclure les fins de semaine" ci-dessus contrôle l\'inclusion automatique.')}
                                                </p>

                                                {/* Statistiques du personnel */}
                                                {(() => {
                                                    const stats = getPersonnelStats();
                                                    return (
                                                        <div className="bg-white border border-purple-200 rounded-lg p-3 mb-4">
                                                            <h4 className="font-medium text-gray-900 mb-2">📊 {t('form.personnelStatistics', 'Statistiques du personnel')}</h4>

                                                            {/* Vue globale */}
                                                            <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                                                                <div className="text-center">
                                                                    <div className="font-semibold text-blue-600">{stats.total}</div>
                                                                    <div className="text-gray-600">{t('form.total', 'Total')}</div>
                                                                </div>
                                                                <div className="text-center">
                                                                    <div className="font-semibold text-green-600">{stats.selected}</div>
                                                                    <div className="text-gray-600">{t('form.planned', 'Planifiés')}</div>
                                                                </div>
                                                                <div className="text-center">
                                                                    <div className="font-semibold text-gray-600">{stats.available}</div>
                                                                    <div className="text-gray-600">{t('form.available', 'Disponibles')}</div>
                                                                </div>
                                                            </div>

                                                            {/* Par departement */}
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <h5 className="font-medium text-gray-700 mb-1">{t('form.byDepartment', 'Par département/succursale')}:</h5>
                                                                    <div className="space-y-1 text-xs">
                                                                        {Object.entries(stats['byDépartement/Succursale']).map(([departement, data]) => (
                                                                            <div key={departement} className="flex justify-between">
                                                                                <span className="truncate mr-2">{departement}</span>
                                                                                <span className="text-green-600 font-medium">{data.selected}/{data.total}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <h5 className="font-medium text-gray-700 mb-1">{t('form.byPosition', 'Par poste')}:</h5>
                                                                    <div className="space-y-1 text-xs">
                                                                        {Object.entries(stats.byPoste).map(([poste, data]) => (
                                                                            <div key={poste} className="flex justify-between">
                                                                                <span className="truncate mr-2">{poste}</span>
                                                                                <span className="text-green-600 font-medium">{data.selected}/{data.total}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Contrôles globaux */}
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const defaultSchedules = generateDefaultDailySchedules();
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                horairesParJour: { ...prev.horairesParJour, ...defaultSchedules }
                                                            }));
                                                        }}
                                                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                                    >
                                                        ⚡ Initialiser selon préférences
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                horairesParJour: {}
                                                            }));
                                                        }}
                                                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                                    >
                                                        🗑️ Effacer tout
                                                    </button>
                                                </div>

                                                {/* Navigation par onglets */}
                                                <div className="flex border-b border-purple-200 mb-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDailyPersonnelTab('horaires')}
                                                        className={`px-4 py-2 font-medium transition-colors ${
                                                            dailyPersonnelTab === 'horaires'
                                                                ? 'border-b-2 border-purple-600 text-purple-600'
                                                                : 'text-gray-600 hover:text-gray-900'
                                                        }`}
                                                    >
                                                        🕐 Horaires par jour
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDailyPersonnelTab('personnel')}
                                                        className={`px-4 py-2 font-medium transition-colors ${
                                                            dailyPersonnelTab === 'personnel'
                                                                ? 'border-b-2 border-purple-600 text-purple-600'
                                                                : 'text-gray-600 hover:text-gray-900'
                                                        }`}
                                                    >
                                                        👥 Personnel par jour
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDailyPersonnelTab('equipement')}
                                                        className={`px-4 py-2 font-medium transition-colors ${
                                                            dailyPersonnelTab === 'equipement'
                                                                ? 'border-b-2 border-purple-600 text-purple-600'
                                                                : 'text-gray-600 hover:text-gray-900'
                                                        }`}
                                                    >
                                                        🔧 Équipement par jour
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDailyPersonnelTab('succursales')}
                                                        className={`px-4 py-2 font-medium transition-colors ${
                                                            dailyPersonnelTab === 'succursales'
                                                                ? 'border-b-2 border-purple-600 text-purple-600'
                                                                : 'text-gray-600 hover:text-gray-900'
                                                        }`}
                                                    >
                                                        🏢 Horaires par département/succursale
                                                    </button>
                                                </div>

                                                {/* Instructions selon l'onglet */}
                                                {dailyPersonnelTab === 'horaires' && (
                                                    <div className="text-xs text-purple-600 mb-3 p-2 bg-purple-100 rounded">
                                                        <div className="font-medium mb-1">Guide horaires:</div>
                                                        <div>🔵 Jour ouvrable • 🟣 Fin de semaine • ⚪ Exclu • 🟠 Mode 24/24</div>
                                                        <div>Cliquez sur les jours pour les inclure/exclure • Utilisez les boutons 24h pour le mode continu</div>
                                                    </div>
                                                )}

                                                {dailyPersonnelTab === 'personnel' && (
                                                    <div className="text-xs text-purple-600 mb-3 p-2 bg-purple-100 rounded">
                                                        <div className="font-medium mb-1">Guide personnel:</div>
                                                        <div>Cliquez sur un jour pour gérer son personnel spécifique • Filtres par poste et département/succursale disponibles</div>
                                                        <div>🟢 Disponible • 🔴 Occupé • ✅ Assigné à ce jour • 🕐 Personnaliser horaire</div>
                                                    </div>
                                                )}

                                                {dailyPersonnelTab === 'equipement' && (
                                                    <div className="text-xs text-purple-600 mb-3 p-2 bg-purple-100 rounded">
                                                        <div className="font-medium mb-1">Guide équipement:</div>
                                                        <div>Cliquez sur un jour pour gérer les équipements spécifiques • Filtres par département/succursale disponibles</div>
                                                        <div>🟢 Disponible • 🔴 En maintenance/occupé • ✅ Assigné à ce jour • 🕐 Personnaliser horaire</div>
                                                    </div>
                                                )}

                                            </div>

                                            {dailyPersonnelTab === 'horaires' && formData.dateDebut && formData.dateFin && (() => {
                                                const allDays = getAllDays();

                                                return (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {allDays.map(({ date: dateString, dayName, dayNumber, isWeekend, included, isExplicitlyExcluded, hasCustomSchedule }) => {
                                                            const schedule = formData.horairesParJour[dateString];
                                                            const is24h = schedule?.mode === '24h';
                                                            const dayStats = getDayStats(dateString);

                                                            return (
                                                                <div
                                                                    key={dateString}
                                                                    className={`border rounded-lg p-3 transition-all cursor-pointer ${
                                                                        !included
                                                                            ? 'bg-gray-100 border-gray-300 opacity-60'
                                                                            : is24h
                                                                                ? 'bg-orange-50 border-orange-400'
                                                                                : isWeekend
                                                                                    ? 'bg-purple-50 border-purple-400'
                                                                                    : 'bg-blue-50 border-blue-400'
                                                                    }`}
                                                                    onClick={() => {
                                                                        if (isExplicitlyExcluded || (!included && isWeekend)) {
                                                                            toggleDayInclusion(dateString);
                                                                        }
                                                                    }}
                                                                >
                                                                    <div className="mb-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="font-medium text-sm flex items-center gap-2">
                                                                                <span>{dayName} {dayNumber}</span>
                                                                                {isWeekend && (
                                                                                    <span className="text-xs px-1 py-0.5 bg-purple-200 text-purple-800 rounded">
                                                                                        Week-end
                                                                                    </span>
                                                                                )}
                                                                                {is24h && (
                                                                                    <span className="text-xs px-1 py-0.5 bg-orange-200 text-orange-800 rounded">
                                                                                        24h
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            {included && (
                                                                                <div className="flex gap-1">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            toggleDay24h(dateString);
                                                                                        }}
                                                                                        className={`text-xs px-2 py-1 rounded transition-colors ${
                                                                                            is24h
                                                                                                ? 'bg-orange-500 text-white hover:bg-orange-600'
                                                                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                                        }`}
                                                                                        title={is24h ? "Revenir au mode jour" : "Mode 24h/24"}
                                                                                    >
                                                                                        {is24h ? '🔄' : '24h'}
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            excludeDay(dateString);
                                                                                        }}
                                                                                        className="text-xs px-2 py-1 bg-red-200 text-red-700 rounded hover:bg-red-300 transition-colors"
                                                                                        title="Exclure ce jour"
                                                                                    >
                                                                                        ✕
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">{dateString}</div>
                                                                        {included && (
                                                                            <div className="mt-2">
                                                                                <div className="text-xs text-gray-600 mb-2">
                                                                                    👥 {dayStats.personnelPlanifie} planifié{dayStats.personnelPlanifie > 1 ? 's' : ''} • {getAssignedEquipementForDay(dateString).length} équipement{getAssignedEquipementForDay(dateString).length > 1 ? 's' : ''}
                                                                                </div>
                                                                                <div className="flex gap-1">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            goToResourceTab('personnel', dateString);
                                                                                        }}
                                                                                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                                                                        title={t('form.managePersonnelForDay', 'Gérer le personnel de ce jour')}
                                                                                    >
                                                                                        👥 Personnel
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            goToResourceTab('equipement', dateString);
                                                                                        }}
                                                                                        className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                                                                        title={t('form.manageEquipmentForDay', 'Gérer les équipements de ce jour')}
                                                                                    >
                                                                                        🔧 {t('equipment.equipment', 'Équipement')}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {included && !is24h && (
                                                                        <div className="flex items-center gap-2">
                                                                            <input
                                                                                type="time"
                                                                                value={schedule?.heureDebut || formData.heureDebut}
                                                                                onChange={(e) => updateDailySchedule(
                                                                                    dateString,
                                                                                    e.target.value,
                                                                                    schedule?.heureFin || formData.heureFin,
                                                                                    'jour'
                                                                                )}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className={`w-20 text-sm p-1 border rounded focus:ring-1 focus:ring-purple-500 ${
                                                                                    hasCustomSchedule ? 'bg-white' : 'bg-gray-50'
                                                                                }`}
                                                                                placeholder={formData.heureDebut}
                                                                            />
                                                                            <span className="text-xs text-gray-400">à</span>
                                                                            <input
                                                                                type="time"
                                                                                value={schedule?.heureFin || formData.heureFin}
                                                                                onChange={(e) => updateDailySchedule(
                                                                                    dateString,
                                                                                    schedule?.heureDebut || formData.heureDebut,
                                                                                    e.target.value,
                                                                                    'jour'
                                                                                )}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className={`w-20 text-sm p-1 border rounded focus:ring-1 focus:ring-purple-500 ${
                                                                                    hasCustomSchedule ? 'bg-white' : 'bg-gray-50'
                                                                                }`}
                                                                                placeholder={formData.heureFin}
                                                                            />
                                                                            {!hasCustomSchedule && (
                                                                                <span className="text-xs text-gray-500 ml-1">(global)</span>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {included && is24h && (
                                                                        <div className="text-center">
                                                                            <span className="text-sm font-medium text-orange-700">
                                                                                Mode continu 24h/24
                                                                            </span>
                                                                            <div className="text-xs text-orange-600">00:00 - 23:59</div>
                                                                        </div>
                                                                    )}

                                                                    {!included && (
                                                                        <div className="text-center text-gray-500">
                                                                            <div className="text-sm">
                                                                                {isExplicitlyExcluded ? 'Jour exclu' : (isWeekend ? 'Fin de semaine' : 'Jour exclu')}
                                                                            </div>
                                                                            <div className="text-xs">
                                                                                {isExplicitlyExcluded ? 'Cliquez pour inclure' : (isWeekend ? 'Activez "Inclure fins de semaine" ou cliquez pour inclure' : 'Cliquez pour inclure')}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );

                                            })()}

                                            {/* Onglet Personnel par jour */}
                                            {dailyPersonnelTab === 'personnel' && formData.dateDebut && formData.dateFin && (
                                                <div>
                                                    {!selectedDay ? (
                                                        // Vue générale : sélection du jour
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 mb-3">Sélectionnez un jour pour gérer son personnel</h4>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                                                                {getAllDays().filter(day => day.included).map(({ date: dateString, dayName, dayNumber, isWeekend }) => {
                                                                    const dayStats = getDayStats(dateString);
                                                                    return (
                                                                        <button
                                                                            key={dateString}
                                                                            type="button"
                                                                            onClick={() => setSelectedDay(dateString)}
                                                                            className={`p-3 border rounded-lg hover:bg-gray-50 transition-all text-left ${
                                                                                isWeekend ? 'bg-purple-50 border-purple-300' : 'bg-blue-50 border-blue-300'
                                                                            }`}
                                                                        >
                                                                            <div className="font-medium text-sm">{dayName} {dayNumber}</div>
                                                                            <div className="text-xs text-gray-500">{dateString}</div>
                                                                            <div className="text-xs text-green-600 mt-1">
                                                                                👥 {dayStats.personnelPlanifie} assigné{dayStats.personnelPlanifie > 1 ? 's' : ''}
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        // Vue détaillée : gestion du personnel pour le jour sélectionné
                                                        <div>
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h4 className="font-medium text-gray-900">
                                                                    👥 Personnel pour {localizedDateString(new Date(selectedDay), currentLanguage, { weekday: 'long', day: 'numeric', month: 'long' })}
                                                                </h4>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedDay(null)}
                                                                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                                                >
                                                                    ← Retour
                                                                </button>
                                                            </div>

                                                            {/* Filtres */}
                                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                            Poste
                                                                        </label>
                                                                        <select
                                                                            value={personnelFilters.poste}
                                                                            onChange={(e) => setPersonnelFilters(prev => ({ ...prev, poste: e.target.value }))}
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                                        >
                                                                            <option value="tous">👔 Tous les postes</option>
                                                                            {[...new Set(personnel.map(p => p.poste).filter(Boolean))].sort().map(poste => (
                                                                                <option key={poste} value={poste}>{poste}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>

                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                            Département/Succursale
                                                                        </label>
                                                                        <select
                                                                            value={personnelFilters.succursale}
                                                                            onChange={(e) => setPersonnelFilters(prev => ({ ...prev, departement: e.target.value }))}
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                                        >
                                                                            <option value="global">🌐 Tous les départements/succursales</option>
                                                                            {[...new Set(personnel.map(p => p.departement).filter(Boolean))].sort().map(departement => (
                                                                                <option key={departement} value={departement}>🏢 {departement}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>

                                                                    <div className="flex items-end">
                                                                        <label className="flex items-center gap-2 text-sm">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={personnelFilters.showAll}
                                                                                onChange={(e) => setPersonnelFilters(prev => ({ ...prev, showAll: e.target.checked }))}
                                                                                className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200"
                                                                            />
                                                                            <span className="text-gray-700">Afficher tout le personnel</span>
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Personnel assigné */}
                                                            <div className="mb-4">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <h5 className="font-medium text-gray-900">✅ Personnel assigné ({getAssignedPersonnelForDay(selectedDay).length})</h5>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setShowPersonnelQuickActions(!showPersonnelQuickActions)}
                                                                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                                                            title="Actions rapides"
                                                                        >
                                                                            ⚡ Actions rapides
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                {showPersonnelQuickActions && (
                                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                                                        <div className="text-sm font-medium text-blue-900 mb-2">⚡ Accès rapide à tout l'événement</div>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const assignedPersonnel = getAssignedPersonnelForDay(selectedDay);
                                                                                    assignedPersonnel.forEach(person => {
                                                                                        if (!formData.personnel.includes(person.id)) {
                                                                                            setFormData(prev => ({
                                                                                                ...prev,
                                                                                                personnel: [...prev.personnel, person.id]
                                                                                            }));
                                                                                        }
                                                                                    });
                                                                                    addNotification(t('success.personnelAddedToEvent', 'Personnel ajouté à l\'ensemble de l\'événement'), 'success');
                                                                                }}
                                                                                className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                                                            >
                                                                                ➕ Ajouter au global
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const assignedPersonnel = getAssignedPersonnelForDay(selectedDay);
                                                                                    assignedPersonnel.forEach(person => {
                                                                                        setFormData(prev => ({
                                                                                            ...prev,
                                                                                            personnel: prev.personnel.filter(id => id !== person.id)
                                                                                        }));
                                                                                    });
                                                                                    addNotification('Personnel retiré de l\'ensemble de l\'événement', 'warning');
                                                                                }}
                                                                                className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                                                            >
                                                                                ➖ Retirer du global
                                                                            </button>
                                                                        </div>
                                                                        <div className="mt-3 pt-3 border-t border-blue-200">
                                                                            <div className="text-sm font-medium text-blue-900 mb-2">📅 Sélection rapide par jour</div>
                                                                            <div className="flex gap-2 flex-wrap">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const allDays = getAllDays();
                                                                                        const assignedPersonnel = getAssignedPersonnelForDay(selectedDay);
                                                                                        allDays.forEach(day => {
                                                                                            assignedPersonnel.forEach(person => {
                                                                                                togglePersonnelForDay(day.dateString, person.id);
                                                                                            });
                                                                                        });
                                                                                        addNotification('Personnel assigné à tous les jours', 'success');
                                                                                    }}
                                                                                    className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                                                                                >
                                                                                    ✓ Tous les jours
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const allDays = getAllDays();
                                                                                        const assignedPersonnel = getAssignedPersonnelForDay(selectedDay);
                                                                                        allDays.filter(day => ![0, 6].includes(new Date(day.dateString).getDay())).forEach(day => {
                                                                                            assignedPersonnel.forEach(person => {
                                                                                                togglePersonnelForDay(day.dateString, person.id);
                                                                                            });
                                                                                        });
                                                                                        addNotification('Personnel assigné aux jours ouvrables', 'success');
                                                                                    }}
                                                                                    className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                                                                                >
                                                                                    📅 Jours ouvrables
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const allDays = getAllDays();
                                                                                        const assignedPersonnel = getAssignedPersonnelForDay(selectedDay);
                                                                                        allDays.filter(day => [0, 6].includes(new Date(day.dateString).getDay())).forEach(day => {
                                                                                            assignedPersonnel.forEach(person => {
                                                                                                togglePersonnelForDay(day.dateString, person.id);
                                                                                            });
                                                                                        });
                                                                                        addNotification('Personnel assigné aux weekends', 'success');
                                                                                    }}
                                                                                    className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                                                                                >
                                                                                    🎅 Weekends
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                    {getAssignedPersonnelForDay(selectedDay).map(person => (
                                                                        <div
                                                                            key={person.id}
                                                                            onClick={() => togglePersonnelForDay(selectedDay, person.id)}
                                                                            className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-red-50 hover:border-red-300 transition-colors"
                                                                            title="Cliquer pour retirer de ce jour"
                                                                        >
                                                                            <div className="flex-1">
                                                                                <div className="font-medium text-sm">
                                                                                    {person.prenom ? `${person.prenom} ${person.nom}` : person.nom}
                                                                                </div>
                                                                                <div className="text-xs text-gray-600">{person.poste}</div>
                                                                                <div className="text-xs text-gray-500">{person.succursale}</div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        openScheduleModal('personnel', person.id, person);
                                                                                    }}
                                                                                    className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                                                                                    title="Personnaliser l'horaire"
                                                                                >
                                                                                    🕐
                                                                                </button>
                                                                                <div className="text-lg text-red-600">
                                                                                    ➖
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                {getAssignedPersonnelForDay(selectedDay).length === 0 && (
                                                                    <div className="text-center text-gray-500 py-4">
                                                                        Aucun personnel assigné pour ce jour
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Personnel disponible */}
                                                            <div>
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <h5 className="font-medium text-gray-900">
                                                                        🟢 Personnel {personnelFilters.showAll ? 'disponible' : 'libre'} ({filterPersonnelByDay(selectedDay, personnel).filter(p => !formData.personnel.includes(p.id)).length})
                                                                    </h5>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setShowAvailablePersonnelQuickActions(!showAvailablePersonnelQuickActions)}
                                                                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                                                            title="Actions rapides"
                                                                        >
                                                                            ⚡ Actions rapides
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                {showAvailablePersonnelQuickActions && (
                                                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                                                                        <div className="text-sm font-medium text-green-900 mb-2">⚡ Accès rapide pour tout le personnel disponible</div>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const availablePersonnel = filterPersonnelByDay(selectedDay, personnel)
                                                                                        .filter(person => !formData.personnel.includes(person.id));
                                                                                    availablePersonnel.forEach(person => {
                                                                                        togglePersonnelForDay(selectedDay, person.id);
                                                                                    });
                                                                                    addNotification(`${availablePersonnel.length} personnes ajoutées à ce jour`, 'success');
                                                                                }}
                                                                                className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                                                            >
                                                                                ➕ Ajouter tout à ce jour
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const availablePersonnel = filterPersonnelByDay(selectedDay, personnel)
                                                                                        .filter(person => !formData.personnel.includes(person.id));
                                                                                    availablePersonnel.forEach(person => {
                                                                                        if (!formData.personnel.includes(person.id)) {
                                                                                            setFormData(prev => ({
                                                                                                ...prev,
                                                                                                personnel: [...prev.personnel, person.id]
                                                                                            }));
                                                                                        }
                                                                                    });
                                                                                    addNotification(`${availablePersonnel.length} personnes ajoutées à l'événement global`, 'success');
                                                                                }}
                                                                                className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                                                                            >
                                                                                ➕ Ajouter tout au global
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                                                                    {filterPersonnelByDay(selectedDay, personnel)
                                                                        .filter(person => !formData.personnel.includes(person.id))
                                                                        .map(person => {
                                                                            const conflicts = checkResourceConflicts ?
                                                                                checkResourceConflicts(person.id, 'personnel', selectedDay, selectedDay, formData.id) : [];
                                                                            const hasConflicts = conflicts.length > 0;

                                                                            return (
                                                                                <div
                                                                                    key={person.id}
                                                                                    onClick={() => {
                                                                                        if (!(hasConflicts && !personnelFilters.showAll)) {
                                                                                            togglePersonnelForDay(selectedDay, person.id);
                                                                                        }
                                                                                    }}
                                                                                    className={`flex items-center justify-between p-3 border rounded-lg transition-all cursor-pointer ${
                                                                                        hasConflicts && !personnelFilters.showAll
                                                                                            ? 'bg-red-50 border-red-200 cursor-not-allowed opacity-60'
                                                                                            : hasConflicts
                                                                                                ? 'bg-red-50 border-red-200 hover:bg-red-100'
                                                                                                : 'bg-gray-50 border-gray-200 hover:bg-green-50 hover:border-green-300'
                                                                                    }`}
                                                                                    title={hasConflicts && !personnelFilters.showAll
                                                                                        ? 'Personnel en conflit - non disponible'
                                                                                        : hasConflicts
                                                                                            ? 'Cliquer pour assigner (attention: conflit détecté)'
                                                                                            : 'Cliquer pour assigner à ce jour'
                                                                                    }
                                                                                >
                                                                                    <div>
                                                                                        <div className="font-medium text-sm">
                                                                                            {person.prenom ? `${person.prenom} ${person.nom}` : person.nom}
                                                                                        </div>
                                                                                        <div className="text-xs text-gray-600">{person.poste}</div>
                                                                                        <div className="text-xs text-gray-500">{person.succursale}</div>
                                                                                        {hasConflicts && (
                                                                                            <div className="text-xs text-red-600 mt-1">
                                                                                                ⚠️ Conflit avec {conflicts.length} événement{conflicts.length > 1 ? 's' : ''}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className={`text-lg ${
                                                                                        hasConflicts && !personnelFilters.showAll
                                                                                            ? 'text-gray-400'
                                                                                            : hasConflicts
                                                                                                ? 'text-orange-600'
                                                                                                : 'text-green-600'
                                                                                    }`}>
                                                                                        {hasConflicts && !personnelFilters.showAll ? '🔒' : hasConflicts ? '⚠️' : '➕'}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                </div>
                                                                {filterPersonnelByDay(selectedDay, personnel).filter(p => !formData.personnel.includes(p.id)).length === 0 && (
                                                                    <div className="text-center text-gray-500 py-4">
                                                                        Aucun personnel disponible avec les filtres actuels
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Onglet Équipement par jour */}
                                            {dailyPersonnelTab === 'equipement' && formData.dateDebut && formData.dateFin && (
                                                <div>
                                                    {!selectedDay ? (
                                                        // Vue générale : sélection du jour
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 mb-3">Sélectionnez un jour pour gérer ses équipements</h4>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                                                                {getAllDays().filter(day => day.included).map(({ date: dateString, dayName, dayNumber, isWeekend }) => {
                                                                    const equipementsAssignes = getAssignedEquipementForDay(dateString).length;
                                                                    return (
                                                                        <button
                                                                            key={dateString}
                                                                            type="button"
                                                                            onClick={() => setSelectedDay(dateString)}
                                                                            className={`p-3 border rounded-lg hover:bg-gray-50 transition-all text-left ${
                                                                                isWeekend ? 'bg-purple-50 border-purple-300' : 'bg-blue-50 border-blue-300'
                                                                            }`}
                                                                        >
                                                                            <div className="font-medium text-sm">{dayName} {dayNumber}</div>
                                                                            <div className="text-xs text-gray-500">{dateString}</div>
                                                                            <div className="text-xs text-green-600 mt-1">
                                                                                🔧 {equipementsAssignes} équipement{equipementsAssignes > 1 ? 's' : ''}
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        // Vue détaillée : gestion des équipements pour le jour sélectionné
                                                        <div>
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h4 className="font-medium text-gray-900">
                                                                    🔧 Équipements pour {localizedDateString(new Date(selectedDay), currentLanguage, { weekday: 'long', day: 'numeric', month: 'long' })}
                                                                </h4>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedDay(null)}
                                                                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                                                >
                                                                    ← Retour
                                                                </button>
                                                            </div>

                                                            {/* Filtres */}
                                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                            Département/Succursale
                                                                        </label>
                                                                        <select
                                                                            value={personnelFilters.succursale}
                                                                            onChange={(e) => setPersonnelFilters(prev => ({ ...prev, departement: e.target.value }))}
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                                        >
                                                                            <option value="global">🌐 Tous les départements/succursales</option>
                                                                            {[...new Set(equipements.map(e => e.departement).filter(Boolean))].sort().map(departement => (
                                                                                <option key={departement} value={departement}>🏢 {departement}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>

                                                                    <div className="flex items-end">
                                                                        <label className="flex items-center gap-2 text-sm">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={personnelFilters.showAll}
                                                                                onChange={(e) => setPersonnelFilters(prev => ({ ...prev, showAll: e.target.checked }))}
                                                                                className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200"
                                                                            />
                                                                            <span className="text-gray-700">Afficher tous les équipements</span>
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Équipements assignés */}
                                                            <div className="mb-4">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <h5 className="font-medium text-gray-900">✅ Équipements assignés ({getAssignedEquipementForDay(selectedDay).length})</h5>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setShowEquipementQuickActions(!showEquipementQuickActions)}
                                                                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                                                            title="Actions rapides"
                                                                        >
                                                                            ⚡ Actions rapides
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                {showEquipementQuickActions && (
                                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                                                        <div className="text-sm font-medium text-blue-900 mb-2">⚡ Accès rapide à tout l'événement</div>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const assignedEquipement = getAssignedEquipementForDay(selectedDay);
                                                                                    assignedEquipement.forEach(equipement => {
                                                                                        if (!formData.equipements.includes(equipement.id)) {
                                                                                            setFormData(prev => ({
                                                                                                ...prev,
                                                                                                equipements: [...prev.equipements, equipement.id]
                                                                                            }));
                                                                                        }
                                                                                    });
                                                                                    addNotification('Équipements ajoutés à l\'ensemble de l\'événement', 'success');
                                                                                }}
                                                                                className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                                                            >
                                                                                ➕ Ajouter au global
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const assignedEquipement = getAssignedEquipementForDay(selectedDay);
                                                                                    assignedEquipement.forEach(equipement => {
                                                                                        setFormData(prev => ({
                                                                                            ...prev,
                                                                                            equipements: prev.equipements.filter(id => id !== equipement.id)
                                                                                        }));
                                                                                    });
                                                                                    addNotification('Équipements retirés de l\'ensemble de l\'événement', 'warning');
                                                                                }}
                                                                                className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                                                            >
                                                                                ➖ Retirer du global
                                                                            </button>
                                                                        </div>
                                                                        <div className="mt-3 pt-3 border-t border-blue-200">
                                                                            <div className="text-sm font-medium text-blue-900 mb-2">📅 Sélection rapide par jour</div>
                                                                            <div className="flex gap-2 flex-wrap">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const allDays = getAllDays();
                                                                                        const assignedEquipement = getAssignedEquipementForDay(selectedDay);
                                                                                        allDays.forEach(day => {
                                                                                            assignedEquipement.forEach(equipement => {
                                                                                                toggleEquipementForDay(day.dateString, equipement.id);
                                                                                            });
                                                                                        });
                                                                                        addNotification('Équipements assignés à tous les jours', 'success');
                                                                                    }}
                                                                                    className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                                                                                >
                                                                                    ✓ Tous les jours
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const allDays = getAllDays();
                                                                                        const assignedEquipement = getAssignedEquipementForDay(selectedDay);
                                                                                        allDays.filter(day => ![0, 6].includes(new Date(day.dateString).getDay())).forEach(day => {
                                                                                            assignedEquipement.forEach(equipement => {
                                                                                                toggleEquipementForDay(day.dateString, equipement.id);
                                                                                            });
                                                                                        });
                                                                                        addNotification('Équipements assignés aux jours ouvrables', 'success');
                                                                                    }}
                                                                                    className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                                                                                >
                                                                                    📅 Jours ouvrables
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const allDays = getAllDays();
                                                                                        const assignedEquipement = getAssignedEquipementForDay(selectedDay);
                                                                                        allDays.filter(day => [0, 6].includes(new Date(day.dateString).getDay())).forEach(day => {
                                                                                            assignedEquipement.forEach(equipement => {
                                                                                                toggleEquipementForDay(day.dateString, equipement.id);
                                                                                            });
                                                                                        });
                                                                                        addNotification('Équipements assignés aux weekends', 'success');
                                                                                    }}
                                                                                    className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                                                                                >
                                                                                    🎅 Weekends
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                    {getAssignedEquipementForDay(selectedDay).map(equipement => (
                                                                        <div
                                                                            key={equipement.id}
                                                                            onClick={() => toggleEquipementForDay(selectedDay, equipement.id)}
                                                                            className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-red-50 hover:border-red-300 transition-colors"
                                                                            title="Cliquer pour retirer de ce jour"
                                                                        >
                                                                            <div className="flex-1">
                                                                                <div className="font-medium text-sm">{equipement.nom}</div>
                                                                                <div className="text-xs text-gray-600">{equipement.type}</div>
                                                                                <div className="text-xs text-gray-500">{equipement.succursale}</div>
                                                                                <div className="text-xs text-gray-500">Statut: {equipement.statut}</div>
                                                                            </div>
                                                                            <div className="flex gap-1">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        openScheduleModal('equipement', equipement.id, equipement);
                                                                                    }}
                                                                                    className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                                                                                    title="Personnaliser l'horaire"
                                                                                >
                                                                                    🕐
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                {getAssignedEquipementForDay(selectedDay).length === 0 && (
                                                                    <div className="text-center text-gray-500 py-4">
                                                                        Aucun équipement assigné pour ce jour
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Équipements disponibles */}
                                                            <div>
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <h5 className="font-medium text-gray-900">
                                                                        🟢 Équipements {personnelFilters.showAll ? 'disponibles' : 'libres'} ({filterEquipementByDay(selectedDay, equipements).filter(e => !formData.equipements.includes(e.id)).length})
                                                                    </h5>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setShowAvailableEquipementQuickActions(!showAvailableEquipementQuickActions)}
                                                                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                                                            title="Actions rapides"
                                                                        >
                                                                            ⚡ Actions rapides
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                {showAvailableEquipementQuickActions && (
                                                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                                                                        <div className="text-sm font-medium text-green-900 mb-2">⚡ Accès rapide pour tous les équipements disponibles</div>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const availableEquipement = filterEquipementByDay(selectedDay, equipements)
                                                                                        .filter(equipement => !formData.equipements.includes(equipement.id));
                                                                                    availableEquipement.forEach(equipement => {
                                                                                        toggleEquipementForDay(selectedDay, equipement.id);
                                                                                    });
                                                                                    addNotification(`${availableEquipement.length} équipements ajoutés à ce jour`, 'success');
                                                                                }}
                                                                                className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                                                            >
                                                                                ➕ Ajouter tout à ce jour
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const availableEquipement = filterEquipementByDay(selectedDay, equipements)
                                                                                        .filter(equipement => !formData.equipements.includes(equipement.id));
                                                                                    availableEquipement.forEach(equipement => {
                                                                                        if (!formData.equipements.includes(equipement.id)) {
                                                                                            setFormData(prev => ({
                                                                                                ...prev,
                                                                                                equipements: [...prev.equipements, equipement.id]
                                                                                            }));
                                                                                        }
                                                                                    });
                                                                                    addNotification(`${availableEquipement.length} équipements ajoutés à l'événement global`, 'success');
                                                                                }}
                                                                                className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                                                                            >
                                                                                ➕ Ajouter tout au global
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                                                                    {filterEquipementByDay(selectedDay, equipements)
                                                                        .filter(equipement => !formData.equipements.includes(equipement.id))
                                                                        .map(equipement => {
                                                                            const conflicts = checkResourceConflicts ?
                                                                                checkResourceConflicts(equipement.id, 'equipement', selectedDay, selectedDay, formData.id) : [];
                                                                            const hasConflicts = conflicts.length > 0;

                                                                            return (
                                                                                <div
                                                                                    key={equipement.id}
                                                                                    onClick={() => {
                                                                                        if (!(hasConflicts && !personnelFilters.showAll)) {
                                                                                            toggleEquipementForDay(selectedDay, equipement.id);
                                                                                        }
                                                                                    }}
                                                                                    className={`flex items-center justify-between p-3 border rounded-lg transition-all cursor-pointer ${
                                                                                        hasConflicts && !personnelFilters.showAll
                                                                                            ? 'bg-red-50 border-red-200 cursor-not-allowed opacity-60'
                                                                                            : 'bg-gray-50 border-gray-200 hover:bg-green-50 hover:border-green-300'
                                                                                    }`}
                                                                                >
                                                                                    <div>
                                                                                        <div className="font-medium text-sm">{equipement.nom}</div>
                                                                                        <div className="text-xs text-gray-600">{equipement.type}</div>
                                                                                        <div className="text-xs text-gray-500">{equipement.succursale}</div>
                                                                                        <div className="text-xs text-gray-500">Statut: {equipement.statut}</div>
                                                                                        {hasConflicts && (
                                                                                            <div className="text-xs text-red-600 mt-1">
                                                                                                ⚠️ Conflit avec {conflicts.length} événement{conflicts.length > 1 ? 's' : ''}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className={`px-2 py-1 text-xs rounded transition-colors ${
                                                                                        hasConflicts && !personnelFilters.showAll
                                                                                            ? 'bg-gray-200 text-gray-500'
                                                                                            : 'bg-green-100 text-green-700'
                                                                                    }`}>
                                                                                        {hasConflicts && !personnelFilters.showAll ? '🔒' : '✓'}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                </div>
                                                                {filterEquipementByDay(selectedDay, equipements).filter(e => !formData.equipements.includes(e.id)).length === 0 && (
                                                                    <div className="text-center text-gray-500 py-4">
                                                                        Aucun équipement disponible avec les filtres actuels
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Onglet Horaires par département/succursale */}
                                            {dailyPersonnelTab === 'succursales' && (
                                                <div>
                                                    <div className="mb-4">
                                                        <h4 className="font-medium text-gray-900 mb-3">🏢 Horaires par département/succursale</h4>
                                                        <p className="text-sm text-gray-600 mb-4">
                                                            Configurez des horaires globaux ou personnalisés par jour pour chaque département/succursale.
                                                        </p>
                                                    </div>


                                                    {/* Vue en grille - Tous les jours visibles */}
                                                    <div className="space-y-4">
                                                        {!formData.dateDebut || !formData.dateFin ? (
                                                            <div className="text-center text-gray-500 py-4">
                                                                📅 Veuillez d'abord définir les dates de début et fin de l'événement
                                                            </div>
                                                        ) : (() => {
                                                            const succursales = [...new Set([
                                                                ...personnel.map(p => p.succursale),
                                                                ...equipements.map(e => e.succursale)
                                                            ])].filter(Boolean).sort();

                                                            if (succursales.length === 0) {
                                                                return (
                                                                    <div className="text-center text-gray-500 py-8">
                                                                        <div className="text-4xl mb-4">🏢</div>
                                                                        <p className="text-lg font-medium mb-2">Aucun département/succursale trouvé</p>
                                                                        <p className="text-sm">Assurez-vous que votre personnel et/ou équipements ont une succursale définie</p>
                                                                        <div className="mt-4 text-xs text-gray-600">
                                                                            Personnel disponible: {personnel.length} | Équipements disponibles: {equipements.length}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }

                                                            const allDays = getAllDays().filter(day => day.included);

                                                            return succursales.map(departement => (
                                                                <div key={departement} className="border border-gray-200 rounded-lg p-4">
                                                                    <div className="flex items-center justify-between mb-4">
                                                                        <div>
                                                                            <h5 className="font-medium text-gray-900">🏢 {departement}</h5>
                                                                            <p className="text-xs text-gray-600">
                                                                                {personnel.filter(p => p.succursale === departement).length} personne{personnel.filter(p => p.succursale === departement).length > 1 ? 's' : ''}
                                                                                {equipements.filter(e => e.succursale === departement).length > 0 && (
                                                                                    <span> • {equipements.filter(e => e.succursale === departement).length} équipement{equipements.filter(e => e.succursale === departement).length > 1 ? 's' : ''}</span>
                                                                                )}
                                                                            </p>

                                                                            {/* Sélection du personnel et équipement */}
                                                                            <div className="mt-2">
                                                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                                    {t('job.selectResources', 'Sélectionner les ressources')}:
                                                                                </label>
                                                                                <div className="space-y-2">
                                                                                    <select
                                                                                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                                                                                        onChange={(e) => {
                                                                                            const value = e.target.value;
                                                                                            if (value === 'global') {
                                                                                                // Option globale - tous les personnel/équipement de la succursale
                                                                                                setFormData(prev => ({
                                                                                                    ...prev,
                                                                                                    personnelAssigne: [
                                                                                                        ...(prev.personnelAssigne || []).filter(p => !personnel.find(per => per.id === p && per.succursale === departement)),
                                                                                                        ...personnel.filter(p => p.succursale === departement).map(p => p.id)
                                                                                                    ],
                                                                                                    equipementAssigne: [
                                                                                                        ...(prev.equipementAssigne || []).filter(e => !equipements.find(eq => eq.id === e && eq.succursale === departement)),
                                                                                                        ...equipements.filter(e => e.succursale === departement).map(e => e.id)
                                                                                                    ]
                                                                                                }));
                                                                                            } else if (value.startsWith('personnel-')) {
                                                                                                const personnelId = value.replace('personnel-', '');
                                                                                                setFormData(prev => ({
                                                                                                    ...prev,
                                                                                                    personnelAssigne: (prev.personnelAssigne || []).includes(personnelId)
                                                                                                        ? (prev.personnelAssigne || []).filter(id => id !== personnelId)
                                                                                                        : [...(prev.personnelAssigne || []), personnelId]
                                                                                                }));
                                                                                            } else if (value.startsWith('equipement-')) {
                                                                                                const equipementId = value.replace('equipement-', '');
                                                                                                setFormData(prev => ({
                                                                                                    ...prev,
                                                                                                    equipementAssigne: (prev.equipementAssigne || []).includes(equipementId)
                                                                                                        ? (prev.equipementAssigne || []).filter(id => id !== equipementId)
                                                                                                        : [...(prev.equipementAssigne || []), equipementId]
                                                                                                }));
                                                                                            }
                                                                                            e.target.value = ''; // Reset selection
                                                                                        }}
                                                                                        defaultValue=""
                                                                                    >
                                                                                        <option value="">{t('job.chooseAction', 'Choisir une action...')}</option>
                                                                                        <option value="global">🌐 {t('job.selectAllResources', 'Sélectionner toutes les ressources')}</option>
                                                                                        <optgroup label={`👥 ${t('resource.personnel')} (${personnel.filter(p => p.succursale === departement).length})`}>
                                                                                            {personnel.filter(p => p.succursale === departement).map(person => (
                                                                                                <option key={person.id} value={`personnel-${person.id}`}>
                                                                                                    {(formData.personnelAssigne || []).includes(person.id) ? '✅' : '⚪'} {person.nom}{person.prenom ? `, ${person.prenom}` : ''} - {person.poste}
                                                                                                </option>
                                                                                            ))}
                                                                                        </optgroup>
                                                                                        {equipements.filter(e => e.succursale === departement).length > 0 && (
                                                                                            <optgroup label={`🔧 ${t('resource.equipment')} (${equipements.filter(e => e.succursale === departement).length})`}>
                                                                                                {equipements.filter(e => e.succursale === departement).map(equipement => (
                                                                                                    <option key={equipement.id} value={`equipement-${equipement.id}`}>
                                                                                                        {(formData.equipementAssigne || []).includes(equipement.id) ? '✅' : '⚪'} {equipement.nom} - {equipement.type}
                                                                                                    </option>
                                                                                                ))}
                                                                                            </optgroup>
                                                                                        )}
                                                                                    </select>

                                                                                    {/* Bouton personnalisation par jour */}
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            setFormData(prev => ({
                                                                                                ...prev,
                                                                                                resourcesPersonnaliseeParJour: {
                                                                                                    ...prev.resourcesPersonnaliseeParJour,
                                                                                                    [departement]: !prev.resourcesPersonnaliseeParJour?.[departement]
                                                                                                }
                                                                                            }));
                                                                                        }}
                                                                                        className={`w-full text-xs px-2 py-1 rounded transition-colors ${
                                                                                            formData.resourcesPersonnaliseeParJour?.[departement]
                                                                                                ? 'bg-purple-600 text-white'
                                                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                                        }`}
                                                                                    >
                                                                                        📅 {formData.resourcesPersonnaliseeParJour?.[departement]
                                                                                            ? t('job.cancelDailyCustomization', 'Annuler la personnalisation par jour')
                                                                                            : t('job.customizeByDay', 'Personnaliser par jour')
                                                                                        }
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Horaires globaux */}
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="text-xs text-gray-600">Horaires globaux:</div>
                                                                            <div className="flex items-center gap-2">
                                                                                <input
                                                                                    type="time"
                                                                                    value={formData.horairesDepartements.global?.[departement]?.heureDebut || formData.heureDebut}
                                                                                    onChange={(e) => {
                                                                                        setFormData(prev => ({
                                                                                            ...prev,
                                                                                            horairesDepartements: {
                                                                                                ...prev.horairesDepartements,
                                                                                                global: {
                                                                                                    ...(prev.horairesDepartements.global || {}),
                                                                                                    [departement]: {
                                                                                                        ...(prev.horairesDepartements.global?.[departement] || {}),
                                                                                                        heureDebut: e.target.value
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }));
                                                                                    }}
                                                                                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                                                />
                                                                                <span className="text-xs text-gray-500">à</span>
                                                                                <input
                                                                                    type="time"
                                                                                    value={formData.horairesDepartements.global?.[departement]?.heureFin || formData.heureFin}
                                                                                    onChange={(e) => {
                                                                                        setFormData(prev => ({
                                                                                            ...prev,
                                                                                            horairesDepartements: {
                                                                                                ...prev.horairesDepartements,
                                                                                                global: {
                                                                                                    ...(prev.horairesDepartements.global || {}),
                                                                                                    [departement]: {
                                                                                                        ...(prev.horairesDepartements.global?.[departement] || {}),
                                                                                                        heureFin: e.target.value
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }));
                                                                                    }}
                                                                                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Grille des jours */}
                                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                                        {allDays.map(({ date: dateString, dayName, dayNumber, isWeekend }) => {
                                                                            const daySchedule = formData.horairesDepartements[dateString]?.[departement];
                                                                            const hasCustomSchedule = daySchedule?.heureDebut && daySchedule?.heureFin;
                                                                            const globalSchedule = formData.horairesDepartements.global?.[departement];

                                                                            const effectiveStart = hasCustomSchedule ? daySchedule.heureDebut :
                                                                                                  globalSchedule?.heureDebut || formData.heureDebut;
                                                                            const effectiveEnd = hasCustomSchedule ? daySchedule.heureFin :
                                                                                                globalSchedule?.heureFin || formData.heureFin;

                                                                            return (
                                                                                <div
                                                                                    key={dateString}
                                                                                    className={`border rounded-lg p-3 transition-all ${
                                                                                        hasCustomSchedule
                                                                                            ? 'border-purple-300 bg-purple-50'
                                                                                            : isWeekend
                                                                                                ? 'border-orange-200 bg-orange-50'
                                                                                                : 'border-gray-200 bg-white'
                                                                                    }`}
                                                                                >
                                                                                    <div className="text-xs font-medium text-gray-900 mb-2">
                                                                                        {dayName} {dayNumber}
                                                                                    </div>

                                                                                    <div className="space-y-2">
                                                                                        <div className="flex items-center gap-1">
                                                                                            <input
                                                                                                type="time"
                                                                                                value={effectiveStart}
                                                                                                onChange={(e) => {
                                                                                                    setFormData(prev => ({
                                                                                                        ...prev,
                                                                                                        horairesDepartements: {
                                                                                                            ...prev.horairesDepartements,
                                                                                                            [dateString]: {
                                                                                                                ...(prev.horairesDepartements[dateString] || {}),
                                                                                                                [departement]: {
                                                                                                                    ...(prev.horairesDepartements[dateString]?.[departement] || {}),
                                                                                                                    heureDebut: e.target.value,
                                                                                                                    heureFin: effectiveEnd
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }));
                                                                                                }}
                                                                                                className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                                                            />
                                                                                        </div>

                                                                                        <div className="flex items-center gap-1">
                                                                                            <input
                                                                                                type="time"
                                                                                                value={effectiveEnd}
                                                                                                onChange={(e) => {
                                                                                                    setFormData(prev => ({
                                                                                                        ...prev,
                                                                                                        horairesDepartements: {
                                                                                                            ...prev.horairesDepartements,
                                                                                                            [dateString]: {
                                                                                                                ...(prev.horairesDepartements[dateString] || {}),
                                                                                                                [departement]: {
                                                                                                                    ...(prev.horairesDepartements[dateString]?.[departement] || {}),
                                                                                                                    heureDebut: effectiveStart,
                                                                                                                    heureFin: e.target.value
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }));
                                                                                                }}
                                                                                                className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                                                            />
                                                                                        </div>

                                                                                        {hasCustomSchedule && (
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    setFormData(prev => {
                                                                                                        const newHoraires = { ...prev.horairesDepartements };
                                                                                                        if (newHoraires[dateString]) {
                                                                                                            delete newHoraires[dateString][departement];
                                                                                                            if (Object.keys(newHoraires[dateString]).length === 0) {
                                                                                                                delete newHoraires[dateString];
                                                                                                            }
                                                                                                        }
                                                                                                        return {
                                                                                                            ...prev,
                                                                                                            horairesDepartements: newHoraires
                                                                                                        };
                                                                                                    });
                                                                                                }}
                                                                                                className="w-full px-1 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                                                                                                title="Revenir aux horaires globaux"
                                                                                            >
                                                                                                🔄 Global
                                                                                            </button>
                                                                                        )}
                                                                                    </div>

                                                                                    <div className="mt-2 text-xs text-center">
                                                                                        {hasCustomSchedule ? (
                                                                                            <span className="text-purple-600 font-medium">✅ Personnalisé</span>
                                                                                        ) : (
                                                                                            <span className="text-gray-500">🔄 Global</span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ));
                                                        })()}
                                                    </div>
                                                </div>
                                            )}


                                        </div>
                                    )}
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

                        {activeTab === 'recurrence' && (
                            <div className="h-full overflow-y-auto p-6">
                                <div className="space-y-6">
                                    {/* Header Récurrence */}
                                    <div className="flex items-center gap-4 px-6 py-4 bg-gray-900 border-b border-gray-700 rounded-lg">
                                        <div className="text-4xl">🔄</div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white flex items-center">
                                                Récurrence des Tâches
                                            </h3>
                                            <p className="text-sm text-gray-300">
                                                Configuration des tâches récurrentes et programmation automatique
                                            </p>
                                        </div>
                                    </div>

                                    {/* Activation de la récurrence */}
                                    <div className="bg-white border rounded-lg overflow-hidden">
                                        <div className="bg-purple-50 p-4 border-b">
                                            <h4 className="font-medium text-purple-800 flex items-center gap-2">
                                                ⚡ Activation de la Récurrence
                                            </h4>
                                        </div>
                                        <div className="p-6">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    id="recurrence-active"
                                                    checked={formData.recurrence?.active || false}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        recurrence: {
                                                            ...prev.recurrence,
                                                            active: e.target.checked
                                                        }
                                                    }))}
                                                    className="w-5 h-5 text-purple-600 rounded"
                                                />
                                                <label htmlFor="recurrence-active" className="text-lg font-medium text-gray-900">
                                                    Activer la récurrence automatique
                                                </label>
                                            </div>
                                            {formData.recurrence?.active && (
                                                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                                    <p className="text-green-800 text-sm">
                                                        ✅ La récurrence est activée. Ce job sera automatiquement dupliqué selon la configuration ci-dessous.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Configuration de la récurrence */}
                                    {formData.recurrence?.active && (
                                        <>
                                            {/* Type de récurrence */}
                                            <div className="bg-white border rounded-lg overflow-hidden">
                                                <div className="bg-blue-50 p-4 border-b">
                                                    <h4 className="font-medium text-blue-800 flex items-center gap-2">
                                                        📅 Type de Récurrence
                                                    </h4>
                                                </div>
                                                <div className="p-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        {[
                                                            { value: 'quotidienne', label: 'Quotidienne', icon: '📅' },
                                                            { value: 'hebdomadaire', label: 'Hebdomadaire', icon: '📊' },
                                                            { value: 'mensuelle', label: 'Mensuelle', icon: '📆' },
                                                            { value: 'annuelle', label: 'Annuelle', icon: '🗓️' }
                                                        ].map(type => (
                                                            <label
                                                                key={type.value}
                                                                className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                                                    formData.recurrence?.type === type.value
                                                                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                                        : 'border-gray-200 hover:border-gray-300'
                                                                }`}
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name="recurrence-type"
                                                                    value={type.value}
                                                                    checked={formData.recurrence?.type === type.value}
                                                                    onChange={(e) => setFormData(prev => ({
                                                                        ...prev,
                                                                        recurrence: {
                                                                            ...prev.recurrence,
                                                                            type: e.target.value
                                                                        }
                                                                    }))}
                                                                    className="sr-only"
                                                                />
                                                                <div className="text-2xl mb-2">{type.icon}</div>
                                                                <div className="font-medium">{type.label}</div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Intervalle et paramètres */}
                                            <div className="bg-white border rounded-lg overflow-hidden">
                                                <div className="bg-orange-50 p-4 border-b">
                                                    <h4 className="font-medium text-orange-800 flex items-center gap-2">
                                                        ⚙️ Paramètres de Récurrence
                                                    </h4>
                                                </div>
                                                <div className="p-6 space-y-4">
                                                    {/* Intervalle */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Intervalle - Répéter tous les {formData.recurrence?.intervalle || 1} {
                                                                formData.recurrence?.type === 'quotidienne' ? 'jour(s)' :
                                                                formData.recurrence?.type === 'hebdomadaire' ? 'semaine(s)' :
                                                                formData.recurrence?.type === 'mensuelle' ? 'mois' :
                                                                'année(s)'
                                                            }
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="99"
                                                            value={formData.recurrence?.intervalle || 1}
                                                            onChange={(e) => setFormData(prev => ({
                                                                ...prev,
                                                                recurrence: {
                                                                    ...prev.recurrence,
                                                                    intervalle: parseInt(e.target.value) || 1
                                                                }
                                                            }))}
                                                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                        />
                                                    </div>

                                                    {/* Condition de fin */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                                            Condition de fin
                                                        </label>
                                                        <div className="space-y-3">
                                                            <label className="flex items-center gap-3">
                                                                <input
                                                                    type="radio"
                                                                    name="fin-recurrence"
                                                                    value="date"
                                                                    checked={formData.recurrence?.finRecurrence === 'date'}
                                                                    onChange={(e) => setFormData(prev => ({
                                                                        ...prev,
                                                                        recurrence: {
                                                                            ...prev.recurrence,
                                                                            finRecurrence: e.target.value
                                                                        }
                                                                    }))}
                                                                    className="w-4 h-4 text-purple-600"
                                                                />
                                                                <span>Se terminer à une date spécifique</span>
                                                            </label>
                                                            {formData.recurrence?.finRecurrence === 'date' && (
                                                                <div className="ml-7">
                                                                    <input
                                                                        type="date"
                                                                        value={formData.recurrence?.dateFinRecurrence || ''}
                                                                        onChange={(e) => setFormData(prev => ({
                                                                            ...prev,
                                                                            recurrence: {
                                                                                ...prev.recurrence,
                                                                                dateFinRecurrence: e.target.value
                                                                            }
                                                                        }))}
                                                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                                    />
                                                                </div>
                                                            )}

                                                            <label className="flex items-center gap-3">
                                                                <input
                                                                    type="radio"
                                                                    name="fin-recurrence"
                                                                    value="occurrences"
                                                                    checked={formData.recurrence?.finRecurrence === 'occurrences'}
                                                                    onChange={(e) => setFormData(prev => ({
                                                                        ...prev,
                                                                        recurrence: {
                                                                            ...prev.recurrence,
                                                                            finRecurrence: e.target.value
                                                                        }
                                                                    }))}
                                                                    className="w-4 h-4 text-purple-600"
                                                                />
                                                                <span>Après un nombre d'occurrences</span>
                                                            </label>
                                                            {formData.recurrence?.finRecurrence === 'occurrences' && (
                                                                <div className="ml-7 flex items-center gap-2">
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        max="999"
                                                                        value={formData.recurrence?.nombreOccurrences || 10}
                                                                        onChange={(e) => setFormData(prev => ({
                                                                            ...prev,
                                                                            recurrence: {
                                                                                ...prev.recurrence,
                                                                                nombreOccurrences: parseInt(e.target.value) || 10
                                                                            }
                                                                        }))}
                                                                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                                    />
                                                                    <span className="text-sm text-gray-600">occurrences</span>
                                                                </div>
                                                            )}

                                                            <label className="flex items-center gap-3">
                                                                <input
                                                                    type="radio"
                                                                    name="fin-recurrence"
                                                                    value="jamais"
                                                                    checked={formData.recurrence?.finRecurrence === 'jamais'}
                                                                    onChange={(e) => setFormData(prev => ({
                                                                        ...prev,
                                                                        recurrence: {
                                                                            ...prev.recurrence,
                                                                            finRecurrence: e.target.value
                                                                        }
                                                                    }))}
                                                                    className="w-4 h-4 text-purple-600"
                                                                />
                                                                <span>Jamais (récurrence infinie)</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Aperçu de la récurrence */}
                                            <div className="bg-white border rounded-lg overflow-hidden">
                                                <div className="bg-green-50 p-4 border-b">
                                                    <h4 className="font-medium text-green-800 flex items-center gap-2">
                                                        👁️ Aperçu de la Récurrence
                                                    </h4>
                                                </div>
                                                <div className="p-6">
                                                    <div className="bg-gray-50 rounded-lg p-4">
                                                        <div className="text-sm text-gray-600 mb-2">Configuration actuelle :</div>
                                                        <div className="font-medium text-gray-900">
                                                            Répéter tous les {formData.recurrence?.intervalle || 1} {
                                                                formData.recurrence?.type === 'quotidienne' ? 'jour(s)' :
                                                                formData.recurrence?.type === 'hebdomadaire' ? 'semaine(s)' :
                                                                formData.recurrence?.type === 'mensuelle' ? 'mois' :
                                                                'année(s)'
                                                            }
                                                            {formData.recurrence?.finRecurrence === 'date' && formData.recurrence?.dateFinRecurrence &&
                                                                `, jusqu'au ${formatLocalizedDate(formData.recurrence.dateFinRecurrence, currentLanguage)}`
                                                            }
                                                            {formData.recurrence?.finRecurrence === 'occurrences' &&
                                                                `, pour ${formData.recurrence?.nombreOccurrences || 10} occurrences`
                                                            }
                                                            {formData.recurrence?.finRecurrence === 'jamais' &&
                                                                ', indéfiniment'
                                                            }
                                                        </div>

                                                        {formData.dateDebut && (
                                                            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                                                                <div className="text-sm text-blue-700 font-medium mb-2">📅 Prochaines occurrences :</div>
                                                                <div className="text-sm text-blue-600 space-y-1">
                                                                    {(() => {
                                                                        const dates = [];
                                                                        let currentDate = new Date(formData.dateDebut);
                                                                        const interval = formData.recurrence?.intervalle || 1;
                                                                        const type = formData.recurrence?.type || 'hebdomadaire';

                                                                        for (let i = 0; i < Math.min(5, formData.recurrence?.nombreOccurrences || 5); i++) {
                                                                            dates.push(new Date(currentDate));

                                                                            if (type === 'quotidienne') {
                                                                                currentDate.setDate(currentDate.getDate() + interval);
                                                                            } else if (type === 'hebdomadaire') {
                                                                                currentDate.setDate(currentDate.getDate() + (interval * 7));
                                                                            } else if (type === 'mensuelle') {
                                                                                currentDate.setMonth(currentDate.getMonth() + interval);
                                                                            } else if (type === 'annuelle') {
                                                                                currentDate.setFullYear(currentDate.getFullYear() + interval);
                                                                            }
                                                                        }

                                                                        return dates.map((date, index) => (
                                                                            <div key={index}>
                                                                                {index + 1}. {formatLocalizedDate(date.toISOString().split('T')[0], currentLanguage)} ({getLocalizedDayName(date, currentLanguage)})
                                                                            </div>
                                                                        ));
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Options avancées */}
                                            <div className="bg-white border rounded-lg overflow-hidden">
                                                <div className="bg-yellow-50 p-4 border-b">
                                                    <h4 className="font-medium text-yellow-800 flex items-center gap-2">
                                                        🔧 Options Avancées
                                                    </h4>
                                                </div>
                                                <div className="p-6 space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <h5 className="font-medium text-gray-700 mb-3">Gestion des ressources</h5>
                                                            <div className="space-y-2">
                                                                <label className="flex items-center gap-2">
                                                                    <input type="checkbox" className="w-4 h-4 text-purple-600" defaultChecked />
                                                                    <span className="text-sm">Conserver les mêmes ressources</span>
                                                                </label>
                                                                <label className="flex items-center gap-2">
                                                                    <input type="checkbox" className="w-4 h-4 text-purple-600" />
                                                                    <span className="text-sm">Vérifier la disponibilité automatiquement</span>
                                                                </label>
                                                                <label className="flex items-center gap-2">
                                                                    <input type="checkbox" className="w-4 h-4 text-purple-600" />
                                                                    <span className="text-sm">Notifier en cas de conflit</span>
                                                                </label>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h5 className="font-medium text-gray-700 mb-3">Notifications</h5>
                                                            <div className="space-y-2">
                                                                <label className="flex items-center gap-2">
                                                                    <input type="checkbox" className="w-4 h-4 text-purple-600" defaultChecked />
                                                                    <span className="text-sm">Création automatique de tâches</span>
                                                                </label>
                                                                <label className="flex items-center gap-2">
                                                                    <input type="checkbox" className="w-4 h-4 text-purple-600" />
                                                                    <span className="text-sm">Rappels avant échéance</span>
                                                                </label>
                                                                <label className="flex items-center gap-2">
                                                                    <input type="checkbox" className="w-4 h-4 text-purple-600" />
                                                                    <span className="text-sm">Rapport de récurrence mensuel</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Message si récurrence désactivée */}
                                    {!formData.recurrence?.active && (
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                                            <div className="text-4xl mb-4">🔄</div>
                                            <h3 className="text-lg font-medium text-gray-700 mb-2">Récurrence désactivée</h3>
                                            <p className="text-gray-600 mb-4">
                                                Activez la récurrence pour programmer automatiquement cette tâche à des intervalles réguliers.
                                            </p>
                                            <button
                                                onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    recurrence: {
                                                        ...prev.recurrence,
                                                        active: true
                                                    }
                                                }))}
                                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                            >
                                                ⚡ Activer la récurrence
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Onglet Personnalisation */}
                        {activeTab === 'customization' && (
                            <div className="h-full overflow-y-auto p-6">
                                <div className="space-y-6">
                                    {/* Header Personnalisation */}
                                    <div className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-purple-900 to-indigo-900 border-b border-purple-700 rounded-lg">
                                        <div className="text-4xl">⚙️</div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white flex items-center">
                                                Personnalisation Avancée
                                            </h3>
                                            <p className="text-sm text-gray-200">
                                                Horaires personnalisés et dates multiples pour votre projet
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions Rapides */}
                                    <div className="bg-white border rounded-lg overflow-hidden">
                                        <div className="bg-emerald-50 p-4 border-b">
                                            <h4 className="font-medium text-emerald-800 flex items-center gap-2">
                                                ⚡ Actions Rapides
                                            </h4>
                                        </div>
                                        <div className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <button
                                                    type="button"
                                                    onClick={optimizePersonnelAssignment}
                                                    className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                                                >
                                                    <div className="text-2xl">🧠</div>
                                                    <div className="text-sm font-medium text-blue-800">Optimisation IA</div>
                                                    <div className="text-xs text-blue-600 text-center">Assignation automatique basée sur les compétences</div>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={resolveScheduleConflicts}
                                                    className="flex flex-col items-center gap-2 p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                                                >
                                                    <div className="text-2xl">🔍</div>
                                                    <div className="text-sm font-medium text-red-800">Résoudre Conflits</div>
                                                    <div className="text-xs text-red-600 text-center">Détection et résolution automatique</div>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const assignedPersonnel = getAssignedPersonnelForDay(selectedDay);
                                                        applyPersonnelToAllDays(assignedPersonnel);
                                                    }}
                                                    className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
                                                >
                                                    <div className="text-2xl">📅</div>
                                                    <div className="text-sm font-medium text-green-800">Appliquer à Tout</div>
                                                    <div className="text-xs text-green-600 text-center">Copier la sélection actuelle</div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sélection de Jour */}
                                    <div className="bg-white border rounded-lg overflow-hidden">
                                        <div className="bg-teal-50 p-4 border-b">
                                            <h4 className="font-medium text-teal-800 flex items-center gap-2">
                                                📅 Sélection de Jour
                                            </h4>
                                        </div>
                                        <div className="p-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Jour sélectionné:
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={selectedDay}
                                                        min={formData.dateDebut}
                                                        max={formData.dateFin}
                                                        onChange={(e) => setSelectedDay(e.target.value)}
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                                    />
                                                </div>

                                                {/* Navigation rapide entre les jours */}
                                                <div className="flex gap-2 flex-wrap">
                                                    {getAllDays().slice(0, 7).map((day, index) => (
                                                        <button
                                                            key={day.dateString}
                                                            type="button"
                                                            onClick={() => setSelectedDay(day.dateString)}
                                                            className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                                                                selectedDay === day.dateString
                                                                    ? 'bg-teal-600 text-white'
                                                                    : day.isWeekend
                                                                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            {day.dayName.slice(0, 3)} {day.date.getDate()}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Gestion Personnel pour le Jour Sélectionné */}
                                    <div className="bg-white border rounded-lg overflow-hidden">
                                        <div className="bg-purple-50 p-4 border-b flex items-center justify-between">
                                            <h4 className="font-medium text-purple-800 flex items-center gap-2">
                                                👥 Personnel du {new Date(selectedDay).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            </h4>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setDailyPersonnelTab('assigned')}
                                                    className={`px-3 py-1 text-sm rounded ${
                                                        dailyPersonnelTab === 'assigned'
                                                            ? 'bg-purple-600 text-white'
                                                            : 'text-purple-600 hover:bg-purple-100'
                                                    }`}
                                                >
                                                    Assignés
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDailyPersonnelTab('available')}
                                                    className={`px-3 py-1 text-sm rounded ${
                                                        dailyPersonnelTab === 'available'
                                                            ? 'bg-purple-600 text-white'
                                                            : 'text-purple-600 hover:bg-purple-100'
                                                    }`}
                                                >
                                                    Disponibles
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            {dailyPersonnelTab === 'assigned' ? (
                                                <div className="space-y-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {getAssignedPersonnelForDay(selectedDay).map(person => (
                                                            <div
                                                                key={person.id}
                                                                className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg"
                                                            >
                                                                <span className="font-medium">{person.nom}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => togglePersonnelForDay(selectedDay, person.id)}
                                                                    className="text-green-600 hover:text-green-800"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Actions rapides */}
                                                    <div className="mt-3 pt-3 border-t border-purple-200">
                                                        <div className="text-sm font-medium text-purple-900 mb-2">📅 Sélection rapide par jour</div>
                                                        <div className="flex gap-2 flex-wrap">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const assignedPersonnel = getAssignedPersonnelForDay(selectedDay);
                                                                    applyPersonnelToAllDays(assignedPersonnel);
                                                                }}
                                                                className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                                                            >
                                                                ✓ Tous les jours
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const assignedPersonnel = getAssignedPersonnelForDay(selectedDay);
                                                                    applyPersonnelToWeekdays(assignedPersonnel);
                                                                }}
                                                                className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                                                            >
                                                                📅 Jours ouvrables
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const assignedPersonnel = getAssignedPersonnelForDay(selectedDay);
                                                                    applyPersonnelToWeekends(assignedPersonnel);
                                                                }}
                                                                className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                                                            >
                                                                🏖️ Weekends
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {personnel?.filter(person =>
                                                            !getAssignedPersonnelForDay(selectedDay).some(assigned => assigned.id === person.id)
                                                        ).map(person => (
                                                            <div
                                                                key={person.id}
                                                                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                                                                        {person.nom?.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium text-sm">{person.nom}</div>
                                                                        <div className="text-xs text-gray-500">{person.poste}</div>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => togglePersonnelForDay(selectedDay, person.id)}
                                                                    className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
                                                                >
                                                                    + Ajouter
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Statistiques */}
                                    <div className="bg-white border rounded-lg overflow-hidden">
                                        <div className="bg-gray-50 p-4 border-b">
                                            <h4 className="font-medium text-gray-800 flex items-center gap-2">
                                                📊 Statistiques du Projet
                                            </h4>
                                        </div>
                                        <div className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                                    <div className="text-2xl font-bold text-blue-600">{getAllDays().length}</div>
                                                    <div className="text-sm text-blue-800">Jours Total</div>
                                                </div>
                                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                                    <div className="text-2xl font-bold text-green-600">{personnel?.length || 0}</div>
                                                    <div className="text-sm text-green-800">Personnel Disponible</div>
                                                </div>
                                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                                    <div className="text-2xl font-bold text-purple-600">
                                                        {Object.keys(formData.horairesPersonnalises || {}).length}
                                                    </div>
                                                    <div className="text-sm text-purple-800">Jours Configurés</div>
                                                </div>
                                                <div className="text-center p-4 bg-orange-50 rounded-lg">
                                                    <div className="text-2xl font-bold text-orange-600">
                                                        {Math.round(
                                                            (Object.keys(formData.horairesPersonnalises || {}).length / Math.max(getAllDays().length, 1)) * 100
                                                        )}%
                                                    </div>
                                                    <div className="text-sm text-orange-800">Completion</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

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

            {/* Modal de Configuration Avancée d'Étape */}
            {showStepConfigModal && selectedStep && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-6 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Icon name="settings" size={24} />
                                Configuration - {selectedStep.text || 'Étape'}
                            </h3>
                            <button
                                onClick={closeStepConfigModal}
                                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
                            >
                                <Icon name="close" size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
                            {/* Tâches Parallèles */}
                            <div className="bg-white border rounded-lg overflow-hidden">
                                <div className="bg-blue-50 p-4 border-b">
                                    <h4 className="font-medium text-blue-800 flex items-center gap-2">
                                        🔀 Tâches Parallèles
                                    </h4>
                                    <p className="text-xs text-blue-600 mt-1">
                                        Sélectionnez les tâches qui peuvent s'exécuter en même temps
                                    </p>
                                </div>
                                <div className="p-4 max-h-64 overflow-y-auto">
                                    {generateHierarchicalCheckboxes(selectedStep)}
                                </div>
                            </div>

                            {/* Type de Tâche */}
                            <div className="bg-white border rounded-lg overflow-hidden">
                                <div className="bg-purple-50 p-4 border-b">
                                    <h4 className="font-medium text-purple-800 flex items-center gap-2">
                                        📋 Type de Tâche
                                    </h4>
                                </div>
                                <div className="p-4 space-y-2">
                                    <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!selectedStep.isMilestone}
                                            onChange={() => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    etapes: prev.etapes.map(e =>
                                                        e.id === selectedStep.id
                                                            ? { ...e, isMilestone: false }
                                                            : e
                                                    )
                                                }));
                                                setSelectedStep({ ...selectedStep, isMilestone: false });
                                            }}
                                            className="rounded-full border-gray-300"
                                        />
                                        <span className="text-sm">📄 Tâche normale</span>
                                    </label>
                                    <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={selectedStep.isMilestone === true}
                                            onChange={() => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    etapes: prev.etapes.map(e =>
                                                        e.id === selectedStep.id
                                                            ? { ...e, isMilestone: true, duration: 0 }
                                                            : e
                                                    )
                                                }));
                                                setSelectedStep({ ...selectedStep, isMilestone: true, duration: 0 });
                                            }}
                                            className="rounded-full border-gray-300"
                                        />
                                        <span className="text-sm">🎯 Jalon (milestone)</span>
                                    </label>
                                </div>
                            </div>

                            {/* Dépendances */}
                            <div className="bg-white border rounded-lg overflow-hidden">
                                <div className="bg-green-50 p-4 border-b">
                                    <h4 className="font-medium text-green-800 flex items-center gap-2">
                                        🔗 Dépendances
                                    </h4>
                                    <p className="text-xs text-green-600 mt-1">
                                        Cette tâche dépend de: {selectedStep.dependsOn?.map(id => {
                                            const dep = formData.etapes.find(e => e.id === id);
                                            return dep?.text || id;
                                        }).join(', ') || 'Aucune'}
                                    </p>
                                </div>
                                <div className="p-4">
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const newDeps = [...(selectedStep.dependsOn || []), e.target.value];
                                                setFormData(prev => ({
                                                    ...prev,
                                                    etapes: prev.etapes.map(et =>
                                                        et.id === selectedStep.id
                                                            ? { ...et, dependsOn: newDeps }
                                                            : et
                                                    )
                                                }));
                                                setSelectedStep({ ...selectedStep, dependsOn: newDeps });
                                                e.target.value = '';
                                            }
                                        }}
                                        value=""
                                    >
                                        <option value="">+ Ajouter une dépendance</option>
                                        {generateHierarchicalSelectOptions(selectedStep)}
                                    </select>

                                    {/* Liste des dépendances actuelles */}
                                    {selectedStep.dependsOn && selectedStep.dependsOn.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {selectedStep.dependsOn.map(depId => {
                                                const dep = formData.etapes.find(e => e.id === depId);
                                                return (
                                                    <div key={depId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                        <span className="text-sm">{dep?.text || depId}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newDeps = selectedStep.dependsOn.filter(id => id !== depId);
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    etapes: prev.etapes.map(et =>
                                                                        et.id === selectedStep.id
                                                                            ? { ...et, dependsOn: newDeps }
                                                                            : et
                                                                    )
                                                                }));
                                                                setSelectedStep({ ...selectedStep, dependsOn: newDeps });
                                                            }}
                                                            className="text-red-600 hover:bg-red-100 p-1 rounded"
                                                        >
                                                            <Icon name="trash" size={16} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50">
                            <button
                                onClick={closeStepConfigModal}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}