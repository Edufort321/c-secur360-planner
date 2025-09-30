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
    const CELL_HEIGHT = 80; // pixels
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
        alert(`📅 ${t ? t('calendar.fullDate') : 'Date complète'} :\n${dateComplete}`);
    };

    // Période prédéfinies
    const periodOptions = [
        { value: 1, label: '1J', days: 1, timeView: '1day' },
        { value: 7, label: '1S', days: 7, timeView: '1week' },
        { value: 14, label: '2S', days: 14, timeView: '2weeks' },
        { value: 21, label: '3S', days: 21, timeView: 'period-21' },
        { value: 30, label: '1M', days: 30, timeView: 'period-30' },
        { value: 90, label: '3M', days: 90, timeView: 'period-90' },
        { value: 180, label: '6M', days: 180, timeView: 'period-180' },
        { value: 365, label: '1AN', days: 365, timeView: 'period-365' }
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

    // Filtrer les ressources (personnel et équipements)
    const filteredResources = useMemo(() => {
        if (modeVueIndividuel && travailleurSelectionne) {
            if (filterType === 'personnel') {
                let filteredPersonnel = personnel.filter(person => {
                    const matchesSearch = person.nom.toLowerCase().includes(searchTerm.toLowerCase());
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
                    return matchesSearch && matchesBureau && equipement.id === travailleurSelectionne;
                });
                return filteredEquipements.map(e => ({...e, type: 'equipement'}));
            } else if (filterType === 'global') {
                // Vue individuelle globale - chercher dans personnel et équipements
                let filteredPersonnel = personnel.filter(person => {
                    const matchesSearch = person.nom.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesBureau = filterBureau === 'tous' || person.succursale === filterBureau;
                    const matchesPoste = filterPoste === 'tous' || person.poste === filterPoste;
                    const visibleCalendrier = person.visibleChantier === true;
                    return matchesSearch && matchesBureau && matchesPoste && visibleCalendrier && person.id === travailleurSelectionne;
                }).map(p => ({...p, type: 'personnel'}));

                const filteredEquipements = equipements.filter(equipement => {
                    const matchesSearch = equipement.nom.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesBureau = filterBureau === 'tous' || equipement.succursale === filterBureau;
                    return matchesSearch && matchesBureau && equipement.id === travailleurSelectionne;
                }).map(e => ({...e, type: 'equipement'}));

                return [...filteredPersonnel, ...filteredEquipements];
            }
            // Fallback pour éviter undefined
            return [];
        } else if (filterType === 'personnel') {
            let filteredPersonnel = personnel.filter(person => {
                const matchesSearch = person.nom.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesBureau = filterBureau === 'tous' || person.succursale === filterBureau;
                const matchesPoste = filterPoste === 'tous' || person.poste === filterPoste;
                const visibleCalendrier = person.visibleChantier === true;
                return matchesSearch && matchesBureau && matchesPoste && visibleCalendrier;
            });
            return sortPersonnel(filteredPersonnel).map(p => ({...p, type: 'personnel'}));
        } else if (filterType === 'equipements') {
            return equipements.filter(equipement => {
                const matchesSearch = equipement.nom.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesBureau = filterBureau === 'tous' || equipement.succursale === filterBureau;
                return matchesSearch && matchesBureau;
            }).map(e => ({...e, type: 'equipement'}));
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
                const matchesSearch = person.nom.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesBureau = filterBureau === 'tous' || person.succursale === filterBureau;
                const matchesPoste = filterPoste === 'tous' || person.poste === filterPoste;
                const visibleCalendrier = person.visibleChantier === true;
                return matchesSearch && matchesBureau && matchesPoste && visibleCalendrier;
            }).map(p => ({...p, type: 'personnel'}));

            const filteredEquipements = equipements.filter(equipement => {
                const matchesSearch = equipement.nom.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesBureau = filterBureau === 'tous' || equipement.succursale === filterBureau;
                return matchesSearch && matchesBureau;
            }).map(e => ({...e, type: 'equipement'}));

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
            const jobDate = new Date(job.dateDebut).toISOString().split('T')[0];
            if (jobDate !== dayString) return false;

            if (resourceType === 'personnel') {
                return job.personnel && job.personnel.includes(resourceId);
            } else if (resourceType === 'equipement') {
                return job.equipements && job.equipements.includes(resourceId);
            }
            return false;
        });
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
                            Aujourd'hui
                        </button>
                        <button
                            onClick={() => navigateWeeks(1)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <Icon name="chevronRight" size={20} />
                        </button>

                        {/* Sélecteur de période */}
                        <select
                            value={numberOfDays}
                            onChange={(e) => {
                                const selectedPeriod = periodOptions.find(p => p.value === parseInt(e.target.value));
                                if (selectedPeriod) {
                                    setNumberOfDays(selectedPeriod.days);
                                    setTimeView(selectedPeriod.timeView);
                                }
                            }}
                            className="px-2 py-1 text-sm border rounded-lg"
                        >
                            {periodOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
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
                        {/* Recherche */}
                        <div className="relative flex-1 max-w-md">
                            <Icon
                                name="search"
                                size={18}
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Filtre type */}
                        <select
                            value={filterType}
                            onChange={(e) => {
                                setFilterType(e.target.value);
                                if (e.target.value === 'equipements') {
                                    setModeVueIndividuel(false);
                                    setTravailleurSelectionne('');
                                }
                            }}
                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="personnel">Personnel</option>
                            <option value="equipements">Équipements</option>
                            <option value="global">Vue globale</option>
                            <option value="jobs">📋 Événements seulement</option>
                            <option value="dashboard">📊 Dashboard</option>
                        </select>

                        {/* Filtre bureau */}
                        <select
                            value={filterBureau}
                            onChange={(e) => setFilterBureau(e.target.value)}
                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {getBureauOptions().map(bureau =>
                                <option key={bureau.value} value={bureau.value}>{bureau.label}</option>
                            )}
                        </select>

                        {/* Filtre poste - seulement pour personnel */}
                        {(filterType === 'personnel' || filterType === 'global') && (
                            <select
                                value={filterPoste}
                                onChange={(e) => setFilterPoste(e.target.value)}
                                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                {getPosteOptions().map(poste =>
                                    <option key={poste.value} value={poste.value}>{poste.label}</option>
                                )}
                            </select>
                        )}

                        {/* Filtre dashboard */}
                        {filterType === 'dashboard' && (
                            <select
                                value={dashboardFilter}
                                onChange={(e) => setDashboardFilter(e.target.value)}
                                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="global">📊 Vue globale</option>
                                <option value="personnel">👥 Focus Personnel</option>
                                <option value="equipements">🔧 Focus Équipements</option>
                            </select>
                        )}

                        {/* Toggle couleur priorité vs succursale - seulement pour vue calendrier */}
                        {filterType !== 'dashboard' && (
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">Couleur:</label>
                                <button
                                    onClick={() => setColorMode(colorMode === 'priorite' ? 'succursale' : 'priorite')}
                                    className={`px-3 py-2 text-sm rounded-lg border ${
                                        colorMode === 'priorite'
                                            ? 'bg-orange-100 border-orange-300 text-orange-700'
                                            : 'bg-blue-100 border-blue-300 text-blue-700'
                                    }`}
                                >
                                    {colorMode === 'priorite' ? '🎯 Priorité' : '🏢 Bureau'}
                                </button>
                            </div>
                        )}

                        {/* Mode vue individuel */}
                        {(filterType === 'personnel' || filterType === 'global') && (
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 text-sm">
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
                                    <span>Vue individuel</span>
                                </label>
                                {modeVueIndividuel && (
                                    <select
                                        value={travailleurSelectionne}
                                        onChange={(e) => setTravailleurSelectionne(e.target.value)}
                                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[200px]"
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

                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="flex">
                        {/* Colonnes fixes pour noms et postes */}
                        <div className="flex-shrink-0 border-r-2 border-gray-300">
                            <table className="border-collapse">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className={`px-3 py-2 text-left font-semibold text-gray-700 bg-gray-50 border-r ${isMobile ? 'w-[120px]' : 'w-[180px]'}`}>
                                            {filterType === 'global' ? "Ressource" :
                                             filterType === 'personnel' ? (isMobile ? "Nom" : "Nom / Prénom") :
                                             filterType === 'jobs' ? (isMobile ? "Événement" : "Événement / Client") :
                                             (isMobile ? "Équip." : "Équipement")}
                                        </th>
                                        {!isMobile && (
                                            <th className="px-2 py-2 text-left font-semibold text-gray-700 bg-gray-50 w-[100px]">
                                                {filterType === 'global' ? "Type" :
                                                 filterType === 'personnel' ? "Poste" :
                                                 filterType === 'jobs' ? "Statut" : "Type"}
                                            </th>
                                        )}
                                    </tr>
                                    <tr>
                                        <th className={`px-3 py-2 bg-gray-50 border-r ${isMobile ? 'w-[120px]' : 'w-[180px]'}`} />
                                        {!isMobile && <th className="px-2 py-2 bg-gray-50 w-[100px]" />}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredResources.map((resource) => (
                                        <tr key={resource.id} className="border-b hover:bg-gray-50">
                                            <td className={`px-3 py-3 font-medium bg-white border-r ${isMobile ? 'w-[120px]' : 'w-[180px]'}`}>
                                                <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold flex items-center gap-1`}>
                                                    {filterType === 'global' && (
                                                        <Icon
                                                            name={resource.type === 'personnel' ? 'user' : 'wrench'}
                                                            size={12}
                                                            className={resource.type === 'personnel' ? 'text-blue-600' : 'text-orange-600'}
                                                        />
                                                    )}
                                                    <span title={resource.nom}>
                                                        {isMobile ? resource.nom.split(' ')[0] : resource.nom}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {resource.succursale}
                                                </div>
                                            </td>
                                            {!isMobile && (
                                                <td className="px-2 py-3 text-xs bg-white w-[100px]">
                                                    {filterType === 'global' ?
                                                        (resource.type === 'personnel' ? resource.poste : resource.type) :
                                                        (filterType === 'personnel' ? resource.poste : resource.type)
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
                                <thead className="bg-gray-50 sticky top-0">
                                    {/* En-tête avec mois */}
                                    <tr>
                                        {continuousDays.map((day, index) => {
                                            const showMonth = index === 0 || day.date.getDate() === 1;
                                            return (
                                                <th
                                                    key={index}
                                                    className={`px-1 py-2 text-center font-semibold text-gray-700 ${getCellWidth()} border-r ${day.isWeekend ? 'bg-gray-100' : ''}`}
                                                >
                                                    {showMonth && (
                                                        <div className="text-xs text-gray-500 font-normal">
                                                            {isMobile ? day.monthName.substr(0, 3) : day.monthName}
                                                        </div>
                                                    )}
                                                </th>
                                            );
                                        })}
                                    </tr>

                                    {/* En-tête avec jours */}
                                    <tr>
                                        {continuousDays.map((day, index) =>
                                            <th
                                                key={index}
                                                className={`px-1 py-2 text-center text-xs border-r ${getCellWidth()} ${
                                                    day.isWeekend ? 'bg-gray-100' : 'bg-gray-50'
                                                } ${
                                                    day.isToday ? 'bg-blue-100 text-blue-600 font-bold' : 'text-gray-600'
                                                }`}
                                            >
                                                <div className="font-medium">
                                                    {isMobile ? day.dayName.substr(0, 1) : day.dayName}
                                                </div>
                                                <div className={`${isMobile ? 'text-xs' : 'text-sm'} ${day.isToday ? 'font-bold' : ''}`}>
                                                    {day.dayNumber}
                                                </div>
                                            </th>
                                        )}
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredResources.map((resource) => (
                                        <tr key={`dates-${resource.id}`} className="border-b hover:bg-gray-50">
                                            {continuousDays.map((day, dayIndex) => {
                                                const job = getJobForCell(resource.id, day, resource.type);

                                                return (
                                                    <td
                                                        key={dayIndex}
                                                        className={`relative p-1 border-r cursor-pointer hover:bg-blue-50 ${
                                                            day.isWeekend ? 'bg-gray-50' : 'bg-white'
                                                        } ${getCellWidth()}`}
                                                        style={{ height: `${CELL_HEIGHT}px` }}
                                                        onClick={() => handleCellClick(resource.id, day, resource.type)}
                                                    >
                                                        {job && (
                                                            <div
                                                                className={`w-full h-full rounded text-xs p-1 ${
                                                                    colorMode === 'priorite' ? (
                                                                        job.priorite === 'urgente' ? 'bg-red-100 border border-red-300 text-red-800' :
                                                                        job.priorite === 'haute' ? 'bg-orange-100 border border-orange-300 text-orange-800' :
                                                                        job.priorite === 'normale' ? 'bg-yellow-100 border border-yellow-300 text-yellow-800' :
                                                                        'bg-green-100 border border-green-300 text-green-800'
                                                                    ) : 'border'
                                                                }`}
                                                                style={colorMode === 'succursale' && job.bureau ? {
                                                                    backgroundColor: getSuccursaleColor(job.bureau) + '20',
                                                                    borderColor: getSuccursaleColor(job.bureau),
                                                                    color: getSuccursaleColor(job.bureau)
                                                                } : {}}
                                                            >
                                                                <div className="font-bold truncate text-xs" title={`Job #${job.numRef || job.id} - ${job.client}`}>
                                                                    #{job.numRef || job.id}
                                                                </div>
                                                                <div className="text-xs truncate" title={job.client}>
                                                                    {job.client}
                                                                </div>
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
                    addSousTraitant={addSousTraitant}
                    addNotification={addNotification}
                />
            )}

        </div>
    );
}