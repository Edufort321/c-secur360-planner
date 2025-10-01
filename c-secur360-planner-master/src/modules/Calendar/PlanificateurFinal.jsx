import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '../../components/UI/Icon';
import { JobModal } from '../NewJob/JobModal';
import { AnalyticsDashboard } from '../../components/Analytics/AnalyticsDashboard';
import { BUREAU_COLORS } from '../../../config/constants.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import {
    generateLocalizedDays,
    formatLocalizedDate,
    getLocalizedDayName,
    getLocalizedMonthName
} from '../../utils/localizedDateUtils.js';

export function PlanificateurFinal({
    jobs = [],
    personnel = [],
    equipements = [],
    sousTraitants = [],
    conges = [],
    succursales = [],
    onSaveJob,
    onDeleteJob,
    onSavePersonnel,
    onDeletePersonnel,
    onSaveEquipement,
    onDeleteEquipement,
    onSaveConge,
    onDeleteConge,
    addSousTraitant,
    addNotification,
    utilisateurConnecte = null,
    peutModifier = () => false,
    estCoordonnateur = () => false
}) {
    // Hook de traduction
    const { t, currentLanguage } = useLanguage();

    // Hauteur uniforme simple
    const CELL_HEIGHT = 89; // pixels
    // États pour la vue calendrier
    const [startDate, setStartDate] = useState(new Date());
    const [numberOfDays, setNumberOfDays] = useState(14);
    const [timeView, setTimeView] = useState('2weeks'); // '1day', '1week', '2weeks'
    const [filterType, setFilterType] = useState('personnel'); // 'personnel', 'equipements', 'global'
    const [filterBureau, setFilterBureau] = useState('tous');
    const [filterPoste, setFilterPoste] = useState('tous');
    const [searchTerm, setSearchTerm] = useState('');
    const [modeVueIndividuel, setModeVueIndividuel] = useState(false);
    const [travailleurSelectionne, setTravailleurSelectionne] = useState('');
    const [selectedJob, setSelectedJob] = useState(null);
    const [conflictJob, setConflictJob] = useState(null); // Job en conflit ouvert en parallèle
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Effet pour ajuster numberOfDays selon la vue temporelle
    useEffect(() => {
        if (timeView.startsWith('period-')) {
            // Les périodes étendues sont déjà gérées dans le onChange du select
            return;
        }

        switch(timeView) {
            case '1day':
                setNumberOfDays(1);
                break;
            case '1week':
                setNumberOfDays(7);
                break;
            case '2weeks':
            default:
                setNumberOfDays(14);
                break;
        }
    }, [timeView]);

    // Fonction pour calculer les largeurs des cellules selon la vue
    const getCellWidth = () => {
        if (isMobile) {
            switch(timeView) {
                case '1day': return 'w-32'; // 128px - très large pour 1 jour
                case '1week': return 'w-20'; // 80px - large pour 7 jours
                case '2weeks': return 'w-10'; // 40px - normal pour 14 jours
                case 'period-21': return 'w-8'; // 32px - compact pour 3 semaines
                case 'period-30': return 'w-6'; // 24px - très compact pour 1 mois
                case 'period-90': return 'w-4'; // 16px - minimal pour 3 mois
                case 'period-180': return 'w-3'; // 12px - très minimal pour 6 mois
                case 'period-365': return 'w-2'; // 8px - ultra minimal pour 1 an
                default: return 'w-10';
            }
        } else {
            switch(timeView) {
                case '1day': return 'w-48'; // 192px - très large pour 1 jour
                case '1week': return 'w-32'; // 128px - large pour 7 jours
                case '2weeks': return 'w-16'; // 64px - normal pour 14 jours
                case 'period-21': return 'w-12'; // 48px - compact pour 3 semaines
                case 'period-30': return 'w-10'; // 40px - compact pour 1 mois
                case 'period-90': return 'w-6'; // 24px - minimal pour 3 mois
                case 'period-180': return 'w-4'; // 16px - très minimal pour 6 mois
                case 'period-365': return 'w-3'; // 12px - ultra minimal pour 1 an
                default: return 'w-16';
            }
        }
    };

    // États pour la navigation de date rapide
    const [showDateSearch, setShowDateSearch] = useState(false);
    const [quickDate, setQuickDate] = useState('');

    // États pour le dashboard
    const [dashboardFilter, setDashboardFilter] = useState('global'); // 'global', 'personnel', 'equipements'

    // État pour le menu hamburger
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [activeFilterTab, setActiveFilterTab] = useState('type'); // 'type', 'bureau', 'poste', 'vue'

    // État pour le mode de couleur
    const [colorMode, setColorMode] = useState('succursale'); // 'succursale' ou 'priorite'

    // Fonction pour obtenir les options de bureau
    const getBureauOptions = () => {
        const bureaux = new Set();
        personnel.forEach(p => p.succursale && bureaux.add(p.succursale));
        equipements.forEach(e => e.succursale && bureaux.add(e.succursale));

        const options = [{ value: 'tous', label: t ? t('resource.allOffices') : 'Tous les bureaux' }];
        Array.from(bureaux).sort().forEach(bureau => {
            options.push({ value: bureau, label: bureau });
        });
        return options;
    };

    // Obtenir la couleur d'une succursale
    const getSuccursaleColor = (nomSuccursale) => {
        const succursaleObj = succursales.find(s => s.nom === nomSuccursale);
        return succursaleObj?.couleur || '#6B7280'; // Couleur grise par défaut
    };

    // Fonction pour obtenir les options de poste
    const getPosteOptions = () => {
        const postes = new Set();
        personnel.forEach(p => {
            if (p.poste) {
                const posteLabel = p.departement ? `${p.poste} - ${p.departement}` : p.poste;
                postes.add(JSON.stringify({ value: p.poste, label: posteLabel }));
            }
        });

        const options = [{ value: 'tous', label: t ? t('resource.allPositions') : 'Tous les postes' }];
        Array.from(postes)
            .map(p => JSON.parse(p))
            .sort((a, b) => a.label.localeCompare(b.label))
            .forEach(poste => {
                options.push(poste);
            });
        return options;
    };

    // Navigation de date rapide
    const handleQuickDateGo = () => {
        if (quickDate) {
            const date = new Date(quickDate);
            if (!isNaN(date.getTime())) {
                setStartDate(date);
                setShowDateSearch(false);
                setQuickDate('');
            }
        }
    };

    // Fonction pour afficher la date complète lors du double-clic
    const handleDateDoubleClick = (date) => {
        const dateComplete = formatLocalizedDate(date, currentLanguage, 'full');
        alert(`📅 ${t('calendar.fullDate')} :\n${dateComplete}`);
    };

    // Période prédéfinies
    const periodOptions = [
        { value: 14, label: '2S', days: 14 },
        { value: 21, label: '3S', days: 21 },
        { value: 30, label: '1M', days: 30 },
        { value: 90, label: '3M', days: 90 },
        { value: 180, label: '6M', days: 180 },
        { value: 365, label: '1AN', days: 365 }
    ];

    // Calculer les statistiques du dashboard
    const dashboardStats = useMemo(() => {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + numberOfDays);

        // Filtrer les jobs dans la période
        const jobsInPeriod = jobs.filter(job => {
            const jobDate = new Date(job.dateDebut);
            return jobDate >= startDate && jobDate <= endDate;
        });

        // Filtrer selon le bureau si nécessaire
        const filteredJobs = filterBureau === 'tous' ? jobsInPeriod :
            jobsInPeriod.filter(job => {
                if (dashboardFilter === 'personnel') {
                    return job.personnel && job.personnel.some(p => {
                        const person = personnel.find(pers => pers.id === p);
                        return person && person.succursale === filterBureau;
                    });
                } else if (dashboardFilter === 'equipements') {
                    return job.equipements && job.equipements.some(e => {
                        const equipement = equipements.find(eq => eq.id === e);
                        return equipement && equipement.succursale === filterBureau;
                    });
                }
                return true;
            });

        // Calculer les statistiques par statut
        const stats = {
            total: filteredJobs.length,
            enCours: filteredJobs.filter(job => job.statut === 'en-cours').length,
            tentatif: filteredJobs.filter(job => job.statut === 'tentatif').length,
            planifie: filteredJobs.filter(job => job.statut === 'planifie').length,
            enAttente: filteredJobs.filter(job => job.statut === 'en-attente' || !job.statut).length,
            termine: filteredJobs.filter(job => job.statut === 'termine').length
        };

        // Calculer le pourcentage de planification du personnel
        let totalPersonnelRequis = 0;
        let personnelPlanifie = 0;

        filteredJobs.forEach(job => {
            if (job.personnel) {
                totalPersonnelRequis += job.personnel.length;
                personnelPlanifie += job.personnel.filter(p => {
                    const person = personnel.find(pers => pers.id === p);
                    return person && person.disponible !== false;
                }).length;
            }
        });

        const pourcentagePlanification = totalPersonnelRequis > 0 ?
            Math.round((personnelPlanifie / totalPersonnelRequis) * 100) : 0;

        // Statistiques par priorité
        const parPriorite = {
            urgente: filteredJobs.filter(job => job.priorite === 'urgente').length,
            haute: filteredJobs.filter(job => job.priorite === 'haute').length,
            normale: filteredJobs.filter(job => job.priorite === 'normale').length,
            faible: filteredJobs.filter(job => job.priorite === 'faible').length
        };

        // Statistiques par bureau
        const parBureau = {};
        filteredJobs.forEach(job => {
            const bureau = job.bureau || 'Non défini';
            parBureau[bureau] = (parBureau[bureau] || 0) + 1;
        });

        return {
            ...stats,
            pourcentagePlanification,
            totalPersonnelRequis,
            personnelPlanifie,
            parPriorite,
            parBureau,
            periode: numberOfDays
        };
    }, [jobs, startDate, numberOfDays, dashboardFilter, filterBureau, personnel, equipements]);

    // Responsive
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fermer la recherche de date quand on clique en dehors
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDateSearch && !event.target.closest('.date-search-container')) {
                setShowDateSearch(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDateSearch]);

    // Générer les jours continus avec traduction
    const continuousDays = useMemo(() => {
        return generateLocalizedDays(startDate, numberOfDays, currentLanguage, isMobile);
    }, [startDate, numberOfDays, currentLanguage, isMobile]);

    // Trier le personnel par bureau puis alphabétique (nom, prénom)
    const sortPersonnel = (personnelList) => {
        return personnelList.sort((a, b) => {
            // Trier d'abord par bureau
            if (a.succursale !== b.succursale) {
                return (a.succursale || '').localeCompare(b.succursale || '');
            }

            // Puis trier alphabétiquement par nom complet
            const nomA = a.nom.toLowerCase();
            const nomB = b.nom.toLowerCase();
            return nomA.localeCompare(nomB);
        });
    };

    // Trier les équipements par bureau puis alphabétique
    const sortEquipements = (equipementsList) => {
        return equipementsList.sort((a, b) => {
            // Trier d'abord par bureau
            if (a.succursale !== b.succursale) {
                return (a.succursale || '').localeCompare(b.succursale || '');
            }

            // Puis trier alphabétiquement par nom
            const nomA = a.nom.toLowerCase();
            const nomB = b.nom.toLowerCase();
            return nomA.localeCompare(nomB);
        });
    };

    // Filtrer les ressources (personnel et équipements)
    const filteredResources = useMemo(() => {
        if (modeVueIndividuel && travailleurSelectionne) {
            if (filterType === 'personnel') {
                let filteredPersonnel = personnel.filter(person => {
                    const matchesSearch = person.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                       (person.prenom && person.prenom.toLowerCase().includes(searchTerm.toLowerCase()));
                    const matchesBureau = filterBureau === 'tous' || person.succursale === filterBureau;
                    const matchesPoste = filterPoste === 'tous' || person.poste === filterPoste;
                    const visibleCalendrier = person.visibleChantier === true;
                    return matchesSearch && matchesBureau && matchesPoste && visibleCalendrier && person.id === travailleurSelectionne;
                });
                return sortPersonnel(filteredPersonnel).map(p => ({...p, type: 'personnel'}));
            } else if (filterType === 'equipements') {
                const filteredEquipements = equipements.filter(equipement => {
                    const matchesSearch = equipement.nom.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesBureau = filterBureau === 'tous' || equipement.succursale === filterBureau;
                    const visibleCalendrier = equipement.visibleChantier === true;
                    return matchesSearch && matchesBureau && visibleCalendrier && equipement.id === travailleurSelectionne;
                });
                return sortEquipements(filteredEquipements).map(e => ({...e, type: 'equipement'}));
            } else if (filterType === 'global') {
                // Vue individuelle globale - chercher dans personnel et équipements
                let filteredPersonnel = personnel.filter(person => {
                    const matchesSearch = person.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                       (person.prenom && person.prenom.toLowerCase().includes(searchTerm.toLowerCase()));
                    const matchesBureau = filterBureau === 'tous' || person.succursale === filterBureau;
                    const matchesPoste = filterPoste === 'tous' || person.poste === filterPoste;
                    const visibleCalendrier = person.visibleChantier === true;
                    return matchesSearch && matchesBureau && matchesPoste && visibleCalendrier && person.id === travailleurSelectionne;
                }).map(p => ({...p, type: 'personnel'}));

                const filteredEquipements = equipements.filter(equipement => {
                    const matchesSearch = equipement.nom.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesBureau = filterBureau === 'tous' || equipement.succursale === filterBureau;
                    const visibleCalendrier = equipement.visibleChantier === true;
                    return matchesSearch && matchesBureau && visibleCalendrier && equipement.id === travailleurSelectionne;
                }).map(e => ({...e, type: 'equipement'}));

                return [...filteredPersonnel, ...sortEquipements(filteredEquipements)];
            }
            // Fallback pour éviter undefined
            return [];
        } else if (filterType === 'personnel') {
            let filteredPersonnel = personnel.filter(person => {
                const matchesSearch = person.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                   (person.prenom && person.prenom.toLowerCase().includes(searchTerm.toLowerCase()));
                const matchesBureau = filterBureau === 'tous' || person.succursale === filterBureau;
                const matchesPoste = filterPoste === 'tous' || person.poste === filterPoste;
                const visibleCalendrier = person.visibleChantier === true;
                return matchesSearch && matchesBureau && matchesPoste && visibleCalendrier;
            });
            return sortPersonnel(filteredPersonnel).map(p => ({...p, type: 'personnel'}));
        } else if (filterType === 'equipements') {
            return sortEquipements(equipements.filter(equipement => {
                const matchesSearch = equipement.nom.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesBureau = filterBureau === 'tous' || equipement.succursale === filterBureau;
                const visibleCalendrier = equipement.visibleChantier === true;
                return matchesSearch && matchesBureau && visibleCalendrier;
            })).map(e => ({...e, type: 'equipement'}));
        } else if (filterType === 'jobs') {
            // Vue "Événements seulement" - créer des lignes pour chaque événement
            return jobs.filter(job => {
                const matchesBureau = filterBureau === 'tous' || job.bureau === filterBureau;
                const matchesSearch = job.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    job.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    job.numeroJob?.toLowerCase().includes(searchTerm.toLowerCase());
                // Inclure tous les événements : planifiés, tentatifs, ou sans personnel assigné
                const isRelevantJob = ['planifie', 'tentatif', 'en-attente'].includes(job.statut) ||
                                    !job.personnel?.length || !job.equipements?.length;
                return matchesBureau && matchesSearch && isRelevantJob;
            }).map(job => ({
                id: `job-${job.id}`,
                nom: `${job.numeroJob} - ${job.nom}`,
                poste: job.client || 'Client non défini',
                succursale: job.bureau || 'Bureau non défini',
                bureau: job.bureau,
                type: 'job',
                job: job, // Référence au job complet
                priorite: job.priorite,
                statut: job.statut
            }));
        } else { // global
            let filteredPersonnel = personnel.filter(person => {
                const matchesSearch = person.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                   (person.prenom && person.prenom.toLowerCase().includes(searchTerm.toLowerCase()));
                const matchesBureau = filterBureau === 'tous' || person.succursale === filterBureau;
                const matchesPoste = filterPoste === 'tous' || person.poste === filterPoste;
                const visibleCalendrier = person.visibleChantier === true;
                return matchesSearch && matchesBureau && matchesPoste && visibleCalendrier;
            }).map(p => ({...p, type: 'personnel'}));

            const filteredEquipements = sortEquipements(equipements.filter(equipement => {
                const matchesSearch = equipement.nom.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesBureau = filterBureau === 'tous' || equipement.succursale === filterBureau;
                const visibleCalendrier = equipement.visibleChantier === true;
                return matchesSearch && matchesBureau && visibleCalendrier;
            })).map(e => ({...e, type: 'equipement'}));

            return [...filteredPersonnel, ...filteredEquipements];
        }
    }, [personnel, equipements, filterType, filterBureau, filterPoste, searchTerm, modeVueIndividuel, travailleurSelectionne]);

    // Obtenir le job pour une cellule donnée
    const getJobForCell = (resourceId, day, resourceType) => {
        const dayString = day.fullDate;

        if (resourceType === 'job') {
            // Pour la vue "événements seulement", retourner l'événement s'il tombe sur cette date
            const jobId = resourceId.replace('job-', '');
            const job = jobs.find(j => j.id.toString() === jobId);
            if (!job) return null;

            const jobDateDebut = new Date(job.dateDebut).toISOString().split('T')[0];
            const jobDateFin = job.dateFin ? new Date(job.dateFin).toISOString().split('T')[0] : jobDateDebut;

            return dayString >= jobDateDebut && dayString <= jobDateFin ? job : null;
        }

        return jobs.find(job => {
            const jobDateDebut = new Date(job.dateDebut).toISOString().split('T')[0];
            const jobDateFin = job.dateFin ? new Date(job.dateFin).toISOString().split('T')[0] : jobDateDebut;

            // Vérifier si le jour actuel est dans la plage du job
            if (!(dayString >= jobDateDebut && dayString <= jobDateFin)) return false;

            if (resourceType === 'personnel') {
                return job.personnel && job.personnel.includes(resourceId);
            } else if (resourceType === 'equipement') {
                return job.equipements && job.equipements.includes(resourceId);
            }
            return false;
        });
    };

    // Nouvelle fonction pour obtenir TOUS les jobs d'une cellule (pour timeline)
    const getAllJobsForCell = (resourceId, day, resourceType) => {
        const dayString = day.fullDate;

        if (resourceType === 'job') {
            const jobId = resourceId.replace('job-', '');
            const job = jobs.find(j => j.id.toString() === jobId);
            if (!job) return [];

            const jobDateDebut = new Date(job.dateDebut).toISOString().split('T')[0];
            const jobDateFin = job.dateFin ? new Date(job.dateFin).toISOString().split('T')[0] : jobDateDebut;

            return dayString >= jobDateDebut && dayString <= jobDateFin ? [job] : [];
        }

        return jobs.filter(job => {
            const jobDateDebut = new Date(job.dateDebut).toISOString().split('T')[0];
            const jobDateFin = job.dateFin ? new Date(job.dateFin).toISOString().split('T')[0] : jobDateDebut;

            // Vérifier si le jour actuel est dans la plage du job
            if (!(dayString >= jobDateDebut && dayString <= jobDateFin)) return false;

            if (resourceType === 'personnel') {
                return job.personnel && job.personnel.includes(resourceId);
            } else if (resourceType === 'equipement') {
                return job.equipements && job.equipements.includes(resourceId);
            }
            return false;
        });
    };

    // Composant Timeline pour afficher les jobs dans une cellule
    const TimelineCell = ({ jobs, day, onJobClick, resourceId, resourceType }) => {
        if (!jobs || jobs.length === 0) return null;

        // Fonction pour obtenir l'horaire spécifique d'une ressource pour un job
        const getResourceSchedule = (job, resourceId, resourceType) => {
            // Vérifier s'il y a un horaire personnalisé pour cette ressource
            const resourceKey = `${resourceType}_${resourceId}`;
            const customSchedule = job.horairesIndividuels && job.horairesIndividuels[resourceKey];

            if (customSchedule && customSchedule.mode === 'personnalise') {
                // Vérifier si cette ressource travaille ce jour-là
                const dayString = day.fullDate;
                if (customSchedule.joursTravailles && !customSchedule.joursTravailles.includes(dayString)) {
                    return null; // La ressource ne travaille pas ce jour
                }

                return {
                    heureDebut: customSchedule.heureDebut || job.heureDebut || '08:00',
                    heureFin: customSchedule.heureFin || job.heureFin || '17:00'
                };
            }

            // Utiliser l'horaire global de l'événement
            return {
                heureDebut: job.heureDebut || '08:00',
                heureFin: job.heureFin || '17:00'
            };
        };

        // Fonction pour calculer la position et largeur d'un job dans la timeline
        const getJobTimelineStyle = (job) => {
            const schedule = getResourceSchedule(job, resourceId, resourceType);

            // Si la ressource ne travaille pas ce jour, ne pas afficher
            if (!schedule) return null;

            const heureDebut = schedule.heureDebut;
            const heureFin = schedule.heureFin;

            // Convertir les heures en minutes depuis minuit
            const [debutH, debutM] = heureDebut.split(':').map(Number);
            const [finH, finM] = heureFin.split(':').map(Number);

            const minutesDebut = debutH * 60 + debutM;
            const minutesFin = finH * 60 + finM;

            // Timeline de 6h (360min) à 20h (1200min) = 840 minutes
            const timelineStart = 6 * 60; // 6h00
            const timelineEnd = 20 * 60;   // 20h00
            const timelineRange = timelineEnd - timelineStart;

            // Calculer pourcentages
            const left = Math.max(0, ((minutesDebut - timelineStart) / timelineRange) * 100);
            const width = Math.min(100 - left, ((minutesFin - minutesDebut) / timelineRange) * 100);

            return {
                left: `${left}%`,
                width: `${Math.max(8, width)}%` // Minimum 8% de largeur pour visibilité
            };
        };

        // Fonction pour détecter les conflits d'horaires et organiser en lignes
        const organizeJobsInLayers = (jobs) => {
            const layers = [];

            jobs.forEach(job => {
                const heureDebut = job.heureDebut || '08:00';
                const heureFin = job.heureFin || '17:00';

                // Convertir en minutes pour comparaison
                const [debutH, debutM] = heureDebut.split(':').map(Number);
                const [finH, finM] = heureFin.split(':').map(Number);
                const debut = debutH * 60 + debutM;
                const fin = finH * 60 + finM;

                // Trouver une ligne disponible
                let layerIndex = 0;
                while (layerIndex < layers.length) {
                    const layer = layers[layerIndex];
                    let canPlace = true;

                    // Vérifier si ce job peut être placé dans cette ligne
                    for (const existingJob of layer) {
                        const existingDebut = existingJob.debut;
                        const existingFin = existingJob.fin;

                        // Chevauchement si début < existingFin ET fin > existingDebut
                        if (debut < existingFin && fin > existingDebut) {
                            canPlace = false;
                            break;
                        }
                    }

                    if (canPlace) {
                        layer.push({ job, debut, fin });
                        break;
                    }

                    layerIndex++;
                }

                // Si aucune ligne disponible, créer une nouvelle ligne
                if (layerIndex === layers.length) {
                    layers.push([{ job, debut, fin }]);
                }
            });

            return layers;
        };

        // Déterminer la couleur basée sur le mode sélectionné
        const getJobColor = (job) => {
            if (colorMode === 'succursale' && job.succursaleEnCharge) {
                const bureauColor = BUREAU_COLORS[job.succursaleEnCharge];
                if (bureauColor) {
                    return `text-white`;
                }
            }

            // Fallback sur priorité
            switch(job.priorite) {
                case 'urgente': return 'bg-red-500 text-white';
                case 'haute': return 'bg-orange-500 text-white';
                case 'normale': return 'bg-blue-500 text-white';
                default: return 'bg-green-500 text-white';
            }
        };

        // Fonction pour obtenir le style de couleur
        const getJobStyle = (job) => {
            if (colorMode === 'succursale' && job.succursaleEnCharge) {
                // Chercher la succursale dans la liste des succursales créées
                const succursaleObj = succursales.find(s => s.nom === job.succursaleEnCharge);
                if (succursaleObj && succursaleObj.couleur) {
                    return {
                        backgroundColor: succursaleObj.couleur,
                        color: '#ffffff'
                    };
                }
            }

            // Fallback sur priorité avec couleurs par défaut
            switch(job.priorite) {
                case 'urgente': return { backgroundColor: '#ef4444', color: '#ffffff' };
                case 'haute': return { backgroundColor: '#f59e0b', color: '#ffffff' };
                case 'normale': return { backgroundColor: '#3b82f6', color: '#ffffff' };
                default: return { backgroundColor: '#10b981', color: '#ffffff' };
            }
        };

        const jobLayers = organizeJobsInLayers(jobs);
        const layerHeight = Math.floor(CELL_HEIGHT / jobLayers.length); // Diviser par nombre de lignes nécessaires

        return (
            <div className="relative w-full h-20 bg-gray-50 border border-gray-200 rounded">
                {/* Grille d'heures en arrière-plan */}
                <div className="absolute inset-0 flex opacity-25">
                    {Array.from({length: 12}, (_, i) => (
                        <div key={i} className="flex-1 border-r border-gray-300 last:border-r-0"></div>
                    ))}
                </div>

                {/* Affichage des jobs organisés en lignes */}
                {jobLayers.map((layer, layerIndex) => (
                    <div
                        key={layerIndex}
                        className="absolute w-full"
                        style={{
                            top: `${layerIndex * layerHeight}px`,
                            height: `${layerHeight}px`
                        }}
                    >
                        {layer.map(({ job }, jobIndex) => {
                            const timelineStyle = getJobTimelineStyle(job);
                            const colorStyle = getJobStyle(job);
                            const heureDebut = job.heureDebut || '08:00';
                            const heureFin = job.heureFin || '17:00';

                            return (
                                <div
                                    key={`${job.id}-${layerIndex}-${jobIndex}`}
                                    className={`absolute h-full rounded px-1 cursor-pointer hover:opacity-80 flex flex-col justify-center`}
                                    style={{
                                        left: timelineStyle.left,
                                        width: timelineStyle.width,
                                        fontSize: layerHeight > 25 ? '11px' : layerHeight > 15 ? '10px' : '8px',
                                        backgroundColor: colorStyle.backgroundColor,
                                        color: colorStyle.color
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onJobClick(job);
                                    }}
                                    title={`${job.numeroJob || `Job-${job.id}`} - ${job.client} (${heureDebut}-${heureFin})`}
                                >
                                    {/* Contenu de l'événement */}
                                    <div className="text-center leading-tight">
                                        <div className="font-bold truncate">
                                            {job.numeroJob || `Job-${job.id}`}
                                        </div>
                                        <div className="truncate opacity-90">
                                            {job.client}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}

                {/* Indicateurs d'heures */}
                <div className="absolute inset-x-0 bottom-0 h-3 flex text-xs text-gray-500 opacity-70 pointer-events-none">
                    <div className="text-center text-[9px]">6h</div>
                    <div className="flex-1"></div>
                    <div className="text-center text-[9px]">9h</div>
                    <div className="flex-1"></div>
                    <div className="text-center text-[9px]">12h</div>
                    <div className="flex-1"></div>
                    <div className="text-center text-[9px]">15h</div>
                    <div className="flex-1"></div>
                    <div className="text-center text-[9px]">18h</div>
                </div>
            </div>
        );
    };

    // Fonction pour ouvrir un job en conflit en parallèle
    const handleOpenConflictJob = (conflictingJob) => {
        setConflictJob(conflictingJob);
    };

    // Gestion du clic sur une cellule
    const handleCellClick = (resourceId, day, resourceType) => {
        const existingJob = getJobForCell(resourceId, day, resourceType);

        if (existingJob) {
            setSelectedJob(existingJob);
        } else {
            // Créer un nouveau job
            const newJob = {
                id: null,
                nom: '',
                dateDebut: day.fullDate,
                heureDebut: '08:00',
                heureFin: '17:00',
                personnel: resourceType === 'personnel' ? [resourceId] : [],
                equipements: resourceType === 'equipement' ? [resourceId] : [],
                sousTraitants: [],
                statut: 'planifie',
                priorite: 'normale'
            };
            setSelectedJob(newJob);
        }
    };

    // Navigation
    const navigateWeeks = (direction) => {
        const newDate = new Date(startDate);
        newDate.setDate(newDate.getDate() + (direction * 7));
        setStartDate(newDate);
    };

    const goToToday = () => {
        setStartDate(new Date());
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header avec contrôles */}
            <div className="bg-white shadow-sm border-b p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Statistiques */}
                    <div className="flex-1">
                        <p className="text-lg font-semibold text-gray-900">
                            {jobs.length} événements • {personnel.length} techniciens • {equipements.length} équipements
                        </p>
                        <p className="text-sm text-gray-600">
                            Vue {modeVueIndividuel ? 'individuelle' : 'globale'} • {numberOfDays} jours
                        </p>
                    </div>


                    {/* Navigation temporelle */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => navigateWeeks(-1)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <Icon name="chevronLeft" size={20} />
                        </button>
                        <button
                            onClick={goToToday}
                            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                        >
                            {t('calendar.today')}
                        </button>
                        <button
                            onClick={() => navigateWeeks(1)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <Icon name="chevronRight" size={20} />
                        </button>

                        {/* Sélecteur de vue temporelle et période */}
                        <select
                            value={timeView.startsWith('period-') ? timeView : timeView}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value.startsWith('period-')) {
                                    setTimeView(value);
                                    setNumberOfDays(parseInt(value.replace('period-', '')));
                                } else {
                                    setTimeView(value);
                                }
                            }}
                            className="px-3 py-2 text-sm border rounded-lg bg-white"
                        >
                            <optgroup label={t('calendar.detailedViews')}>
                                <option value="1day">{t('calendar.day')}</option>
                                <option value="1week">{t('calendar.1week')}</option>
                                <option value="2weeks">{t('calendar.2weeks')}</option>
                            </optgroup>
                            <optgroup label={t('calendar.extendedPeriods')}>
                                <option value="period-21">{t('calendar.3weeks')}</option>
                                <option value="period-30">{t('calendar.1month')}</option>
                                <option value="period-90">{t('calendar.3months')}</option>
                                <option value="period-180">{t('calendar.6months')}</option>
                                <option value="period-365">{t('calendar.1year')}</option>
                            </optgroup>
                        </select>

                        {/* Sélecteur de mode de couleur */}
                        <select
                            value={colorMode}
                            onChange={(e) => setColorMode(e.target.value)}
                            className="px-3 py-2 text-sm border rounded-lg bg-white"
                            title={t('calendar.colorMode')}
                        >
                            <option value="succursale">{t('calendar.colorByBranch')}</option>
                            <option value="priorite">{t('calendar.colorByPriority')}</option>
                        </select>

                        {/* Recherche de date rapide */}
                        <div className="relative date-search-container">
                            <button
                                onClick={() => setShowDateSearch(!showDateSearch)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                                title="Aller à une date"
                            >
                                <Icon name="calendar" size={20} />
                            </button>

                            {showDateSearch && (
                                <div className="absolute top-full mt-1 right-0 bg-white border rounded-lg shadow-lg p-3 z-50 min-w-[250px]">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Aller à une date</h4>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={quickDate}
                                            onChange={(e) => setQuickDate(e.target.value)}
                                            className="flex-1 px-2 py-1 text-sm border rounded"
                                            placeholder="YYYY-MM-DD"
                                        />
                                        <button
                                            onClick={handleQuickDateGo}
                                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                                        >
                                            Aller
                                        </button>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-500">
                                        Sélectionnez une date pour y naviguer rapidement
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filtres et recherche */}
                <div className="flex flex-col lg:flex-row gap-4 mt-4">
                    <div className="flex flex-1 gap-2">
                        {/* Menu hamburger avec titre */}
                        <div className="relative flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">{t('filter.filters')}</span>
                            <button
                                onClick={() => setShowFilterMenu(!showFilterMenu)}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border"
                                title={t('filter.menuFilters')}
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={`transition-transform duration-200 ${showFilterMenu ? 'rotate-90' : ''}`}
                                >
                                    <path d="M3 12h18M3 6h18M3 18h18" />
                                </svg>
                            </button>

                            {/* Menu déroulant avec onglets */}
                            {showFilterMenu && (
                                <>
                                    <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                                        <div className="p-4">
                                            {/* Header du menu */}
                                            <div className="border-b border-gray-200 pb-3 mb-4">
                                                <h3 className="text-sm font-semibold text-gray-900">
                                                    {t('filter.filtersAndOptions')}
                                                </h3>
                                            </div>

                                            {/* Bouton Créer événement */}
                                            <button
                                                onClick={() => {
                                                    const newJob = {
                                                        id: null,
                                                        nom: '',
                                                        dateDebut: new Date().toISOString().split('T')[0],
                                                        heureDebut: '08:00',
                                                        heureFin: '17:00',
                                                        personnel: [],
                                                        equipements: [],
                                                        sousTraitants: [],
                                                        statut: 'planifie',
                                                        priorite: 'normale'
                                                    };
                                                    setSelectedJob(newJob);
                                                    setShowFilterMenu(false);
                                                }}
                                                className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
                                            >
                                                <span className="text-xl">➕</span>
                                                <span>{t ? t('event.createEvent') : 'Créer un événement'}</span>
                                            </button>

                                            {/* Section Paramètres système */}
                                            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-sm font-medium text-gray-700">⚙️ Paramètres</span>
                                                </div>

                                                {/* Mode écran */}
                                                <div className="mb-3">
                                                    <label className="text-xs text-gray-600 mb-1 block">Mode d'affichage</label>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setIsMobile(false)}
                                                            className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
                                                                !isMobile
                                                                    ? 'bg-blue-500 text-white'
                                                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                                            }`}
                                                        >
                                                            🖥️ Bureau
                                                        </button>
                                                        <button
                                                            onClick={() => setIsMobile(true)}
                                                            className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
                                                                isMobile
                                                                    ? 'bg-blue-500 text-white'
                                                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                                            }`}
                                                        >
                                                            📱 Mobile
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Thème */}
                                                <div>
                                                    <label className="text-xs text-gray-600 mb-1 block">Thème</label>
                                                    <div className="flex gap-2">
                                                        <button
                                                            className="flex-1 px-2 py-1.5 text-xs rounded bg-blue-500 text-white"
                                                        >
                                                            ☀️ Jour
                                                        </button>
                                                        <button
                                                            disabled
                                                            className="flex-1 px-2 py-1.5 text-xs rounded bg-gray-300 text-gray-500 cursor-not-allowed"
                                                        >
                                                            🌙 Nuit
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Onglets */}
                                            <div className="flex border-b border-gray-200 mb-4">
                                                {[
                                                    { key: 'type', label: t ? t('filter.type') : 'Type', icon: '🔍' },
                                                    { key: 'bureau', label: t ? t('filter.office') : 'Bureau', icon: '🏢' },
                                                    { key: 'poste', label: t ? t('filter.position') : 'Poste', icon: '👔' },
                                                    { key: 'vue', label: t ? t('filter.view') : 'Vue', icon: '👁️' }
                                                ].map((tab) => (
                                                    <button
                                                        key={tab.key}
                                                        onClick={() => setActiveFilterTab(tab.key)}
                                                        className={`flex-1 py-2 px-3 text-sm font-medium border-b-2 transition-colors ${
                                                            activeFilterTab === tab.key
                                                                ? 'border-blue-500 text-blue-600'
                                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                                        }`}
                                                    >
                                                        <span className="mr-1">{tab.icon}</span>
                                                        {tab.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Contenu des onglets */}
                                            <div className="min-h-[200px]">
                                                {/* Onglet Type de vue */}
                                                {activeFilterTab === 'type' && (
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                                            {t('filter.selectViewType')}
                                                        </label>
                                                        {[
                                                            { value: 'personnel', label: t('viewType.personnel'), desc: t('filter.personnelOnly') },
                                                            { value: 'equipements', label: t('viewType.equipment'), desc: t('filter.equipmentOnly') },
                                                            { value: 'global', label: t('viewType.global'), desc: t('filter.globalView') },
                                                            { value: 'jobs', label: t('viewType.events'), desc: t('filter.eventsOnly') },
                                                            { value: 'dashboard', label: t('viewType.dashboard'), desc: t('filter.dashboardView') }
                                                        ].map((type) => (
                                                            <button
                                                                key={type.value}
                                                                onClick={() => {
                                                                    setFilterType(type.value);
                                                                    if (type.value === 'equipements') {
                                                                        setModeVueIndividuel(false);
                                                                        setTravailleurSelectionne('');
                                                                    }
                                                                }}
                                                                className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                                                                    filterType === type.value
                                                                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                                                        : 'hover:bg-gray-100 text-gray-700 border border-transparent'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium">{type.label}</span>
                                                                    {filterType === type.value && (
                                                                        <span className="ml-auto text-blue-600">✓</span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-gray-500 mt-1">{type.desc}</div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Onglet Bureau */}
                                                {activeFilterTab === 'bureau' && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                                            {t('filter.filterByOffice')}
                                                        </label>
                                                        <select
                                                            value={filterBureau}
                                                            onChange={(e) => setFilterBureau(e.target.value)}
                                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            {getBureauOptions().map(bureau =>
                                                                <option key={bureau.value} value={bureau.value}>{bureau.label}</option>
                                                            )}
                                                        </select>
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            {t('filter.selectOfficeResource')}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Onglet Poste */}
                                                {activeFilterTab === 'poste' && (
                                                    <div>
                                                        {(filterType === 'personnel' || filterType === 'global') ? (
                                                            <>
                                                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                                                    {t('filter.filterByPosition')}
                                                                </label>
                                                                <select
                                                                    value={filterPoste}
                                                                    onChange={(e) => setFilterPoste(e.target.value)}
                                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                >
                                                                    {getPosteOptions().map(poste =>
                                                                        <option key={poste.value} value={poste.value}>{poste.label}</option>
                                                                    )}
                                                                </select>
                                                                <p className="text-xs text-gray-500 mt-2">
                                                                    {t('filter.showPersonnelPosition')}
                                                                </p>
                                                            </>
                                                        ) : filterType === 'dashboard' ? (
                                                            <>
                                                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                                                    {t('filter.dashboardFocus')}
                                                                </label>
                                                                <select
                                                                    value={dashboardFilter}
                                                                    onChange={(e) => setDashboardFilter(e.target.value)}
                                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                                                >
                                                                    <option value="global">{t('viewType.globalFocus')}</option>
                                                                    <option value="personnel">{t('viewType.personnelFocus')}</option>
                                                                    <option value="equipements">{t('viewType.equipmentFocus')}</option>
                                                                </select>
                                                                <p className="text-xs text-gray-500 mt-2">
                                                                    {t('filter.chooseAnalysisType')}
                                                                </p>
                                                            </>
                                                        ) : (
                                                            <div className="text-center py-8 text-gray-500">
                                                                <p>{t('filter.positionNotAvailable')}</p>
                                                                <p className="text-xs mt-1">{t('filter.selectPersonnelOrGlobal')}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Onglet Vue */}
                                                {activeFilterTab === 'vue' && (
                                                    <div className="space-y-4">
                                                        {/* Mode couleur */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Mode de couleur
                                                            </label>
                                                            <div className="space-y-2">
                                                                <button
                                                                    onClick={() => setColorMode('priorite')}
                                                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                                                                        colorMode === 'priorite'
                                                                            ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                                                            : 'hover:bg-gray-100 text-gray-700 border border-transparent'
                                                                    }`}
                                                                >
                                                                    🎯 Couleur par priorité
                                                                </button>
                                                                <button
                                                                    onClick={() => setColorMode('succursale')}
                                                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                                                                        colorMode === 'succursale'
                                                                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                                                            : 'hover:bg-gray-100 text-gray-700 border border-transparent'
                                                                    }`}
                                                                >
                                                                    🏢 Couleur par bureau
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Vue individuelle */}
                                                        {(filterType === 'personnel' || filterType === 'global') && (
                                                            <div>
                                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={modeVueIndividuel}
                                                                        onChange={(e) => {
                                                                            setModeVueIndividuel(e.target.checked);
                                                                            if (!e.target.checked) {
                                                                                setTravailleurSelectionne('');
                                                                            }
                                                                        }}
                                                                        className="rounded"
                                                                    />
                                                                    Vue individuelle
                                                                </label>
                                                                {modeVueIndividuel && (
                                                                    <select
                                                                        value={travailleurSelectionne}
                                                                        onChange={(e) => setTravailleurSelectionne(e.target.value)}
                                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                    >
                                                                        <option value="">Sélectionner...</option>
                                                                        {filterType === 'personnel' && personnel.map(person =>
                                                                            <option key={person.id} value={person.id}>{person.nom}</option>
                                                                        )}
                                                                        {filterType === 'global' && [
                                                                            ...personnel.map(person =>
                                                                                <option key={person.id} value={person.id}>👤 {person.nom}</option>
                                                                            ),
                                                                            ...equipements.map(equipement =>
                                                                                <option key={equipement.id} value={equipement.id}>🔧 {equipement.nom}</option>
                                                                            )
                                                                        ]}
                                                                    </select>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Overlay pour fermer le menu */}
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowFilterMenu(false)}
                                    ></div>
                                </>
                            )}
                        </div>

                        {/* Recherche */}
                        <div className="relative flex-1 max-w-md">
                            <Icon
                                name="search"
                                size={18}
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                placeholder={t('form.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenu principal - Dashboard ou Calendrier */}
            <div className="p-4">
                {filterType === 'dashboard' ? (
                    /* Vue Dashboard Analytique Avancé */
                    <AnalyticsDashboard
                        jobs={jobs}
                        personnel={personnel}
                        equipements={equipements}
                        filterBureau={filterBureau}
                        dateDebut={startDate}
                        dateFin={new Date(startDate.getTime() + numberOfDays * 24 * 60 * 60 * 1000)}
                    />
                ) : filterType === 'dashboard-old' ? (
                    /* Ancien Dashboard Simple */
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">📊 Dashboard C-Secur360</h2>
                            <p className="text-gray-600">
                                Vue d'ensemble des activités sur {dashboardStats.periode} jours
                                {dashboardFilter === 'personnel' && ' - Focus Personnel'}
                                {dashboardFilter === 'equipements' && ' - Focus Équipements'}
                            </p>
                        </div>

                        {/* Cartes statistiques principales */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-600">Total Événements</p>
                                        <p className="text-2xl font-bold text-blue-900">{dashboardStats.total}</p>
                                    </div>
                                    <div className="text-blue-500 text-2xl">📋</div>
                                </div>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-600">En Cours</p>
                                        <p className="text-2xl font-bold text-green-900">{dashboardStats.enCours}</p>
                                    </div>
                                    <div className="text-green-500 text-2xl">⚡</div>
                                </div>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-yellow-600">Tentatif</p>
                                        <p className="text-2xl font-bold text-yellow-900">{dashboardStats.tentatif}</p>
                                    </div>
                                    <div className="text-yellow-500 text-2xl">⏳</div>
                                </div>
                            </div>

                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-red-600">En Attente</p>
                                        <p className="text-2xl font-bold text-red-900">{dashboardStats.enAttente}</p>
                                    </div>
                                    <div className="text-red-500 text-2xl">⏸️</div>
                                </div>
                            </div>
                        </div>

                        {/* Section planification personnel */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <div className="bg-white border rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Planification Personnel</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Personnel requis:</span>
                                        <span className="font-semibold">{dashboardStats.totalPersonnelRequis}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Personnel planifié:</span>
                                        <span className="font-semibold">{dashboardStats.personnelPlanifie}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Taux de planification:</span>
                                        <span className={`font-semibold ${
                                            dashboardStats.pourcentagePlanification >= 80 ? 'text-green-600' :
                                            dashboardStats.pourcentagePlanification >= 60 ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                            {dashboardStats.pourcentagePlanification.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                        <div
                                            className={`h-2 rounded-full ${
                                                dashboardStats.pourcentagePlanification >= 80 ? 'bg-green-500' :
                                                dashboardStats.pourcentagePlanification >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                            style={{ width: `${Math.min(dashboardStats.pourcentagePlanification, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Répartition par Priorité</h3>
                                <div className="space-y-3">
                                    {Object.entries(dashboardStats.parPriorite).map(([priorite, count]) => (
                                        <div key={priorite} className="flex justify-between items-center">
                                            <span className={`font-medium ${
                                                priorite === 'urgente' ? 'text-red-600' :
                                                priorite === 'haute' ? 'text-orange-600' :
                                                priorite === 'normale' ? 'text-yellow-600' : 'text-green-600'
                                            }`}>
                                                {priorite === 'urgente' ? '🔴 Urgente' :
                                                 priorite === 'haute' ? '🟠 Haute' :
                                                 priorite === 'normale' ? '🟡 Normale' : '🟢 Basse'}:
                                            </span>
                                            <span className="font-semibold">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Section par bureau */}
                        {Object.keys(dashboardStats.parBureau).length > 1 && (
                            <div className="bg-white border rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 Répartition par Bureau</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(dashboardStats.parBureau).map(([bureau, count]) => (
                                        <div key={bureau} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="font-medium text-gray-700">{bureau || 'Non défini'}:</span>
                                            <span className="font-semibold text-blue-600">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Vue Calendrier */
                <div className="space-y-4">
                    {/* Dashboard résumé en haut de la vue globale */}
                    {filterType === 'global' && (
                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">📊 Vue d'ensemble - {dashboardStats.periode} jours</h3>
                                <div className="text-sm text-gray-600">
                                    Taux de planification: <span className={`font-semibold ${
                                        dashboardStats.pourcentagePlanification >= 80 ? 'text-green-600' :
                                        dashboardStats.pourcentagePlanification >= 60 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>{dashboardStats.pourcentagePlanification.toFixed(1)}%</span>
                                </div>
                            </div>

                            {/* Cartes statistiques compactes */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                    <div className="text-lg font-bold text-blue-900">{dashboardStats.total}</div>
                                    <div className="text-xs text-blue-600">Total Événements</div>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                                    <div className="text-lg font-bold text-green-900">{dashboardStats.enCours}</div>
                                    <div className="text-xs text-green-600">En Cours</div>
                                </div>
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                                    <div className="text-lg font-bold text-yellow-900">{dashboardStats.tentatif}</div>
                                    <div className="text-xs text-yellow-600">Tentatif</div>
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                                    <div className="text-lg font-bold text-red-900">{dashboardStats.enAttente}</div>
                                    <div className="text-xs text-red-600">En Attente</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-lg shadow-sm overflow-hidden max-h-[calc(100vh-200px)] overflow-y-auto">
                    <div className="flex">
                        {/* Colonnes fixes pour noms et postes */}
                        <div className="flex-shrink-0 border-r-2 border-gray-300">
                            <table className="border-collapse w-full">
                                <thead className="bg-gray-900 sticky top-0">
                                    <tr className="h-20">
                                        <th className={`px-3 py-4 text-left font-semibold text-white bg-gray-900 border-r border-gray-600 ${isMobile ? 'w-[120px]' : 'w-[180px]'}`}>
                                            {filterType === 'global' ? "Ressource" :
                                             filterType === 'personnel' ? (isMobile ? "Nom" : "Nom / Prénom") :
                                             filterType === 'jobs' ? (isMobile ? "Événement" : "Événement / Client") :
                                             (isMobile ? "Équip." : "Équipement")}
                                        </th>
                                        {!isMobile && (
                                            <th className="px-2 py-4 text-left font-semibold text-white bg-gray-900 border-r border-gray-600 w-[100px]">
                                                {filterType === 'global' ? "Type" :
                                                 filterType === 'personnel' ? "Poste" :
                                                 filterType === 'jobs' ? "Statut" : "Type"}
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredResources.map((resource) => (
                                        <tr key={resource.id} className={`border-b hover:bg-gray-50 ${
                                            continuousDays.some(d => d.isToday) ? 'bg-gray-100' : ''
                                        }`} style={{ height: '89px' }}>
                                            <td className={`px-3 py-4 font-medium border-r ${isMobile ? 'w-[120px]' : 'w-[180px]'} ${
                                                continuousDays.some(d => d.isToday) ? 'bg-gray-100' : 'bg-white'
                                            }`}>
                                                <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold flex items-center gap-2 leading-tight`}>
                                                    {/* Pastille couleur succursale */}
                                                    <div
                                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: getSuccursaleColor(resource.succursale) }}
                                                        title={`Succursale: ${resource.succursale}`}
                                                    />
                                                    {filterType === 'global' && (
                                                        <Icon
                                                            name={resource.type === 'personnel' ? 'user' : 'wrench'}
                                                            size={12}
                                                            className={resource.type === 'personnel' ? 'text-blue-600' : 'text-orange-600'}
                                                        />
                                                    )}
                                                    <span title={`${resource.nom}${resource.prenom ? ', ' + resource.prenom : ''}`}>
                                                        {isMobile ? resource.nom.split(' ')[0] :
                                                         `${resource.nom}${resource.prenom ? ', ' + resource.prenom : ''}`}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 leading-tight">
                                                    {resource.succursale}
                                                </div>
                                            </td>
                                            {!isMobile && (
                                                <td className={`px-2 py-4 text-xs w-[100px] ${
                                                    continuousDays.some(d => d.isToday) ? 'bg-gray-100' : 'bg-white'
                                                }`}>
                                                    {filterType === 'global' ?
                                                        (resource.type === 'personnel' ?
                                                            (resource.poste && resource.departement ? `${resource.poste} - ${resource.departement}` : resource.poste || '')
                                                            : resource.type) :
                                                        (filterType === 'personnel' ?
                                                            (resource.poste && resource.departement ? `${resource.poste} - ${resource.departement}` : resource.poste || '')
                                                            : resource.type)
                                                    }
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Section scrollable pour les dates */}
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full min-w-max border-collapse">
                                <thead className="bg-gray-900 sticky top-0">
                                    {/* En-tête avec dates - UNE seule ligne synchronisée */}
                                    <tr className="h-20">
                                        {continuousDays.map((day, index) => (
                                            <th
                                                key={index}
                                                className={`px-1 py-4 text-center text-xs border-r border-gray-600 w-20 bg-gray-900 ${
                                                    day.isToday ? 'text-yellow-400 font-bold' : 'text-white'
                                                } cursor-pointer hover:bg-gray-700 transition-colors`}
                                                onDoubleClick={() => handleDateDoubleClick(day.date)}
                                                title={t('calendar.doubleClickFullDate')}
                                            >
                                                <div className="font-medium leading-tight">{day.displayShort}</div>
                                                <div className={`${isMobile ? 'text-xs' : 'text-sm'} leading-tight ${day.isToday ? 'font-bold' : ''}`}>
                                                    {day.dayNumber}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>

                                </thead>

                                <tbody>
                                    {filteredResources.map((resource) => (
                                        <tr key={`dates-${resource.id}`} className="border-b hover:bg-gray-50 h-20">
                                            {continuousDays.map((day, dayIndex) => {
                                                const allJobs = getAllJobsForCell(resource.id, day, resource.type);

                                                return (
                                                    <td
                                                        key={dayIndex}
                                                        className={`relative p-1 border-r w-20 cursor-pointer hover:bg-blue-50 ${
                                                            day.isToday ? 'bg-gray-300' :
                                                            day.isWeekend ? 'bg-gray-200' : 'bg-white'
                                                        }`}
                                                        onClick={() => handleCellClick(resource.id, day, resource.type)}
                                                    >
                                                        {allJobs.length > 0 ? (
                                                            <TimelineCell
                                                                jobs={allJobs}
                                                                day={day}
                                                                onJobClick={(job) => setSelectedJob(job)}
                                                                resourceId={resource.id}
                                                                resourceType={resource.type}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-20 flex items-center justify-center text-gray-400 text-xs">
                                                                {/* Cellule vide */}
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                </div>
                )}
            </div>

            {/* Modal de job */}
            {selectedJob && (
                <JobModal
                    isOpen={true}
                    onClose={() => setSelectedJob(null)}
                    onSave={onSaveJob}
                    onDelete={onDeleteJob}
                    job={selectedJob}
                    personnel={personnel}
                    equipements={equipements}
                    sousTraitants={sousTraitants}
                    succursales={succursales}
                    conges={conges}
                    jobs={jobs}
                    addSousTraitant={addSousTraitant}
                    addNotification={addNotification}
                    onOpenConflictJob={handleOpenConflictJob}
                />
            )}

            {/* Modal pour l'événement en conflit - Positionné à droite */}
            {conflictJob && (
                <div className="fixed inset-0 z-60 pointer-events-none">
                    <div className="h-full flex">
                        {/* Espace à gauche pour le modal principal */}
                        <div className="flex-1"></div>

                        {/* Modal de conflit à droite */}
                        <div className="w-1/2 max-w-3xl pointer-events-auto">
                            <div className="h-full bg-black bg-opacity-50 flex items-center justify-center p-4">
                                <div className="bg-white rounded-xl shadow-2xl w-full max-h-[95vh] flex flex-col border-4 border-orange-300">
                                    {/* Header spécial pour le conflit */}
                                    <div className="flex-shrink-0 flex items-center justify-between p-4 bg-orange-600 rounded-t-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                                ⚠️
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-white">
                                                    {t('event.conflictEvent')}
                                                </h2>
                                                <p className="text-sm text-orange-100">
                                                    #{conflictJob.numeroJob} - {conflictJob.client}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setConflictJob(null)}
                                            className="p-2 text-orange-100 hover:text-white hover:bg-orange-700 rounded-lg transition-colors"
                                            title={t('form.close')}
                                        >
                                            <Icon name="close" size={20} />
                                        </button>
                                    </div>

                                    {/* Contenu simplifié */}
                                    <div className="flex-1 p-4 overflow-y-auto">
                                        <div className="space-y-4">
                                            {/* Informations de base */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Date début</label>
                                                    <div className="mt-1 text-sm text-gray-900">{conflictJob.dateDebut}</div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Date fin</label>
                                                    <div className="mt-1 text-sm text-gray-900">{conflictJob.dateFin}</div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Heure début</label>
                                                    <div className="mt-1 text-sm text-gray-900">{conflictJob.heureDebut}</div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Heure fin</label>
                                                    <div className="mt-1 text-sm text-gray-900">{conflictJob.heureFin}</div>
                                                </div>
                                            </div>

                                            {/* Ressources assignées */}
                                            <div>
                                                <h3 className="font-medium text-gray-900 mb-2">{t('event.assignedResources')}</h3>
                                                <div className="space-y-2">
                                                    {conflictJob.personnel?.length > 0 && (
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-700">👥 {t('resource.personnel')}:</span>
                                                            <div className="mt-1 text-sm text-gray-600">
                                                                {conflictJob.personnel.map(id => {
                                                                    const person = personnel.find(p => p.id === id);
                                                                    return person ? `${person.prenom ? `${person.prenom} ${person.nom}` : person.nom}` : id;
                                                                }).join(', ')}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {conflictJob.equipements?.length > 0 && (
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-700">🔧 {t('resource.equipment')}:</span>
                                                            <div className="mt-1 text-sm text-gray-600">
                                                                {conflictJob.equipements.map(id => {
                                                                    const equipement = equipements.find(e => e.id === id);
                                                                    return equipement ? equipement.nom : id;
                                                                }).join(', ')}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {conflictJob.sousTraitants?.length > 0 && (
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-700">🏢 Sous-traitants:</span>
                                                            <div className="mt-1 text-sm text-gray-600">
                                                                {conflictJob.sousTraitants.map(id => {
                                                                    const sousTraitant = sousTraitants.find(s => s.id === id);
                                                                    return sousTraitant ? sousTraitant.nom : id;
                                                                }).join(', ')}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Description */}
                                            {conflictJob.description && (
                                                <div>
                                                    <h3 className="font-medium text-gray-900 mb-2">{t('analytics.description')}</h3>
                                                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                                        {conflictJob.description}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex-shrink-0 flex justify-between items-center p-4 border-t bg-gray-50">
                                        <div className="text-sm text-orange-600 font-medium">
                                            ⚠️ {t('event.conflictWarning')}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setConflictJob(null);
                                                setSelectedJob(conflictJob); // Ouvrir le job en conflit dans le modal principal
                                            }}
                                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                        >
                                            ✏️ {t('event.modifyEvent')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}