/**
 * Composant principal PlanificateurFinal
 * EXTRAIT DE LA VERSION COMPLÈTE B3hoWdZQh (1434 lignes)
 * Contient le calendrier, l'authentification, et toute la logique principale
 */

import { useAppDataWithSync } from '../hooks/useAppDataWithSync.js';
import { useScreenSize } from '../hooks/useScreenSize.js';
import { useNotifications } from '../hooks/useNotifications.js';
import { Icon } from './UI/Icon.js';
import { Modal } from './Modal.js';
import { JobModal } from './JobModalComplet.js';
import { ResourceManagementModal } from './ResourceManagementModal.js';

const { useState, useEffect, useCallback, useMemo } = React;

export const PlanificateurFinal = () => {
            const {
                jobs, setJobs,
                personnel, setPersonnel,
                equipements, setEquipements,
                sousTraitants, setSousTraitants, addSousTraitant,
                typesEquipements, addTypeEquipement,
                demandesConges, setDemandesConges,
                modeTheme, setModeTheme,
                googleDrive, // Service Google Drive
                forceSync    // Fonction de synchronisation manuelle
            } = useAppDataWithSync(); // Utiliser le hook avec synchronisation

            const { isMobile, isTablet } = useScreenSize();
            const { notifications, addNotification } = useNotifications();
            
            const [showJobModal, setShowJobModal] = useState(false);
            const [showResourceModal, setShowResourceModal] = useState(false);
            const [selectedJob, setSelectedJob] = useState(null);
            const [selectedCell, setSelectedCell] = useState(null);
            const [startDate, setStartDate] = useState(new Date(2025, 8, 1));
            const [numberOfDays, setNumberOfDays] = useState(isMobile ? 14 : 30);
            
            // États PWA
            const [deferredPrompt, setDeferredPrompt] = useState(null);
            const [showInstallButton, setShowInstallButton] = useState(false);
            const [searchTerm, setSearchTerm] = useState('');
            const [filterBureau, setFilterBureau] = useState('tous');
            const [filterType, setFilterType] = useState('personnel'); // 'personnel', 'equipements' ou 'global'
            const [showDateNavigator, setShowDateNavigator] = useState(false);
            const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
            const [showAdminLogin, setShowAdminLogin] = useState(false);
            const [adminPassword, setAdminPassword] = useState('');
            const [showMobileMenu, setShowMobileMenu] = useState(false); // État menu hamburger
            
            // États d'authentification utilisateur
            const [utilisateurConnecte, setUtilisateurConnecte] = useState(null);
            const [showUserLogin, setShowUserLogin] = useState(true);
            const [loginForm, setLoginForm] = useState({ nom: '', motDePasse: '' });
            const [modeVueIndividuel, setModeVueIndividuel] = useState(false);
            const [travailleurSelectionne, setTravailleurSelectionne] = useState('');
            const [showCongesModal, setShowCongesModal] = useState(false);
            const [selectedPersonnelConges, setSelectedPersonnelConges] = useState(null);
            
            // Authentification admin
            const handleAdminLogin = () => {
                if (adminPassword === 'MdlAdm321!$') {
                    setIsAdminAuthenticated(true);
                    setShowAdminLogin(false);
                    setAdminPassword('');
                    addNotification('Connexion admin réussie', 'success');
                } else {
                    addNotification('Mot de passe incorrect', 'error');
                    setAdminPassword('');
                }
            };
            
            const requireAdminAuth = () => {
                if (isAdminAuthenticated) {
                    setShowResourceModal(true);
                } else {
                    setShowAdminLogin(true);
                }
            };
            
            // Authentification utilisateur
            const handleUserLogin = (utilisateurIdentifie, motDePasse) => {
                console.log('📥 Réception des données d\'authentification:', {
                    utilisateur: utilisateurIdentifie?.nom,
                    motDePasse: motDePasse,
                    longueurMotDePasse: motDePasse?.length,
                    typeMotDePasse: typeof motDePasse
                });
                console.log('🔐 Authentification avec mot de passe pour:', utilisateurIdentifie?.nom);
                
                if (!utilisateurIdentifie) {
                    console.log('❌ Aucun utilisateur fourni');
                    addNotification('Erreur d\'authentification', 'error');
                    return;
                }
                
                if (!motDePasse) {
                    console.log('❌ Aucun mot de passe fourni');
                    addNotification('Mot de passe requis', 'error');
                    return;
                }
                
                // Vérification du mot de passe avec logs détaillés
                console.log('🔍 SIMPLE - Mot de passe BD:', utilisateurIdentifie.motDePasse);
                console.log('🔍 SIMPLE - Mot de passe saisi:', motDePasse);
                console.log('🔍 SIMPLE - Égaux?', utilisateurIdentifie.motDePasse === motDePasse);
                
                console.log('🔍 DÉBOGAGE CRITIQUE - Détails de vérification:', {
                    utilisateur: utilisateurIdentifie.nom,
                    motDePasseBD: `"${utilisateurIdentifie.motDePasse}"`,
                    motDePasseSaisi: `"${motDePasse}"`,
                    longueurBD: utilisateurIdentifie.motDePasse?.length,
                    longueurSaisi: motDePasse?.length,
                    egal: utilisateurIdentifie.motDePasse === motDePasse,
                    caractereParCaractereBD: utilisateurIdentifie.motDePasse?.split(''),
                    caractereParCaractereSaisi: motDePasse?.split('')
                });
                
                if (utilisateurIdentifie.motDePasse === motDePasse) {
                    console.log('✅ Mot de passe correct pour:', utilisateurIdentifie.nom);
                    setUtilisateurConnecte(utilisateurIdentifie);
                    setShowUserLogin(false);
                    setLoginForm({ nom: '', motDePasse: '' });
                    addNotification(`Connexion réussie - ${utilisateurIdentifie.nom}`, 'success');
                } else {
                    console.log('❌ Mot de passe incorrect pour:', utilisateurIdentifie.nom);
                    console.log('❌ Comparaison détaillée:', {
                        attendu: `"${utilisateurIdentifie.motDePasse}"`,
                        recu: `"${motDePasse}"`,
                        typeAttendu: typeof utilisateurIdentifie.motDePasse,
                        typeRecu: typeof motDePasse
                    });
                    addNotification('Mot de passe incorrect', 'error');
                    // Garder le formulaire pour permettre une nouvelle tentative
                    setLoginForm(prev => ({ ...prev, motDePasse: '' }));
                }
            };
            
            const handleUserLogout = () => {
                setUtilisateurConnecte(null);
                setShowUserLogin(true);
                addNotification('Déconnexion réussie', 'success');
            };
            
            // Fonction pour vérifier les permissions
            const peutModifier = () => {
                if (!utilisateurConnecte) return false;
                if (!utilisateurConnecte.permissions) return false;
                return utilisateurConnecte.permissions.peutModifier === true;
            };
            
            const estCoordonnateur = () => {
                if (!utilisateurConnecte) return false;
                if (!utilisateurConnecte.permissions) return false;
                return utilisateurConnecte.permissions.estCoordonnateur === true;
            };
            
            // Filtrer le personnel visible selon le rôle
            const getPersonnelVisible = () => {
                if (estCoordonnateur()) {
                    // Coordonnateurs voient tout le monde
                    return personnel;
                } else {
                    // Autres voient seulement le personnel de chantier (visibleChantier: true)
                    return personnel.filter(p => p.visibleChantier);
                }
            };

            // Générer les jours
            const generateContinuousDays = useCallback(() => {
                const days = [];
                const current = new Date(startDate);
                
                for (let i = 0; i < numberOfDays; i++) {
                    days.push({
                        date: new Date(current),
                        dayNumber: current.getDate(),
                        dayName: current.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase(),
                        monthName: current.toLocaleDateString('fr-FR', { month: 'short' }),
                        isWeekend: current.getDay() === 0 || current.getDay() === 6,
                        isToday: current.toDateString() === new Date().toDateString(),
                        dateString: current.toISOString().split('T')[0]
                    });
                    current.setDate(current.getDate() + 1);
                }
                
                return days;
            }, [startDate, numberOfDays]);

            const continuousDays = generateContinuousDays();

            // Filtrer le personnel ou équipements
            const filteredResources = useMemo(() => {
                // En mode vue individuel, respecter le filtre sélectionné (Personnel/Équipement/Global)
                if (modeVueIndividuel && travailleurSelectionne) {
                    if (filterType === 'personnel') {
                        // Mode individuel + filtre Personnel = Voir uniquement la personne sélectionnée
                        let filteredPersonnel = personnel.filter(person => {
                            const matchesSearch = person.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                 person.poste.toLowerCase().includes(searchTerm.toLowerCase());
                            const matchesBureau = filterBureau === 'tous' || person.succursale === filterBureau;
                            const notCoordonnateur = !person.isCoordonnateur;
                            const visibleCalendrier = person.visibleChantier === true;
                            return matchesSearch && matchesBureau && notCoordonnateur && visibleCalendrier && person.id === travailleurSelectionne;
                        });
                        return filteredPersonnel.map(p => ({...p, type: 'personnel'}));
                    } else if (filterType === 'equipements') {
                        // Mode individuel + filtre Équipement = Voir uniquement l'équipement sélectionné
                        const filteredEquipements = equipements.filter(equipement => {
                            const matchesSearch = equipement.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                 equipement.type.toLowerCase().includes(searchTerm.toLowerCase());
                            const matchesBureau = filterBureau === 'tous' || equipement.succursale === filterBureau;
                            return matchesSearch && matchesBureau && equipement.id === travailleurSelectionne;
                        });
                        return filteredEquipements.map(e => ({...e, type: 'equipement'}));
                    } else {
                        // Mode individuel + filtre Global = Voir la ressource sélectionnée + tout le reste
                        let filteredPersonnel = personnel.filter(person => {
                            const matchesSearch = person.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                 person.poste.toLowerCase().includes(searchTerm.toLowerCase());
                            const matchesBureau = filterBureau === 'tous' || person.succursale === filterBureau;
                            const notCoordonnateur = !person.isCoordonnateur;
                            const visibleCalendrier = person.visibleChantier === true;
                            return matchesSearch && matchesBureau && notCoordonnateur && visibleCalendrier && person.id === travailleurSelectionne;
                        });
                        
                        filteredPersonnel = filteredPersonnel.map(p => ({...p, type: 'personnel'}));
                        
                        const filteredEquipements = equipements.filter(equipement => {
                            const matchesSearch = equipement.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                 equipement.type.toLowerCase().includes(searchTerm.toLowerCase());
                            const matchesBureau = filterBureau === 'tous' || equipement.succursale === filterBureau;
                            return matchesSearch && matchesBureau;
                        }).map(e => ({...e, type: 'equipement'}));
                        
                        return [...filteredPersonnel, ...filteredEquipements];
                    }
                } else if (filterType === 'personnel') {
                    let filteredPersonnel = personnel.filter(person => {
                        const matchesSearch = person.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                             person.poste.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesBureau = filterBureau === 'tous' || person.succursale === filterBureau;
                        const notCoordonnateur = !person.isCoordonnateur;
                        const visibleCalendrier = person.visibleChantier === true;
                        return matchesSearch && matchesBureau && notCoordonnateur && visibleCalendrier;
                    });
                    
                    return filteredPersonnel.map(p => ({...p, type: 'personnel'}));
                } else if (filterType === 'equipements') {
                    return equipements.filter(equipement => {
                        const matchesSearch = equipement.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                             equipement.type.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesBureau = filterBureau === 'tous' || equipement.succursale === filterBureau;
                        return matchesSearch && matchesBureau;
                    }).map(e => ({...e, type: 'equipement'}));
                } else { // global
                    let filteredPersonnel = personnel.filter(person => {
                        const matchesSearch = person.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                             person.poste.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesBureau = filterBureau === 'tous' || person.succursale === filterBureau;
                        const notCoordonnateur = !person.isCoordonnateur;
                        const visibleCalendrier = person.visibleChantier === true;
                        return matchesSearch && matchesBureau && notCoordonnateur && visibleCalendrier;
                    });
                    
                    filteredPersonnel = filteredPersonnel.map(p => ({...p, type: 'personnel'}));
                    
                    const filteredEquipements = equipements.filter(equipement => {
                        const matchesSearch = equipement.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                             equipement.type.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesBureau = filterBureau === 'tous' || equipement.succursale === filterBureau;
                        return matchesSearch && matchesBureau;
                    }).map(e => ({...e, type: 'equipement'}));
                    
                    return [...filteredPersonnel, ...filteredEquipements];
                }
            }, [filterType, personnel, equipements, searchTerm, filterBureau, modeVueIndividuel, travailleurSelectionne]);

            // Obtenir job pour cellule
            const getJobForCell = (resourceId, day, resourceType = null) => {
                return jobs.find(job => {
                    // Vérifier si cette ressource a un planning individuel
                    const planningIndividuel = job.planningsIndividuels?.[resourceId];
                    let dateDebut, dateFin;
                    
                    if (planningIndividuel) {
                        dateDebut = planningIndividuel.dateDebut;
                        dateFin = planningIndividuel.dateFin;
                    } else {
                        dateDebut = job.dateDebut;
                        dateFin = job.dateFin;
                    }
                    
                    let dateMatch = day.dateString >= dateDebut && day.dateString <= dateFin;
                    
                    // Si l'événement n'inclut pas les fins de semaine, exclure samedi et dimanche
                    if (dateMatch && !job.includeWeekendsInDuration && day.isWeekend) {
                        dateMatch = false;
                    }
                    
                    if (filterType === 'personnel') {
                        return job.personnel?.includes(resourceId) && dateMatch;
                    } else if (filterType === 'equipements') {
                        return job.equipements?.includes(resourceId) && dateMatch;
                    } else { // global
                        // Utiliser le type de ressource pour déterminer dans quelle liste chercher
                        if (resourceType === 'personnel') {
                            return job.personnel?.includes(resourceId) && dateMatch;
                        } else if (resourceType === 'equipement') {
                            return job.equipements?.includes(resourceId) && dateMatch;
                        }
                        // Fallback : chercher dans les deux listes
                        return (job.personnel?.includes(resourceId) || job.equipements?.includes(resourceId)) && dateMatch;
                    }
                });
            };

            // V6.5 ULTRA: Obtenir TOUS les jobs/tâches pour une cellule (multi-tâches par jour)
            const getAllJobsForCell = (resourceId, day, resourceType = null, ganttDataParam = null) => {
                const currentGanttData = ganttDataParam || { tasks: [], assignments: [] };
                const dayJobs = [];
                
                // 1. Jobs classiques (événements) - TOUS ceux qui matchent
                const classicJobs = jobs.filter(job => {
                    const planningIndividuel = job.planningsIndividuels?.[resourceId];
                    let dateDebut, dateFin;
                    
                    if (planningIndividuel) {
                        dateDebut = planningIndividuel.dateDebut;
                        dateFin = planningIndividuel.dateFin;
                    } else {
                        dateDebut = job.dateDebut;
                        dateFin = job.dateFin;
                    }
                    
                    let dateMatch = day.dateString >= dateDebut && day.dateString <= dateFin;
                    
                    if (dateMatch && !job.includeWeekendsInDuration && day.isWeekend) {
                        dateMatch = false;
                    }
                    
                    if (filterType === 'personnel') {
                        return job.personnel?.includes(resourceId) && dateMatch;
                    } else if (filterType === 'equipements') {
                        return job.equipements?.includes(resourceId) && dateMatch;
                    } else {
                        if (resourceType === 'personnel') {
                            return job.personnel?.includes(resourceId) && dateMatch;
                        } else if (resourceType === 'equipements') {
                            return job.equipements?.includes(resourceId) && dateMatch;
                        } else {
                            return (job.personnel?.includes(resourceId) || job.equipements?.includes(resourceId)) && dateMatch;
                        }
                    }
                });

                // 2. Tâches Gantt du jour (si assignées à cette ressource via les équipes)
                const ganttTasksToday = (currentGanttData.tasks && currentGanttData.tasks.length > 0) ? currentGanttData.tasks.filter(task => {
                    const taskDate = new Date(task.startDate).toISOString().split('T')[0];
                    const dayStr = day.date || day.dateString;
                    
                    if (taskDate !== dayStr) return false;
                    
                    // Vérifier si cette ressource est assignée via une équipe
                    const assignments = currentGanttData.assignments || [];
                    const isAssignedToTask = assignments.some(assignment => 
                        assignment.taskId === task.id && assignment.resourceId === resourceId
                    );
                    
                    return isAssignedToTask;
                }) : [];

                // Convertir les jobs classiques au format unifié avec créneaux horaires
                classicJobs.forEach((job, index) => {
                    dayJobs.push({
                        id: `event-${job.id}`,
                        type: 'event',
                        name: job.nom,
                        numeroJob: job.numeroJob,
                        heureDebut: job.heureDebut || '08:00',
                        heureFin: job.heureFin || '17:00',
                        duration: calculateJobDuration(job.heureDebut || '08:00', job.heureFin || '17:00'),
                        priority: job.priorite || 'normale',
                        bureau: job.bureau,
                        client: job.client,
                        color: getPriorityAndBureauColor(job),
                        originalJob: job,
                        sortOrder: index
                    });
                });

                // Convertir les tâches Gantt au format unifié
                ganttTasksToday.forEach((task, index) => {
                    const startTime = new Date(task.startDate);
                    const endTime = new Date(task.endDate);
                    
                    dayJobs.push({
                        id: `gantt-${task.id}`,
                        type: 'gantt-task',
                        name: task.name,
                        heureDebut: startTime.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}),
                        heureFin: endTime.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}),
                        duration: task.duration,
                        priority: task.priority || 'normal',
                        color: task.completed ? 'bg-green-100 border-green-300 text-green-800' : 
                               (currentGanttData.tasks && calculateCriticalPath(currentGanttData.tasks).includes(task.id)) ? 'bg-red-100 border-red-300 text-red-800' : 
                               'bg-blue-100 border-blue-300 text-blue-800',
                        originalTask: task,
                        sortOrder: 1000 + index // Gantt tasks après les événements
                    });
                });

                // Trier par heure de début, puis par ordre de priorité
                return dayJobs.sort((a, b) => {
                    const timeA = a.heureDebut.split(':').map(n => parseInt(n));
                    const timeB = b.heureDebut.split(':').map(n => parseInt(n));
                    const minutesA = timeA[0] * 60 + timeA[1];
                    const minutesB = timeB[0] * 60 + timeB[1];
                    
                    // Trier par heure d'abord
                    if (minutesA !== minutesB) {
                        return minutesA - minutesB;
                    }
                    
                    // En cas d'égalité, par ordre de création
                    return a.sortOrder - b.sortOrder;
                });
            };

            // Fonction utilitaire pour calculer la durée d'un job en heures
            const calculateJobDuration = (heureDebut, heureFin) => {
                const [startH, startM] = heureDebut.split(':').map(n => parseInt(n));
                const [endH, endM] = heureFin.split(':').map(n => parseInt(n));
                const startMinutes = startH * 60 + startM;
                const endMinutes = endH * 60 + endM;
                return Math.max(0.25, (endMinutes - startMinutes) / 60);
            };

            // Obtenir les équipements assignés à un job
            const getJobEquipments = (job) => {
                if (!job.equipements) return [];
                return equipements.filter(eq => job.equipements.includes(eq.id));
            };

            // Obtenir les congés approuvés pour un personnel à une date donnée
            const getCongesForPersonnel = (personnelId, date) => {
                return demandesConges.filter(conge => 
                    conge.personnelId === personnelId &&
                    conge.statut === 'approuve' &&
                    new Date(conge.dateDebut) <= new Date(date) &&
                    new Date(conge.dateFin) >= new Date(date)
                );
            };

            // === GESTION DES CONGÉS ===
            const handleSaveConges = (congesData) => {
                const existingIndex = demandesConges.findIndex(d => d.id === congesData.id);
                if (existingIndex !== -1) {
                    setDemandesConges(demandesConges.map(d => d.id === congesData.id ? congesData : d));
                    addNotification('Demande de congé modifiée avec succès', 'success');
                } else {
                    setDemandesConges([...demandesConges, congesData]);
                    addNotification('Demande de congé créée avec succès', 'success');
                }
            };

            const handleDeleteConges = (id) => {
                if (window.confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) {
                    setDemandesConges(demandesConges.filter(d => d.id !== id));
                    addNotification('Demande supprimée avec succès', 'success');
                }
            };

            // Gestionnaires d'événements
            const handleCellClick = (resourceId, day, resourceType = null, event = null) => {
                // Si Ctrl+click sur personnel, ouvrir modal congés
                if (event?.ctrlKey && resourceType === 'personnel') {
                    const personnelToSelect = personnel.find(p => p.id === resourceId);
                    setSelectedPersonnelConges(personnelToSelect);
                    setShowCongesModal(true);
                    return;
                }

                const existingJob = getJobForCell(resourceId, day, resourceType);
                
                if (existingJob) {
                    setSelectedJob(existingJob);
                } else {
                    // Vérifier les permissions pour créer un nouveau job
                    if (!peutModifier()) {
                        addNotification('Vous n\'avez pas les permissions pour créer de nouveaux événements', 'error');
                        return;
                    }
                    setSelectedJob(null);
                    if (filterType === 'personnel') {
                        setSelectedCell({ personnelId: resourceId, date: day.dateString });
                    } else {
                        setSelectedCell({ date: day.dateString });
                    }
                }
                setShowJobModal(true);
            };

            // Fonction pour générer les dates récurrentes
            const genererDatesRecurrentes = (dateDebut, recurrence) => {
                const dates = [new Date(dateDebut)];
                const startDate = new Date(dateDebut);
                
                for (let i = 1; i < (recurrence.finRecurrence === 'occurrences' ? recurrence.nombreOccurrences : 50); i++) {
                    const nextDate = new Date(startDate);
                    
                    switch (recurrence.type) {
                        case 'hebdomadaire':
                            nextDate.setDate(startDate.getDate() + (i * 7 * recurrence.intervalle));
                            break;
                        case 'mensuel':
                            nextDate.setMonth(startDate.getMonth() + (i * recurrence.intervalle));
                            break;
                        case 'annuel':
                            nextDate.setFullYear(startDate.getFullYear() + (i * recurrence.intervalle));
                            break;
                    }
                    
                    // Vérifier si on dépasse la date de fin
                    if (recurrence.finRecurrence === 'date' && recurrence.dateFinRecurrence) {
                        const dateFin = new Date(recurrence.dateFinRecurrence);
                        if (nextDate > dateFin) break;
                    }
                    
                    dates.push(nextDate);
                }
                
                return dates;
            };

            const handleSaveJob = (jobData) => {
                if (selectedJob) {
                    setJobs(jobs.map(j => j.id === selectedJob.id ? jobData : j));
                } else {
                    // Vérifier si c'est un événement récurrent
                    if (jobData.recurrence && jobData.recurrence.active) {
                        const datesRecurrentes = genererDatesRecurrentes(jobData.dateDebut, jobData.recurrence);
                        const nouveauxJobs = [];
                        
                        datesRecurrentes.forEach((date, index) => {
                            const dateFin = jobData.dateFin ? new Date(jobData.dateFin) : date;
                            if (jobData.dateFin) {
                                const diff = new Date(jobData.dateFin) - new Date(jobData.dateDebut);
                                dateFin.setTime(date.getTime() + diff);
                            }
                            
                            const nouveauJob = {
                                ...jobData,
                                id: Date.now() + index + Math.random(),
                                dateDebut: date.toISOString().split('T')[0],
                                dateFin: dateFin.toISOString().split('T')[0],
                                nom: `${jobData.nom}${index > 0 ? ` (${index + 1})` : ''}`,
                                recurrence: index === 0 ? jobData.recurrence : { ...jobData.recurrence, active: false } // Seul le premier garde la config de récurrence
                            };
                            
                            nouveauxJobs.push(nouveauJob);
                        });
                        
                        setJobs([...jobs, ...nouveauxJobs]);
                    } else {
                        setJobs([...jobs, jobData]);
                    }
                }
                setSelectedJob(null);
                setSelectedCell(null);
            };

            const handleDeleteJob = (jobId) => {
                setJobs(jobs.filter(j => j.id !== jobId));
            };

            const getPriorityAndBureauColor = (job) => {
                // Utiliser le bureau assigné à l'événement ou fallback sur le bureau du personnel
                const bureauAssigne = job.bureau || (
                    job.personnel?.length > 0 
                        ? personnel.find(p => job.personnel.includes(p.id))?.succursale 
                        : ''
                );
                const bureauClass = getBureauColor(bureauAssigne);
                
                // Ajouter classes pour différents types d'horaires
                let horaireClass = '';
                if (job.typeHoraire === 'nuit') {
                    horaireClass = 'night-work';
                } else if (job.typeHoraire === '24h') {
                    horaireClass = 'work-24h';
                }
                
                const weekendClass = job.includeWeekendsInDuration ? 'includes-weekends' : '';
                
                return `${bureauClass} border-2 ${horaireClass} ${weekendClass}`.trim();
            };

            // Navigation
            const navigateWeeks = (direction) => {
                const newDate = new Date(startDate);
                newDate.setDate(newDate.getDate() + (direction * 7));
                setStartDate(newDate);
            };

            const navigateMonths = (direction) => {
                const newDate = new Date(startDate);
                newDate.setMonth(newDate.getMonth() + direction);
                setStartDate(newDate);
            };

            const goToToday = () => {
                setStartDate(new Date());
            };

            // Export des données
            const exportData = () => {
                const data = {
                    jobs,
                    personnel,
                    equipements,
                    sousTraitants,
                    typesEquipements,
                    exportDate: new Date().toISOString(),
                    version: '4.0'
                };
                
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `planificateur-final-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                addNotification('Données exportées avec succès', 'success');
            };

            // Fonctions PWA
            useEffect(() => {
                const handleBeforeInstallPrompt = (e) => {
                    e.preventDefault();
                    setDeferredPrompt(e);
                    setShowInstallButton(true);
                };

                window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

                return () => {
                    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
                };
            }, []);

            const handleInstallPWA = async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') {
                        addNotification('Application installée avec succès !', 'success');
                        setShowInstallButton(false);
                    }
                    setDeferredPrompt(null);
                } else {
                    addNotification('Installation non disponible pour ce navigateur', 'info');
                }
            };

            return React.createElement('div', { 
                className: `min-h-screen bg-gray-50 transition-colors duration-300 ${modeTheme === 'nuit' ? 'theme-nuit' : ''}` 
            },
                // Notifications
                React.createElement(NotificationContainer, { notifications }),
                
                // Modal de login utilisateur
                React.createElement(UserLoginModal, {
                    isOpen: showUserLogin,
                    personnel: personnel,
                    loginForm: loginForm,
                    setLoginForm: setLoginForm,
                    onLogin: (utilisateurIdentifie, motDePasse) => handleUserLogin(utilisateurIdentifie, motDePasse),
                    onClose: () => {} // Pas de fermeture possible sans connexion
                }),

                // HEADER RESPONSIVE AVEC MENU HAMBURGER
                React.createElement('div', { className: "bg-gradient-to-r from-gray-900 to-black shadow-lg border-b border-gray-800" },
                    React.createElement('div', { className: "px-4 py-3" },
                        // BARRE PRINCIPALE COMPACTE
                        React.createElement('div', { className: "flex items-center justify-between" },
                            // Logo + Titre (toujours visible)
                            React.createElement('div', { className: "flex items-center gap-2" },
                                React.createElement('img', { 
                                    src: "C-Secur360-logo.png.png", 
                                    alt: "C-Secur360",
                                    className: isMobile ? "w-10 h-10" : "w-12 h-12 lg:w-16 lg:h-16 object-contain"
                                }),
                                React.createElement('div', null,
                                    React.createElement('h1', { 
                                        className: isMobile 
                                            ? "text-sm font-bold text-white" 
                                            : "text-lg lg:text-2xl font-bold text-white drop-shadow-lg" 
                                    }, isMobile ? "C-Secur360" : "Planificateur C-Secur360"),
                                    !isMobile && React.createElement('div', { className: "text-xs text-gray-300" }, 
                                        `${jobs.length} jobs • ${personnel.length} techniciens • ${equipements.length} équipements`
                                    )
                                )
                            ),
                            
                            // ACTIONS RAPIDES MOBILES
                            React.createElement('div', { className: "flex items-center gap-2" },
                                // Utilisateur connecté - version compacte
                                utilisateurConnecte && React.createElement('div', { 
                                    className: isMobile 
                                        ? "flex items-center gap-2" 
                                        : "hidden lg:flex items-center gap-3" 
                                },
                                    React.createElement('div', { className: isMobile ? "text-right" : "text-right" },
                                        React.createElement('div', { className: "flex items-center gap-1" },
                                            React.createElement('span', { 
                                                className: `w-2 h-2 rounded-full ${peutModifier() ? 'bg-green-500' : 'bg-orange-500'}` 
                                            }),
                                            React.createElement('span', { 
                                                className: isMobile 
                                                    ? "text-xs font-medium text-white" 
                                                    : "font-medium text-white" 
                                            }, isMobile ? utilisateurConnecte.nom.split(' ')[0] : utilisateurConnecte.nom)
                                        ),
                                        !isMobile && React.createElement('div', { className: "text-xs text-gray-200" },
                                            utilisateurConnecte.poste,
                                            estCoordonnateur() && React.createElement('span', { className: "ml-2 px-2 py-1 bg-blue-600 text-blue-100 rounded-full" }, "Coord.")
                                        )
                                    )
                                ),
                                
                                // Google Drive - version compacte pour mobile
                                utilisateurConnecte && React.createElement('button', {
                                    onClick: () => {
                                        if (googleDrive.isAuthenticated) {
                                            if (forceSync) forceSync();
                                        } else {
                                            googleDrive.signIn();
                                        }
                                    },
                                    className: `p-2 rounded-lg transition-all ${
                                        googleDrive.isAuthenticated 
                                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`,
                                    title: googleDrive.isAuthenticated ? 'Synchroniser Google Drive' : 'Se connecter à Google Drive'
                                },
                                    React.createElement('span', { className: 'text-lg' }, 
                                        googleDrive.isSyncing ? '🔄' : googleDrive.isAuthenticated ? '☁️' : '📡'
                                    )
                                ),
                                
                                // MENU HAMBURGER 
                                React.createElement('button', {
                                    onClick: () => setShowMobileMenu(!showMobileMenu),
                                    className: "p-2 rounded-lg hover:bg-gray-800 transition-colors",
                                    title: "Menu"
                                },
                                    React.createElement('div', { className: "flex flex-col gap-1" },
                                        React.createElement('div', { className: `w-5 h-0.5 bg-white transition-transform ${showMobileMenu ? 'rotate-45 translate-y-1.5' : ''}` }),
                                        React.createElement('div', { className: `w-5 h-0.5 bg-white transition-opacity ${showMobileMenu ? 'opacity-0' : ''}` }),
                                        React.createElement('div', { className: `w-5 h-0.5 bg-white transition-transform ${showMobileMenu ? '-rotate-45 -translate-y-1.5' : ''}` })
                                    )
                                )
                            )
                        ),
                        
                        // MENU DÉROULANT MOBILE/TABLETTE
                        showMobileMenu && React.createElement('div', {
                            className: "mt-4 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
                        },
                            // Section Informations
                            React.createElement('div', { className: "p-4 border-b border-gray-700" },
                                React.createElement('h3', { className: "text-sm font-semibold text-gray-300 mb-2" }, "📊 Informations"),
                                React.createElement('div', { className: "grid grid-cols-2 gap-3 text-xs" },
                                    React.createElement('div', { className: "bg-gray-700 p-2 rounded" },
                                        React.createElement('div', { className: "text-blue-400 font-medium" }, jobs.length),
                                        React.createElement('div', { className: "text-gray-300" }, jobs.length <= 1 ? 'Job' : 'Jobs')
                                    ),
                                    React.createElement('div', { className: "bg-gray-700 p-2 rounded" },
                                        React.createElement('div', { className: "text-green-400 font-medium" }, personnel.length),
                                        React.createElement('div', { className: "text-gray-300" }, 'Techniciens')
                                    ),
                                    React.createElement('div', { className: "bg-gray-700 p-2 rounded" },
                                        React.createElement('div', { className: "text-purple-400 font-medium" }, equipements.length),
                                        React.createElement('div', { className: "text-gray-300" }, 'Équipements')
                                    ),
                                    React.createElement('div', { className: "bg-gray-700 p-2 rounded" },
                                        React.createElement('div', { className: `font-medium ${
                                            isMobile ? 'text-blue-400' : isTablet ? 'text-green-400' : 'text-purple-400'
                                        }` }, isMobile ? 'Mobile' : isTablet ? 'Tablette' : 'Desktop'),
                                        React.createElement('div', { className: "text-gray-300" }, 'Mode')
                                    )
                                )
                            ),
                            
                            // Section Utilisateur (si connecté)
                            utilisateurConnecte && React.createElement('div', { className: "p-4 border-b border-gray-700" },
                                React.createElement('h3', { className: "text-sm font-semibold text-gray-300 mb-2" }, "👤 Compte"),
                                React.createElement('div', { className: "bg-gray-700 p-3 rounded-lg" },
                                    React.createElement('div', { className: "flex items-center justify-between mb-2" },
                                        React.createElement('span', { className: "font-medium text-white" }, utilisateurConnecte.nom),
                                        React.createElement('span', { 
                                            className: `w-2 h-2 rounded-full ${peutModifier() ? 'bg-green-500' : 'bg-orange-500'}` 
                                        })
                                    ),
                                    React.createElement('div', { className: "text-xs text-gray-300 mb-1" }, utilisateurConnecte.poste),
                                    React.createElement('div', { className: "flex items-center justify-between" },
                                        React.createElement('span', { className: "text-xs text-gray-400" }, 
                                            peutModifier() ? "Peut modifier" : "Consultation"
                                        ),
                                        estCoordonnateur() && React.createElement('span', { 
                                            className: "px-2 py-1 bg-blue-600 text-blue-100 rounded text-xs" 
                                        }, "Coord.")
                                    )
                                ),
                                React.createElement('button', {
                                    onClick: handleUserLogout,
                                    className: "w-full mt-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                }, "🚪 Se déconnecter")
                            ),
                            
                            // Section Google Drive
                            utilisateurConnecte && React.createElement('div', { className: "p-4 border-b border-gray-700" },
                                React.createElement('h3', { className: "text-sm font-semibold text-gray-300 mb-2" }, "☁️ Google Drive"),
                                React.createElement('div', { className: "bg-gray-700 p-3 rounded-lg" },
                                    React.createElement('div', { className: "flex items-center justify-between mb-2" },
                                        React.createElement('span', { className: "text-sm" }, 
                                            googleDrive.isAuthenticated ? "Connecté" : "Non connecté"
                                        ),
                                        React.createElement('span', { 
                                            className: `text-lg ${
                                                googleDrive.isSyncing ? '' : 
                                                googleDrive.isAuthenticated ? 'text-green-400' : 
                                                'text-gray-400'
                                            }` 
                                        }, googleDrive.isSyncing ? '🔄' : googleDrive.isAuthenticated ? '☁️' : '📡')
                                    ),
                                    googleDrive.lastSync && React.createElement('div', { className: "text-xs text-gray-400 mb-2" },
                                        `Dernière sync: ${googleDrive.lastSync.toLocaleDateString()}`
                                    ),
                                    React.createElement('div', { className: "flex gap-2" },
                                        !googleDrive.isAuthenticated 
                                            ? React.createElement('button', {
                                                onClick: googleDrive.signIn,
                                                className: "flex-1 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                                            }, "Se connecter")
                                            : React.createElement('div', { className: "flex gap-2 w-full" },
                                                React.createElement('button', {
                                                    onClick: forceSync,
                                                    disabled: googleDrive.isSyncing,
                                                    className: "flex-1 p-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-xs"
                                                }, googleDrive.isSyncing ? "Sync..." : "Sync"),
                                                React.createElement('button', {
                                                    onClick: googleDrive.signOut,
                                                    className: "px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs"
                                                }, "Déco")
                                            )
                                    )
                                )
                            ),
                            
                            // Section Actions
                            React.createElement('div', { className: "p-4" },
                                React.createElement('h3', { className: "text-sm font-semibold text-gray-300 mb-3" }, "⚡ Actions"),
                                React.createElement('div', { className: "grid grid-cols-2 gap-3" },
                                    // Bouton Nouveau (seulement si peut modifier)
                                    peutModifier() && React.createElement('button', {
                                        onClick: () => {
                                            setSelectedJob(null);
                                            setSelectedCell(null);
                                            setShowJobModal(true);
                                            setShowMobileMenu(false); // Fermer le menu
                                        },
                                        className: "flex items-center justify-center gap-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    },
                                        React.createElement(Icon, { name: 'plus', size: 16 }),
                                        React.createElement('span', { className: "text-sm font-medium" }, "Nouveau Job")
                                    ),
                                    
                                    // Bouton Ressources
                                    React.createElement('button', {
                                        onClick: () => {
                                            requireAdminAuth();
                                            setShowMobileMenu(false);
                                        },
                                        className: "flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    },
                                        React.createElement(Icon, { name: 'settings', size: 16 }),
                                        React.createElement('span', { className: "text-sm font-medium" }, "Ressources")
                                    ),
                                    
                                    // Toggle Mode Jour/Nuit
                                    React.createElement('button', {
                                        onClick: () => {
                                            setModeTheme(modeTheme === 'jour' ? 'nuit' : 'jour');
                                            setShowMobileMenu(false);
                                        },
                                        className: `flex items-center justify-center gap-2 p-3 rounded-lg transition-colors ${
                                            modeTheme === 'nuit' 
                                                ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                                                : 'bg-gray-700 text-white hover:bg-gray-800'
                                        }`
                                    },
                                        React.createElement('span', { className: "text-lg" }, modeTheme === 'nuit' ? '☀️' : '🌙'),
                                        React.createElement('span', { className: "text-sm font-medium" }, 
                                            modeTheme === 'nuit' ? 'Mode Jour' : 'Mode Nuit'
                                        )
                                    ),
                                    
                                    // Bouton Congés
                                    React.createElement('button', {
                                        onClick: () => {
                                            setSelectedPersonnelConges(null);
                                            setShowCongesModal(true);
                                            setShowMobileMenu(false);
                                        },
                                        className: "flex items-center justify-center gap-2 p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                    },
                                        React.createElement('span', { className: "text-lg" }, '🏖️'),
                                        React.createElement('span', { className: "text-sm font-medium" }, "Congés")
                                    ),
                                    
                                    // PWA Install
                                    React.createElement('button', {
                                        onClick: () => {
                                            handleInstallPWA();
                                            setShowMobileMenu(false);
                                        },
                                        className: `flex items-center justify-center gap-2 p-3 rounded-lg transition-colors ${
                                            showInstallButton ? 
                                            'bg-purple-600 text-white hover:bg-purple-700 animate-pulse' :
                                            'bg-gray-600 text-white hover:bg-gray-700'
                                        }`
                                    },
                                        React.createElement('span', { className: "text-lg" }, '📱'),
                                        React.createElement('span', { className: "text-sm font-medium" }, 
                                            showInstallButton ? 'Installer App' : 'PWA'
                                        )
                                    ),
                                    
                                    // Export Data
                                    React.createElement('button', {
                                        onClick: () => {
                                            exportData();
                                            setShowMobileMenu(false);
                                        },
                                        className: "flex items-center justify-center gap-2 p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                    },
                                        React.createElement(Icon, { name: 'download', size: 16 }),
                                        React.createElement('span', { className: "text-sm font-medium" }, "Export")
                                )
                            )
                        ),
                        
                        // ACTIONS DESKTOP - Visible uniquement sur desktop
                        !isMobile && !showMobileMenu && React.createElement('div', { className: "hidden lg:flex lg:items-center lg:gap-2 mt-4" },
                            // Bouton Nouveau (seulement si peut modifier)
                            peutModifier() && React.createElement('button', {
                                onClick: () => {
                                    setSelectedJob(null);
                                    setSelectedCell(null);
                                    setShowJobModal(true);
                                },
                                className: "flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            },
                                React.createElement(Icon, { name: 'plus', size: 16 }),
                                React.createElement('span', null, "Nouveau")
                            ),
                            
                            // Bouton installation PWA
                            React.createElement('button', {
                                onClick: handleInstallPWA,
                                className: `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                    showInstallButton ? 
                                    'bg-purple-500 text-white hover:bg-purple-600 animate-pulse' :
                                    'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`,
                                title: showInstallButton ? 'Installer l\'application' : 'PWA disponible'
                            },
                                React.createElement('span', null, '📱'),
                                React.createElement('span', null, showInstallButton ? 'Installer' : 'PWA')
                            ),
                            
                            React.createElement('button', {
                                onClick: requireAdminAuth,
                                className: "flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            },
                                React.createElement(Icon, { name: 'settings', size: 16 }),
                                React.createElement('span', null, "Ressources")
                            ),
                            
                            React.createElement('button', {
                                onClick: () => setModeTheme(modeTheme === 'jour' ? 'nuit' : 'jour'),
                                className: `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                                    modeTheme === 'nuit' 
                                        ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                                        : 'bg-gray-800 text-white hover:bg-gray-900'
                                }`
                            },
                                React.createElement('span', null, modeTheme === 'nuit' ? '☀️' : '🌙'),
                                React.createElement('span', null, modeTheme === 'nuit' ? 'Jour' : 'Nuit')
                            ),
                            
                            React.createElement('button', {
                                onClick: () => {
                                    setSelectedPersonnelConges(null);
                                    setShowCongesModal(true);
                                },
                                className: "flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                            },
                                React.createElement('span', null, '🏖️'),
                                React.createElement('span', null, "Congés")
                            ),
                            
                            React.createElement('button', {
                                onClick: exportData,
                                className: "flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            },
                                React.createElement(Icon, { name: 'download', size: 16 }),
                                React.createElement('span', null, "Export")
                            )
                        )
                    ),

                    // Navigation et recherche
                        React.createElement('div', { className: "flex flex-col lg:flex-row gap-4 mt-4" },
                            // Recherche et filtres
                            React.createElement('div', { className: "flex flex-1 gap-2" },
                                React.createElement('div', { className: "relative flex-1 max-w-md" },
                                    React.createElement(Icon, { 
                                        name: 'search', 
                                        size: 18, 
                                        className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                                    }),
                                    React.createElement('input', {
                                        type: "text",
                                        placeholder: "Rechercher...",
                                        value: searchTerm,
                                        onChange: (e) => setSearchTerm(e.target.value),
                                        className: "w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    })
                                ),
                                React.createElement('select', {
                                    value: filterType,
                                    onChange: (e) => {
                                        setFilterType(e.target.value);
                                        // Désactiver le mode vue individuel si on passe aux équipements
                                        if (e.target.value === 'equipements') {
                                            setModeVueIndividuel(false);
                                            setTravailleurSelectionne('');
                                        }
                                    },
                                    className: "px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                },
                                    React.createElement('option', { value: "personnel" }, "Personnel"),
                                    React.createElement('option', { value: "equipements" }, "Équipements"),
                                    React.createElement('option', { value: "global" }, "Vue globale")
                                ),
                                React.createElement('select', {
                                    value: filterBureau,
                                    onChange: (e) => setFilterBureau(e.target.value),
                                    className: "px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                },
                                    ...getBureauOptions().map(bureau => 
                                        React.createElement('option', { key: bureau.value, value: bureau.value }, bureau.label)
                                    )
                                ),

                                // Mode vue individuel (seulement pour personnel et global)
                                (filterType === 'personnel' || filterType === 'global') && React.createElement('div', { className: "flex items-center gap-2" },
                                    React.createElement('label', { className: "flex items-center gap-2 text-sm" },
                                        React.createElement('input', {
                                            type: "checkbox",
                                            checked: modeVueIndividuel,
                                            onChange: (e) => {
                                                setModeVueIndividuel(e.target.checked);
                                                if (!e.target.checked) {
                                                    setTravailleurSelectionne('');
                                                }
                                            },
                                            className: "rounded"
                                        }),
                                        React.createElement('span', null, "Vue individuel")
                                    ),
                                    modeVueIndividuel && React.createElement('select', {
                                        value: travailleurSelectionne,
                                        onChange: (e) => setTravailleurSelectionne(e.target.value),
                                        className: "px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[200px]"
                                    },
                                        React.createElement('option', { value: "" }, "Sélectionner un travailleur"),
                                        ...personnel.filter(p => !p.isCoordonnateur).map(person => 
                                            React.createElement('option', { key: person.id, value: person.id }, 
                                                `${person.nom} - ${person.poste}`
                                            )
                                        )
                                    )
                                )
                            ),

                            // Navigation temporelle
                            React.createElement('div', { className: "flex items-center gap-2" },
                                React.createElement('button', {
                                    onClick: () => navigateMonths(-1),
                                    className: "p-2 hover:bg-gray-100 rounded-lg",
                                    title: "Mois précédent"
                                }, React.createElement(Icon, { name: 'chevronLeft', size: 20 })),
                                React.createElement('button', {
                                    onClick: () => navigateWeeks(-1),
                                    className: "px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                                }, "←"),
                                React.createElement('button', {
                                    onClick: goToToday,
                                    className: "px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded text-blue-600"
                                }, "Aujourd'hui"),
                                React.createElement('div', { className: "relative" },
                                    React.createElement('button', {
                                        onClick: () => setShowDateNavigator(!showDateNavigator),
                                        className: "px-3 py-1 text-sm font-semibold bg-gray-100 hover:bg-gray-200 rounded cursor-pointer",
                                        title: "Cliquer pour aller à une date précise"
                                    }, startDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })),
                                    showDateNavigator && React.createElement('div', { 
                                        className: "absolute top-full mt-2 z-50" 
                                    },
                                        React.createElement(DateNavigator, {
                                            currentDate: startDate,
                                            onDateChange: setStartDate,
                                            onClose: () => setShowDateNavigator(false)
                                        })
                                    )
                                ),
                                React.createElement('button', {
                                    onClick: () => navigateWeeks(1),
                                    className: "px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                                }, "→"),
                                React.createElement('button', {
                                    onClick: () => navigateMonths(1),
                                    className: "p-2 hover:bg-gray-100 rounded-lg",
                                    title: "Mois suivant"
                                }, React.createElement(Icon, { name: 'chevronRight', size: 20 })),
                                React.createElement('select', {
                                    value: numberOfDays,
                                    onChange: (e) => setNumberOfDays(parseInt(e.target.value)),
                                    className: "px-2 py-1 text-sm border rounded-lg"
                                },
                                    React.createElement('option', { value: 14 }, "2S"),
                                    React.createElement('option', { value: 21 }, "3S"),
                                    React.createElement('option', { value: 30 }, "1M"),
                                    React.createElement('option', { value: 60 }, "2M"),
                                    React.createElement('option', { value: 90 }, "3M")
                                )
                            )
                        )
                    )
                ),

                // Calendrier principal
                React.createElement('div', { className: "p-4" },
                    React.createElement('div', { className: "bg-white rounded-lg shadow-sm overflow-hidden" },
                        React.createElement('div', { className: "overflow-x-auto" },
                            React.createElement('table', { className: "w-full min-w-max" },
                                React.createElement('thead', { className: "bg-gray-50 sticky top-0" },
                                    // En-tête avec mois
                                    React.createElement('tr', null,
                                        React.createElement('th', { 
                                            className: `px-3 py-2 text-left font-semibold text-gray-700 sticky left-0 bg-gray-50 z-20 border-r ${isMobile ? 'min-w-[120px]' : 'min-w-[160px]'}` 
                                        }, filterType === 'global' ? "Ressource" :
                                           filterType === 'personnel' ? (isMobile ? "Tech." : "Technicien") : (isMobile ? "Équip." : "Équipement")),
                                        !isMobile && React.createElement('th', { 
                                            className: "px-2 py-2 text-left font-semibold text-gray-700 sticky left-[160px] bg-gray-50 z-20 border-r w-20" 
                                        }, filterType === 'global' ? "Type" :
                                           filterType === 'personnel' ? "Poste" : "Type"),
                                        ...continuousDays.map((day, index) => {
                                            const showMonth = index === 0 || day.date.getDate() === 1;
                                            return React.createElement('th', {
                                                key: index,
                                                className: `px-1 py-2 text-center font-semibold text-gray-700 ${isMobile ? 'w-10' : 'w-16'} border-r ${day.isWeekend ? 'bg-gray-100' : ''}`
                                            }, showMonth && React.createElement('div', { 
                                                className: "text-xs text-gray-500 font-normal" 
                                            }, isMobile ? day.monthName.substr(0, 3) : day.monthName));
                                        })
                                    ),
                                    
                                    // En-tête avec jours
                                    React.createElement('tr', null,
                                        React.createElement('th', { className: `px-3 py-2 sticky left-0 bg-gray-50 z-20 border-r ${isMobile ? 'w-[120px]' : 'w-[160px]'}` }),
                                        !isMobile && React.createElement('th', { className: "px-2 py-2 sticky left-[160px] bg-gray-50 z-20 border-r" }),
                                        ...continuousDays.map((day, index) => 
                                            React.createElement('th', {
                                                key: index,
                                                className: `px-1 py-2 text-center text-xs border-r ${day.isWeekend ? 'bg-gray-100' : 'bg-gray-50'} ${day.isToday ? 'bg-blue-100 text-blue-600 font-bold' : 'text-gray-600'}`
                                            },
                                                React.createElement('div', { className: "font-medium" }, 
                                                    isMobile ? day.dayName.substr(0, 1) : day.dayName
                                                ),
                                                React.createElement('div', { 
                                                    className: `${isMobile ? 'text-xs' : 'text-sm'} ${day.isToday ? 'font-bold' : ''}` 
                                                }, day.dayNumber)
                                            )
                                        )
                                    )
                                ),
                                
                                React.createElement('tbody', null,
                                    ...filteredResources.map((resource) => 
                                        React.createElement('tr', {
                                            key: resource.id,
                                            className: "border-b hover:bg-gray-50"
                                        },
                                            React.createElement('td', { 
                                                className: `px-3 py-3 font-medium sticky left-0 bg-white z-10 border-r ${isMobile ? 'w-[120px]' : 'w-[160px]'}` 
                                            },
                                                React.createElement('div', { className: `${isMobile ? 'text-xs' : 'text-sm'} font-semibold flex items-center gap-1` }, 
                                                    filterType === 'global' && React.createElement(Icon, { 
                                                        name: resource.type === 'personnel' ? 'user' : 'wrench', 
                                                        size: 12,
                                                        className: resource.type === 'personnel' ? 'text-blue-600' : 'text-orange-600'
                                                    }),
                                                    isMobile ? resource.nom.split(' ')[0] : resource.nom
                                                ),
                                                React.createElement('div', { className: "text-xs text-gray-500" }, 
                                                    resource.succursale
                                                )
                                            ),
                                            !isMobile && React.createElement('td', { 
                                                className: "px-2 py-3 text-xs sticky left-[160px] bg-white z-10 border-r" 
                                            }, filterType === 'global' ? 
                                                (resource.type === 'personnel' ? resource.poste : resource.type) :
                                                (filterType === 'personnel' ? resource.poste : resource.type)
                                            ),
                                            ...continuousDays.map((day, dayIndex) => {
                                                const job = getJobForCell(resource.id, day, resource.type);
                                                const jobEquipments = job ? getJobEquipments(job) : [];
                                                const congesApprouves = resource.type === 'personnel' ? getCongesForPersonnel(resource.id, day.date) : [];
                                                
                                                // V6.5 ULTRA: TEMPORAIREMENT DÉSACTIVÉ - Revenir au système simple
                                                const allDayJobs = [];
                                                
                                                return React.createElement('td', {
                                                    key: dayIndex,
                                                    className: `px-0 py-0 border-r cursor-pointer hover:bg-blue-50 transition-colors relative ${allDayJobs.length > 1 ? 'h-16' : isMobile ? 'h-12' : 'h-10'} ${day.isWeekend ? 'bg-gray-50' : 'bg-white'}`,
                                                    onClick: (e) => handleCellClick(resource.id, day, resource.type, e),
                                                    title: allDayJobs.length > 1 ? `${allDayJobs.length} tâches ce jour` : undefined
                                                },
                                                    // RETOUR AU SYSTÈME CLASSIQUE STABLE (V6.3)
                                                    congesApprouves.length > 0 && !job ? React.createElement('div', {
                                                        className: `w-full h-full flex items-center justify-center text-xs rounded border-2 ${congesApprouves[0].type === 'vacances' ? 'conges-approuve' : 'demande-conges'}`,
                                                        title: `CONGÉ: ${congesApprouves[0].type.toUpperCase()}\nDu ${congesApprouves[0].dateDebut} au ${congesApprouves[0].dateFin}\nMotif: ${congesApprouves[0].motif}`
                                                    },
                                                        React.createElement('div', { className: "text-center truncate px-1" },
                                                            React.createElement('div', { className: `font-medium ${isMobile ? 'text-[9px]' : 'text-[10px]'}` }, 
                                                                congesApprouves[0].type === 'vacances' ? '🏖️' : congesApprouves[0].type === 'maladie' ? '🏥' : '📅'
                                                            ),
                                                            React.createElement('div', { className: `truncate ${isMobile ? 'text-[8px]' : 'text-[9px]'}` }, 
                                                                congesApprouves[0].type.toUpperCase()
                                                            )
                                                        )
                                                    ) : job ? React.createElement('div', {
                                                        className: `w-full h-full flex items-center justify-center text-xs rounded border-2 ${getPriorityAndBureauColor(job)}`,
                                                        title: `${job.numeroJob} - ${job.nom}\nBureau: ${job.bureau || 'Non assigné'}\nClient: ${job.client || 'N/A'}\n${
                                                            job.planningsIndividuels?.[resource.id] 
                                                                ? `Planning personnalisé: ${job.planningsIndividuels[resource.id].dateDebut} au ${job.planningsIndividuels[resource.id].dateFin}` 
                                                                : `Du ${job.dateDebut} au ${job.dateFin || job.dateDebut}`
                                                        }\nType: ${
                                                            job.typeHoraire === 'nuit' ? 'Travaux de nuit 🌙' : 
                                                            job.typeHoraire === '24h' ? 'Travaux 24h/24h ⏰' : 
                                                            'Travaux de jour ☀️'
                                                        }${
                                                            job.typeHoraire === '24h' && job.horairesIndividuels?.[resource.id] 
                                                                ? `\nHoraire personnel: ${job.horairesIndividuels[resource.id] === 'nuit' ? 'Nuit 🌙' : 'Jour ☀️'}`
                                                                : ''
                                                        }${
                                                            job.includeWeekendsInDuration ? '\nInclut les fins de semaine' : ''
                                                        }\nÉquipements: ${jobEquipments.map(eq => eq.nom).join(', ') || 'Aucun'}`
                                                    },
                                                        React.createElement('div', { className: "text-center truncate px-1" },
                                                            React.createElement('div', { className: `font-medium ${isMobile ? 'text-[10px]' : 'text-[12px]'}` }, `#${job.numeroJob}`),
                                                            React.createElement('div', { className: `truncate ${isMobile ? 'text-[9px]' : 'text-[11px]'}` }, 
                                                                isMobile && job.nom.length > 8 ? job.nom.substring(0, 8) + '...' : job.nom
                                                            )
                                                        ),
                                                        // Indicateur d'équipements
                                                        jobEquipments.length > 0 && React.createElement('div', {
                                                            className: "equipment-indicator",
                                                            title: `${jobEquipments.length} équipement(s) assigné(s)`
                                                        }),
                                                        // Indicateur de récurrence
                                                        job.recurrence?.active && React.createElement('div', {
                                                            className: "recurrence-indicator",
                                                            title: `Événement récurrent (${job.recurrence.type})`
                                                        }, "🔄"),
                                                        // Indicateur de planning personnalisé
                                                        job.planningsIndividuels?.[resource.id] && React.createElement('div', {
                                                            className: "absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full",
                                                            title: "Planning personnalisé"
                                                        }),
                                                        // Indicateur d'horaire individuel pour travaux 24h/24h
                                                        job.typeHoraire === '24h' && job.horairesIndividuels?.[resource.id] && 
                                                        React.createElement('div', {
                                                            className: `absolute bottom-0 right-0 w-2 h-2 rounded-full ${
                                                                job.horairesIndividuels[resource.id] === 'nuit' ? 'bg-blue-600' : 'bg-orange-400'
                                                            }`,
                                                            title: `Horaire: ${job.horairesIndividuels[resource.id] === 'nuit' ? 'Nuit' : 'Jour'}`
                                                        }),
                                                        // Indicateur de congés (même avec un job)
                                                        congesApprouves.length > 0 && React.createElement('div', {
                                                            className: "conges-indicator",
                                                            title: `CONGÉ: ${congesApprouves[0].type.toUpperCase()}\nDu ${congesApprouves[0].dateDebut} au ${congesApprouves[0].dateFin}`
                                                        })
                                                    ) : React.createElement('div', {
                                                        className: "w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                                                    }, React.createElement(Icon, { name: 'plus', size: isMobile ? 8 : 10, className: "text-gray-400" }))
                                                );
                                            })
                                        )
                                    )
                                )
                            )
                        )
                    )
                ),

                // Modals
                React.createElement(JobModal, {
                    isOpen: showJobModal,
                    onClose: () => {
                        setShowJobModal(false);
                        setSelectedJob(null);
                        setSelectedCell(null);
                    },
                    job: selectedJob,
                    onSave: handleSaveJob,
                    onDelete: handleDeleteJob,
                    personnel: getPersonnelVisible(), // Utiliser le personnel filtré selon les permissions
                    equipements,
                    sousTraitants,
                    addSousTraitant,
                    jobs,
                    selectedCell,
                    addNotification,
                    peutModifier: peutModifier(),
                    estCoordonnateur: estCoordonnateur()
                }),

                React.createElement(ResourceManagementModal, {
                    isOpen: showResourceModal,
                    onClose: () => setShowResourceModal(false),
                    personnel,
                    setPersonnel,
                    equipements,
                    setEquipements,
                    typesEquipements,
                    addTypeEquipement,
                    addNotification,
                    demandesConges,
                    setDemandesConges,
                    showCongesModal,
                    setShowCongesModal,
                    selectedPersonnelConges,
                    setSelectedPersonnelConges,
                    handleSaveConges,
                    handleDeleteConges
                }),

                // Modal de connexion admin
                React.createElement(Modal, {
                    isOpen: showAdminLogin,
                    onClose: () => {
                        setShowAdminLogin(false);
                        setAdminPassword('');
                    },
                    title: "Authentification Administrateur",
                    size: 'sm'
                },
                    React.createElement('div', { className: "p-6 space-y-4" },
                        React.createElement('div', { className: "text-sm text-gray-600 mb-4" },
                            "Accès administrateur requis pour modifier les ressources."
                        ),
                        React.createElement('div', null,
                            React.createElement('label', { className: "block text-sm font-medium mb-2" }, "Mot de passe administrateur"),
                            React.createElement('input', {
                                type: "password",
                                value: adminPassword,
                                onChange: (e) => setAdminPassword(e.target.value),
                                onKeyPress: (e) => e.key === 'Enter' && handleAdminLogin(),
                                className: "w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500",
                                placeholder: "Entrez le mot de passe",
                                autoFocus: true
                            })
                        ),
                        React.createElement('div', { className: "flex justify-end gap-3 pt-4" },
                            React.createElement('button', {
                                onClick: () => {
                                    setShowAdminLogin(false);
                                    setAdminPassword('');
                                },
                                className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            }, "Annuler"),
                            React.createElement('button', {
                                onClick: handleAdminLogin,
                                className: "px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            }, "Se connecter")
                        )
                    )
                )
            );
        };

        // 🔍 DIAGNOSTIC FINAL - Test du rendu
        console.log('%c🎯 ÉTAPE FINALE - Test du rendu', 'background: #FF9800; color: white; padding: 5px;');
        
        try {
            const rootElement = document.getElementById('root');
            if (!rootElement) {
                throw new Error('❌ Élément root non trouvé dans le DOM');
            }
            console.log('✅ Élément root trouvé:', rootElement);
            
            if (typeof PlanificateurFinal === 'undefined') {
                throw new Error('❌ Composant PlanificateurFinal non défini');
            }
            console.log('✅ Composant PlanificateurFinal défini');
            
            // Rendu de l'application
            console.log('🚀 Démarrage du rendu React...');
            const root = ReactDOM.createRoot(rootElement);
            root.render(React.createElement(PlanificateurFinal));
            console.log('%c🎉 SUCCÈS ! V6.7 chargé avec succès - Version Complète', 'background: #4CAF50; color: white; padding: 10px; font-size: 16px;');
            
        } catch (error) {
            console.error('%c💥 ERREUR LORS DU RENDU:', 'background: #f44336; color: white; padding: 5px;', error);
            console.error('Stack trace:', error.stack);
            
            document.body.innerHTML = `
                <div style="padding: 20px; background: #fee; border: 2px solid #f00; margin: 20px; border-radius: 10px; font-family: Arial;">
                    <h1 style="color: #d00;">🚨 ERREUR DE RENDU V6.4</h1>
                    <p><strong>Problème détecté:</strong> ${error.message}</p>
                    <pre style="background: #f8f8f8; padding: 10px; border-radius: 5px; overflow: auto; font-size: 12px;">${error.stack}</pre>
                    <button onclick="location.reload()" style="padding: 10px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;">🔄 Recharger la page</button>
                </div>
            `;
            throw error;
        }
    </script>
</body>
</html><!-- Trigger deploy ven. 12 sept. 2025 12:56:56 -->
