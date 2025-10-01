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

        if (totalTaskHours <= 6) return '6h';
        if (totalTaskHours <= 12) return '12h';
        if (totalTaskHours <= 24) return '24h';
        if (totalTaskHours <= 168) return 'day'; // 1 semaine
        return 'week';
    };

    // Effect pour forcer l'onglet Gantt en mode mobile
    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth < 640; // sm breakpoint
            if (isMobile && activeTab !== 'gantt') {
                setActiveTab('gantt');
            }
        };

        // Vérifier au chargement
        handleResize();

        // Ajouter le listener
        window.addEventListener('resize', handleResize);

        // Nettoyer
        return () => window.removeEventListener('resize', handleResize);
    }, [activeTab]);

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

    // Fonction pour obtenir tous les conflits de l'événement actuel
    const getCurrentEventConflicts = () => {
        if (!formData.dateDebut || !formData.dateFin) return [];

        let allConflicts = [];

        // Vérifier les conflits pour le personnel
        formData.personnel.forEach(personnelId => {
            const conflicts = checkResourceConflicts(personnelId, 'personnel', formData.dateDebut, formData.dateFin, job?.id);
            allConflicts = [...allConflicts, ...conflicts];
        });

        // Vérifier les conflits pour les équipements
        formData.equipements.forEach(equipementId => {
            const conflicts = checkResourceConflicts(equipementId, 'equipement', formData.dateDebut, formData.dateFin, job?.id);
            allConflicts = [...allConflicts, ...conflicts];
        });

        // Vérifier les conflits pour les sous-traitants
        formData.sousTraitants.forEach(sousTraitantId => {
            const conflicts = checkResourceConflicts(sousTraitantId, 'sousTraitant', formData.dateDebut, formData.dateFin, job?.id);
            allConflicts = [...allConflicts, ...conflicts];
        });

        return allConflicts;
    };

    const currentConflicts = getCurrentEventConflicts();

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

    // Fonctions pour horaires hiérarchiques
    const getAllDays = () => {
        if (!formData.dateDebut || !formData.dateFin) return [];

        const startDate = new Date(formData.dateDebut);
        const endDate = new Date(formData.dateFin);
        const allDays = [];

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateString = d.toISOString().split('T')[0];
            const dayOfWeek = d.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            // Un jour est inclus par défaut sauf si explicitement exclu
            let included = true;
            let isExplicitlyExcluded = false;

            if (formData.horairesParJour[dateString] === null) {
                included = false;
                isExplicitlyExcluded = true;
            } else if (isWeekend && !formData.includeWeekendsInDuration && !formData.horairesParJour[dateString]) {
                included = false;
            }

            allDays.push({
                date: dateString,
                dateString: dateString,
                dayName: getLocalizedDayName(d, currentLanguage, false),
                dayNumber: d.getDate(),
                isWeekend: isWeekend,
                included: included,
                isExplicitlyExcluded: isExplicitlyExcluded,
                hasCustomSchedule: formData.horairesParJour[dateString] !== undefined && formData.horairesParJour[dateString] !== null
            });
        }

        return allDays;
    };

    const getLocalizedDayName = (date, language, abbreviated = true) => {
        const options = { weekday: abbreviated ? 'short' : 'long' };
        return date.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', options);
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

    const togglePersonnelForDay = (dateString, personnelId) => {
        setFormData(prev => {
            const dayAssignations = prev.assignationsParJour[dateString] || { personnel: [], equipements: [] };
            const isCurrentlyAssigned = dayAssignations.personnel.includes(personnelId);

            if (isCurrentlyAssigned) {
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

    const toggleEquipementForDay = (dateString, equipementId) => {
        setFormData(prev => {
            const dayAssignations = prev.assignationsParJour[dateString] || { personnel: [], equipements: [] };
            const isCurrentlyAssigned = dayAssignations.equipements.includes(equipementId);

            if (isCurrentlyAssigned) {
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

    const getAssignedPersonnelForDay = (dateString) => {
        const dayAssignations = formData.assignationsParJour[dateString];
        if (!dayAssignations || !dayAssignations.personnel) return [];

        return dayAssignations.personnel
            .map(personnelId => personnel?.find(p => p.id === personnelId))
            .filter(Boolean);
    };

    const getAssignedEquipementForDay = (dateString) => {
        const dayAssignations = formData.assignationsParJour[dateString];
        if (!dayAssignations || !dayAssignations.equipements) return [];

        return dayAssignations.equipements
            .map(equipementId => equipements?.find(e => e.id === equipementId))
            .filter(Boolean);
    };

    const openScheduleModal = (resourceType, resourceId, resourceData) => {
        setScheduleModalType(resourceType);
        setSelectedResource({ id: resourceId, data: resourceData });
        setScheduleModalOpen(true);
    };

    const generateDefaultDailySchedules = (includeWeekends = false) => {
        const defaultSchedules = {};
        getAllDays().forEach(day => {
            if (day.included || includeWeekends) {
                defaultSchedules[day.dateString] = {
                    heureDebut: formData.heureDebut,
                    heureFin: formData.heureFin,
                    mode: 'jour'
                };
            }
        });
        return defaultSchedules;
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

    // Fonctions avancées pour Gantt
    const calculateCriticalPath = () => {
        const tasks = formData.etapes.map(etape => ({
            id: etape.id,
            duration: etape.duration || 1,
            dependencies: etape.dependencies || [],
            earlyStart: 0,
            earlyFinish: 0,
            lateStart: 0,
            lateFinish: 0,
            slack: 0
        }));

        if (tasks.length === 0) return [];

        // Forward Pass (Early Start/Finish)
        const taskMap = {};
        tasks.forEach(task => {
            taskMap[task.id] = { ...task };
        });

        const calculateEarly = (taskId, visited = new Set()) => {
            if (visited.has(taskId)) return;
            visited.add(taskId);

            const task = taskMap[taskId];
            if (!task) return;

            let maxEarlyFinish = 0;
            if (task.dependencies && task.dependencies.length > 0) {
                task.dependencies.forEach(dep => {
                    calculateEarly(dep.id, visited);
                    const depTask = taskMap[dep.id];
                    if (depTask) {
                        const depFinish = depTask.earlyFinish + (dep.lag || 0);
                        maxEarlyFinish = Math.max(maxEarlyFinish, depFinish);
                    }
                });
            }

            task.earlyStart = maxEarlyFinish;
            task.earlyFinish = task.earlyStart + task.duration;
        };

        tasks.forEach(task => calculateEarly(task.id));

        // Backward Pass (Late Start/Finish)
        const projectFinish = Math.max(...Object.values(taskMap).map(t => t.earlyFinish));

        Object.values(taskMap).forEach(task => {
            const hasSuccessors = tasks.some(t =>
                t.dependencies && t.dependencies.some(dep => dep.id === task.id)
            );
            if (!hasSuccessors) {
                task.lateFinish = projectFinish;
                task.lateStart = task.lateFinish - task.duration;
            }
        });

        const calculateLate = (taskId, visited = new Set()) => {
            if (visited.has(taskId)) return;
            visited.add(taskId);

            const task = taskMap[taskId];
            if (!task) return;

            if (task.lateFinish === undefined) {
                let minLateStart = Infinity;
                tasks.forEach(t => {
                    if (t.dependencies && t.dependencies.some(dep => dep.id === taskId)) {
                        calculateLate(t.id, visited);
                        const successorTask = taskMap[t.id];
                        if (successorTask) {
                            const dep = t.dependencies.find(d => d.id === taskId);
                            const lag = dep ? (dep.lag || 0) : 0;
                            minLateStart = Math.min(minLateStart, successorTask.lateStart - lag);
                        }
                    }
                });

                if (minLateStart !== Infinity) {
                    task.lateFinish = minLateStart;
                    task.lateStart = task.lateFinish - task.duration;
                }
            }
        };

        tasks.forEach(task => calculateLate(task.id));

        // Calculate slack and identify critical path
        Object.values(taskMap).forEach(task => {
            task.slack = task.lateStart - task.earlyStart;
        });

        const criticalTasks = Object.values(taskMap)
            .filter(task => Math.abs(task.slack) < 0.001)
            .map(task => task.id);

        return criticalTasks;
    };

    const addDependency = (etapeId, dependencyId, type = 'FS', lag = 0) => {
        setFormData(prev => ({
            ...prev,
            etapes: prev.etapes.map(etape =>
                etape.id === etapeId
                    ? {
                        ...etape,
                        dependencies: [...(etape.dependencies || []), { id: dependencyId, type, lag }]
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
                        dependencies: (etape.dependencies || []).filter(dep => dep.id !== dependencyId)
                    }
                    : etape
            )
        }));
    };

    const addParallelTask = (etapeId, parallelEtapeId) => {
        setFormData(prev => ({
            ...prev,
            etapes: prev.etapes.map(etape => {
                if (etape.id === etapeId) {
                    const parallelWith = etape.parallelWith || [];
                    return {
                        ...etape,
                        parallelWith: parallelWith.includes(parallelEtapeId)
                            ? parallelWith
                            : [...parallelWith, parallelEtapeId]
                    };
                }
                if (etape.id === parallelEtapeId) {
                    const parallelWith = etape.parallelWith || [];
                    return {
                        ...etape,
                        parallelWith: parallelWith.includes(etapeId)
                            ? parallelWith
                            : [...parallelWith, etapeId]
                    };
                }
                return etape;
            })
        }));
    };

    const saveBaseline = () => {
        const baseline = {
            date: new Date().toISOString(),
            etapes: formData.etapes.map(etape => ({
                id: etape.id,
                baselineStart: etape.startDate || formData.dateDebut,
                baselineEnd: etape.endDate || formData.dateFin,
                baselineDuration: etape.duration
            }))
        };

        setFormData(prev => ({
            ...prev,
            ganttBaseline: baseline
        }));

        addNotification?.('Baseline sauvegardée avec succès', 'success');
    };

    // Templates WBS prédéfinis
    const WBS_TEMPLATES = {
        construction: {
            name: 'Projet de Construction/Sécurité',
            phases: [
                {
                    name: 'Phase 1 - Planification',
                    tasks: [
                        { name: 'Étude de faisabilité', duration: 16, skills: ['analyse', 'expertise technique'] },
                        { name: 'Conception préliminaire', duration: 24, skills: ['conception', 'dessin technique'] },
                        { name: 'Évaluation des risques', duration: 8, skills: ['sécurité', 'analyse de risque'] }
                    ]
                },
                {
                    name: 'Phase 2 - Préparation',
                    tasks: [
                        { name: 'Obtention des permis', duration: 40, skills: ['réglementation', 'administration'] },
                        { name: 'Commande matériaux', duration: 8, skills: ['approvisionnement', 'logistique'] },
                        { name: 'Préparation du site', duration: 16, skills: ['préparation terrain', 'sécurité'] }
                    ]
                },
                {
                    name: 'Phase 3 - Réalisation',
                    tasks: [
                        { name: 'Installation systèmes', duration: 64, skills: ['installation', 'technique'] },
                        { name: 'Tests et contrôles', duration: 24, skills: ['tests', 'contrôle qualité'] },
                        { name: 'Formation utilisateurs', duration: 16, skills: ['formation', 'communication'] }
                    ]
                }
            ]
        },
        maintenance: {
            name: 'Maintenance Préventive',
            phases: [
                {
                    name: 'Inspection',
                    tasks: [
                        { name: 'Diagnostic initial', duration: 4, skills: ['diagnostic', 'expertise'] },
                        { name: 'Liste des points à vérifier', duration: 2, skills: ['planification', 'documentation'] }
                    ]
                },
                {
                    name: 'Maintenance',
                    tasks: [
                        { name: 'Nettoyage et lubrification', duration: 8, skills: ['maintenance', 'mécanique'] },
                        { name: 'Remplacement pièces', duration: 12, skills: ['réparation', 'technique'] },
                        { name: 'Tests de fonctionnement', duration: 4, skills: ['tests', 'contrôle'] }
                    ]
                }
            ]
        }
    };

    const applyWBSTemplate = (templateKey) => {
        const template = WBS_TEMPLATES[templateKey];
        if (!template) return;

        const newTasks = [];
        let currentStartHour = 0;

        template.phases.forEach((phase, phaseIndex) => {
            // Créer la tâche de phase (parent)
            const phaseTask = {
                id: `phase_${Date.now()}_${phaseIndex}`,
                name: phase.name,
                duration: phase.tasks.reduce((sum, task) => sum + task.duration, 0),
                startHour: currentStartHour,
                description: `Phase du projet: ${phase.name}`,
                priority: 'haute',
                status: 'planifie',
                resources: [],
                dependencies: phaseIndex > 0 ? [`phase_${Date.now()}_${phaseIndex - 1}`] : [],
                parallelWith: [],
                assignedResources: { personnel: [], equipements: [], equipes: [], sousTraitants: [] },
                parentId: null,
                level: 0,
                wbsCode: (phaseIndex + 1).toString(),
                deliverables: [],
                acceptanceCriteria: [],
                requiredSkills: [],
                riskLevel: 'moyenne',
                complexity: 'modérée',
                estimationMethod: 'analogique',
                confidenceLevel: 'élevée',
                assumptions: [],
                constraints: [],
                workPackageType: 'planification'
            };
            newTasks.push(phaseTask);

            let taskStartHour = currentStartHour;

            // Créer les sous-tâches
            phase.tasks.forEach((task, taskIndex) => {
                const subTask = {
                    id: `task_${Date.now()}_${phaseIndex}_${taskIndex}`,
                    name: task.name,
                    duration: task.duration,
                    startHour: taskStartHour,
                    description: `Tâche: ${task.name}`,
                    priority: 'normale',
                    status: 'planifie',
                    resources: [],
                    dependencies: taskIndex > 0 ? [`task_${Date.now()}_${phaseIndex}_${taskIndex - 1}`] : [],
                    parallelWith: [],
                    assignedResources: { personnel: [], equipements: [], equipes: [], sousTraitants: [] },
                    parentId: phaseTask.id,
                    level: 1,
                    wbsCode: `${phaseIndex + 1}.${taskIndex + 1}`,
                    deliverables: [],
                    acceptanceCriteria: [],
                    requiredSkills: task.skills || [],
                    riskLevel: 'faible',
                    complexity: 'simple',
                    estimationMethod: 'expert',
                    confidenceLevel: 'moyenne',
                    assumptions: [],
                    constraints: [],
                    workPackageType: 'executable'
                };
                newTasks.push(subTask);
                taskStartHour += task.duration;
            });

            currentStartHour += phaseTask.duration;
        });

        setFormData(prev => ({
            ...prev,
            etapes: [...prev.etapes, ...newTasks]
        }));

        addNotification?.(`Template WBS "${template.name}" appliqué avec succès`, 'success');
    };

    const generateWorkPackageReport = () => {
        const allTasks = formData.etapes;
        const report = {
            totalTasks: allTasks.length,
            workPackages: allTasks.filter(t => t.workPackageType === 'executable').length,
            planningPackages: allTasks.filter(t => t.workPackageType === 'planification').length,
            totalEffort: allTasks.reduce((sum, task) => sum + (task.duration || 0), 0),
            riskDistribution: {
                faible: allTasks.filter(t => t.riskLevel === 'faible').length,
                moyenne: allTasks.filter(t => t.riskLevel === 'moyenne').length,
                elevee: allTasks.filter(t => t.riskLevel === 'élevée').length
            },
            complexityDistribution: {
                simple: allTasks.filter(t => t.complexity === 'simple').length,
                moderee: allTasks.filter(t => t.complexity === 'modérée').length,
                complexe: allTasks.filter(t => t.complexity === 'complexe').length
            },
            skillsRequired: [...new Set(allTasks.flatMap(t => t.requiredSkills || []))],
            estimationMethods: {
                expert: allTasks.filter(t => t.estimationMethod === 'expert').length,
                analogique: allTasks.filter(t => t.estimationMethod === 'analogique').length,
                parametrique: allTasks.filter(t => t.estimationMethod === 'paramétrique').length
            }
        };

        return report;
    };

    const validateWBSStructure = () => {
        const tasks = formData.etapes;
        const issues = [];

        // Vérifier l'intégrité des références parent-enfant
        tasks.forEach(task => {
            if (task.parentId && !tasks.find(t => t.id === task.parentId)) {
                issues.push(`Tâche "${task.name}" référence un parent inexistant`);
            }
        });

        // Vérifier que les codes WBS sont uniques
        const wbsCodes = tasks.map(t => t.wbsCode).filter(Boolean);
        const duplicates = wbsCodes.filter((code, index) => wbsCodes.indexOf(code) !== index);
        if (duplicates.length > 0) {
            issues.push(`Codes WBS dupliqués: ${duplicates.join(', ')}`);
        }

        // Vérifier que les tâches parent ont une durée cohérente
        tasks.filter(t => tasks.some(child => child.parentId === t.id)).forEach(parent => {
            const children = tasks.filter(t => t.parentId === parent.id);
            const childrenDuration = children.reduce((sum, child) => sum + (child.duration || 0), 0);
            if (Math.abs(parent.duration - childrenDuration) > 0.1) {
                issues.push(`Tâche parent "${parent.name}" a une durée incohérente avec ses enfants`);
            }
        });

        return {
            isValid: issues.length === 0,
            issues
        };
    };

    const addSubTask = (parentId) => {
        return addNewTask(parentId);
    };

    // ====== FONCTIONS AVANCÉES DE GESTION D'ÉQUIPES ======

    // Fonctions avancées pour la gestion du personnel quotidien


    // Fonction pour appliquer rapidement le personnel à différents types de jours
    const applyPersonnelToAllDays = (selectedPersonnel) => {
        const allDays = getAllDays();
        allDays.forEach(day => {
            selectedPersonnel.forEach(person => {
                togglePersonnelForDay(day.dateString, person.id);
            });
        });
        addNotification?.('Personnel assigné à tous les jours', 'success');
    };

    const applyPersonnelToWeekdays = (selectedPersonnel) => {
        const allDays = getAllDays();
        allDays.filter(day => ![0, 6].includes(new Date(day.dateString).getDay())).forEach(day => {
            selectedPersonnel.forEach(person => {
                togglePersonnelForDay(day.dateString, person.id);
            });
        });
        addNotification?.('Personnel assigné aux jours ouvrables', 'success');
    };

    const applyPersonnelToWeekends = (selectedPersonnel) => {
        const allDays = getAllDays();
        allDays.filter(day => [0, 6].includes(new Date(day.dateString).getDay())).forEach(day => {
            selectedPersonnel.forEach(person => {
                togglePersonnelForDay(day.dateString, person.id);
            });
        });
        addNotification?.('Personnel assigné aux weekends', 'success');
    };

    // Fonction pour optimiser automatiquement l'assignation basée sur les compétences
    const optimizePersonnelAssignment = () => {
        if (!formData.etapes || formData.etapes.length === 0) return;

        const allDays = getAllDays();
        let optimizations = 0;

        allDays.forEach(day => {
            formData.etapes.forEach(etape => {
                if (etape.competencesRequises && etape.competencesRequises.length > 0) {
                    // Trouver le personnel avec les compétences requises
                    const suitablePersonnel = personnel.filter(person =>
                        etape.competencesRequises.some(competence =>
                            person.competences?.includes(competence)
                        )
                    );

                    // Assigner automatiquement le personnel le plus adapté
                    if (suitablePersonnel.length > 0) {
                        const bestMatch = suitablePersonnel[0]; // Simplification
                        const currentAssigned = getAssignedPersonnelForDay(day.dateString);

                        if (!currentAssigned.some(p => p.id === bestMatch.id)) {
                            togglePersonnelForDay(day.dateString, bestMatch.id);
                            optimizations++;
                        }
                    }
                }
            });
        });

        if (optimizations > 0) {
            addNotification?.(`${optimizations} optimisations appliquées automatiquement`, 'success');
        } else {
            addNotification?.('Aucune optimisation nécessaire', 'info');
        }
    };

    // Fonction pour détecter et résoudre les conflits d'horaires
    const resolveScheduleConflicts = () => {
        const allDays = getAllDays();
        let conflictsResolved = 0;

        allDays.forEach(day => {
            const assignedPersonnel = getAssignedPersonnelForDay(day.dateString);

            assignedPersonnel.forEach(person => {
                // Vérifier les conflits avec les congés
                const hasCongeConflict = conges?.some(conge =>
                    conge.personnelId === person.id &&
                    new Date(conge.dateDebut) <= new Date(day.dateString) &&
                    new Date(conge.dateFin) >= new Date(day.dateString)
                );

                if (hasCongeConflict) {
                    togglePersonnelForDay(day.dateString, person.id); // Retirer
                    conflictsResolved++;
                }
            });
        });

        if (conflictsResolved > 0) {
            addNotification?.(`${conflictsResolved} conflits d'horaires résolus`, 'warning');
        } else {
            addNotification?.('Aucun conflit détecté', 'success');
        }
    };

    // État pour la gestion avancée des équipes (déjà défini plus haut)

    // Fonction pour obtenir les statistiques de personnel par département/succursale et poste
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
                        <button
                            onClick={() => setActiveTab('recurrence')}
                            className={`px-6 py-3 font-medium transition-colors ${
                                activeTab === 'recurrence'
                                    ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            🔄 Récurrence {formData.recurrence?.active ? '(Activé)' : ''}
                        </button>
                        <button
                            onClick={() => setActiveTab('teams')}
                            className={`px-6 py-3 font-medium transition-colors ${
                                activeTab === 'teams'
                                    ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            🎯 Équipes {formData.horaireMode === 'personnalise' ? '(Avancé)' : ''}
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
                                                {/* Templates WBS */}
                                                <div className="relative">
                                                    <select
                                                        onChange={(e) => {
                                                            if (e.target.value) {
                                                                applyWBSTemplate(e.target.value);
                                                                e.target.value = '';
                                                            }
                                                        }}
                                                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm appearance-none pr-8"
                                                    >
                                                        <option value="">📋 Templates WBS</option>
                                                        <option value="construction">🏗️ Construction/Sécurité</option>
                                                        <option value="maintenance">🔧 Maintenance Préventive</option>
                                                    </select>
                                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-white">
                                                        ▼
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        const validation = validateWBSStructure();
                                                        if (validation.isValid) {
                                                            addNotification?.('Structure WBS valide ✅', 'success');
                                                        } else {
                                                            addNotification?.(`Problèmes WBS: ${validation.issues.join(', ')}`, 'error');
                                                        }
                                                    }}
                                                    className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 text-sm"
                                                >
                                                    ✅ Valider WBS
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        const report = generateWorkPackageReport();
                                                        const message = `📊 Rapport WBS:
- ${report.totalTasks} tâches totales
- ${report.workPackages} paquets de travail
- ${report.totalEffort}h d'effort total
- ${report.skillsRequired.length} compétences requises`;
                                                        alert(message);
                                                    }}
                                                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
                                                >
                                                    📊 Rapport WBS
                                                </button>

                                                {/* Contrôles de vue Gantt */}
                                                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                                                    <span className="text-xs text-gray-600 px-2">Vue:</span>
                                                    {['6h', '12h', '24h', 'day', 'week'].map(mode => (
                                                        <button
                                                            key={mode}
                                                            onClick={() => setFormData(prev => ({ ...prev, ganttViewMode: mode }))}
                                                            className={`px-2 py-1 text-xs rounded ${
                                                                (formData.ganttViewMode || getDefaultViewMode()) === mode
                                                                    ? 'bg-purple-600 text-white'
                                                                    : 'text-gray-600 hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            {mode === 'day' ? 'Jour' : mode === 'week' ? 'Semaine' : mode}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Indicateur de mode automatique */}
                                                <div className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
                                                    Auto: {getDefaultViewMode()} ({formData.etapes.reduce((sum, etape) => sum + (etape.duration || 0), 0)}h)
                                                </div>

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
                                                        const criticalPath = calculateCriticalPath();
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            criticalPath,
                                                            etapes: prev.etapes.map(task => ({
                                                                ...task,
                                                                isCritical: criticalPath.includes(task.id)
                                                            }))
                                                        }));
                                                        addNotification?.(`Chemin critique calculé: ${criticalPath.length} tâche(s) critique(s)`, 'info');
                                                    }}
                                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                                                >
                                                    🎯 Calculer critique
                                                </button>
                                                <button
                                                    onClick={saveBaseline}
                                                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
                                                >
                                                    💾 Sauver baseline
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
                                                            <div key={task.id} className={`grid grid-cols-12 gap-2 p-3 hover:bg-gray-50 ${task.parentId ? 'bg-blue-50' : ''} ${task.workPackageType === 'executable' ? 'border-l-4 border-green-500' : 'border-l-4 border-blue-500'}`}>
                                                                {/* WBS + Nom de la tâche */}
                                                                <div className="col-span-4">
                                                                    <div className="flex items-center gap-2">
                                                                        {/* Code WBS */}
                                                                        <div className="flex-shrink-0">
                                                                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-mono">
                                                                                {task.wbsCode || generateWBSCode(task.id, formData.etapes)}
                                                                            </span>
                                                                        </div>

                                                                        {/* Indentation hiérarchique */}
                                                                        <div style={{ marginLeft: `${(task.level || 0) * 20}px` }} className="flex-1">
                                                                            <input
                                                                                type="text"
                                                                                value={task.name || ''}
                                                                                onChange={(e) => updateTask(task.id, { name: e.target.value })}
                                                                                className="w-full text-sm border-none bg-transparent focus:bg-white focus:border focus:border-purple-300 rounded px-2 py-1"
                                                                                placeholder="Nom de la tâche"
                                                                            />

                                                                            {/* Indicateurs WBS */}
                                                                            <div className="flex items-center gap-1 mt-1">
                                                                                {task.workPackageType === 'executable' && (
                                                                                    <span className="text-xs bg-green-100 text-green-700 px-1 rounded">Exécutable</span>
                                                                                )}
                                                                                {task.complexity && task.complexity !== 'simple' && (
                                                                                    <span className={`text-xs px-1 rounded ${
                                                                                        task.complexity === 'complexe' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                                                    }`}>
                                                                                        {task.complexity}
                                                                                    </span>
                                                                                )}
                                                                                {task.riskLevel && task.riskLevel !== 'faible' && (
                                                                                    <span className={`text-xs px-1 rounded ${
                                                                                        task.riskLevel === 'élevée' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                                                                    }`}>
                                                                                        ⚠️ {task.riskLevel}
                                                                                    </span>
                                                                                )}
                                                                                {task.requiredSkills && task.requiredSkills.length > 0 && (
                                                                                    <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded" title={`Compétences: ${task.requiredSkills.join(', ')}`}>
                                                                                        🎯 {task.requiredSkills.length}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
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
                                                                            onClick={() => {
                                                                                const targetTaskId = prompt('ID de la tâche dépendante:');
                                                                                if (targetTaskId) {
                                                                                    addDependency(task.id, targetTaskId, 'FS', 0);
                                                                                    addNotification?.('Dépendance ajoutée', 'success');
                                                                                }
                                                                            }}
                                                                            className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1"
                                                                            title="Ajouter dépendance"
                                                                        >
                                                                            🔗
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                const targetTaskId = prompt('ID de la tâche parallèle:');
                                                                                if (targetTaskId) {
                                                                                    addParallelTask(task.id, targetTaskId);
                                                                                    addNotification?.('Tâche parallèle ajoutée', 'success');
                                                                                }
                                                                            }}
                                                                            className="text-purple-500 hover:text-purple-700 text-xs px-2 py-1"
                                                                            title="Ajouter tâche parallèle"
                                                                        >
                                                                            ⚡
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                const subTaskId = addSubTask(task.id);
                                                                                addNotification?.('Sous-tâche ajoutée', 'success');
                                                                            }}
                                                                            className="text-green-500 hover:text-green-700 text-xs px-2 py-1"
                                                                            title="Ajouter sous-tâche"
                                                                        >
                                                                            📁
                                                                        </button>
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

                                    {/* Horaires Hiérarchiques */}
                                    {formData.dateDebut && formData.dateFin && (
                                        <div className="bg-white border rounded-lg overflow-hidden">
                                            <div className="bg-yellow-50 p-4 border-b">
                                                <h4 className="font-medium text-yellow-800 flex items-center gap-2">
                                                    🕰️ Horaires Hiérarchiques
                                                </h4>
                                            </div>
                                            <div className="p-4 space-y-4">
                                                {/* Mode horaire global */}
                                                <div className="flex items-center gap-4">
                                                    <label className="text-sm font-medium text-gray-700">Mode horaire:</label>
                                                    <select
                                                        value={formData.modeHoraire || 'heures-jour'}
                                                        onChange={(e) => updateField('modeHoraire', e.target.value)}
                                                        className="text-sm border rounded px-2 py-1"
                                                    >
                                                        <option value="heures-jour">Heures de jour</option>
                                                        <option value="24h-24">24h/24</option>
                                                    </select>
                                                    {formData.modeHoraire === 'heures-jour' && (
                                                        <>
                                                            <input
                                                                type="time"
                                                                value={formData.heuresDebutJour || '08:00'}
                                                                onChange={(e) => updateField('heuresDebutJour', e.target.value)}
                                                                className="text-sm border rounded px-2 py-1"
                                                            />
                                                            <span className="text-gray-500">à</span>
                                                            <input
                                                                type="time"
                                                                value={formData.heuresFinJour || '17:00'}
                                                                onChange={(e) => updateField('heuresFinJour', e.target.value)}
                                                                className="text-sm border rounded px-2 py-1"
                                                            />
                                                        </>
                                                    )}
                                                </div>

                                                {/* Calendrier des jours */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h5 className="font-medium text-gray-700">Planification par jour</h5>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    const defaultSchedules = generateDefaultDailySchedules();
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        horairesParJour: { ...prev.horairesParJour, ...defaultSchedules }
                                                                    }));
                                                                }}
                                                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                                            >
                                                                ⚡ Initialiser
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        horairesParJour: {}
                                                                    }));
                                                                }}
                                                                className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                                            >
                                                                🗑️ Effacer
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-2">
                                                        {getAllDays().map(day => {
                                                            const daySchedule = formData.horairesParJour[day.dateString];
                                                            const is24h = daySchedule?.mode === '24h';
                                                            const isCustom = daySchedule !== undefined && daySchedule !== null;

                                                            return (
                                                                <div
                                                                    key={day.dateString}
                                                                    className={`p-2 border rounded text-center cursor-pointer transition-all ${
                                                                        day.isExplicitlyExcluded
                                                                            ? 'bg-red-100 border-red-300 text-red-700'
                                                                            : !day.included
                                                                                ? 'bg-gray-100 border-gray-300 text-gray-500'
                                                                                : is24h
                                                                                    ? 'bg-purple-100 border-purple-300 text-purple-700'
                                                                                    : isCustom
                                                                                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                                                                                        : day.isWeekend
                                                                                            ? 'bg-orange-50 border-orange-200 text-orange-700'
                                                                                            : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                                                    }`}
                                                                    onClick={() => setSelectedDay(day.dateString)}
                                                                >
                                                                    <div className="text-xs font-medium">{day.dayName}</div>
                                                                    <div className="text-lg font-bold">{day.dayNumber}</div>
                                                                    {isCustom && (
                                                                        <div className="text-xs mt-1">
                                                                            {is24h ? '24h' : `${daySchedule.heureDebut}-${daySchedule.heureFin}`}
                                                                        </div>
                                                                    )}
                                                                    <div className="flex justify-center gap-1 mt-1">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                toggleDay24h(day.dateString);
                                                                            }}
                                                                            className={`w-4 h-4 rounded text-xs ${
                                                                                is24h ? 'bg-purple-500 text-white' : 'bg-gray-300 hover:bg-purple-300'
                                                                            }`}
                                                                            title={is24h ? 'Mode 24h actif' : 'Activer mode 24h'}
                                                                        >
                                                                            {is24h ? '✓' : '24'}
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                toggleDayInclusion(day.dateString);
                                                                            }}
                                                                            className={`w-4 h-4 rounded text-xs ${
                                                                                day.included ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                                                            }`}
                                                                            title={day.included ? 'Jour inclus' : 'Jour exclu'}
                                                                        >
                                                                            {day.included ? '✓' : '✗'}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Détail du jour sélectionné */}
                                                {selectedDay && (
                                                    <div className="bg-gray-50 p-4 rounded-lg">
                                                        <h6 className="font-medium text-gray-700 mb-3">
                                                            Détail pour {getAllDays().find(d => d.dateString === selectedDay)?.dayName} {getAllDays().find(d => d.dateString === selectedDay)?.dayNumber}
                                                        </h6>

                                                        {/* Assignations personnel pour ce jour */}
                                                        <div className="space-y-3">
                                                            <div>
                                                                <h6 className="text-sm font-medium text-gray-600 mb-2">
                                                                    Personnel assigné ({getAssignedPersonnelForDay(selectedDay).length})
                                                                </h6>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                    {getAssignedPersonnelForDay(selectedDay).map(person => (
                                                                        <div
                                                                            key={person.id}
                                                                            onClick={() => togglePersonnelForDay(selectedDay, person.id)}
                                                                            className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded cursor-pointer hover:bg-red-50 hover:border-red-300 transition-colors"
                                                                            title="Cliquer pour retirer de ce jour"
                                                                        >
                                                                            <div className="flex-1">
                                                                                <div className="font-medium text-sm">
                                                                                    {person.prenom ? `${person.prenom} ${person.nom}` : person.nom}
                                                                                </div>
                                                                                <div className="text-xs text-gray-600">{person.poste}</div>
                                                                            </div>
                                                                            <div className="text-green-600">✓</div>
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                {/* Personnel disponible à ajouter */}
                                                                {personnel && personnel.length > 0 && (
                                                                    <div className="mt-3">
                                                                        <h6 className="text-sm font-medium text-gray-600 mb-2">Ajouter du personnel</h6>
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                            {personnel
                                                                                .filter(person => !getAssignedPersonnelForDay(selectedDay).find(ap => ap.id === person.id))
                                                                                .map(person => (
                                                                                    <div
                                                                                        key={person.id}
                                                                                        onClick={() => togglePersonnelForDay(selectedDay, person.id)}
                                                                                        className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded cursor-pointer hover:bg-green-50 hover:border-green-300 transition-colors"
                                                                                        title="Cliquer pour assigner à ce jour"
                                                                                    >
                                                                                        <div className="flex-1">
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
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

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
                                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                                        <div className="text-4xl">🔄</div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white flex items-center">
                                                Récurrence des Tâches
                                            </h3>
                                            <p className="text-sm text-gray-200">
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

                        {/* Onglet Équipes Avancées */}
                        {activeTab === 'teams' && (
                            <div className="h-full overflow-y-auto p-6">
                                <div className="space-y-6">
                                    {/* Header Équipes */}
                                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg">
                                        <div className="text-4xl">🎯</div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white flex items-center">
                                                Gestion Avancée des Équipes
                                            </h3>
                                            <p className="text-sm text-gray-200">
                                                Optimisation automatique et gestion personnalisée des horaires d'équipe
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