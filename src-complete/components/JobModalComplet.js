/**
 * JobModal COMPLET - Version B3hoWdZQh 
 * EXTRAIT DE LA VERSION COMPLÈTE (3546 lignes de fonctionnalités)
 * Contient TOUT: Gantt avancé, algorithmes de planification, équipes, récurrence, etc.
 */

import { Icon } from '../UI/Icon.js';
import { Modal } from '../Modal.js';
import { ResourceSelector } from '../ResourceSelector.js';

const { useState, useEffect, useCallback, useMemo } = React;

export const JobModal = ({ 
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
        }) => {
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
                dureePreviewHours: '', // Durée prévue en heures
                includeWeekendsInDuration: false, // Inclure fins de semaine dans calcul durée
                etapes: [], // [{text: '', completed: false, duration: 1, isParallel: false, dependencies: [], priority: 'normal', baseline: {startDate: '', endDate: '', duration: 1}}]
                preparation: [], // Liste de préparation [{text: '', statut: 'a_reserver|en_commande|fait'}]
                typeHoraire: 'jour', // 'jour', 'nuit' ou '24h'
                horairesIndividuels: {}, // {personnelId: 'jour'|'nuit'}
                recurrence: {
                    active: false,
                    type: 'hebdomadaire', // 'hebdomadaire', 'mensuel', 'annuel'
                    intervalle: 1, // Tous les X semaines/mois/années
                    finRecurrence: 'date', // 'date' ou 'occurrences'
                    dateFinRecurrence: '',
                    nombreOccurrences: 10
                },
                equipes: [], // [{id: '', nom: '', membres: [], horaire: 'jour|nuit', heureDebut: '', heureFin: '', actif: true}]
                assignationsEquipes: {}, // {etapeIndex: equipeId}
                modeHoraireEquipes: 'global', // 'global' ou 'individuel'
                // Fonctionnalités Gantt avancées
                ganttBaseline: {}, // Sauvegarde du planning initial
                criticalPath: [], // Chemin critique automatiquement calculé
                showCriticalPath: false, // Affichage du chemin critique
                ganttViewMode: 'days', // 'hours', 'days', 'weeks', 'months'
                // Système d'équipes illimitées ultra-intelligent
                equipesNumerotees: {}, // {id: {membres: [personnelIds], nom: 'Équipe X', actif: true, horaire: 'jour|nuit', auto: true}}
                ganttMode: 'individuel', // 'individuel' ou 'equipe'
                prochainNumeroEquipe: 1, // Compteur auto-incrémenté
                equipeAutoGeneration: true // Génération automatique selon horaire
            });

            const [modificationMode, setModificationMode] = useState('groupe');
            const [ressourceIndividuelle, setRessourceIndividuelle] = useState(null);
            const [typeRessourceIndividuelle, setTypeRessourceIndividuelle] = useState('personnel');
            const [modificationsIndividuelles, setModificationsIndividuelles] = useState({});
            const [newSousTraitant, setNewSousTraitant] = useState('');
            
            // États pour les fonctionnalités Gantt avancées
            const [activeTab, setActiveTab] = useState('form'); // 'form' ou 'gantt'
            const [ganttFullscreen, setGanttFullscreen] = useState(false);
            const [ganttData, setGanttData] = useState({
                tasks: [],
                assignments: [],
                mode: 'global' // 'global' ou 'individuel'
            });

            // Fonctions de gestion des fichiers
            const handleFilesAdded = (files, type) => {
                const newFiles = files.map(file => ({
                    id: Date.now() + Math.random(),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    url: URL.createObjectURL(file),
                    file: file
                }));

                if (type === 'documents') {
                    setFormData(prev => ({
                        ...prev,
                        documents: [...prev.documents, ...newFiles]
                    }));
                } else if (type === 'photos') {
                    setFormData(prev => ({
                        ...prev,
                        photos: [...prev.photos, ...newFiles]
                    }));
                }
            };

            const removeFile = (fileToRemove, type) => {
                if (type === 'documents') {
                    setFormData(prev => ({
                        ...prev,
                        documents: prev.documents.filter(f => f.id !== fileToRemove.id)
                    }));
                } else if (type === 'photos') {
                    setFormData(prev => ({
                        ...prev,
                        photos: prev.photos.filter(f => f.id !== fileToRemove.id)
                    }));
                }
            };

            // Générer un numéro de job automatique
            const generateJobNumber = useCallback(() => {
                const year = new Date().getFullYear();
                const month = String(new Date().getMonth() + 1).padStart(2, '0');
                const existingNumbers = jobs
                    .filter(j => j.numeroJob?.startsWith(`G${year.toString().slice(-2)}-${month}`))
                    .map(j => parseInt(j.numeroJob.split('-')[1]) || 0);
                const nextNumber = Math.max(0, ...existingNumbers) + 1;
                return `G${year.toString().slice(-2)}-${month}${String(nextNumber).padStart(2, '0')}`;
            }, [jobs]);

            // Fonction pour ajouter un sous-traitant
            const handleAddSousTraitant = () => {
                if (newSousTraitant.trim()) {
                    const newId = addSousTraitant(newSousTraitant);
                    if (newId) {
                        setFormData(prev => ({
                            ...prev,
                            sousTraitants: [...(prev.sousTraitants || []), newId]
                        }));
                        setNewSousTraitant('');
                        addNotification(`Sous-traitant "${newSousTraitant}" ajouté avec succès`, 'success');
                    }
                }
            };

            // ============== FONCTIONS GANTT AVANCÉES ==============
            
            // Calcul de la charge de travail par équipe
            const calculateTeamWorkload = (equipes, etapes, assignationsEquipes) => {
                const workload = {};
                
                equipes.forEach(equipe => {
                    workload[equipe.id] = {
                        team: equipe,
                        tasks: [],
                        totalHours: 0,
                        estimatedEndTime: null
                    };
                });
                
                // Calculer les tâches assignées à chaque équipe
                Object.entries(assignationsEquipes || {}).forEach(([etapeIndex, equipeId]) => {
                    const etape = etapes[parseInt(etapeIndex)];
                    if (etape && workload[equipeId]) {
                        workload[equipeId].tasks.push({
                            index: parseInt(etapeIndex),
                            etape: etape,
                            duration: etape.duration || 0.25
                        });
                        workload[equipeId].totalHours += (etape.duration || 0.25);
                    }
                });
                
                return workload;
            };
            
            const generateGanttTasks = () => {
                if (!formData.etapes.length || !formData.dateDebut) {
                    return [];
                }
                const startDate = new Date(formData.dateDebut + 'T' + (formData.heureDebut || '08:00'));
                
                // Calculer les heures par jour selon le type d'horaire
                let dailyHours;
                if (formData.typeHoraire === '24h') {
                    dailyHours = 24;
                } else {
                    const [debutH, debutM] = (formData.heureDebut || '08:00').split(':').map(Number);
                    const [finH, finM] = (formData.heureFin || '17:00').split(':').map(Number);
                    const debutMinutes = debutH * 60 + debutM;
                    const finMinutes = finH * 60 + finM;
                    dailyHours = Math.max(1, (finMinutes - debutMinutes) / 60);
                }
                
                // V6.5 ULTRA: Filtrer les étapes actives
                const etapesActives = formData.etapes.filter(e => e.text.trim());
                if (etapesActives.length === 0) return [];
                
                // V6.5 ULTRA: Algorithme de planification avec dépendances (surpasse MS Project)
                const tasks = [];
                const taskCompletionTimes = {}; // Stockage des temps de fin de chaque tâche
                
                // Fonction pour calculer la date de début d'une tâche basée sur ses dépendances
                const calculateStartDate = (etape, etapeIndex) => {
                    let startTime = new Date(startDate);
                    
                    if (etape.dependencies && etape.dependencies.length > 0) {
                        let latestEndTime = new Date(startDate);
                        
                        etape.dependencies.forEach(depIndex => {
                            const depTask = tasks.find(t => t.originalIndex === depIndex);
                            if (depTask) {
                                let depEndTime = new Date(depTask.endDate);
                                const dependencyType = etape.dependencyType || 'FS';
                                const leadLag = (etape.leadLag || 0) * 60 * 60 * 1000; // Convert hours to ms
                                
                                switch (dependencyType) {
                                    case 'FS': // Finish-to-Start (défaut MS Project)
                                        depEndTime = new Date(depTask.endDate);
                                        break;
                                    case 'SS': // Start-to-Start
                                        depEndTime = new Date(depTask.startDate);
                                        break;
                                    case 'FF': // Finish-to-Finish
                                        depEndTime = new Date(depTask.endDate);
                                        const taskDuration = (etape.duration || 0.25) * 60 * 60 * 1000;
                                        depEndTime = new Date(depEndTime.getTime() - taskDuration);
                                        break;
                                    case 'SF': // Start-to-Finish
                                        depEndTime = new Date(depTask.startDate);
                                        const currentTaskDuration = (etape.duration || 0.25) * 60 * 60 * 1000;
                                        depEndTime = new Date(depEndTime.getTime() - currentTaskDuration);
                                        break;
                                }
                                
                                // Appliquer le lead/lag
                                depEndTime.setTime(depEndTime.getTime() + leadLag);
                                
                                if (depEndTime > latestEndTime) {
                                    latestEndTime = depEndTime;
                                }
                            }
                        });
                        
                        startTime = latestEndTime;
                    }
                    
                    return startTime;
                };
                
                // Trier les étapes par ordre de dépendance (topological sort)
                const sortedEtapes = [];
                const visited = new Set();
                const visiting = new Set();
                
                const visit = (etapeIndex) => {
                    if (visiting.has(etapeIndex)) {
                        console.warn(`Dépendance circulaire détectée à l'étape ${etapeIndex + 1}`);
                        return;
                    }
                    
                    if (visited.has(etapeIndex)) return;
                    
                    visiting.add(etapeIndex);
                    const etape = etapesActives[etapeIndex];
                    
                    if (etape && etape.dependencies) {
                        etape.dependencies.forEach(depIndex => {
                            if (depIndex < etapesActives.length) {
                                visit(depIndex);
                            }
                        });
                    }
                    
                    visiting.delete(etapeIndex);
                    visited.add(etapeIndex);
                    sortedEtapes.push({ etape, originalIndex: etapeIndex });
                };
                
                // Visiter toutes les étapes
                for (let i = 0; i < etapesActives.length; i++) {
                    visit(i);
                }
                
                // Traiter les étapes dans l'ordre de dépendance
                sortedEtapes.forEach(({ etape, originalIndex }) => {
                    const taskDuration = etape.duration || 0.25;
                    const taskStartTime = calculateStartDate(etape, originalIndex);
                    const taskEndTime = new Date(taskStartTime);
                    taskEndTime.setTime(taskStartTime.getTime() + (taskDuration * 60 * 60 * 1000));
                    
                    tasks.push({
                        id: etape.id || `task-${originalIndex}`,
                        name: etape.text,
                        startDate: taskStartTime.toISOString(),
                        endDate: taskEndTime.toISOString(),
                        duration: taskDuration,
                        completed: etape.completed || false,
                        order: originalIndex,
                        priority: etape.priority || 'normal',
                        isParallel: etape.isParallel || false,
                        dependencies: etape.dependencies || [],
                        dependencyType: etape.dependencyType || 'FS',
                        leadLag: etape.leadLag || 0,
                        originalIndex: originalIndex // Pour les références
                    });
                    
                    taskCompletionTimes[originalIndex] = taskEndTime;
                });
                
                // V6.5 ULTRA: Calcul du chemin critique avec les nouvelles dépendances
                const criticalPath = calculateCriticalPath(tasks);
                
                return tasks;
            };

            const generateGanttAssignments = (tasks) => {
                if (ganttData.mode === 'global') {
                    // Mode global : toutes les ressources sur toutes les tâches
                    const assignments = [];
                    tasks.forEach(task => {
                        const taskIndex = task.order || task.id;
                        const assignedTeamId = (formData.assignationsEquipes || {})[taskIndex];
                        
                        // V6.4 Ultra-Pro: Gestion équipes numérotées
                        if (assignedTeamId && assignedTeamId.startsWith('equipe-') && formData.equipesNumerotees) {
                            const equipeNum = assignedTeamId.replace('equipe-', '');
                            const assignedEquipe = formData.equipesNumerotees[equipeNum];
                            if (assignedEquipe && assignedEquipe.actif) {
                                // Mode Équipe: Assigner tous les membres de l'équipe numérotée
                                (assignedEquipe.membres || []).forEach(membreId => {
                                    const person = personnel.find(p => p.id === membreId);
                                    if (person) {
                                        assignments.push({
                                            taskId: task.id,
                                            resourceId: membreId,
                                            resourceName: person.nom,
                                            resourceType: 'personnel',
                                            workType: formData.typeHoraire,
                                            teamId: `equipe-${equipeNum}`,
                                            teamName: `Équipe ${equipeNum}`,
                                            teamColor: assignedEquipe.couleur,
                                            isNumericTeam: true
                                        });
                                    }
                                });
                            }
                        } else if (assignedTeamId && formData.equipes) {
                            // Mode classique avec équipes personnalisées
                            const assignedTeam = (formData.equipes || []).find(eq => eq.id === assignedTeamId && eq.actif);
                            if (assignedTeam) {
                                // Assigner tous les membres de l'équipe à cette tâche
                                assignedTeam.membres.forEach(membreId => {
                                    const person = personnel.find(p => p.id === membreId);
                                    if (person) {
                                        assignments.push({
                                            taskId: task.id,
                                            resourceId: membreId,
                                            resourceName: person.nom,
                                            resourceType: 'personnel',
                                            workType: formData.typeHoraire,
                                            teamId: assignedTeamId,
                                            teamName: assignedTeam.nom
                                        });
                                    }
                                });
                            }
                        } else if (formData.ganttMode === 'individuel') {
                            // Mode standard : assigner tout le personnel sélectionné
                            formData.personnel.forEach(personId => {
                                const person = personnel.find(p => p.id === personId);
                                if (person) {
                                    assignments.push({
                                        taskId: task.id,
                                        resourceId: personId,
                                        resourceName: person.nom,
                                        resourceType: 'personnel',
                                        workType: formData.typeHoraire
                                    });
                                }
                            });
                        }
                        
                        // Assigner les équipements (inchangé)
                        formData.equipements.forEach(equipId => {
                            const equip = equipements.find(e => e.id === equipId);
                            if (equip) {
                                assignments.push({
                                    taskId: task.id,
                                    resourceId: equipId,
                                    resourceName: equip.nom,
                                    resourceType: 'equipement',
                                    workType: formData.typeHoraire
                                });
                            }
                        });
                    });
                    return assignments;
                } else {
                    // Mode individuel : assignations spécifiques par tâche
                    return [];
                }
            };

            // V6.7: ALGORITHME PROFESSIONNEL CPM (Critical Path Method)
            const calculateCriticalPath = (tasks) => {
                if (!tasks || tasks.length === 0) return [];
                
                try {
                    // Initialisation avec calculs Forward Pass (ES/EF)
                    const taskMap = new Map();
                    tasks.forEach(task => {
                        taskMap.set(task.id, {
                            ...task,
                            ES: 0, // Earliest Start
                            EF: 0, // Earliest Finish
                            LS: 0, // Latest Start  
                            LF: 0, // Latest Finish
                            slack: 0,
                            predecessors: task.dependencies || [],
                            successors: []
                        });
                    });
                    
                    // Construire les liens successeurs
                    tasks.forEach(task => {
                        (task.dependencies || []).forEach(depId => {
                            if (taskMap.has(depId)) {
                                taskMap.get(depId).successors.push(task.id);
                            }
                        });
                    });
                    
                    // FORWARD PASS - Calcul ES et EF
                    const visited = new Set();
                    const calculateEarlyTimes = (taskId) => {
                        if (visited.has(taskId)) return;
                        visited.add(taskId);
                        
                        const task = taskMap.get(taskId);
                        if (!task) return;
                        
                        // Calculer ES (max EF des prédécesseurs)
                        if (task.predecessors.length === 0) {
                            task.ES = 0;
                        } else {
                            task.ES = Math.max(...task.predecessors.map(predId => {
                                const pred = taskMap.get(predId);
                                if (pred) {
                                    calculateEarlyTimes(predId);
                                    return pred.EF;
                                }
                                return 0;
                            }));
                        }
                        
                        // EF = ES + durée (en jours)
                        task.EF = task.ES + Math.ceil((task.duration || 8) / 8);
                    };
                    
                    tasks.forEach(task => calculateEarlyTimes(task.id));
                    
                    // BACKWARD PASS - Calcul LS et LF
                    const finalTasks = Array.from(taskMap.values()).filter(task => task.successors.length === 0);
                    const projectEF = Math.max(...finalTasks.map(task => task.EF));
                    
                    const visitedBackward = new Set();
                    const calculateLateTimes = (taskId) => {
                        if (visitedBackward.has(taskId)) return;
                        visitedBackward.add(taskId);
                        
                        const task = taskMap.get(taskId);
                        if (!task) return;
                        
                        // Calculer LF (min LS des successeurs)
                        if (task.successors.length === 0) {
                            task.LF = projectEF;
                        } else {
                            task.LF = Math.min(...task.successors.map(succId => {
                                const succ = taskMap.get(succId);
                                if (succ) {
                                    calculateLateTimes(succId);
                                    return succ.LS;
                                }
                                return projectEF;
                            }));
                        }
                        
                        // LS = LF - durée
                        task.LS = task.LF - Math.ceil((task.duration || 8) / 8);
                        task.slack = task.LS - task.ES;
                    };
                    
                    finalTasks.forEach(task => calculateLateTimes(task.id));
                    
                    // Identifier le chemin critique (slack = 0)
                    const criticalTaskIds = Array.from(taskMap.values())
                        .filter(task => Math.abs(task.slack) < 0.1)
                        .map(task => task.id);
                    
                    console.log('🎯 Chemin critique CPM:', criticalTaskIds);
                    return criticalTaskIds;
                    
                } catch (error) {
                    console.error('❌ Erreur calcul CPM:', error);
                    // Fallback sur l'ancien algorithme
                    return tasks.length > 0 ? [tasks[tasks.length - 1].id] : [];
                }
            };

            // Fonctions pour équipes illimitées ultra-intelligentes
            const creerNouvelleEquipe = (horaire = null) => {
                const nouveauNumero = formData.prochainNumeroEquipe || 1;
                const horaireDetecte = horaire || detecterHorairePrincipal();
                const equipesExistantes = {...(formData.equipesNumerotees || {})};
                
                console.log(`🔧 Création équipe ${nouveauNumero}, horaire: ${horaireDetecte}`);
                console.log(`📊 Équipes existantes avant:`, equipesExistantes);
                
                const nouvelleEquipe = {
                    membres: [],
                    nom: `Équipe ${nouveauNumero}`,
                    actif: true,
                    couleur: getEquipeColor(nouveauNumero),
                    horaire: horaireDetecte,
                    auto: horaire === null
                };
                
                equipesExistantes[nouveauNumero] = nouvelleEquipe;
                console.log(`📊 Équipes après ajout:`, equipesExistantes);
                
                // Mise à jour en une seule fois avec les deux valeurs
                setFormData(prev => ({
                    ...prev,
                    equipesNumerotees: equipesExistantes,
                    prochainNumeroEquipe: nouveauNumero + 1
                }));
                
                console.log(`✅ Équipe ${nouveauNumero} créée, prochain numéro: ${nouveauNumero + 1}`);
                return nouvelleEquipe;
            };


            const detecterHorairePrincipal = () => {
                if (formData.typeHoraire === '24h') {
                    return 'jour'; // Par défaut jour en 24h
                }
                return formData.typeHoraire; // 'jour' ou 'nuit'
            };

            const getEquipeColor = (numero) => {
                const couleurs = [
                    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
                    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
                    '#14B8A6', '#A855F7', '#F43F5E', '#8B5A2B', '#059669',
                    '#7C3AED', '#DC2626', '#0891B2', '#CA8A04', '#BE123C'
                ];
                return couleurs[(numero - 1) % couleurs.length];
            };

            const supprimerEquipe = (numeroEquipe) => {
                console.log(`🗑️ Suppression équipe ${numeroEquipe}`);
                const equipesExistantes = {...formData.equipesNumerotees};
                delete equipesExistantes[numeroEquipe];
                
                // Nettoyer les assignations
                const assignationsNettoyees = {...formData.assignationsEquipes};
                Object.keys(assignationsNettoyees).forEach(etapeIndex => {
                    if (assignationsNettoyees[etapeIndex] === `equipe-${numeroEquipe}`) {
                        delete assignationsNettoyees[etapeIndex];
                    }
                });
                
                // Mise à jour en une seule fois
                setFormData(prev => ({
                    ...prev,
                    equipesNumerotees: equipesExistantes,
                    assignationsEquipes: assignationsNettoyees
                }));
                
                console.log(`✅ Équipe ${numeroEquipe} supprimée`);
            };

            const modifierEquipe = (numeroEquipe, modifications) => {
                const equipesExistantes = {...formData.equipesNumerotees};
                if (equipesExistantes[numeroEquipe]) {
                    equipesExistantes[numeroEquipe] = {
                        ...equipesExistantes[numeroEquipe],
                        ...modifications
                    };
                    updateField('equipesNumerotees', equipesExistantes);
                }
            };

            const assignerPersonnelEquipe = (personnelId, equipeNum) => {
                console.log('🎯 Assignation personnel:', { personnelId, equipeNum });
                
                if (!personnelId) {
                    console.error('❌ PersonnelId manquant');
                    return;
                }
                
                const equipesNumerotees = {...(formData.equipesNumerotees || {})};
                
                // S'assurer que toutes les équipes ont un tableau membres
                Object.keys(equipesNumerotees).forEach(num => {
                    if (!equipesNumerotees[num].membres) {
                        equipesNumerotees[num].membres = [];
                    }
                });
                
                // Retirer de toutes les autres équipes
                Object.keys(equipesNumerotees).forEach(num => {
                    const avant = equipesNumerotees[num].membres.length;
                    equipesNumerotees[num].membres = equipesNumerotees[num].membres.filter(id => id !== personnelId);
                    if (avant !== equipesNumerotees[num].membres.length) {
                        console.log(`📤 Retiré de équipe ${num}`);
                    }
                });
                
                // Ajouter à la nouvelle équipe si spécifiée
                if (equipeNum && equipesNumerotees[equipeNum]) {
                    if (!equipesNumerotees[equipeNum].membres.includes(personnelId)) {
                        equipesNumerotees[equipeNum].membres.push(personnelId);
                        console.log(`📥 Ajouté à équipe ${equipeNum}`);
                    }
                } else if (equipeNum) {
                    console.warn(`⚠️ Équipe ${equipeNum} n'existe pas`);
                }
                
                console.log('📊 Équipes après assignation:', equipesNumerotees);
                setFormData(prev => ({
                    ...prev,
                    equipesNumerotees: equipesNumerotees
                }));
            };

            const getPersonnelEquipe = (personnelId) => {
                if (!formData.equipesNumerotees) return null;
                for (const [num, equipe] of Object.entries(formData.equipesNumerotees)) {
                    if (equipe.membres && equipe.membres.includes(personnelId)) {
                        return parseInt(num);
                    }
                }
                return null;
            };

            // V6.2: Fonction de sauvegarde baseline
            const saveBaseline = () => {
                const tasks = generateGanttTasks();
                const baseline = {
                    tasks: tasks.map(task => ({
                        id: task.id,
                        startDate: task.startDate,
                        endDate: task.endDate,
                        duration: task.duration
                    })),
                    savedDate: new Date().toISOString(),
                    totalDuration: tasks.reduce((sum, task) => sum + task.duration, 0)
                };
                
                updateField('ganttBaseline', baseline);
                return baseline;
            };

            const updateGanttData = () => {
                const tasks = generateGanttTasks();
                const assignments = generateGanttAssignments(tasks);
                
                // V6.2: Calcul automatique du chemin critique
                const criticalPath = formData.showCriticalPath ? calculateCriticalPath(tasks) : [];
                
                setGanttData(prev => ({
                    ...prev,
                    tasks,
                    assignments,
                    criticalPath
                }));
            };

            // Fonction pour recalculer les dates après réorganisation
            const redistributeTaskDates = (tasks, formData) => {
                if (!tasks.length || !formData.dateDebut || !formData.dureePreviewHours) return tasks;
                
                const baseDate = new Date(`${formData.dateDebut}T${formData.heureDebut || '08:00'}`);
                let currentDate = new Date(baseDate);
                
                const getWorkingHoursPerDay = () => {
                    if (formData.typeHoraire === '24h') return 24;
                    const [startHour, startMin] = (formData.heureDebut || '08:00').split(':').map(Number);
                    const [endHour, endMin] = (formData.heureFin || '17:00').split(':').map(Number);
                    return (endHour + endMin/60) - (startHour + startMin/60);
                };
                
                const hoursPerDay = getWorkingHoursPerDay();
                const totalDuration = parseFloat(formData.dureePreviewHours);
                const stepDuration = totalDuration / tasks.length;
                
                return tasks.map((task, index) => {
                    const stepStartDate = new Date(currentDate);
                    const stepEndDate = new Date(currentDate);
                    stepEndDate.setHours(stepEndDate.getHours() + stepDuration);
                    
                    currentDate = new Date(stepEndDate);
                    
                    return {
                        ...task,
                        startDate: stepStartDate.toISOString(),
                        endDate: stepEndDate.toISOString(),
                        duration: stepDuration,
                        order: index
                    };
                });
            };

            // V6.4 Ultra-Pro: Synchronisation bidirectionnelle automatique
            useEffect(() => {
                if (activeTab === 'gantt') {
                    updateGanttData();
                }
            }, [formData.etapes, formData.dureePreviewHours, formData.dateDebut, formData.heureDebut, formData.heureFin, formData.typeHoraire, formData.includeWeekendsInDuration, formData.personnel, ganttData.mode, activeTab, formData.equipesNumerotees, formData.assignationsEquipes, formData.ganttMode]);

            // Synchronisation automatique des modifications Gantt vers l'événement
            const syncGanttToEvent = () => {
                // Calculer automatiquement la durée totale du projet selon les étapes
                if (formData.etapes && formData.etapes.length > 0) {
                    const totalDuration = formData.etapes.reduce((sum, etape) => {
                        return sum + (parseFloat(etape.duration) || 0.25);
                    }, 0);
                    
                    // Mettre à jour automatiquement si différent
                    if (totalDuration !== parseFloat(formData.dureePreviewHours || 0)) {
                        updateField('dureePreviewHours', totalDuration.toString());
                    }
                }
            };

            // Auto-sync quand les étapes changent
            useEffect(() => {
                syncGanttToEvent();
            }, [formData.etapes]);

            // Sécurité pour les équipes au chargement
            useEffect(() => {
                if (formData.equipesNumerotees && Object.keys(formData.equipesNumerotees).length > 0) {
                    const equipesCorrigees = {...formData.equipesNumerotees};
                    let needsUpdate = false;
                    
                    Object.keys(equipesCorrigees).forEach(num => {
                        if (!Array.isArray(equipesCorrigees[num].membres)) {
                            equipesCorrigees[num].membres = [];
                            needsUpdate = true;
                            console.log(`🔧 Correction membres équipe ${num}`);
                        }
                    });
                    
                    if (needsUpdate) {
                        updateField('equipesNumerotees', equipesCorrigees);
                    }
                }
            }, [formData.equipesNumerotees]);

            // Initialiser le formulaire
            useEffect(() => {
                if (isOpen) {
                    if (job) {
                        // Migration des anciennes données vers le nouveau format
                        setFormData({
                            ...job,
                            personnel: Array.isArray(job.personnel) ? job.personnel : [],
                            equipements: Array.isArray(job.equipements) ? job.equipements : [],
                            sousTraitants: Array.isArray(job.sousTraitants) ? job.sousTraitants : [],
                            documents: Array.isArray(job.documents) ? job.documents : [],
                            photos: Array.isArray(job.photos) ? job.photos : [],
                            etapes: Array.isArray(job.etapes) ? job.etapes : [],
                            preparation: Array.isArray(job.preparation) ? job.preparation : [],
                            horairesIndividuels: job.horairesIndividuels || {},
                            recurrence: job.recurrence || {
                                active: false,
                                type: 'hebdomadaire',
                                intervalle: 1,
                                finRecurrence: 'date',
                                dateFin: '',
                                nombreOccurrences: 1,
                                joursApplicables: []
                            }
                        });
                        setModificationMode('groupe');
                    } else {
                        const today = new Date().toISOString().split('T')[0];
                        setFormData({
                            numeroJob: '',
                            nom: '',
                            description: '',
                            dateDebut: selectedCell?.date || today,
                            heureDebut: '08:00',
                            dateFin: selectedCell?.date || today,
                            heureFin: '17:00',
                            personnel: selectedCell?.personnelId ? [selectedCell.personnelId] : [],
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
                            horairesIndividuels: {}
                        });
                        setModificationMode('groupe');
                    }
                }
            }, [isOpen, job, generateJobNumber, selectedCell]);

            // Charger les plannings individuels existants quand on change de ressource
            useEffect(() => {
                if (ressourceIndividuelle && job?.planningsIndividuels?.[ressourceIndividuelle]) {
                    const planning = job.planningsIndividuels[ressourceIndividuelle];
                    setModificationsIndividuelles(prev => ({
                        ...prev,
                        [ressourceIndividuelle]: {
                            dateDebut: planning.dateDebut,
                            dateFin: planning.dateFin,
                            heureDebut: planning.heureDebut,
                            heureFin: planning.heureFin
                        }
                    }));
                }
            }, [ressourceIndividuelle, job]);

            const handleSubmit = (e) => {
                e.preventDefault();
                if (!formData.numeroJob || !formData.nom || !formData.dateDebut || !formData.bureau) {
                    addNotification('Veuillez remplir les champs obligatoires (numéro, nom, date début, bureau)', 'error');
                    return;
                }

                if (formData.personnel.length === 0 && formData.sousTraitants.length === 0) {
                    addNotification('Veuillez assigner au moins une personne ou un sous-traitant', 'error');
                    return;
                }
                
                if (job && modificationMode === 'individuel' && !ressourceIndividuelle) {
                    addNotification('Veuillez sélectionner une ressource pour la modification individuelle', 'error');
                    return;
                }

                let jobData;
                
                if (job && modificationMode === 'individuel' && ressourceIndividuelle) {
                    // Mode modification individuel : ajouter planning personnalisé à l'événement existant
                    const modifRessource = modificationsIndividuelles[ressourceIndividuelle];
                    
                    jobData = {
                        ...formData,
                        id: job.id,
                        dateCreation: job.dateCreation,
                        dateModification: new Date().toISOString(),
                        // Ajouter les plannings individuels
                        planningsIndividuels: (() => {
                            const plannings = { ...job.planningsIndividuels };
                            
                            if (modifRessource === null) {
                                // Supprimer le planning
                                delete plannings[ressourceIndividuelle];
                            } else if (modifRessource) {
                                // Ajouter/modifier le planning
                                plannings[ressourceIndividuelle] = {
                                    dateDebut: modifRessource.dateDebut || job.dateDebut,
                                    dateFin: modifRessource.dateFin || job.dateFin,
                                    heureDebut: modifRessource.heureDebut || job.heureDebut,
                                    heureFin: modifRessource.heureFin || job.heureFin,
                                    type: typeRessourceIndividuelle
                                };
                            }
                            
                            return plannings;
                        })()
                    };
                } else {
                    // Mode normal
                    jobData = {
                        ...formData,
                        id: job ? job.id : Date.now(),
                        dateCreation: job ? job.dateCreation : new Date().toISOString(),
                        dateModification: new Date().toISOString()
                    };
                }

                onSave(jobData);
                
                const message = job && modificationMode === 'individuel' && ressourceIndividuelle 
                    ? `Planning personnalisé ajouté pour ${
                        typeRessourceIndividuelle === 'personnel' 
                            ? personnel.find(p => p.id === ressourceIndividuelle)?.nom
                            : equipements.find(e => e.id === ressourceIndividuelle)?.nom
                    }`
                    : job ? 'Job modifié avec succès' : 'Job créé avec succès';
                    
                addNotification(message, 'success');
                onClose();
            };

            // Fonction pour calculer la date de fin basée sur la durée et le type d'horaire
            const calculateEndDate = (startDate, durationHours, typeHoraire, includeWeekends, heureDebut = '08:00', heureFin = '17:00') => {
                if (!startDate || !durationHours) return null;
                
                const start = new Date(startDate);
                let totalHours = parseFloat(durationHours);
                let currentDate = new Date(start);
                
                // Calculer les heures par jour selon le type d'horaire
                let dailyHours;
                if (typeHoraire === '24h') {
                    dailyHours = 24;
                } else {
                    // Pour jour/nuit, calculer les heures basées sur heureDebut et heureFin
                    const [debutH, debutM] = heureDebut.split(':').map(Number);
                    const [finH, finM] = heureFin.split(':').map(Number);
                    const debutMinutes = debutH * 60 + debutM;
                    const finMinutes = finH * 60 + finM;
                    dailyHours = Math.max(1, (finMinutes - debutMinutes) / 60); // Au minimum 1h par jour
                }
                
                while (totalHours > 0) {
                    const dayOfWeek = currentDate.getDay(); // 0=dimanche, 6=samedi
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    
                    // Si on inclut pas les fins de semaine et c'est weekend, passer au jour suivant
                    if (!includeWeekends && isWeekend) {
                        currentDate.setDate(currentDate.getDate() + 1);
                        continue;
                    }
                    
                    // Soustraire les heures de la journée
                    if (totalHours >= dailyHours) {
                        totalHours -= dailyHours;
                        currentDate.setDate(currentDate.getDate() + 1);
                    } else {
                        // Dernière journée partielle
                        break;
                    }
                }
                
                // Ajuster pour ne pas finir sur un weekend si non inclus
                if (!includeWeekends) {
                    const finalDayOfWeek = currentDate.getDay();
                    if (finalDayOfWeek === 0) { // Dimanche -> Lundi
                        currentDate.setDate(currentDate.getDate() + 1);
                    } else if (finalDayOfWeek === 6) { // Samedi -> Lundi
                        currentDate.setDate(currentDate.getDate() + 2);
                    }
                }
                
                return currentDate.toISOString().split('T')[0];
            };

            const updateField = (field, value) => {
                setFormData(prev => {
                    const newData = { ...prev, [field]: value };
                    
                    // Auto-ajustement de la date de fin
                    if (field === 'dateDebut' && value && !prev.dateFin) {
                        // Si pas de date de fin, définir par défaut à la même date
                        newData.dateFin = value;
                        // Définir les heures par défaut si pas déjà définies
                        if (!prev.heureDebut) newData.heureDebut = '08:00';
                        if (!prev.heureFin) newData.heureFin = '17:00';
                    }
                    
                    // Recalcul automatique basé sur la durée
                    if ((field === 'dureePreviewHours' || field === 'typeHoraire' || field === 'includeWeekendsInDuration' || field === 'heureDebut' || field === 'heureFin') && 
                        newData.dateDebut && newData.dureePreviewHours) {
                        const calculatedEndDate = calculateEndDate(
                            newData.dateDebut,
                            newData.dureePreviewHours,
                            newData.typeHoraire,
                            newData.includeWeekendsInDuration,
                            newData.heureDebut || '08:00',
                            newData.heureFin || '17:00'
                        );
                        if (calculatedEndDate) {
                            newData.dateFin = calculatedEndDate;
                            // Pour 24h/24h, ajuster les heures
                            if (newData.typeHoraire === '24h') {
                                newData.heureDebut = '00:00';
                                newData.heureFin = '23:59';
                            }
                        }
                    }
                    
                    return newData;
                });
            };

            // Fonctions d'impression
            const printTodos = (type) => {
                const todos = type === 'etapes' ? formData.etapes : formData.preparation;
                const title = type === 'etapes' ? 'Étapes du projet' : 'Préparation et matériel';
                
                const printWindow = window.open('', '_blank');
                const printContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>${title} - ${formData.nom || 'Nouveau projet'}</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; overflow: hidden; }
                            .header img { height: 60px; float: left; margin-right: 20px; }
                            .project-info { margin-bottom: 20px; background: #f5f5f5; padding: 15px; border-radius: 5px; }
                            .todo-item { display: flex; align-items: center; padding: 8px; border-bottom: 1px solid #eee; }
                            .checkbox { width: 15px; height: 15px; margin-right: 10px; }
                            .completed { text-decoration: line-through; color: #666; }
                            .status-badge { padding: 2px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; margin-right: 10px; }
                            .status-a_reserver { background: #fff3cd; color: #856404; }
                            .status-en_commande { background: #cce7ff; color: #0066cc; }
                            .status-fait { background: #d4edda; color: #155724; }
                            .print-date { text-align: right; font-size: 12px; color: #666; margin-top: 20px; }
                            @media print { body { margin: 0; } }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <img src="C-Secur360-logo.png.png" alt="C-Secur360" style="height: 60px; float: left; margin-right: 20px;">
                            <h1>${title}</h1>
                            <h2>${formData.nom || 'Nouveau projet'}</h2>
                        </div>
                        
                        <div class="project-info">
                            <strong>Projet #${formData.numeroJob}</strong><br>
                            ${formData.client ? `Client: ${formData.client}<br>` : ''}
                            ${formData.bureau ? `Bureau: ${formData.bureau}<br>` : ''}
                            ${formData.lieu ? `Lieu: ${formData.lieu}<br>` : ''}
                            ${formData.dateDebut ? `Date: ${formData.dateDebut}${formData.dateFin && formData.dateFin !== formData.dateDebut ? ` au ${formData.dateFin}` : ''}<br>` : ''}
                        </div>
                        
                        <div class="todos">
                            ${todos.length === 0 ? `<p><em>Aucun élément dans ${title.toLowerCase()}</em></p>` : 
                                todos.map((item, index) => `
                                    <div class="todo-item">
                                        <input type="checkbox" class="checkbox" ${type === 'etapes' ? (item.completed ? 'checked' : '') : (item.statut === 'fait' ? 'checked' : '')} disabled>
                                        ${type === 'preparation' ? 
                                            `<span class="status-badge status-${item.statut}">
                                                ${item.statut === 'fait' ? '✓ Fait' : item.statut === 'en_commande' ? 'En commande' : 'À réserver'}
                                            </span>` : ''
                                        }
                                        <span class="${(type === 'etapes' && item.completed) || (type === 'preparation' && item.statut === 'fait') ? 'completed' : ''}">${item.text || 'Élément vide'}</span>
                                    </div>
                                `).join('')
                            }
                        </div>
                        
                        <div class="print-date">
                            Imprimé le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
                        </div>
                    </body>
                    </html>
                `;
                
                printWindow.document.write(printContent);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            };

            const printFullEvent = () => {
                const printWindow = window.open('', '_blank');
                const printContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Événement complet - ${formData.nom || 'Nouveau projet'}</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; font-size: 12px; }
                            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; overflow: hidden; }
                            .header img { height: 60px; float: left; margin-right: 20px; }
                            .section { margin-bottom: 20px; page-break-inside: avoid; }
                            .section-title { font-weight: bold; font-size: 14px; margin-bottom: 10px; padding: 5px; background: #f0f0f0; }
                            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                            .info-item { margin-bottom: 5px; }
                            .todo-item { display: flex; align-items: center; padding: 5px; border-bottom: 1px solid #eee; }
                            .checkbox { width: 12px; height: 12px; margin-right: 8px; }
                            .completed { text-decoration: line-through; color: #666; }
                            .status-badge { padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold; margin-right: 8px; }
                            .status-a_reserver { background: #fff3cd; color: #856404; }
                            .status-en_commande { background: #cce7ff; color: #0066cc; }
                            .status-fait { background: #d4edda; color: #155724; }
                            .resource-list { margin-left: 10px; }
                            .resource-item { padding: 2px 0; }
                            .print-date { text-align: right; font-size: 10px; color: #666; margin-top: 20px; }
                            @media print { body { margin: 0; } .section { page-break-inside: avoid; } }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <img src="C-Secur360-logo.png.png" alt="C-Secur360" style="height: 60px; float: left; margin-right: 20px;">
                            <h1>Fiche complète du projet</h1>
                            <h2>${formData.nom || 'Nouveau projet'}</h2>
                        </div>
                        
                        <div class="section">
                            <div class="section-title">📝 Informations générales</div>
                            <div class="info-grid">
                                <div>
                                    <div class="info-item"><strong>Numéro:</strong> ${formData.numeroJob}</div>
                                    <div class="info-item"><strong>Client:</strong> ${formData.client || 'Non spécifié'}</div>
                                    <div class="info-item"><strong>Bureau:</strong> ${formData.bureau || 'Non spécifié'}</div>
                                    <div class="info-item"><strong>Lieu:</strong> ${formData.lieu || 'Non spécifié'}</div>
                                </div>
                                <div>
                                    <div class="info-item"><strong>Date début:</strong> ${formData.dateDebut} ${formData.heureDebut}</div>
                                    <div class="info-item"><strong>Date fin:</strong> ${formData.dateFin} ${formData.heureFin}</div>
                                    <div class="info-item"><strong>Type d'horaire:</strong> ${formData.typeHoraire === '24h' ? '24h/24h' : formData.typeHoraire === 'nuit' ? 'Nuit' : 'Jour'}</div>
                                    <div class="info-item"><strong>Durée prévue:</strong> ${formData.dureePreviewHours ? formData.dureePreviewHours + 'h' : 'Non spécifiée'}</div>
                                </div>
                            </div>
                        </div>

                        ${(formData.etapes && formData.etapes.length > 0) ? `
                            <div class="section">
                                <div class="section-title">📋 Étapes du projet</div>
                                ${(formData.etapes || []).map((etape, index) => `
                                    <div class="todo-item">
                                        <input type="checkbox" class="checkbox" ${etape.completed ? 'checked' : ''} disabled>
                                        <span class="${etape.completed ? 'completed' : ''}">${etape.text || 'Étape vide'}</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}

                        ${(formData.preparation && formData.preparation.length > 0) ? `
                            <div class="section">
                                <div class="section-title">🛠️ Préparation et matériel</div>
                                ${(formData.preparation || []).map((item, index) => `
                                    <div class="todo-item">
                                        <input type="checkbox" class="checkbox" ${item.statut === 'fait' ? 'checked' : ''} disabled>
                                        <span class="status-badge status-${item.statut}">
                                            ${item.statut === 'fait' ? '✓ Fait' : item.statut === 'en_commande' ? 'En commande' : 'À réserver'}
                                        </span>
                                        <span class="${item.statut === 'fait' ? 'completed' : ''}">${item.text || 'Élément vide'}</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}

                        ${(formData.personnel && formData.personnel.length > 0) ? `
                            <div class="section">
                                <div class="section-title">👥 Personnel assigné</div>
                                <div class="resource-list">
                                    ${(formData.personnel || []).map(id => {
                                        const person = personnel.find(p => p.id === id);
                                        return person ? `<div class="resource-item">• ${person.nom} (${person.poste})</div>` : '';
                                    }).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${(formData.equipements && formData.equipements.length > 0) ? `
                            <div class="section">
                                <div class="section-title">🔧 Équipements</div>
                                <div class="resource-list">
                                    ${(formData.equipements || []).map(id => {
                                        const equip = equipements.find(e => e.id === id);
                                        return equip ? `<div class="resource-item">• ${equip.nom} (${equip.type})</div>` : '';
                                    }).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${formData.sousTraitants.length > 0 ? `
                            <div class="section">
                                <div class="section-title">🏢 Sous-traitants</div>
                                <div class="resource-list">
                                    ${formData.sousTraitants.map(id => {
                                        const st = sousTraitants.find(s => s.id === id);
                                        return st ? `<div class="resource-item">• ${st.nom}</div>` : '';
                                    }).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <div class="print-date">
                            Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
                        </div>
                    </body>
                    </html>
                `;
                
                printWindow.document.write(printContent);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            };

            const printGantt = () => {
                const printWindow = window.open('', '_blank');
                const printContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Diagramme de Gantt - ${formData.nom || 'Nouveau projet'}</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 12px; }
                            .header { border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; display: flex; align-items: center; }
                            .project-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; background: #f8f9fa; padding: 15px; border-radius: 5px; }
                            .gantt-container { overflow-x: auto; }
                            .gantt-table { width: 100%; border-collapse: collapse; font-size: 10px; }
                            .gantt-table th, .gantt-table td { border: 1px solid #ddd; padding: 4px; text-align: left; }
                            .gantt-table th { background: #f1f3f4; font-weight: bold; }
                            .task-row { background: white; }
                            .task-row.completed { background: #e8f5e8; }
                            .gantt-bar { height: 20px; background: linear-gradient(135deg, #4285f4, #1a73e8); border-radius: 3px; position: relative; margin: 2px 0; }
                            .gantt-bar.completed { background: linear-gradient(135deg, #34a853, #137333); }
                            .assignment-list { font-size: 9px; color: #666; margin-top: 2px; }
                            .print-date { text-align: right; font-size: 10px; color: #666; margin-top: 20px; }
                            @media print { 
                                body { margin: 0; } 
                                .gantt-container { overflow: visible; }
                                .gantt-table { font-size: 8px; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <img src="C-Secur360-logo.png.png" alt="C-Secur360" style="height: 60px; margin-right: 20px;">
                            <div>
                                <h1>📊 Diagramme de Gantt</h1>
                                <h2>${formData.nom || 'Nouveau projet'}</h2>
                            </div>
                        </div>
                        
                        <div class="project-info">
                            <div>
                                <div><strong>Numéro:</strong> ${formData.numeroJob}</div>
                                <div><strong>Client:</strong> ${formData.client || 'Non spécifié'}</div>
                                <div><strong>Bureau:</strong> ${formData.bureau || 'Non spécifié'}</div>
                                <div><strong>Mode:</strong> ${ganttData.mode === 'global' ? 'Assignation globale' : 'Assignation individuelle'}</div>
                            </div>
                            <div>
                                <div><strong>Date début:</strong> ${formData.dateDebut} ${formData.heureDebut}</div>
                                <div><strong>Date fin:</strong> ${formData.dateFin} ${formData.heureFin}</div>
                                <div><strong>Durée totale:</strong> ${formData.dureePreviewHours}h</div>
                                <div><strong>Type d'horaire:</strong> ${formData.typeHoraire === '24h' ? '24h/24h' : formData.typeHoraire === 'nuit' ? 'Nuit' : 'Jour'}</div>
                            </div>
                        </div>

                        <div class="gantt-container">
                            <table class="gantt-table">
                                <thead>
                                    <tr>
                                        <th style="width: 200px;">Tâche</th>
                                        <th style="width: 120px;">Date début</th>
                                        <th style="width: 120px;">Date fin</th>
                                        <th style="width: 80px;">Durée</th>
                                        <th>Ressources assignées</th>
                                        <th style="width: 300px;">Timeline</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${ganttData.tasks.map((task, index) => {
                                        const taskAssignments = ganttData.assignments.filter(a => a.taskId === task.id);
                                        const startDate = new Date(task.startDate);
                                        const endDate = new Date(task.endDate);
                                        
                                        return `
                                            <tr class="task-row ${task.completed ? 'completed' : ''}">
                                                <td><strong>${task.name}</strong></td>
                                                <td>${startDate.toLocaleDateString('fr-FR')} ${startDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</td>
                                                <td>${endDate.toLocaleDateString('fr-FR')} ${endDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</td>
                                                <td>${task.duration.toFixed(1)}h</td>
                                                <td>
                                                    ${taskAssignments.map(assignment => 
                                                        `<div class="assignment-list">${assignment.resourceType === 'personnel' ? '👤' : '🔧'} ${assignment.resourceName}</div>`
                                                    ).join('')}
                                                </td>
                                                <td>
                                                    <div class="gantt-bar ${task.completed ? 'completed' : ''}" style="width: 90%; position: relative;">
                                                        <span style="position: absolute; left: 5px; top: 2px; color: white; font-size: 8px; font-weight: bold;">${task.name}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>

                        <div class="print-date">
                            Gantt généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
                        </div>
                    </body>
                    </html>
                `;
                
                printWindow.document.write(printContent);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            };

            const getPriorityColor = (priorite) => {
                switch (priorite) {
                    case 'urgent': return 'border-red-500 bg-red-50';
                    case 'haute': return 'border-orange-500 bg-orange-50';
                    case 'normale': return 'border-blue-500 bg-blue-50';
                    case 'faible': return 'border-gray-500 bg-gray-50';
                    default: return 'border-blue-500 bg-blue-50';
                }
            };

            if (!isOpen) return null;

            return React.createElement(Modal, {
                isOpen,
                onClose,
                title: job ? 'Modifier l\'événement' : 'Nouveau événement',
                size: 'xl'
            },
                // Navigation des onglets
                React.createElement('div', { className: "border-b" },
                    React.createElement('nav', { className: "flex px-6" },
                        React.createElement('button', {
                            onClick: () => {
                                setActiveTab('gantt');
                                updateGanttData();
                            },
                            className: `py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'gantt' 
                                    ? 'border-blue-500 text-blue-600' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`,
                            disabled: !formData.etapes.length || !formData.dureePreviewHours,
                            title: !formData.etapes.length || !formData.dureePreviewHours ? 'Ajoutez des étapes et une durée pour voir le Gantt' : ''
                        },
                            React.createElement('span', null, "📊"),
                            " Gantt",
                            ganttData.tasks.length > 0 && React.createElement('span', { className: "ml-1 bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs" }, ganttData.tasks.length)
                        ),
                        React.createElement('button', {
                            onClick: () => setActiveTab('form'),
                            className: `py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'form' 
                                    ? 'border-blue-500 text-blue-600' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`
                        },
                            React.createElement('span', null, "📝"),
                            " Formulaire"
                        )
                    )
                ),
                // Contenu des onglets
                activeTab === 'form' ? React.createElement('form', { onSubmit: handleSubmit, className: "p-6 space-y-6" },
                    // Mode de modification pour les jobs existants
                    job && React.createElement('div', { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4" },
                        React.createElement('h4', { className: "font-semibold text-yellow-800 mb-2" }, "Mode de modification :"),
                        React.createElement('div', { className: "flex gap-4" },
                            React.createElement('label', { className: "flex items-center gap-2" },
                                React.createElement('input', {
                                    type: "radio",
                                    name: "modificationMode",
                                    value: "groupe",
                                    checked: modificationMode === 'groupe',
                                    onChange: (e) => setModificationMode(e.target.value)
                                }),
                                React.createElement('span', { className: "text-sm" }, "Modifier pour tout le groupe assigné")
                            ),
                            React.createElement('label', { className: "flex items-center gap-2" },
                                React.createElement('input', {
                                    type: "radio",
                                    name: "modificationMode",
                                    value: "individuel",
                                    checked: modificationMode === 'individuel',
                                    onChange: (e) => setModificationMode(e.target.value)
                                }),
                                React.createElement('span', { className: "text-sm" }, "Créer une version individuelle")
                            )
                        ),
                        
                        // Sélection de la ressource à modifier (mode individuel)
                        modificationMode === 'individuel' && job && React.createElement('div', { className: "mt-4 p-3 bg-blue-50 rounded-lg" },
                            React.createElement('h5', { className: "font-medium text-blue-800 mb-2" }, "Créer planning personnalisé pour :"),
                            
                            // Sélection du type de ressource
                            React.createElement('div', { className: "flex gap-4 mb-3" },
                                React.createElement('label', { className: "flex items-center gap-2" },
                                    React.createElement('input', {
                                        type: "radio",
                                        name: "typeRessourceIndividuelle",
                                        value: "personnel",
                                        checked: typeRessourceIndividuelle === 'personnel',
                                        onChange: (e) => {
                                            setTypeRessourceIndividuelle(e.target.value);
                                            setRessourceIndividuelle(null);
                                        }
                                    }),
                                    React.createElement('span', { className: "text-sm" }, "Personnel")
                                ),
                                React.createElement('label', { className: "flex items-center gap-2" },
                                    React.createElement('input', {
                                        type: "radio",
                                        name: "typeRessourceIndividuelle",
                                        value: "equipement",
                                        checked: typeRessourceIndividuelle === 'equipement',
                                        onChange: (e) => {
                                            setTypeRessourceIndividuelle(e.target.value);
                                            setRessourceIndividuelle(null);
                                        }
                                    }),
                                    React.createElement('span', { className: "text-sm" }, "Équipement")
                                )
                            ),
                            
                            // Sélection de la ressource spécifique
                            React.createElement('select', {
                                value: ressourceIndividuelle || '',
                                onChange: (e) => setRessourceIndividuelle(e.target.value || null),
                                className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            },
                                React.createElement('option', { value: "" }, 
                                    typeRessourceIndividuelle === 'personnel' ? "Sélectionner un travailleur" : "Sélectionner un équipement"
                                ),
                                ...(typeRessourceIndividuelle === 'personnel' 
                                    ? personnel.filter(p => job.personnel?.includes(p.id)).map(p =>
                                        React.createElement('option', { key: p.id, value: p.id }, p.nom)
                                    )
                                    : equipements.filter(e => job.equipements?.includes(e.id)).map(e =>
                                        React.createElement('option', { key: e.id, value: e.id }, e.nom)
                                    )
                                )
                            ),
                            
                            // Champs de modification pour la ressource sélectionnée
                            ressourceIndividuelle && React.createElement('div', { className: "mt-3 p-3 bg-white rounded border" },
                                React.createElement('h6', { className: "font-medium mb-2" }, 
                                    `Planning pour ${
                                        typeRessourceIndividuelle === 'personnel' 
                                            ? personnel.find(p => p.id === ressourceIndividuelle)?.nom
                                            : equipements.find(e => e.id === ressourceIndividuelle)?.nom
                                    }`
                                ),
                                React.createElement('div', { className: "grid grid-cols-2 gap-3" },
                                    React.createElement('div', null,
                                        React.createElement('label', { className: "block text-xs font-medium mb-1" }, "Date début personnalisée"),
                                        React.createElement('input', {
                                            type: "date",
                                            value: modificationsIndividuelles[ressourceIndividuelle]?.dateDebut || formData.dateDebut,
                                            onChange: (e) => setModificationsIndividuelles(prev => ({
                                                ...prev,
                                                [ressourceIndividuelle]: {
                                                    ...prev[ressourceIndividuelle],
                                                    dateDebut: e.target.value
                                                }
                                            })),
                                            className: "w-full p-1 text-xs border rounded focus:ring-1 focus:ring-blue-500"
                                        })
                                    ),
                                    React.createElement('div', null,
                                        React.createElement('label', { className: "block text-xs font-medium mb-1" }, "Date fin personnalisée"),
                                        React.createElement('input', {
                                            type: "date",
                                            value: modificationsIndividuelles[ressourceIndividuelle]?.dateFin || formData.dateFin,
                                            onChange: (e) => setModificationsIndividuelles(prev => ({
                                                ...prev,
                                                [ressourceIndividuelle]: {
                                                    ...prev[ressourceIndividuelle],
                                                    dateFin: e.target.value
                                                }
                                            })),
                                            className: "w-full p-1 text-xs border rounded focus:ring-1 focus:ring-blue-500"
                                        })
                                    ),
                                    React.createElement('div', null,
                                        React.createElement('label', { className: "block text-xs font-medium mb-1" }, "Heure début"),
                                        React.createElement('input', {
                                            type: "time",
                                            value: modificationsIndividuelles[ressourceIndividuelle]?.heureDebut || formData.heureDebut,
                                            onChange: (e) => setModificationsIndividuelles(prev => ({
                                                ...prev,
                                                [ressourceIndividuelle]: {
                                                    ...prev[ressourceIndividuelle],
                                                    heureDebut: e.target.value
                                                }
                                            })),
                                            className: "w-full p-1 text-xs border rounded focus:ring-1 focus:ring-blue-500"
                                        })
                                    ),
                                    React.createElement('div', null,
                                        React.createElement('label', { className: "block text-xs font-medium mb-1" }, "Heure fin"),
                                        React.createElement('input', {
                                            type: "time",
                                            value: modificationsIndividuelles[ressourceIndividuelle]?.heureFin || formData.heureFin,
                                            onChange: (e) => setModificationsIndividuelles(prev => ({
                                                ...prev,
                                                [ressourceIndividuelle]: {
                                                    ...prev[ressourceIndividuelle],
                                                    heureFin: e.target.value
                                                }
                                            })),
                                            className: "w-full p-1 text-xs border rounded focus:ring-1 focus:ring-blue-500"
                                        })
                                    )
                                ),
                                // Bouton pour supprimer le planning personnalisé
                                job?.planningsIndividuels?.[ressourceIndividuelle] && 
                                React.createElement('button', {
                                    type: "button",
                                    onClick: () => {
                                        setModificationsIndividuelles(prev => {
                                            const newModifs = { ...prev };
                                            delete newModifs[ressourceIndividuelle];
                                            return newModifs;
                                        });
                                        // Marquer pour suppression lors de la sauvegarde
                                        setModificationsIndividuelles(prev => ({
                                            ...prev,
                                            [ressourceIndividuelle]: null
                                        }));
                                    },
                                    className: "mt-2 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                }, "Supprimer planning personnalisé")
                            )
                        )
                    ),

                    // Informations de base
                    React.createElement('div', { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" },
                        React.createElement('div', { className: "space-y-4" },
                            React.createElement('h3', { className: "text-lg font-semibold border-b pb-2" }, "Informations de base"),
                            
                            React.createElement('div', null,
                                React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Numéro de Job *"),
                                React.createElement('input', {
                                    type: "text",
                                    value: formData.numeroJob,
                                    onChange: (e) => updateField('numeroJob', e.target.value),
                                    className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500",
                                    required: true
                                })
                            ),

                            React.createElement('div', { className: "grid grid-cols-2 gap-4" },
                                React.createElement('div', null,
                                    React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Client"),
                                    React.createElement('input', {
                                        type: "text",
                                        value: formData.client,
                                        onChange: (e) => updateField('client', e.target.value),
                                        className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    })
                                ),
                                React.createElement('div', null,
                                    React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Bureau responsable *"),
                                    React.createElement('select', {
                                        value: formData.bureau,
                                        onChange: (e) => updateField('bureau', e.target.value),
                                        className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500",
                                        required: true
                                    },
                                        React.createElement('option', { value: "" }, "Sélectionner un bureau"),
                                        ...getBureauOptions().slice(1).map(bureau => 
                                            React.createElement('option', { key: bureau.value, value: bureau.value }, bureau.label)
                                        )
                                    )
                                )
                            ),

                            React.createElement('div', null,
                                React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Nom du Job *"),
                                React.createElement('input', {
                                    type: "text",
                                    value: formData.nom,
                                    onChange: (e) => updateField('nom', e.target.value),
                                    className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500",
                                    required: true
                                })
                            ),

                            React.createElement('div', null,
                                React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Lieu"),
                                React.createElement('input', {
                                    type: "text",
                                    value: formData.lieu,
                                    onChange: (e) => updateField('lieu', e.target.value),
                                    className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                })
                            ),

                            // Section Étapes du projet (remplace Description)
                            React.createElement('div', { 
                                className: `p-4 bg-blue-50 rounded-lg border border-blue-200 transition-all duration-300 ${
                                    expandedSections.etapes ? 'fixed inset-4 z-50 bg-white shadow-2xl' : ''
                                }`,
                                onDoubleClick: () => {
                                    setExpandedSections(prev => ({
                                        ...prev,
                                        etapes: !prev.etapes
                                    }));
                                }
                            },
                                React.createElement('h4', { className: `font-medium text-blue-800 flex items-center gap-2 mb-3 ${expandedSections.etapes ? 'text-lg' : ''}` },
                                    React.createElement('span', null, "📋"),
                                    "Description / Étapes du projet",
                                    React.createElement('button', {
                                        onClick: (e) => {
                                            e.stopPropagation();
                                            printTodos('etapes');
                                        },
                                        className: "ml-auto text-blue-600 hover:text-blue-800 p-1 rounded bg-blue-100 hover:bg-blue-200 text-sm",
                                        title: "Imprimer les étapes"
                                    }, "🖨️"),
                                    expandedSections.etapes && React.createElement('button', {
                                        onClick: (e) => {
                                            e.stopPropagation();
                                            setExpandedSections(prev => ({
                                                ...prev,
                                                etapes: false
                                            }));
                                        },
                                        className: "ml-2 text-gray-500 hover:text-gray-700 text-2xl"
                                    }, "×"),
                                    !expandedSections.etapes && React.createElement('span', { className: "ml-2 text-xs text-blue-400" }, "Double-clic pour agrandir")
                                ),
                                
                                // MODE DE PLANIFICATION INTUITIF (Option 1)
                                React.createElement('div', { className: 'mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200' },
                                    React.createElement('div', { className: 'text-sm font-medium text-gray-700 mb-2 flex items-center gap-2' },
                                        React.createElement('span', null, '🎯 Mode de planification'),
                                        React.createElement('span', { className: 'text-xs text-gray-500' }, '(Comment organiser vos étapes ?)')
                                    ),
                                    React.createElement('div', { className: 'grid grid-cols-3 gap-2' },
                                        // Mode Séquentiel
                                        React.createElement('label', { 
                                            className: `flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                (formData.planningMode || 'sequential') === 'sequential' 
                                                    ? 'border-blue-500 bg-blue-100 text-blue-800' 
                                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                                            }`
                                        },
                                            React.createElement('input', {
                                                type: 'radio',
                                                name: 'planningMode',
                                                value: 'sequential',
                                                checked: (formData.planningMode || 'sequential') === 'sequential',
                                                onChange: (e) => {
                                                    updateField('planningMode', e.target.value);
                                                    // Appliquer automatiquement les dépendances séquentielles
                                                    if (e.target.checked) {
                                                        const newEtapes = formData.etapes.map((etape, index) => ({
                                                            ...etape,
                                                            dependencies: index === 0 ? [] : [index - 1],
                                                            dependencyType: 'FS',
                                                            isParallel: false
                                                        }));
                                                        updateField('etapes', newEtapes);
                                                    }
                                                },
                                                className: 'sr-only'
                                            }),
                                            React.createElement('div', { className: 'text-2xl mb-1' }, '🔄'),
                                            React.createElement('div', { className: 'text-xs font-medium' }, 'Séquentiel'),
                                            React.createElement('div', { className: 'text-xs text-gray-500 text-center mt-1' }, '1 → 2 → 3 → 4'),
                                            React.createElement('div', { className: 'text-xs text-gray-400 text-center mt-1' }, 'Chaque étape après la précédente')
                                        ),
                                        
                                        // Mode Parallèle
                                        React.createElement('label', { 
                                            className: `flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                formData.planningMode === 'parallel' 
                                                    ? 'border-green-500 bg-green-100 text-green-800' 
                                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                                            }`
                                        },
                                            React.createElement('input', {
                                                type: 'radio',
                                                name: 'planningMode',
                                                value: 'parallel',
                                                checked: formData.planningMode === 'parallel',
                                                onChange: (e) => {
                                                    updateField('planningMode', e.target.value);
                                                    // Appliquer automatiquement le parallélisme
                                                    if (e.target.checked) {
                                                        const newEtapes = formData.etapes.map(etape => ({
                                                            ...etape,
                                                            dependencies: [],
                                                            isParallel: true
                                                        }));
                                                        updateField('etapes', newEtapes);
                                                    }
                                                },
                                                className: 'sr-only'
                                            }),
                                            React.createElement('div', { className: 'text-2xl mb-1' }, '⚡'),
                                            React.createElement('div', { className: 'text-xs font-medium' }, 'Parallèle'),
                                            React.createElement('div', { className: 'text-xs text-gray-500 text-center mt-1' }, '1,2,3,4 ensemble'),
                                            React.createElement('div', { className: 'text-xs text-gray-400 text-center mt-1' }, 'Toutes en même temps')
                                        ),
                                        
                                        // Mode Mixte
                                        React.createElement('label', { 
                                            className: `flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                formData.planningMode === 'custom' 
                                                    ? 'border-purple-500 bg-purple-100 text-purple-800' 
                                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                                            }`
                                        },
                                            React.createElement('input', {
                                                type: 'radio',
                                                name: 'planningMode',
                                                value: 'custom',
                                                checked: formData.planningMode === 'custom',
                                                onChange: (e) => {
                                                    updateField('planningMode', e.target.value);
                                                    // En mode custom, garder les dépendances actuelles
                                                },
                                                className: 'sr-only'
                                            }),
                                            React.createElement('div', { className: 'text-2xl mb-1' }, '🎛️'),
                                            React.createElement('div', { className: 'text-xs font-medium' }, 'Mixte'),
                                            React.createElement('div', { className: 'text-xs text-gray-500 text-center mt-1' }, 'Personnalisé'),
                                            React.createElement('div', { className: 'text-xs text-gray-400 text-center mt-1' }, 'Contrôle avancé')
                                        )
                                    ),
                                    
                                    // Exemple visuel du mode sélectionné
                                    (formData.planningMode || 'sequential') !== 'custom' && React.createElement('div', { className: 'mt-3 p-2 bg-white rounded border' },
                                        React.createElement('div', { className: 'text-xs font-medium text-gray-600 mb-1' }, 'Aperçu:'),
                                        React.createElement('div', { className: 'flex items-center justify-center gap-2 text-sm' },
                                            (formData.planningMode || 'sequential') === 'sequential' ? 
                                                [1,2,3,4,5].map((num, i) => 
                                                    React.createElement('span', { key: num, className: 'flex items-center' },
                                                        React.createElement('span', { className: 'w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs' }, num),
                                                        i < 4 && React.createElement('span', { className: 'mx-1 text-gray-400' }, '→')
                                                    )
                                                ) :
                                                React.createElement('div', { className: 'flex flex-col items-center' },
                                                    React.createElement('div', { className: 'flex items-center gap-1' },
                                                        [1,2,3,4,5].map(num => 
                                                            React.createElement('span', { 
                                                                key: num, 
                                                                className: 'w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs' 
                                                            }, num)
                                                        )
                                                    ),
                                                    React.createElement('div', { className: 'text-xs text-green-600 mt-1' }, '↑ Toutes démarrent ensemble')
                                                )
                                        )
                                    )
                                ),
                                
                                React.createElement('div', { 
                                    className: `space-y-2 mb-3 ${
                                        expandedSections.etapes 
                                            ? 'overflow-y-auto max-h-[70vh]' 
                                            : 'max-h-40 overflow-y-auto'
                                    }`,
                                    style: expandedSections.etapes ? { maxHeight: 'calc(100vh - 200px)' } : {}
                                },
                                    formData.etapes.map((etape, index) => 
                                        React.createElement('div', { 
                                            key: `etape-${etape.id || index}`,
                                            className: `group flex items-center gap-2 p-2 bg-white rounded border hover:shadow-md transition-all ${
                                                expandedSections.etapes ? 'p-3 mb-2' : 'mb-1'
                                            }`,
                                            draggable: true,
                                            onDragStart: (e) => {
                                                e.dataTransfer.setData('text/plain', JSON.stringify({
                                                    type: 'etape-reorder',
                                                    fromIndex: index,
                                                    etapeData: etape
                                                }));
                                                e.currentTarget.style.opacity = '0.5';
                                            },
                                            onDragEnd: (e) => {
                                                e.currentTarget.style.opacity = '1';
                                            },
                                            onDragOver: (e) => {
                                                e.preventDefault();
                                                e.currentTarget.style.borderColor = '#3b82f6';
                                                e.currentTarget.style.borderWidth = '2px';
                                            },
                                            onDragLeave: (e) => {
                                                e.currentTarget.style.borderColor = '';
                                                e.currentTarget.style.borderWidth = '1px';
                                            },
                                            onDrop: (e) => {
                                                e.preventDefault();
                                                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                                                if (data.type === 'etape-reorder') {
                                                    const newEtapes = [...formData.etapes];
                                                    const draggedEtape = newEtapes.splice(data.fromIndex, 1)[0];
                                                    newEtapes.splice(index, 0, draggedEtape);
                                                    
                                                    // Renumeroter automatiquement
                                                    const renumberedEtapes = newEtapes.map((etape, i) => ({
                                                        ...etape,
                                                        number: i + 1,
                                                        id: etape.id || `etape-${Date.now()}-${i}`
                                                    }));
                                                    
                                                    updateField('etapes', renumberedEtapes);
                                                }
                                                e.currentTarget.style.borderColor = '';
                                                e.currentTarget.style.borderWidth = '1px';
                                            }
                                        },
                                            
                                            // NUMERO AUTOMATIQUE + INDICATEUR MODE + POIGNEE DRAG
                                            React.createElement('div', { className: 'flex items-center gap-2' },
                                                React.createElement('div', {
                                                    className: `w-6 h-6 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-grab active:cursor-grabbing ${
                                                        (formData.planningMode || 'sequential') === 'sequential' ? 'bg-blue-500' :
                                                        formData.planningMode === 'parallel' ? 'bg-green-500' :
                                                        'bg-purple-500'
                                                    }`,
                                                    title: `Étape #${index + 1} - ${
                                                        (formData.planningMode || 'sequential') === 'sequential' ? 'Mode Séquentiel' :
                                                        formData.planningMode === 'parallel' ? 'Mode Parallèle' :
                                                        'Mode Mixte'
                                                    } - Glisser pour réorganiser`
                                                }, (index + 1).toString()),
                                                React.createElement('div', {
                                                    className: 'flex flex-col gap-0.5 text-gray-400 opacity-0 group-hover:opacity-100 cursor-grab',
                                                    title: 'Poignée de glissement'
                                                },
                                                    React.createElement('div', { className: 'w-1 h-0.5 bg-current' }),
                                                    React.createElement('div', { className: 'w-1 h-0.5 bg-current' }),
                                                    React.createElement('div', { className: 'w-1 h-0.5 bg-current' })
                                                )
                                            ),
                                            React.createElement('input', {
                                                type: "checkbox",
                                                checked: etape.completed,
                                                onChange: (e) => {
                                                    const newEtapes = [...formData.etapes];
                                                    newEtapes[index].completed = e.target.checked;
                                                    updateField('etapes', newEtapes);
                                                },
                                                className: "rounded focus:ring-blue-500"
                                            }),
                                            React.createElement('input', {
                                                type: "text",
                                                value: etape.text || '',
                                                onChange: (e) => {
                                                    const newEtapes = [...formData.etapes];
                                                    newEtapes[index].text = e.target.value;
                                                    updateField('etapes', newEtapes);
                                                },
                                                className: `flex-1 p-1 border rounded focus:ring-2 focus:ring-blue-500 ${etape.completed ? 'line-through text-gray-500' : ''}`,
                                                placeholder: "Description de l'étape..."
                                            }),
                                            
                                            // Durée de l'étape (V6.2)
                                            React.createElement('input', {
                                                type: "number",
                                                value: etape.duration === '' ? '' : (etape.duration || 0.25),
                                                onChange: (e) => {
                                                    const newEtapes = [...formData.etapes];
                                                    let inputValue = e.target.value;
                                                    
                                                    // Permettre la saisie vide temporairement
                                                    if (inputValue === '') {
                                                        newEtapes[index].duration = '';
                                                        updateField('etapes', newEtapes);
                                                        return;
                                                    }
                                                    
                                                    // Convertir la valeur
                                                    let numValue = parseFloat(inputValue);
                                                    
                                                    // Si pas un nombre valide, garder la valeur précédente
                                                    if (isNaN(numValue)) {
                                                        return;
                                                    }
                                                    
                                                    // Appliquer le minimum de 0.25
                                                    if (numValue < 0.25) {
                                                        numValue = 0.25;
                                                    }
                                                    
                                                    newEtapes[index].duration = numValue;
                                                    updateField('etapes', newEtapes);
                                                },
                                                onBlur: (e) => {
                                                    // Au blur, s'assurer qu'il y a une valeur valide
                                                    const newEtapes = [...formData.etapes];
                                                    if (!newEtapes[index].duration || newEtapes[index].duration === '') {
                                                        newEtapes[index].duration = 0.25;
                                                        updateField('etapes', newEtapes);
                                                    }
                                                },
                                                className: "w-20 p-1 border rounded text-center focus:ring-2 focus:ring-blue-500",
                                                placeholder: "1",
                                                min: "0.25",
                                                step: "0.25",
                                                title: "Saisissez directement (ex: 15) puis ajustez avec +/- si besoin"
                                            }),
                                            React.createElement('div', { className: "flex flex-col items-center" },
                                                React.createElement('span', { className: "text-gray-500 text-xs" }, "h"),
                                                etape.duration && etape.duration >= 1 && React.createElement('span', { 
                                                    className: "text-xs text-blue-600 mt-0.5",
                                                    title: `${etape.duration}h = ${Math.floor(etape.duration)}h${((etape.duration % 1) * 60) > 0 ? ` ${((etape.duration % 1) * 60)}min` : ''}`
                                                }, 
                                                    etape.duration % 1 === 0 ? `${etape.duration}h` : 
                                                    `${Math.floor(etape.duration)}h${Math.round((etape.duration % 1) * 60)}min`
                                                )
                                            ),
                                            
                                            // Priorité de l'étape (V6.2)
                                            React.createElement('select', {
                                                value: etape.priority || 'normal',
                                                onChange: (e) => {
                                                    const newEtapes = [...formData.etapes];
                                                    newEtapes[index].priority = e.target.value;
                                                    updateField('etapes', newEtapes);
                                                },
                                                className: "p-1 border rounded focus:ring-2 focus:ring-red-500 text-xs",
                                                title: "Priorité de l'étape"
                                            },
                                                React.createElement('option', { value: 'low' }, "🟢 Basse"),
                                                React.createElement('option', { value: 'normal' }, "🟡 Normale"),
                                                React.createElement('option', { value: 'high' }, "🟠 Haute"),
                                                React.createElement('option', { value: 'critical' }, "🔴 Critique")
                                            ),
                                            
                                            // INDICATEUR SIMPLE DES DEPENDANCES SELON LE MODE
                                            formData.planningMode !== 'custom' && React.createElement('div', { 
                                                className: `text-xs px-2 py-1 rounded ${
                                                    (formData.planningMode || 'sequential') === 'sequential' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                    'bg-green-50 text-green-700 border border-green-200'
                                                }`
                                            },
                                                (formData.planningMode || 'sequential') === 'sequential' ? 
                                                    (index === 0 ? '🚀 Première étape' : `➡️ Après étape ${index}`) :
                                                    '⚡ Démarre avec toutes les autres'
                                            ),
                                            
                                            // V6.5 ULTRA: Contrôles de dépendance MS Project+ (Visible uniquement en mode Mixte)
                                            formData.planningMode === 'custom' && React.createElement('div', { className: "flex flex-col gap-1 border-l-2 border-purple-300 pl-2" },
                                                React.createElement('div', { className: "text-xs text-purple-600 font-medium mb-1" }, "🎛️ Mode Mixte - Contrôles avancés"),
                                                React.createElement('div', { className: "flex items-center gap-2" },
                                                    React.createElement('span', { 
                                                        className: "text-xs font-medium text-blue-700",
                                                        title: "Gestion des dépendances entre étapes"
                                                    }, "🔗 Dépendances"),
                                                    React.createElement('select', {
                                                        value: etape.dependencyType || 'FS',
                                                        onChange: (e) => {
                                                            const newEtapes = [...formData.etapes];
                                                            newEtapes[index].dependencyType = e.target.value;
                                                            updateField('etapes', newEtapes);
                                                        },
                                                        className: "text-xs border rounded px-1 py-0.5 focus:ring-1 focus:ring-blue-500",
                                                        title: "Type de dépendance"
                                                    },
                                                        React.createElement('option', { value: 'FS', title: 'Finish-to-Start: La tâche prédécesseur doit finir avant que cette tâche commence' }, "FS (Fin→Début)"),
                                                        React.createElement('option', { value: 'SS', title: 'Start-to-Start: Cette tâche ne peut commencer avant que le prédécesseur commence' }, "SS (Début→Début)"),
                                                        React.createElement('option', { value: 'FF', title: 'Finish-to-Finish: Cette tâche ne peut finir avant que le prédécesseur finisse' }, "FF (Fin→Fin)"),
                                                        React.createElement('option', { value: 'SF', title: 'Start-to-Finish: Cette tâche ne peut finir avant que le prédécesseur commence' }, "SF (Début→Fin)")
                                                    )
                                                ),
                                                
                                                // Sélection des prédécesseurs
                                                React.createElement('div', { className: "flex items-center gap-2" },
                                                    React.createElement('label', { className: "text-xs text-gray-600" }, "Après étape(s):"),
                                                    React.createElement('select', {
                                                        multiple: true,
                                                        value: etape.dependencies || [],
                                                        onChange: (e) => {
                                                            const selectedOptions = Array.from(e.target.selectedOptions).map(option => parseInt(option.value));
                                                            const newEtapes = [...formData.etapes];
                                                            newEtapes[index].dependencies = selectedOptions;
                                                            updateField('etapes', newEtapes);
                                                        },
                                                        className: "text-xs border rounded px-1 py-0.5 focus:ring-1 focus:ring-blue-500 max-w-[120px]",
                                                        size: 2
                                                    },
                                                        React.createElement('option', { value: '', disabled: true }, "Aucune"),
                                                        ...formData.etapes.map((e, i) => 
                                                            i !== index && e.text.trim() ? 
                                                                React.createElement('option', { 
                                                                    key: i, 
                                                                    value: i,
                                                                    title: e.text 
                                                                }, `${i + 1}. ${e.text.substring(0, 20)}${e.text.length > 20 ? '...' : ''}`)
                                                                : null
                                                        ).filter(Boolean)
                                                    )
                                                ),
                                                
                                                // Lead/Lag time
                                                (etape.dependencies && etape.dependencies.length > 0) &&
                                                React.createElement('div', { className: "flex items-center gap-2" },
                                                    React.createElement('label', { className: "text-xs text-gray-600" }, "Décalage:"),
                                                    React.createElement('input', {
                                                        type: "number",
                                                        value: etape.leadLag || 0,
                                                        onChange: (e) => {
                                                            const newEtapes = [...formData.etapes];
                                                            newEtapes[index].leadLag = parseFloat(e.target.value) || 0;
                                                            updateField('etapes', newEtapes);
                                                        },
                                                        className: "w-16 text-xs border rounded px-1 py-0.5 focus:ring-1 focus:ring-blue-500",
                                                        step: "0.25",
                                                        title: "Décalage en heures (négatif = avance, positif = retard)"
                                                    }),
                                                    React.createElement('span', { className: "text-xs text-gray-500" }, "h")
                                                )
                                            ),
                                            
                                            // Parallélisme (V6.2) - Maintenant complémentaire aux dépendances
                                            React.createElement('label', { 
                                                className: "flex items-center gap-1 text-xs text-orange-600",
                                                title: "Mode legacy - Utilisez plutôt les dépendances pour un contrôle précis"
                                            },
                                                React.createElement('input', {
                                                    type: "checkbox",
                                                    checked: etape.isParallel || false,
                                                    onChange: (e) => {
                                                        const newEtapes = [...formData.etapes];
                                                        newEtapes[index].isParallel = e.target.checked;
                                                        updateField('etapes', newEtapes);
                                                    },
                                                    className: "rounded focus:ring-orange-500"
                                                }),
                                                "⚡ Parallèle (Legacy)"
                                            ),
                                            
                                            // Sélecteur d'équipe pour cette étape (V6.4 Ultra-Pro)
                                            (formData.ganttMode === 'equipe' && Object.keys(formData.equipesNumerotees || {}).length > 0) ?
                                                React.createElement('div', { className: "flex flex-col gap-1" },
                                                    React.createElement('select', {
                                                        value: formData.assignationsEquipes[index] || '',
                                                        onChange: (e) => {
                                                            const newAssignations = {...formData.assignationsEquipes};
                                                            if (e.target.value) {
                                                                newAssignations[index] = e.target.value;
                                                            } else {
                                                                delete newAssignations[index];
                                                            }
                                                            updateField('assignationsEquipes', newAssignations);
                                                        },
                                                        className: "p-1 border rounded focus:ring-2 focus:ring-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 text-purple-800 min-w-[100px] text-xs font-medium"
                                                    },
                                                        React.createElement('option', { value: '' }, "Aucune équipe"),
                                                        ...Object.entries(formData.equipesNumerotees || {}).map(([num, equipe]) => {
                                                            const membresInfo = (equipe.membres || []).map(personnelId => {
                                                                const person = personnel.find(p => p.id === personnelId);
                                                                const horaire = formData.typeHoraire === '24h' && formData.horairesIndividuels[personnelId] 
                                                                    ? (formData.horairesIndividuels[personnelId] === 'nuit' ? ' 🌙' : ' ☀️')
                                                                    : '';
                                                                return person ? `${person.nom}${horaire}` : '';
                                                            }).filter(Boolean).join(', ');
                                                            
                                                            return React.createElement('option', {
                                                                key: num,
                                                                value: `equipe-${num}`,
                                                                style: { color: equipe.couleur },
                                                                title: membresInfo || 'Aucun membre assigné'
                                                            }, `🏗️ Équipe ${num} (${(equipe.membres || []).length})${equipe.horaire ? ` ${equipe.horaire === 'nuit' ? '🌙' : '☀️'}` : ''}`);
                                                        })
                                                    ),
                                                    // Affichage détaillé des membres avec horaires en mode 24h
                                                    formData.assignationsEquipes[index] && formData.typeHoraire === '24h' && (() => {
                                                        const equipeNum = formData.assignationsEquipes[index]?.replace('equipe-', '');
                                                        const equipe = formData.equipesNumerotees[equipeNum];
                                                        if (!equipe || !equipe.membres || equipe.membres.length === 0) return null;
                                                        
                                                        return React.createElement('div', { 
                                                            className: "text-xs text-gray-600 bg-gray-50 rounded px-2 py-1 max-w-[200px]",
                                                            title: "Membres de l'équipe et leurs horaires"
                                                        },
                                                            equipe.membres.map(personnelId => {
                                                                const person = personnel.find(p => p.id === personnelId);
                                                                const horaire = formData.horairesIndividuels[personnelId];
                                                                if (!person) return null;
                                                                return React.createElement('div', { 
                                                                    key: personnelId,
                                                                    className: "flex items-center justify-between"
                                                                },
                                                                    React.createElement('span', null, person.nom),
                                                                    React.createElement('span', { 
                                                                        className: horaire === 'nuit' ? 'text-blue-600' : 'text-orange-600'
                                                                    }, horaire === 'nuit' ? '🌙' : '☀️')
                                                                );
                                                            }).filter(Boolean)
                                                        );
                                                    })()
                                                ) :
                                                // Mode classique avec équipes personnalisées
                                                (formData.equipes && formData.equipes.length > 0 && React.createElement('select', {
                                                    value: formData.assignationsEquipes[index] || '',
                                                    onChange: (e) => {
                                                        const newAssignations = {...formData.assignationsEquipes};
                                                        if (e.target.value) {
                                                            newAssignations[index] = e.target.value;
                                                        } else {
                                                            delete newAssignations[index];
                                                        }
                                                        updateField('assignationsEquipes', newAssignations);
                                                    },
                                                    className: "p-1 border rounded focus:ring-2 focus:ring-purple-500 bg-purple-50 text-purple-800 min-w-[120px]"
                                                },
                                                    React.createElement('option', { value: '' }, "Aucune équipe"),
                                                    ...(formData.equipes || []).filter(eq => eq.actif).map(equipe =>
                                                        React.createElement('option', {
                                                            key: equipe.id,
                                                            value: equipe.id
                                                        }, `👥 ${equipe.nom}`)
                                                    )
                                                )),
                                            
                                            // NOUVELLE SECTION: Assignation individuelle personnel et équipements
                                            React.createElement('div', { className: 'border-t border-gray-200 pt-2 mt-2' },
                                                React.createElement('div', { className: 'text-xs font-medium text-gray-700 mb-1' }, '👤 Personnel & 🔧 Équipements'),
                                                
                                                // Personnel assigné
                                                React.createElement('div', { className: 'flex flex-wrap gap-1 mb-2' },
                                                    React.createElement('label', { className: 'text-xs text-gray-600 w-full' }, 'Personnel:'),
                                                    React.createElement('select', {
                                                        multiple: true,
                                                        value: etape.assignedPersonnel || [],
                                                        onChange: (e) => {
                                                            const selectedIds = Array.from(e.target.selectedOptions).map(option => option.value);
                                                            const newEtapes = [...formData.etapes];
                                                            newEtapes[index].assignedPersonnel = selectedIds;
                                                            updateField('etapes', newEtapes);
                                                        },
                                                        className: 'text-xs border rounded px-1 py-0.5 focus:ring-1 focus:ring-blue-500 max-w-[150px] bg-blue-50',
                                                        size: 3
                                                    },
                                                        React.createElement('option', { value: '', disabled: true }, 'Sélectionner...'),
                                                        ...personnel.map(person =>
                                                            React.createElement('option', {
                                                                key: person.id,
                                                                value: person.id,
                                                                title: `${person.nom} - ${person.poste || 'Poste non spécifié'}`
                                                            }, `${person.nom} (${person.poste || 'N/A'})`)
                                                        )
                                                    ),
                                                    
                                                    // Affichage compact du personnel assigné
                                                    etape.assignedPersonnel && etape.assignedPersonnel.length > 0 &&
                                                    React.createElement('div', { className: 'flex flex-wrap gap-1 mt-1' },
                                                        etape.assignedPersonnel.map(personnelId => {
                                                            const person = personnel.find(p => p.id === personnelId);
                                                            if (!person) return null;
                                                            return React.createElement('span', {
                                                                key: personnelId,
                                                                className: 'inline-flex items-center gap-1 px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded',
                                                                title: `${person.nom} - ${person.poste || 'N/A'}`
                                                            },
                                                                React.createElement('span', null, person.nom.split(' ')[0]),
                                                                React.createElement('button', {
                                                                    type: 'button',
                                                                    onClick: () => {
                                                                        const newEtapes = [...formData.etapes];
                                                                        newEtapes[index].assignedPersonnel = (newEtapes[index].assignedPersonnel || []).filter(id => id !== personnelId);
                                                                        updateField('etapes', newEtapes);
                                                                    },
                                                                    className: 'text-blue-600 hover:text-blue-800 text-xs'
                                                                }, '×')
                                                            );
                                                        })
                                                    )
                                                ),
                                                
                                                // Équipements assignés
                                                React.createElement('div', { className: 'flex flex-wrap gap-1' },
                                                    React.createElement('label', { className: 'text-xs text-gray-600 w-full' }, 'Équipements:'),
                                                    React.createElement('select', {
                                                        multiple: true,
                                                        value: etape.assignedEquipment || [],
                                                        onChange: (e) => {
                                                            const selectedIds = Array.from(e.target.selectedOptions).map(option => option.value);
                                                            const newEtapes = [...formData.etapes];
                                                            newEtapes[index].assignedEquipment = selectedIds;
                                                            updateField('etapes', newEtapes);
                                                        },
                                                        className: 'text-xs border rounded px-1 py-0.5 focus:ring-1 focus:ring-orange-500 max-w-[150px] bg-orange-50',
                                                        size: 3
                                                    },
                                                        React.createElement('option', { value: '', disabled: true }, 'Sélectionner...'),
                                                        ...equipements.map(equipment =>
                                                            React.createElement('option', {
                                                                key: equipment.id,
                                                                value: equipment.id,
                                                                title: `${equipment.nom} - ${equipment.type || 'Type non spécifié'}`
                                                            }, `${equipment.nom} (${equipment.type || 'N/A'})`)
                                                        )
                                                    ),
                                                    
                                                    // Affichage compact des équipements assignés
                                                    etape.assignedEquipment && etape.assignedEquipment.length > 0 &&
                                                    React.createElement('div', { className: 'flex flex-wrap gap-1 mt-1' },
                                                        etape.assignedEquipment.map(equipmentId => {
                                                            const equipment = equipements.find(e => e.id === equipmentId);
                                                            if (!equipment) return null;
                                                            return React.createElement('span', {
                                                                key: equipmentId,
                                                                className: 'inline-flex items-center gap-1 px-1 py-0.5 bg-orange-100 text-orange-800 text-xs rounded',
                                                                title: `${equipment.nom} - ${equipment.type || 'N/A'}`
                                                            },
                                                                React.createElement('span', null, equipment.nom.split(' ')[0]),
                                                                React.createElement('button', {
                                                                    type: 'button',
                                                                    onClick: () => {
                                                                        const newEtapes = [...formData.etapes];
                                                                        newEtapes[index].assignedEquipment = (newEtapes[index].assignedEquipment || []).filter(id => id !== equipmentId);
                                                                        updateField('etapes', newEtapes);
                                                                    },
                                                                    className: 'text-orange-600 hover:text-orange-800 text-xs'
                                                                }, '×')
                                                            );
                                                        })
                                                    )
                                                ),
                                                
                                                // Résumé compact des assignations
                                                React.createElement('div', { className: 'text-xs text-gray-500 mt-1 flex gap-2' },
                                                    React.createElement('span', null, 
                                                        `👤 ${(etape.assignedPersonnel || []).length} pers.`
                                                    ),
                                                    React.createElement('span', null, 
                                                        `🔧 ${(etape.assignedEquipment || []).length} équip.`
                                                    )
                                                )
                                            ),
                                            React.createElement('button', {
                                                type: "button",
                                                onClick: () => {
                                                    const newEtapes = formData.etapes.filter((_, i) => i !== index);
                                                    updateField('etapes', newEtapes);
                                                },
                                                className: "text-red-500 hover:text-red-700 p-1"
                                            }, "🗑️")
                                        )
                                    )
                                ),
                                
                                React.createElement('button', {
                                    type: "button",
                                    onClick: () => {
                                        const newEtapes = [...formData.etapes, { 
                                            id: `etape-${Date.now()}-${formData.etapes.length}`,
                                            number: formData.etapes.length + 1,
                                            text: '', 
                                            completed: false,
                                            assignedPersonnel: [],
                                            assignedEquipment: [], 
                                            duration: 0.25, 
                                            isParallel: false, 
                                            dependencies: [], 
                                            priority: 'normal',
                                            baseline: { startDate: '', endDate: '', duration: 0.25 }
                                        }];
                                        updateField('etapes', newEtapes);
                                    },
                                    className: "w-full p-2 border border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                                },
                                    React.createElement('span', null, "➕"),
                                    "Ajouter une étape"
                                ),
                                
                                // Vue d'ensemble des assignations d'équipes
                                formData.equipes && formData.equipes.length > 0 && formData.assignationsEquipes && Object.keys(formData.assignationsEquipes).length > 0 && React.createElement('div', {
                                    className: "mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200"
                                },
                                    React.createElement('h5', { className: "text-sm font-medium text-purple-800 mb-2" },
                                        "👥 Vue d'ensemble des assignations"
                                    ),
                                    React.createElement('div', { className: "space-y-1 text-sm" },
                                        Object.entries(formData.assignationsEquipes || {}).map(([etapeIndex, equipeId]) => {
                                            const etape = formData.etapes[parseInt(etapeIndex)];
                                            
                                            // V6.4 Ultra-Pro: Support équipes numérotées et classiques
                                            let equipeName = '';
                                            let equipeColor = '#6B7280';
                                            
                                            if (equipeId && equipeId.startsWith('equipe-')) {
                                                const equipeNum = equipeId.replace('equipe-', '');
                                                const equipeNumerotee = formData.equipesNumerotees && formData.equipesNumerotees[equipeNum];
                                                if (equipeNumerotee) {
                                                    equipeName = `🏗️ Équipe ${equipeNum} (${(equipeNumerotee.membres || []).length})`;
                                                    equipeColor = equipeNumerotee.couleur;
                                                }
                                            } else if (equipeId) {
                                                const equipe = (formData.equipes || []).find(eq => eq.id === equipeId);
                                                if (equipe) {
                                                    equipeName = `👥 ${equipe.nom}`;
                                                }
                                            }
                                            
                                            if (!etape || !equipeName) return null;
                                            
                                            return React.createElement('div', {
                                                key: etapeIndex,
                                                className: "flex items-center justify-between text-purple-700 p-2 bg-white rounded border hover:shadow-sm transition-shadow"
                                            },
                                                React.createElement('span', { className: "truncate flex-1 text-xs" },
                                                    `Étape ${parseInt(etapeIndex) + 1}: ${etape.text || 'Sans nom'}`
                                                ),
                                                React.createElement('div', { className: "flex items-center gap-2" },
                                                    React.createElement('span', { 
                                                        className: "font-medium ml-2 text-xs px-2 py-1 rounded",
                                                        style: { 
                                                            color: equipeColor,
                                                            backgroundColor: `${equipeColor}15`
                                                        }
                                                    }, equipeName),
                                                    // Modification rapide directement dans l'aperçu
                                                    React.createElement('select', {
                                                        value: equipeId || '',
                                                        onChange: (e) => {
                                                            const newAssignations = {...formData.assignationsEquipes};
                                                            if (e.target.value) {
                                                                newAssignations[etapeIndex] = e.target.value;
                                                            } else {
                                                                delete newAssignations[etapeIndex];
                                                            }
                                                            updateField('assignationsEquipes', newAssignations);
                                                        },
                                                        className: "px-1 py-0.5 border rounded text-xs focus:ring-1 focus:ring-purple-500 bg-white",
                                                        title: "Modification rapide de l'équipe"
                                                    },
                                                        React.createElement('option', { value: '' }, "Aucune"),
                                                        formData.ganttMode === 'equipe' ?
                                                            Object.entries(formData.equipesNumerotees || {}).map(([num, equipe]) =>
                                                                React.createElement('option', { 
                                                                    key: num, 
                                                                    value: `equipe-${num}`,
                                                                    style: { color: equipe.couleur }
                                                                }, `Équipe ${num}`)
                                                            ) :
                                                            (formData.equipes || []).filter(eq => eq.actif).map(equipe =>
                                                                React.createElement('option', { 
                                                                    key: equipe.id, 
                                                                    value: equipe.id 
                                                                }, equipe.nom)
                                                            )
                                                    )
                                                )
                                            );
                                        }).filter(Boolean)
                                    )
                                ),
                                
                                // Section Équipes optimisée
                                React.createElement('div', {
                                    className: "mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200 space-y-2"
                                },
                                    React.createElement('h5', { className: "text-sm font-medium text-purple-800 mb-2 flex items-center justify-between" },
                                        React.createElement('span', null, "👥 Équipes"),
                                        React.createElement('div', { className: "flex gap-2" },
                                            // Créer nouvelle équipe
                                            React.createElement('button', {
                                                type: "button",
                                                onClick: () => creerNouvelleEquipe(),
                                                className: "px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 border border-green-300",
                                                title: "Créer une nouvelle équipe (détection horaire auto)"
                                            }, "➕ Nouvelle Équipe"),
                                            
                                            
                                            // Toggle mode Gantt
                                            React.createElement('select', {
                                                value: formData.ganttMode,
                                                onChange: (e) => updateField('ganttMode', e.target.value),
                                                className: "px-2 py-1 border rounded text-xs focus:ring-2 focus:ring-purple-500 bg-white"
                                            },
                                                React.createElement('option', { value: 'individuel' }, "👤 Mode Individuel"),
                                                React.createElement('option', { value: 'equipe' }, "👥 Mode Équipe")
                                            )
                                        )
                                    ),
                                    
                                    // Assignation personnel aux équipes
                                    formData.ganttMode === 'equipe' && Object.keys(formData.equipesNumerotees || {}).length > 0 && 
                                    React.createElement('div', { className: "space-y-2" },
                                        React.createElement('div', { className: "flex items-center justify-between mb-2" },
                                            React.createElement('h6', { className: "text-xs font-medium text-purple-700" },
                                                "👷 Assignation Personnel → Équipes"
                                            ),
                                            React.createElement('div', { className: "text-xs text-gray-600" },
                                                `${(formData.personnel || []).filter(pId => getPersonnelEquipe(pId) !== null).length}/${(formData.personnel || []).length} assignés`
                                            )
                                        ),
                                        React.createElement('div', { className: "grid grid-cols-1 gap-2 max-h-40 overflow-y-auto" },
                                            (formData.personnel || []).map(personnelId => {
                                                const person = personnel.find(p => p.id === personnelId);
                                                const equipeActuelle = getPersonnelEquipe(personnelId);
                                                const equipeInfo = equipeActuelle ? formData.equipesNumerotees[equipeActuelle] : null;
                                                
                                                return person && React.createElement('div', {
                                                    key: personnelId,
                                                    className: "flex items-center justify-between p-2 bg-white rounded border text-xs hover:shadow-sm transition-shadow",
                                                    style: equipeInfo ? { 
                                                        borderLeftColor: equipeInfo.couleur,
                                                        borderLeftWidth: '3px',
                                                        backgroundColor: `${equipeInfo.couleur}08`
                                                    } : {}
                                                },
                                                    React.createElement('div', { className: "flex items-center gap-2" },
                                                        // Icône horaire de l'équipe
                                                        equipeInfo && React.createElement('span', { 
                                                            className: "text-xs",
                                                            title: `Horaire: ${equipeInfo.horaire}`
                                                        }, equipeInfo.horaire === 'jour' ? '🌞' : '🌙'),
                                                        
                                                        React.createElement('span', { 
                                                            className: `font-medium ${equipeActuelle ? 'text-purple-700' : 'text-gray-600'}` 
                                                        }, 
                                                            person.nom
                                                        ),
                                                        
                                                        // Badge équipe actuelle
                                                        equipeActuelle && React.createElement('span', { 
                                                            className: "px-2 py-1 rounded text-xs font-medium",
                                                            style: { 
                                                                backgroundColor: equipeInfo?.couleur + '20',
                                                                color: equipeInfo?.couleur
                                                            }
                                                        }, `${equipeInfo?.nom || `Équipe ${equipeActuelle}`}`)
                                                    ),
                                                    
                                                    React.createElement('select', {
                                                        value: equipeActuelle || '',
                                                        onChange: (e) => {
                                                            console.log(`Assignation ${person.nom} → Équipe ${e.target.value}`);
                                                            assignerPersonnelEquipe(personnelId, e.target.value || null);
                                                        },
                                                        className: "px-2 py-1 border rounded text-xs focus:ring-2 focus:ring-purple-500 bg-white min-w-[100px]"
                                                    },
                                                        React.createElement('option', { value: '' }, "❌ Aucune"),
                                                        ...Object.entries(formData.equipesNumerotees || {}).map(([num, equipe]) =>
                                                            React.createElement('option', { 
                                                                key: num, 
                                                                value: num,
                                                                style: { color: equipe.couleur }
                                                            }, `${equipe.horaire === 'jour' ? '🌞' : '🌙'} ${equipe.nom}`)
                                                        )
                                                    )
                                                );
                                            }).filter(Boolean)
                                        )
                                    ),
                                    
                                    // Aperçu des équipes
                                    Object.keys(formData.equipesNumerotees || {}).length > 0 && React.createElement('div', {
                                        className: "mt-3 p-2 bg-white rounded border space-y-1"
                                    },
                                        React.createElement('div', { className: "text-xs font-medium text-gray-700 mb-2 flex items-center justify-between" }, 
                                            React.createElement('span', null, `📊 Aperçu Équipes (${Object.keys(formData.equipesNumerotees || {}).length} créée${Object.keys(formData.equipesNumerotees || {}).length !== 1 ? 's' : ''})`),
                                            React.createElement('div', { className: "flex gap-1" },
                                                // Bouton création rapide jour
                                                formData.typeHoraire === '24h' && React.createElement('button', {
                                                    type: "button",
                                                    onClick: () => creerNouvelleEquipe('jour'),
                                                    className: "px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200 border border-yellow-300",
                                                    title: "Créer équipe JOUR"
                                                }, "🌞 J"),
                                                
                                                // Bouton création rapide nuit  
                                                formData.typeHoraire === '24h' && React.createElement('button', {
                                                    type: "button",
                                                    onClick: () => creerNouvelleEquipe('nuit'),
                                                    className: "px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs hover:bg-indigo-200 border border-indigo-300",
                                                    title: "Créer équipe NUIT"
                                                }, "🌙 N"),
                                                
                                                // Bouton suppression toutes équipes
                                                Object.keys(formData.equipesNumerotees || {}).length > 0 && React.createElement('button', {
                                                    type: "button",
                                                    onClick: () => {
                                                        if (confirm(`Supprimer toutes les ${Object.keys(formData.equipesNumerotees || {}).length} équipes ?`)) {
                                                            updateField('equipesNumerotees', {});
                                                            updateField('assignationsEquipes', {});
                                                            updateField('prochainNumeroEquipe', 1);
                                                        }
                                                    },
                                                    className: "px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 border border-red-300",
                                                    title: "Supprimer toutes les équipes"
                                                }, "🗑️")
                                            )
                                        ),
                                        Object.entries(formData.equipesNumerotees || {}).map(([num, equipe]) =>
                                            React.createElement('div', {
                                                key: num,
                                                className: "flex items-center justify-between text-xs p-2 rounded border-l-4 hover:shadow-sm transition-shadow",
                                                style: { 
                                                    backgroundColor: `${equipe.couleur}10`,
                                                    borderLeftColor: equipe.couleur
                                                }
                                            },
                                                React.createElement('div', { className: "flex items-center gap-2" },
                                                    // Icône horaire
                                                    React.createElement('span', { 
                                                        className: "text-xs",
                                                        title: `Horaire: ${equipe.horaire}`
                                                    }, equipe.horaire === 'jour' ? '🌞' : equipe.horaire === 'nuit' ? '🌙' : '⏰'),
                                                    
                                                    // Nom modifiable
                                                    React.createElement('input', {
                                                        type: "text",
                                                        value: equipe.nom,
                                                        onChange: (e) => modifierEquipe(num, { nom: e.target.value }),
                                                        className: "bg-transparent border-none p-0 font-medium focus:outline-none focus:bg-white focus:px-1 focus:rounded text-xs min-w-0 flex-1",
                                                        style: { color: equipe.couleur }
                                                    }),
                                                    
                                                    // Sélecteur horaire en mode 24h
                                                    formData.typeHoraire === '24h' && React.createElement('select', {
                                                        value: equipe.horaire,
                                                        onChange: (e) => modifierEquipe(num, { horaire: e.target.value }),
                                                        className: "bg-white border rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-blue-500",
                                                        style: { color: equipe.couleur }
                                                    },
                                                        React.createElement('option', { value: 'jour' }, "🌞 Jour"),
                                                        React.createElement('option', { value: 'nuit' }, "🌙 Nuit")
                                                    )
                                                ),
                                                
                                                React.createElement('div', { className: "flex items-center gap-2" },
                                                    React.createElement('span', { 
                                                        className: "text-gray-600 font-medium px-2 py-1 bg-white rounded",
                                                        title: "Nombre de membres"
                                                    }, `${Array.isArray(equipe.membres) ? equipe.membres.length : 0}`),
                                                    
                                                    // Bouton supprimer équipe
                                                    React.createElement('button', {
                                                        type: "button",
                                                        onClick: () => {
                                                            if (confirm(`Supprimer "${equipe.nom}" ?`)) {
                                                                supprimerEquipe(num);
                                                            }
                                                        },
                                                        className: "text-red-500 hover:text-red-700 p-1 hover:bg-red-100 rounded",
                                                        title: "Supprimer cette équipe"
                                                    }, "×")
                                                )
                                            )
                                        )
                                    )
                                ),
                                
                                // V6.2: Section contrôles Gantt avancés
                                React.createElement('div', {
                                    className: "mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200 space-y-3"
                                },
                                    React.createElement('h5', { className: "text-sm font-medium text-indigo-800 mb-2" },
                                        "⚙️ Contrôles Gantt avancés (V6.2)"
                                    ),
                                    
                                    React.createElement('div', { className: "flex flex-wrap gap-3" },
                                        // Bouton sauvegarde baseline
                                        React.createElement('button', {
                                            type: "button",
                                            onClick: saveBaseline,
                                            className: "px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-xs hover:bg-indigo-200 border border-indigo-300",
                                            title: "Sauvegarder le planning actuel comme référence"
                                        }, "💾 Sauver Baseline"),
                                        
                                        // Toggle chemin critique
                                        React.createElement('label', { 
                                            className: "flex items-center gap-1 text-xs text-red-700",
                                            title: "Afficher le chemin critique en rouge"
                                        },
                                            React.createElement('input', {
                                                type: "checkbox",
                                                checked: formData.showCriticalPath,
                                                onChange: (e) => updateField('showCriticalPath', e.target.checked),
                                                className: "rounded focus:ring-red-500"
                                            }),
                                            "🔴 Chemin critique"
                                        ),
                                        
                                        // Sélecteur vue Gantt
                                        React.createElement('select', {
                                            value: formData.ganttViewMode,
                                            onChange: (e) => updateField('ganttViewMode', e.target.value),
                                            className: "px-2 py-1 border rounded text-xs focus:ring-2 focus:ring-indigo-500"
                                        },
                                            React.createElement('option', { value: 'hours' }, "Vue Heures"),
                                            React.createElement('option', { value: 'days' }, "Vue Jours"),
                                            React.createElement('option', { value: 'weeks' }, "Vue Semaines"),
                                            React.createElement('option', { value: 'months' }, "Vue Mois")
                                        )
                                    ),
                                    
                                    // Informations baseline
                                    formData.ganttBaseline && formData.ganttBaseline.savedDate && React.createElement('div', {
                                        className: "text-xs text-gray-600 mt-2 p-2 bg-white rounded border"
                                    },
                                        React.createElement('span', { className: "font-medium" }, "📊 Baseline sauvée: "),
                                        new Date(formData.ganttBaseline.savedDate).toLocaleString(),
                                        React.createElement('span', { className: "ml-2" }, 
                                            `(${formData.ganttBaseline.totalDuration}h total)`
                                        )
                                    )
                                ),
                                
                                React.createElement('div', {
                                    className: "mt-4 p-3 bg-green-50 rounded-lg border border-green-200"
                                },
                                    React.createElement('h5', { className: "font-medium text-green-800 text-center" },
                                        "🎯 Planificateur C-Secur360 V6.4"
                                    ),
                                    React.createElement('div', { className: "text-xs text-green-600 text-center mt-1" },
                                        `Durée totale: ${
                                            formData.etapes && formData.etapes.length > 0 
                                                ? `${formData.etapes.reduce((sum, etape) => sum + (parseFloat(etape.duration) || 0.25), 0)}h`
                                                : '0h'
                                        }`
                                    )
                                )
                            )
                        ),

                        React.createElement('div', { className: "space-y-4" },
                            React.createElement('h3', { className: "text-lg font-semibold border-b pb-2" }, "Planification"),
                            
                            React.createElement('div', { className: "grid grid-cols-2 gap-4" },
                                React.createElement('div', null,
                                    React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Date début *"),
                                    React.createElement('input', {
                                        type: "date",
                                        value: formData.dateDebut,
                                        onChange: (e) => updateField('dateDebut', e.target.value),
                                        className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500",
                                        required: true
                                    })
                                ),
                                React.createElement('div', null,
                                    React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Heure début"),
                                    React.createElement('input', {
                                        type: "time",
                                        value: formData.heureDebut,
                                        onChange: (e) => updateField('heureDebut', e.target.value),
                                        className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    })
                                )
                            ),

                            React.createElement('div', { className: "grid grid-cols-2 gap-4" },
                                React.createElement('div', null,
                                    React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Date fin"),
                                    React.createElement('input', {
                                        type: "date",
                                        value: formData.dateFin,
                                        onChange: (e) => updateField('dateFin', e.target.value),
                                        className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    })
                                ),
                                React.createElement('div', null,
                                    React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Heure fin"),
                                    React.createElement('input', {
                                        type: "time",
                                        value: formData.heureFin,
                                        onChange: (e) => updateField('heureFin', e.target.value),
                                        className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    })
                                )
                            ),

                            // Section Calcul automatique de durée
                            React.createElement('div', { className: "p-4 bg-green-50 rounded-lg space-y-4 border border-green-200" },
                                React.createElement('h4', { className: "font-medium text-green-800 flex items-center gap-2 mb-3" },
                                    React.createElement('span', null, "⏱️"),
                                    "Calcul automatique de durée"
                                ),
                                
                                React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
                                    React.createElement('div', null,
                                        React.createElement('label', { className: "block text-sm font-medium mb-1 text-green-700" }, "Durée prévue (heures)"),
                                        React.createElement('input', {
                                            type: "number",
                                            min: "0",
                                            step: "0.25",
                                            value: formData.dureePreviewHours,
                                            onChange: (e) => updateField('dureePreviewHours', e.target.value),
                                            className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500",
                                            placeholder: "Ex: 96"
                                        })
                                    ),
                                    React.createElement('div', null,
                                        React.createElement('label', { className: "block text-sm font-medium mb-1 text-green-700" }, "Type d'horaire"),
                                        React.createElement('select', {
                                            value: formData.typeHoraire,
                                            onChange: (e) => updateField('typeHoraire', e.target.value),
                                            className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                        },
                                            React.createElement('option', { value: "jour" }, "Jour"),
                                            React.createElement('option', { value: "nuit" }, "Nuit"),
                                            React.createElement('option', { value: "24h" }, "24h/24h")
                                        )
                                    ),
                                    React.createElement('div', { className: "flex items-center justify-center" },
                                        React.createElement('label', { className: "flex items-center gap-2 text-sm font-medium text-green-700" },
                                            React.createElement('input', {
                                                type: "checkbox",
                                                checked: formData.includeWeekendsInDuration,
                                                onChange: (e) => updateField('includeWeekendsInDuration', e.target.checked),
                                                className: "rounded focus:ring-green-500"
                                            }),
                                            "Inclure fins de semaine"
                                        )
                                    )
                                ),
                                
                                React.createElement('p', { className: "text-xs text-green-600" },
                                    "💡 Entrez la durée totale en heures. La date de fin sera calculée automatiquement selon :",
                                    React.createElement('br'),
                                    "• Jour/Nuit : Basé sur vos heures début/fin • 24h/24h : 24h/jour"
                                )
                            ),

                            // Section Récurrence
                            React.createElement('div', { className: "p-4 bg-blue-50 rounded-lg space-y-3" },
                                React.createElement('div', { className: "flex items-center gap-2 mb-3" },
                                    React.createElement('input', {
                                        type: "checkbox",
                                        id: "recurrence-active",
                                        checked: formData.recurrence?.active || false,
                                        onChange: (e) => updateField('recurrence', {
                                            ...(formData.recurrence || {}),
                                            active: e.target.checked
                                        }),
                                        className: "rounded"
                                    }),
                                    React.createElement('label', { 
                                        htmlFor: "recurrence-active",
                                        className: "font-medium text-blue-800" 
                                    }, "🔄 Événement récurrent")
                                ),

                                formData.recurrence?.active && React.createElement('div', { className: "space-y-4" },
                                    // Type de récurrence
                                    React.createElement('div', { className: "grid grid-cols-2 gap-4" },
                                        React.createElement('div', null,
                                            React.createElement('label', { className: "block text-sm font-medium mb-2" }, "Fréquence"),
                                            React.createElement('select', {
                                                value: formData.recurrence?.type || 'hebdomadaire',
                                                onChange: (e) => updateField('recurrence', {
                                                    ...(formData.recurrence || {}),
                                                    type: e.target.value
                                                }),
                                                className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            },
                                                React.createElement('option', { value: "hebdomadaire" }, "Hebdomadaire"),
                                                React.createElement('option', { value: "mensuel" }, "Mensuel"),
                                                React.createElement('option', { value: "annuel" }, "Annuel")
                                            )
                                        ),
                                        React.createElement('div', null,
                                            React.createElement('label', { className: "block text-sm font-medium mb-2" }, 
                                                `Répéter tous les ${formData.recurrence?.intervalle || 1} ${
                                                    (formData.recurrence?.type || 'hebdomadaire') === 'hebdomadaire' ? 'semaine(s)' :
                                                    (formData.recurrence?.type || 'hebdomadaire') === 'mensuel' ? 'mois' : 'année(s)'
                                                }`
                                            ),
                                            React.createElement('input', {
                                                type: "number",
                                                min: "1",
                                                max: "12",
                                                value: formData.recurrence?.intervalle || 1,
                                                onChange: (e) => updateField('recurrence', {
                                                    ...(formData.recurrence || {}),
                                                    intervalle: parseInt(e.target.value) || 1
                                                }),
                                                className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            })
                                        )
                                    ),

                                    // Fin de récurrence
                                    React.createElement('div', null,
                                        React.createElement('label', { className: "block text-sm font-medium mb-2" }, "Fin de récurrence"),
                                        React.createElement('div', { className: "flex gap-4 mb-3" },
                                            React.createElement('label', { className: "flex items-center gap-2" },
                                                React.createElement('input', {
                                                    type: "radio",
                                                    name: "finRecurrence",
                                                    value: "date",
                                                    checked: (formData.recurrence?.finRecurrence || 'date') === 'date',
                                                    onChange: (e) => updateField('recurrence', {
                                                        ...(formData.recurrence || {}),
                                                        finRecurrence: e.target.value
                                                    })
                                                }),
                                                React.createElement('span', { className: "text-sm" }, "Jusqu'à une date")
                                            ),
                                            React.createElement('label', { className: "flex items-center gap-2" },
                                                React.createElement('input', {
                                                    type: "radio",
                                                    name: "finRecurrence",
                                                    value: "occurrences",
                                                    checked: (formData.recurrence?.finRecurrence || 'date') === 'occurrences',
                                                    onChange: (e) => updateField('recurrence', {
                                                        ...(formData.recurrence || {}),
                                                        finRecurrence: e.target.value
                                                    })
                                                }),
                                                React.createElement('span', { className: "text-sm" }, "Nombre d'occurrences")
                                            )
                                        ),

                                        (formData.recurrence?.finRecurrence || 'date') === 'date' ? 
                                            React.createElement('input', {
                                                type: "date",
                                                value: formData.recurrence?.dateFinRecurrence || '',
                                                onChange: (e) => updateField('recurrence', {
                                                    ...(formData.recurrence || {}),
                                                    dateFinRecurrence: e.target.value
                                                }),
                                                className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            }) :
                                            React.createElement('input', {
                                                type: "number",
                                                min: "1",
                                                max: "100",
                                                value: formData.recurrence?.nombreOccurrences || 10,
                                                onChange: (e) => updateField('recurrence', {
                                                    ...(formData.recurrence || {}),
                                                    nombreOccurrences: parseInt(e.target.value) || 1
                                                }),
                                                className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500",
                                                placeholder: "Nombre d'événements"
                                            })
                                    )
                                )
                            ),


                            React.createElement('div', { className: "grid grid-cols-2 gap-4" },
                                React.createElement('div', null,
                                    React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Priorité"),
                                    React.createElement('select', {
                                        value: formData.priorite,
                                        onChange: (e) => updateField('priorite', e.target.value),
                                        className: `w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${getPriorityColor(formData.priorite)}`
                                    },
                                        React.createElement('option', { value: "faible" }, "Faible"),
                                        React.createElement('option', { value: "normale" }, "Normale"),
                                        React.createElement('option', { value: "haute" }, "Haute"),
                                        React.createElement('option', { value: "urgent" }, "Urgent")
                                    )
                                ),
                                React.createElement('div', null,
                                    React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Statut"),
                                    React.createElement('select', {
                                        value: formData.statut,
                                        onChange: (e) => updateField('statut', e.target.value),
                                        className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    },
                                        React.createElement('option', { value: "planifie" }, "Planifié"),
                                        React.createElement('option', { value: "tentatif" }, "Tentatif"),
                                        React.createElement('option', { value: "reporte" }, "Reporté"),
                                        React.createElement('option', { value: "annule" }, "Annulé")
                                    )
                                )
                            ),


                            // Section Préparation (remplace Notes)
                            React.createElement('div', { 
                                className: `p-4 bg-orange-50 rounded-lg border border-orange-200 transition-all duration-300 ${
                                    expandedSections.preparation ? 'fixed inset-4 z-50 bg-white shadow-2xl' : ''
                                }`,
                                onDoubleClick: () => {
                                    setExpandedSections(prev => ({
                                        ...prev,
                                        preparation: !prev.preparation
                                    }));
                                }
                            },
                                React.createElement('h4', { className: `font-medium text-orange-800 flex items-center gap-2 mb-3 ${expandedSections.preparation ? 'text-lg' : ''}` },
                                    React.createElement('span', null, "🛠️"),
                                    "Préparation et matériel",
                                    React.createElement('button', {
                                        onClick: (e) => {
                                            e.stopPropagation();
                                            printTodos('preparation');
                                        },
                                        className: "ml-auto text-orange-600 hover:text-orange-800 p-1 rounded bg-orange-100 hover:bg-orange-200 text-sm",
                                        title: "Imprimer la préparation"
                                    }, "🖨️"),
                                    expandedSections.preparation && React.createElement('button', {
                                        onClick: (e) => {
                                            e.stopPropagation();
                                            setExpandedSections(prev => ({
                                                ...prev,
                                                preparation: false
                                            }));
                                        },
                                        className: "ml-2 text-gray-500 hover:text-gray-700 text-2xl"
                                    }, "×"),
                                    !expandedSections.preparation && React.createElement('span', { className: "ml-2 text-xs text-orange-400" }, "Double-clic pour agrandir")
                                ),
                                
                                React.createElement('div', { 
                                    className: `space-y-2 mb-3 ${
                                        expandedSections.preparation 
                                            ? 'overflow-y-auto max-h-[70vh]' 
                                            : 'max-h-40 overflow-y-auto'
                                    }`,
                                    style: expandedSections.preparation ? { maxHeight: 'calc(100vh - 200px)' } : {}
                                },
                                    formData.preparation.map((item, index) => 
                                        React.createElement('div', { 
                                            key: index,
                                            className: `flex items-center gap-2 p-2 bg-white rounded border ${
                                                expandedSections.preparation ? 'p-3' : ''
                                            }`
                                        },
                                            React.createElement('select', {
                                                value: item.statut,
                                                onChange: (e) => {
                                                    const newPreparation = [...formData.preparation];
                                                    newPreparation[index].statut = e.target.value;
                                                    updateField('preparation', newPreparation);
                                                },
                                                className: `px-2 py-1 border rounded text-xs font-medium ${
                                                    item.statut === 'fait' ? 'bg-green-100 text-green-700 border-green-300' :
                                                    item.statut === 'en_commande' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                                    'bg-yellow-100 text-yellow-700 border-yellow-300'
                                                }`
                                            },
                                                React.createElement('option', { value: "a_reserver" }, "À réserver"),
                                                React.createElement('option', { value: "en_commande" }, "En commande"),
                                                React.createElement('option', { value: "fait" }, "✓ Fait")
                                            ),
                                            React.createElement('input', {
                                                type: "text",
                                                value: item.text,
                                                onChange: (e) => {
                                                    const newPreparation = [...formData.preparation];
                                                    newPreparation[index].text = e.target.value;
                                                    updateField('preparation', newPreparation);
                                                },
                                                className: `flex-1 p-1 border rounded focus:ring-2 focus:ring-orange-500 ${item.statut === 'fait' ? 'line-through text-gray-500' : ''}`,
                                                placeholder: "Matériel, équipement, réservation..."
                                            }),
                                            React.createElement('button', {
                                                type: "button",
                                                onClick: () => {
                                                    const newPreparation = formData.preparation.filter((_, i) => i !== index);
                                                    updateField('preparation', newPreparation);
                                                },
                                                className: "text-red-500 hover:text-red-700 p-1"
                                            }, "🗑️")
                                        )
                                    )
                                ),
                                
                                React.createElement('button', {
                                    type: "button",
                                    onClick: () => {
                                        const newPreparation = [...formData.preparation, { text: '', statut: 'a_reserver' }];
                                        updateField('preparation', newPreparation);
                                    },
                                    className: "w-full p-2 border border-dashed border-orange-300 rounded-lg text-orange-600 hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
                                },
                                    React.createElement('span', null, "➕"),
                                    "Ajouter un élément"
                                ),
                                
                                React.createElement('p', { className: "text-xs text-orange-600 mt-2" },
                                    "💡 Listez les matériaux, équipements et réservations nécessaires. Suivez leur statut de préparation."
                                )
                            )
                        )
                    ),

                    // Sélection des ressources
                    React.createElement('div', null,
                        React.createElement('h3', { className: "text-lg font-semibold mb-4" }, "Assignation des ressources"),
                        React.createElement(ResourceSelector, {
                            selectedPersonnel: formData.personnel,
                            selectedEquipements: formData.equipements,
                            selectedSousTraitants: formData.sousTraitants,
                            onPersonnelChange: (personnel) => updateField('personnel', personnel),
                            onEquipementsChange: (equipements) => updateField('equipements', equipements),
                            onSousTraitantsChange: (sousTraitants) => updateField('sousTraitants', sousTraitants),
                            personnel,
                            equipements,
                            sousTraitants,
                            dateDebut: formData.dateDebut,
                            dateFin: formData.dateFin,
                            jobs: jobs.filter(j => j.id !== job?.id),
                            currentJobId: job?.id
                        }),

                        // Gestion des horaires individuels pour travaux 24h/24h
                        formData.typeHoraire === '24h' && formData.personnel.length > 0 && 
                        React.createElement('div', { className: "mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200" },
                            React.createElement('h4', { className: "font-medium text-amber-800 mb-3 flex items-center gap-2" },
                                React.createElement('span', null, "⏰"),
                                "Horaires individuels (Travaux 24h/24h)"
                            ),
                            React.createElement('p', { className: "text-sm text-amber-700 mb-3" },
                                "Spécifiez l'horaire de chaque travailleur pour ce projet 24h/24h :"
                            ),
                            React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-3" },
                                ...formData.personnel.map(personnelId => {
                                    const person = personnel.find(p => p.id === personnelId);
                                    if (!person) return null;
                                    
                                    return React.createElement('div', { 
                                        key: personnelId,
                                        className: "flex items-center justify-between p-3 bg-white rounded border"
                                    },
                                        React.createElement('span', { className: "font-medium text-sm" }, person.nom),
                                        React.createElement('select', {
                                            value: formData.horairesIndividuels[personnelId] || 'jour',
                                            onChange: (e) => updateField('horairesIndividuels', {
                                                ...formData.horairesIndividuels,
                                                [personnelId]: e.target.value
                                            }),
                                            className: "px-3 py-1 text-sm border rounded focus:ring-2 focus:ring-amber-500"
                                        },
                                            React.createElement('option', { value: "jour" }, "Jour ☀️"),
                                            React.createElement('option', { value: "nuit" }, "Nuit 🌙")
                                        )
                                    );
                                }).filter(Boolean)
                            )
                        )
                    ),

                    // Documents et Photos
                    React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
                        // Documents
                        React.createElement('div', null,
                            React.createElement('label', { className: "block text-sm font-medium mb-2" }, "Documents du projet"),
                            React.createElement(DropZone, {
                                onFilesAdded: (files) => handleFilesAdded(files, 'documents'),
                                acceptedTypes: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
                                className: formData.documents.length > 0 ? 'has-files' : ''
                            },
                                React.createElement('div', { className: "text-center" },
                                    React.createElement(Icon, { name: 'paperclip', size: 32, className: 'mx-auto text-gray-400 mb-2' }),
                                    React.createElement('p', { className: 'text-sm text-gray-600' }, "Glissez vos documents ici"),
                                    React.createElement('p', { className: 'text-xs text-gray-500' }, "PDF, Word, Excel")
                                )
                            ),
                            formData.documents.length > 0 && React.createElement('div', { className: "mt-2 space-y-2" },
                                formData.documents.map(file =>
                                    React.createElement(FilePreview, {
                                        key: file.id,
                                        file: file,
                                        onRemove: (f) => removeFile(f, 'documents')
                                    })
                                )
                            )
                        ),

                        // Photos
                        React.createElement('div', null,
                            React.createElement('label', { className: "block text-sm font-medium mb-2" }, "Photos du projet"),
                            React.createElement(DropZone, {
                                onFilesAdded: (files) => handleFilesAdded(files, 'photos'),
                                acceptedTypes: ['image/*'],
                                className: formData.photos.length > 0 ? 'has-files' : ''
                            },
                                React.createElement('div', { className: "text-center" },
                                    React.createElement(Icon, { name: 'camera', size: 32, className: 'mx-auto text-gray-400 mb-2' }),
                                    React.createElement('p', { className: 'text-sm text-gray-600' }, "Glissez vos photos ici"),
                                    React.createElement('p', { className: 'text-xs text-gray-500' }, "JPG, PNG, GIF")
                                )
                            ),
                            formData.photos.length > 0 && React.createElement('div', { className: "mt-2" },
                                React.createElement(PhotoCarousel, {
                                    photos: formData.photos,
                                    className: "h-32"
                                })
                            )
                        )
                    ),

                    // Boutons d'action
                    React.createElement('div', { className: "flex justify-between pt-6 border-t" },
                        React.createElement('div', { className: "flex gap-2" },
                            job && peutModifier && React.createElement('button', {
                                type: "button",
                                onClick: () => {
                                    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce job ?')) {
                                        onDelete(job.id);
                                        addNotification('Job supprimé avec succès', 'success');
                                        onClose();
                                    }
                                },
                                className: "flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            },
                                React.createElement(Icon, { name: 'trash', size: 16 }),
                                "Supprimer"
                            ),
                            !peutModifier && React.createElement('div', { className: "flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg border" },
                                React.createElement(Icon, { name: 'eye', size: 16 }),
                                "Mode consultation seulement"
                            )
                        ),
                        React.createElement('div', { className: "flex gap-3" },
                            React.createElement('button', {
                                type: "button",
                                onClick: printFullEvent,
                                className: "flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300",
                                title: "Imprimer l'événement complet"
                            },
                                React.createElement('span', null, "🖨️"),
                                React.createElement('span', { className: "hidden sm:inline" }, "Imprimer")
                            ),
                            React.createElement('button', {
                                type: "button",
                                onClick: onClose,
                                className: "px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            }, "Annuler"),
                            peutModifier ? React.createElement('button', {
                                type: "submit",
                                disabled: job && modificationMode === 'individuel' && !ressourceIndividuelle,
                                className: `flex items-center gap-2 px-6 py-2 rounded-lg ${
                                    job && modificationMode === 'individuel' && !ressourceIndividuelle 
                                        ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                                        : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`
                            },
                                React.createElement(Icon, { name: 'save', size: 16 }),
                                job ? (modificationMode === 'individuel' && ressourceIndividuelle ? 
                                    `Créer planning pour ${
                                        typeRessourceIndividuelle === 'personnel' 
                                            ? personnel.find(p => p.id === ressourceIndividuelle)?.nom?.split(' ')[0]
                                            : equipements.find(e => e.id === ressourceIndividuelle)?.nom?.split(' ')[0]
                                    }` : 
                                    modificationMode === 'individuel' ? "Sélectionner une ressource" : "Modifier") : "Créer"
                            ) : React.createElement('button', {
                                type: "button",
                                disabled: true,
                                className: "flex items-center gap-2 px-6 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                            },
                                React.createElement(Icon, { name: 'eye', size: 16 }),
                                "Consultation seulement"
                            )
                        )
                    )
                ) : // Onglet Gantt
                React.createElement('div', {
                    className: `p-6 ${ganttFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`,
                    onDoubleClick: () => setGanttFullscreen(!ganttFullscreen)
                },
                    // En-tête Gantt avec contrôles
                    React.createElement('div', { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6" },
                        React.createElement('div', null,
                            React.createElement('h3', { className: `font-semibold ${ganttFullscreen ? 'text-2xl' : 'text-lg'}` }, "📊 Diagramme de Gantt"),
                            ganttData.tasks.length > 0 && React.createElement('p', { className: "text-sm text-gray-600 mt-1" },
                                `${ganttData.tasks.length} tâche${ganttData.tasks.length > 1 ? 's' : ''} • ${formData.dureePreviewHours}h total`
                            )
                        ),
                        React.createElement('div', { className: "flex flex-wrap items-center gap-3" },
                            React.createElement('select', {
                                value: ganttData.mode,
                                onChange: (e) => setGanttData(prev => ({ ...prev, mode: e.target.value })),
                                className: "px-3 py-1 border rounded text-sm"
                            },
                                React.createElement('option', { value: 'global' }, "Assignation globale"),
                                React.createElement('option', { value: 'individuel' }, "Assignation individuelle")
                            ),
                            React.createElement('button', {
                                onClick: printGantt,
                                className: "flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm",
                                title: "Imprimer le Gantt"
                            },
                                React.createElement('span', null, "🖨️"),
                                ganttFullscreen && "Imprimer"
                            ),
                            ganttFullscreen && React.createElement('button', {
                                onClick: () => setGanttFullscreen(false),
                                className: "px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                            }, "Quitter plein écran"),
                            !ganttFullscreen && React.createElement('span', { className: "text-xs text-gray-400" }, "Double-clic pour plein écran")
                        )
                    ),
                    
                    // Contenu Gantt
                    ganttData.tasks.length === 0 ? 
                        React.createElement('div', { className: "text-center py-12 text-gray-500" },
                            React.createElement('p', { className: "text-gray-500" }, "Ajoutez des étapes et une durée dans le formulaire pour générer le Gantt")
                        ) :
                        React.createElement('div', { 
                            className: `overflow-auto ${ganttFullscreen ? 'max-h-[calc(100vh-200px)]' : 'max-h-96'}` 
                        },
                            // V6.5 ULTRA: Timeline visuel interactif (surpasse MS Project)
                            React.createElement('div', { 
                                id: "ultra-timeline-container",
                                className: "relative bg-white border rounded-lg p-4 mb-4",
                                style: { minHeight: '400px' }
                            },
                                React.createElement('div', { className: "flex justify-between items-center mb-4" },
                                    React.createElement('h3', { className: "text-lg font-bold text-gray-800" }, "📊 Timeline Interactif Ultra-Avancé"),
                                    React.createElement('div', { className: "flex gap-2 text-xs" },
                                        React.createElement('div', { className: "flex items-center gap-1" },
                                            React.createElement('div', { className: "w-3 h-3 bg-red-500 rounded" }),
                                            React.createElement('span', null, "Chemin critique")
                                        ),
                                        React.createElement('div', { className: "flex items-center gap-1" },
                                            React.createElement('div', { className: "w-3 h-3 bg-blue-500 rounded" }),
                                            React.createElement('span', null, "Tâches normales")
                                        ),
                                        React.createElement('div', { className: "flex items-center gap-1" },
                                            React.createElement('div', { className: "w-3 h-3 bg-green-500 rounded" }),
                                            React.createElement('span', null, "Terminées")
                                        )
                                    )
                                ),
                                
                                // Timeline principal avec barres draggables
                                React.createElement('div', { 
                                    className: "relative",
                                    style: { 
                                        background: 'linear-gradient(90deg, #f8f9fa 0%, #ffffff 50%, #f8f9fa 100%)',
                                        minHeight: '300px',
                                        position: 'relative'
                                    }
                                },
                                    // Grille de temps en arrière-plan
                                    React.createElement('svg', {
                                        className: "absolute inset-0 w-full h-full pointer-events-none",
                                        style: { zIndex: 1 }
                                    },
                                        // Lignes verticales pour les jours
                                        ...Array.from({ length: 30 }, (_, i) => 
                                            React.createElement('line', {
                                                key: `vline-${i}`,
                                                x1: `${(i + 1) * (100 / 30)}%`,
                                                y1: '0%',
                                                x2: `${(i + 1) * (100 / 30)}%`,
                                                y2: '100%',
                                                stroke: i % 7 === 0 ? '#e2e8f0' : '#f1f5f9',
                                                strokeWidth: i % 7 === 0 ? '2' : '1'
                                            })
                                        ),
                                        // Lignes horizontales
                                        ...Array.from({ length: ganttData.tasks.length + 1 }, (_, i) => 
                                            React.createElement('line', {
                                                key: `hline-${i}`,
                                                x1: '0%',
                                                y1: `${(i) * (100 / (ganttData.tasks.length + 1))}%`,
                                                x2: '100%',
                                                y2: `${(i) * (100 / (ganttData.tasks.length + 1))}%`,
                                                stroke: '#f1f5f9',
                                                strokeWidth: '1'
                                            })
                                        )
                                    ),
                                    
                                    // Barres de tâches avec information riche
                                    ...ganttData.tasks.map((task, index) => {
                                        const startDate = new Date(task.startDate);
                                        const endDate = new Date(task.endDate);
                                        const projectStart = new Date(formData.dateDebut);
                                        const projectEnd = new Date(formData.dateFin);
                                        
                                        const totalDuration = projectEnd - projectStart;
                                        const taskStart = startDate - projectStart;
                                        const taskDuration = endDate - startDate;
                                        
                                        const leftPercent = (taskStart / totalDuration) * 100;
                                        const widthPercent = (taskDuration / totalDuration) * 100;
                                        const topPercent = (index / ganttData.tasks.length) * 80 + 10;
                                        
                                        const isCritical = ganttData.tasks && calculateCriticalPath(ganttData.tasks).includes(task.id);
                                        const isCompleted = task.completed;
                                        
                                        return React.createElement('div', { 
                                            key: task.id,
                                            className: "absolute transition-all duration-300 hover:z-20 cursor-move group",
                                            style: {
                                                left: `${Math.max(0, leftPercent)}%`,
                                                width: `${Math.max(2, widthPercent)}%`,
                                                top: `${topPercent}%`,
                                                height: '6%',
                                                zIndex: 10
                                            },
                                            title: `${task.name}\nDébut: ${startDate.toLocaleDateString()}\nFin: ${endDate.toLocaleDateString()}\nDurée: ${task.duration}h`
                                        },
                                            // Barre principale de la tâche
                                            React.createElement('div', {
                                                className: `h-full rounded-lg shadow-md border-2 flex items-center px-2 text-white text-xs font-medium group-hover:shadow-xl transition-all ${
                                                    isCompleted ? 'bg-green-500 border-green-400' :
                                                    isCritical ? 'bg-red-500 border-red-400' :
                                                    'bg-blue-500 border-blue-400'
                                                }`,
                                                style: {
                                                    background: isCompleted ? 
                                                        'linear-gradient(135deg, #10b981, #059669)' :
                                                        isCritical ? 
                                                        'linear-gradient(135deg, #ef4444, #dc2626)' :
                                                        'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                                                }
                                            },
                                                React.createElement('span', { 
                                                    className: "truncate",
                                                    style: { 
                                                        fontSize: widthPercent < 10 ? '10px' : '12px',
                                                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                                    }
                                                }, task.name),
                                                
                                                // Indicateurs de progression
                                                isCompleted && React.createElement('span', { className: "ml-1 text-xs" }, "✓"),
                                                isCritical && !isCompleted && React.createElement('span', { className: "ml-1 text-xs animate-pulse" }, "⚡")
                                            ),
                                            
                                            // Info-bulle détaillée au survol
                                            React.createElement('div', {
                                                className: "absolute bottom-full left-0 mb-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30 whitespace-nowrap",
                                                style: { minWidth: '200px' }
                                            },
                                                React.createElement('div', { className: "font-bold border-b border-gray-600 pb-1 mb-2" }, task.name),
                                                React.createElement('div', null, `📅 Début: ${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString()}`),
                                                React.createElement('div', null, `📅 Fin: ${endDate.toLocaleDateString()} ${endDate.toLocaleTimeString()}`),
                                                React.createElement('div', null, `⏱️ Durée: ${task.duration}h`),
                                                React.createElement('div', null, `🔥 Priorité: ${task.priority || 'normale'}`),
                                                task.dependencies && task.dependencies.length > 0 && 
                                                    React.createElement('div', null, `🔗 Dépendances: ${task.dependencies.length}`),
                                                isCritical && React.createElement('div', { className: "text-red-400 font-bold mt-1" }, "⚠️ CHEMIN CRITIQUE"),
                                                isCompleted && React.createElement('div', { className: "text-green-400 font-bold mt-1" }, "✅ TERMINÉ")
                                            )
                                        );
                                    }),
                                    
                                    // Flèches de dépendance
                                    React.createElement('svg', {
                                        className: "absolute inset-0 w-full h-full pointer-events-none",
                                        style: { zIndex: 15 }
                                    },
                                        ...ganttData.tasks.flatMap((task, taskIndex) => {
                                            if (!task.dependencies || task.dependencies.length === 0) return [];
                                            
                                            return task.dependencies.map(depIndex => {
                                                const depTask = ganttData.tasks.find(t => t.originalIndex === depIndex);
                                                if (!depTask) return null;
                                                
                                                const depTaskIndex = ganttData.tasks.indexOf(depTask);
                                                const projectStart = new Date(formData.dateDebut);
                                                const projectEnd = new Date(formData.dateFin);
                                                const totalDuration = projectEnd - projectStart;
                                                
                                                // Position de la tâche prédécesseur
                                                const depEndDate = new Date(depTask.endDate);
                                                const depX = ((depEndDate - projectStart) / totalDuration) * 100;
                                                const depY = (depTaskIndex / ganttData.tasks.length) * 80 + 13;
                                                
                                                // Position de la tâche actuelle
                                                const taskStartDate = new Date(task.startDate);
                                                const taskX = ((taskStartDate - projectStart) / totalDuration) * 100;
                                                const taskY = (taskIndex / ganttData.tasks.length) * 80 + 13;
                                                
                                                const criticalTasks = ganttData.tasks ? calculateCriticalPath(ganttData.tasks) : [];
                                                const isCriticalPath = criticalTasks.includes(task.id) && criticalTasks.includes(depTask.id);
                                                
                                                return React.createElement('g', { key: `arrow-${depTask.id}-${task.id}` },
                                                    // Ligne de connexion
                                                    React.createElement('path', {
                                                        d: `M ${depX}% ${depY}% Q ${(depX + taskX) / 2}% ${(depY + taskY) / 2 - 5}% ${taskX}% ${taskY}%`,
                                                        stroke: isCriticalPath ? '#ef4444' : '#6b7280',
                                                        strokeWidth: isCriticalPath ? '3' : '2',
                                                        fill: 'none',
                                                        markerEnd: 'url(#arrowhead)',
                                                        className: 'drop-shadow-sm'
                                                    }),
                                                    
                                                    // Type de dépendance
                                                    React.createElement('text', {
                                                        x: `${(depX + taskX) / 2}%`,
                                                        y: `${(depY + taskY) / 2 - 7}%`,
                                                        fontSize: '10',
                                                        fill: isCriticalPath ? '#ef4444' : '#6b7280',
                                                        textAnchor: 'middle',
                                                        className: 'font-bold'
                                                    }, task.dependencyType || 'FS')
                                                );
                                            }).filter(Boolean);
                                        }),
                                        
                                        // Définition des marqueurs de flèches
                                        React.createElement('defs', null,
                                            React.createElement('marker', {
                                                id: 'arrowhead',
                                                markerWidth: 10,
                                                markerHeight: 7,
                                                refX: 9,
                                                refY: 3.5,
                                                orient: 'auto'
                                            },
                                                React.createElement('polygon', {
                                                    points: '0 0, 10 3.5, 0 7',
                                                    fill: '#6b7280'
                                                })
                                            )
                                        )
                                    ),
                                    
                                    // Labels des tâches sur la gauche
                                    React.createElement('div', {
                                        className: "absolute left-0 top-0 w-48 h-full bg-gray-50 border-r-2 border-gray-200 overflow-y-auto",
                                        style: { zIndex: 20 }
                                    },
                                        React.createElement('div', { className: "sticky top-0 bg-gray-100 p-2 border-b font-bold text-center" }, "Tâches"),
                                        ...ganttData.tasks.map((task, index) => 
                                            React.createElement('div', {
                                                key: `label-${task.id}`,
                                                className: `p-2 border-b text-sm hover:bg-blue-50 cursor-pointer ${
                                                    ganttData.tasks && calculateCriticalPath(ganttData.tasks).includes(task.id) ? 'bg-red-50 border-red-200' : ''
                                                }`,
                                                style: {
                                                    height: `${80 / ganttData.tasks.length}%`,
                                                    minHeight: '40px'
                                                },
                                                title: task.name
                                            },
                                                React.createElement('div', { className: "font-medium truncate" }, `${index + 1}. ${task.name}`),
                                                React.createElement('div', { className: "text-xs text-gray-600 mt-1" },
                                                    `${task.duration}h • ${task.priority || 'normale'}`
                                                ),
                                                task.dependencies && task.dependencies.length > 0 &&
                                                    React.createElement('div', { className: "text-xs text-blue-600 mt-1" },
                                                        `Après: ${task.dependencies.map(d => d + 1).join(', ')}`
                                                    )
                                            )
                                        )
                                    )
                                )
                            ),
                            
                            // Tableau Gantt classique (optionnel/legacy)
                            React.createElement('table', { className: "w-full border-collapse text-sm" },
                                React.createElement('thead', null,
                                    React.createElement('tr', { className: "bg-gray-50" },
                                        React.createElement('th', { className: "border p-2 text-left w-1/4" }, "Tâche"),
                                        React.createElement('th', { className: "border p-2 text-center w-24" }, "Début"),
                                        React.createElement('th', { className: "border p-2 text-center w-24" }, "Fin"),
                                        React.createElement('th', { className: "border p-2 text-center w-16" }, "Durée"),
                                        React.createElement('th', { className: "border p-2 text-left" }, "Ressources"),
                                        React.createElement('th', { className: "border p-2 text-center w-32" }, "Statut")
                                    )
                                ),
                                React.createElement('tbody', null,
                                    ganttData.tasks.map((task, index) => {
                                        const taskAssignments = ganttData.assignments.filter(a => a.taskId === task.id);
                                        const startDate = new Date(task.startDate);
                                        const endDate = new Date(task.endDate);
                                        
                                        return React.createElement('tr', {
                                            key: task.id,
                                            className: `hover:bg-gray-50 ${task.completed ? 'bg-green-50' : ''}`,
                                            draggable: true,
                                            onDragStart: (e) => e.dataTransfer.setData('text/json', JSON.stringify({
                                                type: 'gantt-task',
                                                taskIndex: index
                                            })),
                                            onDragOver: (e) => e.preventDefault(),
                                            onDrop: (e) => {
                                                e.preventDefault();
                                                const dragData = JSON.parse(e.dataTransfer.getData('text/json'));
                                                if (dragData.type === 'gantt-task' && dragData.taskIndex !== index) {
                                                    const newTasks = [...ganttData.tasks];
                                                    const [draggedTask] = newTasks.splice(dragData.taskIndex, 1);
                                                    newTasks.splice(index, 0, draggedTask);
                                                    setGanttData(prev => ({
                                                        ...prev,
                                                        tasks: redistributeTaskDates(newTasks, formData)
                                                    }));
                                                }
                                            }
                                        },
                                            React.createElement('td', { className: "border p-2" },
                                                React.createElement('div', { className: "flex items-center gap-2" },
                                                    React.createElement('button', {
                                                        onClick: () => {
                                                            const updatedTasks = ganttData.tasks.map(t => 
                                                                t.id === task.id ? { ...t, completed: !t.completed } : t
                                                            );
                                                            setGanttData(prev => ({ ...prev, tasks: updatedTasks }));
                                                        },
                                                        className: `w-4 h-4 border-2 rounded ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`
                                                    }),
                                                    React.createElement('span', { 
                                                        className: task.completed ? 'line-through text-gray-500' : '' 
                                                    }, task.name)
                                                )
                                            ),
                                            React.createElement('td', { className: "border p-2 text-center text-xs" },
                                                startDate.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
                                                React.createElement('br'),
                                                startDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})
                                            ),
                                            React.createElement('td', { className: "border p-2 text-center text-xs" },
                                                endDate.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
                                                React.createElement('br'),
                                                endDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})
                                            ),
                                            React.createElement('td', { className: "border p-2 text-center" },
                                                `${task.duration.toFixed(1)}h`
                                            ),
                                            React.createElement('td', { className: "border p-2" },
                                                React.createElement('div', { className: "flex flex-wrap gap-1" },
                                                    taskAssignments.map(assignment => 
                                                        React.createElement('span', {
                                                            key: assignment.resourceId,
                                                            className: "inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                                                        },
                                                            assignment.resourceType === 'personnel' ? '👤' : '🔧',
                                                            assignment.resourceName
                                                        )
                                                    )
                                                )
                                            ),
                                            React.createElement('td', { className: "border p-2 text-center" },
                                                React.createElement('span', {
                                                    className: `px-2 py-1 rounded-full text-xs ${
                                                        task.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`
                                                }, task.completed ? 'Terminé' : 'En cours')
                                            )
                                        );
                                    })
                                )
                            )
                        )
                )
            );
        };
