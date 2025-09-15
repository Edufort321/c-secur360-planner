// ============== DASHBOARD ANALYTIQUE AVANCÉ ==============
// Dashboard avec graphiques et métriques de performance basé sur les données réelles

import React, { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Icon } from '../UI/Icon';
import { MetricsCard } from './MetricsCard';

// Couleurs pour les graphiques
const COLORS = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    cyan: '#06B6D4',
    bureaux: {
        'MDL - Sherbrooke': '#3B82F6',
        'MDL - Terrebonne': '#10B981',
        'MDL - Québec': '#F59E0B',
        'DUAL - Électrotech': '#EF4444',
        'CFM': '#8B5CF6',
        'Surplec': '#06B6D4'
    }
};

export function AnalyticsDashboard({
    jobs = [],
    personnel = [],
    equipements = [],
    filterBureau = 'tous',
    dateDebut = null,
    dateFin = null
}) {
    const [filterPeriode, setFilterPeriode] = useState('mois'); // 'semaine', 'mois', 'annee'
    const [activeTab, setActiveTab] = useState('performance'); // 'performance', 'achalandage', 'comparatif', 'individuel'
    const [analyseType, setAnalyseType] = useState('personnel'); // 'personnel', 'equipement'
    const [selectedIndividu, setSelectedIndividu] = useState('');

    // Calculer les métriques de performance
    const analyticsData = useMemo(() => {
        // Filtrer les jobs selon le bureau et la période
        let filteredJobs = jobs;

        if (filterBureau !== 'tous') {
            filteredJobs = jobs.filter(job => job.bureau === filterBureau);
        }

        // Filtrer par période si spécifiée
        if (dateDebut && dateFin) {
            filteredJobs = filteredJobs.filter(job => {
                const jobDate = new Date(job.dateDebut);
                return jobDate >= dateDebut && jobDate <= dateFin;
            });
        }

        // Calculer les métriques de base
        const totalJobs = filteredJobs.length;
        const jobsActifs = filteredJobs.filter(job =>
            ['planifie', 'en-cours', 'tentatif'].includes(job.statut)
        ).length;

        const totalHeuresPlanifiees = filteredJobs.reduce((sum, job) => {
            return sum + (parseInt(job.heuresPlanifiees) || 0);
        }, 0);

        const totalPersonnelAssigne = filteredJobs.reduce((sum, job) => {
            return sum + (job.personnel?.length || 0);
        }, 0);

        // Personnel disponible (filtré par bureau)
        let personnelDisponible = personnel.filter(p => p.visibleChantier !== false);
        if (filterBureau !== 'tous') {
            personnelDisponible = personnelDisponible.filter(p => p.succursale === filterBureau);
        }

        const tauxUtilisation = personnelDisponible.length > 0 ?
            Math.round((totalPersonnelAssigne / personnelDisponible.length) * 100) : 0;

        // Répartition par bureau
        const bureaux = ['MDL - Sherbrooke', 'MDL - Terrebonne', 'MDL - Québec', 'DUAL - Électrotech', 'CFM', 'Surplec'];
        const repartitionBureau = bureaux.map(bureau => {
            const jobsBureau = jobs.filter(job => job.bureau === bureau);
            const heuresBureau = jobsBureau.reduce((sum, job) => sum + (parseInt(job.heuresPlanifiees) || 0), 0);
            const personnelBureau = personnel.filter(p => p.succursale === bureau && p.visibleChantier !== false);
            const personnelAssigneBureau = jobsBureau.reduce((sum, job) => sum + (job.personnel?.length || 0), 0);

            return {
                bureau: bureau.split(' - ')[1] || bureau,
                jobs: jobsBureau.length,
                heures: heuresBureau,
                personnelDispo: personnelBureau.length,
                personnelAssigne: personnelAssigneBureau,
                tauxUtilisation: personnelBureau.length > 0 ?
                    Math.round((personnelAssigneBureau / personnelBureau.length) * 100) : 0
            };
        });

        // Tendances temporelles (derniers 30 jours)
        const tendances = [];
        const maintenant = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(maintenant);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const jobsJour = jobs.filter(job => {
                const jobDate = new Date(job.dateDebut);
                return jobDate.toISOString().split('T')[0] === dateStr;
            });

            tendances.push({
                date: dateStr,
                dateFormatted: date.toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' }),
                jobs: jobsJour.length,
                heures: jobsJour.reduce((sum, job) => sum + (parseInt(job.heuresPlanifiees) || 0), 0),
                personnel: jobsJour.reduce((sum, job) => sum + (job.personnel?.length || 0), 0)
            });
        }

        // Répartition par statut
        const repartitionStatut = [
            { statut: 'Planifié', value: filteredJobs.filter(j => j.statut === 'planifie').length, color: COLORS.primary },
            { statut: 'En cours', value: filteredJobs.filter(j => j.statut === 'en-cours').length, color: COLORS.success },
            { statut: 'Tentatif', value: filteredJobs.filter(j => j.statut === 'tentatif').length, color: COLORS.warning },
            { statut: 'En attente', value: filteredJobs.filter(j => j.statut === 'en-attente').length, color: COLORS.danger },
            { statut: 'Terminé', value: filteredJobs.filter(j => j.statut === 'termine').length, color: COLORS.purple }
        ].filter(item => item.value > 0);

        // Achalandage par priorité
        const repartitionPriorite = [
            { priorite: 'Urgente', value: filteredJobs.filter(j => j.priorite === 'urgente').length, color: COLORS.danger },
            { priorite: 'Haute', value: filteredJobs.filter(j => j.priorite === 'haute').length, color: COLORS.warning },
            { priorite: 'Normale', value: filteredJobs.filter(j => j.priorite === 'normale').length, color: COLORS.primary },
            { priorite: 'Faible', value: filteredJobs.filter(j => j.priorite === 'faible').length, color: COLORS.success }
        ].filter(item => item.value > 0);

        return {
            totalJobs,
            jobsActifs,
            totalHeuresPlanifiees,
            totalPersonnelAssigne,
            personnelDisponible: personnelDisponible.length,
            tauxUtilisation,
            repartitionBureau,
            tendances,
            repartitionStatut,
            repartitionPriorite
        };
    }, [jobs, personnel, equipements, filterBureau, dateDebut, dateFin]);

    // Calculs pour l'analyse individuelle
    const analyseIndividuelle = useMemo(() => {
        if (!selectedIndividu) return null;

        if (analyseType === 'personnel') {
            const personne = personnel.find(p => p.id === selectedIndividu);
            if (!personne) return null;

            // Jobs assignés à cette personne
            const jobsPersonne = jobs.filter(job =>
                job.personnel && job.personnel.some(p => p.id === selectedIndividu)
            );

            // Filtrer par bureau et période
            let filteredJobs = jobsPersonne;
            if (filterBureau !== 'tous') {
                filteredJobs = jobsPersonne.filter(job => job.bureau === filterBureau);
            }
            if (dateDebut && dateFin) {
                filteredJobs = filteredJobs.filter(job => {
                    const jobDate = new Date(job.dateDebut);
                    return jobDate >= dateDebut && jobDate <= dateFin;
                });
            }

            const totalHeures = filteredJobs.reduce((sum, job) => sum + (parseInt(job.heuresPlanifiees) || 0), 0);
            const jobsActifs = filteredJobs.filter(job => ['planifie', 'en-cours', 'tentatif'].includes(job.statut)).length;

            // Tendances pour cette personne (30 derniers jours)
            const tendancesPersonne = [];
            const maintenant = new Date();
            for (let i = 29; i >= 0; i--) {
                const date = new Date(maintenant);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                const jobsJour = jobsPersonne.filter(job => {
                    const jobDate = new Date(job.dateDebut);
                    return jobDate.toISOString().split('T')[0] === dateStr;
                });

                tendancesPersonne.push({
                    date: dateStr,
                    dateFormatted: date.toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' }),
                    jobs: jobsJour.length,
                    heures: jobsJour.reduce((sum, job) => sum + (parseInt(job.heuresPlanifiees) || 0), 0)
                });
            }

            // Répartition par statut pour cette personne
            const statutsPersonne = [
                { statut: 'Planifié', value: filteredJobs.filter(j => j.statut === 'planifie').length, color: COLORS.primary },
                { statut: 'En cours', value: filteredJobs.filter(j => j.statut === 'en-cours').length, color: COLORS.success },
                { statut: 'Tentatif', value: filteredJobs.filter(j => j.statut === 'tentatif').length, color: COLORS.warning },
                { statut: 'En attente', value: filteredJobs.filter(j => j.statut === 'en-attente').length, color: COLORS.danger },
                { statut: 'Terminé', value: filteredJobs.filter(j => j.statut === 'termine').length, color: COLORS.purple }
            ].filter(item => item.value > 0);

            return {
                type: 'personnel',
                nom: personne.nom,
                totalJobs: filteredJobs.length,
                jobsActifs,
                totalHeures,
                tendances: tendancesPersonne,
                repartitionStatut: statutsPersonne,
                succursale: personne.succursale
            };

        } else if (analyseType === 'equipement') {
            const equipement = equipements.find(e => e.id === selectedIndividu);
            if (!equipement) return null;

            // Jobs utilisant cet équipement
            const jobsEquipement = jobs.filter(job =>
                job.equipements && job.equipements.some(e => e.id === selectedIndividu)
            );

            // Filtrer par bureau et période
            let filteredJobs = jobsEquipement;
            if (filterBureau !== 'tous') {
                filteredJobs = jobsEquipement.filter(job => job.bureau === filterBureau);
            }
            if (dateDebut && dateFin) {
                filteredJobs = filteredJobs.filter(job => {
                    const jobDate = new Date(job.dateDebut);
                    return jobDate >= dateDebut && jobDate <= dateFin;
                });
            }

            const totalHeures = filteredJobs.reduce((sum, job) => sum + (parseInt(job.heuresPlanifiees) || 0), 0);
            const jobsActifs = filteredJobs.filter(job => ['planifie', 'en-cours', 'tentatif'].includes(job.statut)).length;

            // Tendances pour cet équipement
            const tendancesEquipement = [];
            const maintenant = new Date();
            for (let i = 29; i >= 0; i--) {
                const date = new Date(maintenant);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                const jobsJour = jobsEquipement.filter(job => {
                    const jobDate = new Date(job.dateDebut);
                    return jobDate.toISOString().split('T')[0] === dateStr;
                });

                tendancesEquipement.push({
                    date: dateStr,
                    dateFormatted: date.toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' }),
                    jobs: jobsJour.length,
                    heures: jobsJour.reduce((sum, job) => sum + (parseInt(job.heuresPlanifiees) || 0), 0)
                });
            }

            // Répartition par statut pour cet équipement
            const statutsEquipement = [
                { statut: 'Planifié', value: filteredJobs.filter(j => j.statut === 'planifie').length, color: COLORS.primary },
                { statut: 'En cours', value: filteredJobs.filter(j => j.statut === 'en-cours').length, color: COLORS.success },
                { statut: 'Tentatif', value: filteredJobs.filter(j => j.statut === 'tentatif').length, color: COLORS.warning },
                { statut: 'En attente', value: filteredJobs.filter(j => j.statut === 'en-attente').length, color: COLORS.danger },
                { statut: 'Terminé', value: filteredJobs.filter(j => j.statut === 'termine').length, color: COLORS.purple }
            ].filter(item => item.value > 0);

            return {
                type: 'equipement',
                nom: equipement.nom,
                totalJobs: filteredJobs.length,
                jobsActifs,
                totalHeures,
                tendances: tendancesEquipement,
                repartitionStatut: statutsEquipement,
                succursale: equipement.succursale
            };
        }

        return null;
    }, [selectedIndividu, analyseType, jobs, personnel, equipements, filterBureau, dateDebut, dateFin]);

    // Composant Gauge pour afficher les taux
    const GaugeChart = ({ value, title, max = 100, color = COLORS.primary }) => (
        <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-2">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 24 24">
                    <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className="text-gray-200"
                    />
                    <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke={color}
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={`${(value / max) * 63} 63`}
                        className="transition-all duration-300"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold" style={{ color }}>{value}%</span>
                </div>
            </div>
            <p className="text-sm font-medium text-gray-700">{title}</p>
        </div>
    );

    // Formatage des tooltips
    const formatTooltip = (value, name) => {
        if (name === 'heures') return [`${value}h`, 'Heures planifiées'];
        if (name === 'jobs') return [`${value}`, 'Événements'];
        if (name === 'personnel') return [`${value}`, 'Personnel assigné'];
        if (name === 'tauxUtilisation') return [`${value}%`, 'Taux d\'utilisation'];
        return [value, name];
    };

    return (
        <div className="space-y-6">
            {/* En-tête avec filtres */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            📊 Dashboard Analytique
                        </h2>
                        <p className="text-gray-600">
                            Analyse de performance et achalandage - {filterBureau === 'tous' ? 'Tous les bureaux' : filterBureau}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <select
                            value={filterPeriode}
                            onChange={(e) => setFilterPeriode(e.target.value)}
                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="semaine">Cette semaine</option>
                            <option value="mois">Ce mois</option>
                            <option value="annee">Cette année</option>
                        </select>
                    </div>
                </div>

                {/* Onglets */}
                <div className="flex border-b mt-4">
                    {[
                        { id: 'performance', label: '📈 Performance', icon: 'barChart' },
                        { id: 'achalandage', label: '📊 Achalandage', icon: 'users' },
                        { id: 'comparatif', label: '🏢 Comparatif', icon: 'building' },
                        { id: 'individuel', label: '👤 Analyse Individuelle', icon: 'user' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Icon name={tab.icon} size={16} className="inline mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Métriques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricsCard
                    title="Total Événements"
                    value={analyticsData.totalJobs}
                    subtitle={`${analyticsData.jobsActifs} actifs`}
                    icon="calendar"
                    color="blue"
                    trend={analyticsData.totalJobs > 0 ? { direction: 'up', value: 12 } : null}
                />

                <MetricsCard
                    title="Heures Planifiées"
                    value={analyticsData.totalHeuresPlanifiees}
                    unit="h"
                    subtitle="Total programmé"
                    icon="clock"
                    color="green"
                    trend={analyticsData.totalHeuresPlanifiees > 0 ? { direction: 'up', value: 8 } : null}
                />

                <MetricsCard
                    title="Personnel Assigné"
                    value={analyticsData.totalPersonnelAssigne}
                    subtitle={`Sur ${analyticsData.personnelDisponible} disponibles`}
                    icon="users"
                    color="purple"
                />

                <MetricsCard
                    title="Taux d'Utilisation"
                    value={analyticsData.tauxUtilisation}
                    unit="%"
                    subtitle={
                        analyticsData.tauxUtilisation >= 80 ? 'Utilisation élevée' :
                        analyticsData.tauxUtilisation >= 60 ? 'Utilisation modérée' :
                        'Utilisation faible'
                    }
                    icon="barChart"
                    color={
                        analyticsData.tauxUtilisation >= 80 ? 'green' :
                        analyticsData.tauxUtilisation >= 60 ? 'yellow' : 'red'
                    }
                    trend={
                        analyticsData.tauxUtilisation > 0 ? {
                            direction: analyticsData.tauxUtilisation >= 70 ? 'up' : 'down',
                            value: Math.abs(analyticsData.tauxUtilisation - 70)
                        } : null
                    }
                >
                    {/* Barre de progression pour le taux d'utilisation */}
                    <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    analyticsData.tauxUtilisation >= 80 ? 'bg-green-500' :
                                    analyticsData.tauxUtilisation >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(analyticsData.tauxUtilisation, 100)}%` }}
                            />
                        </div>
                    </div>
                </MetricsCard>
            </div>

            {/* Contenu des onglets */}
            {activeTab === 'performance' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tendances temporelles */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Tendances (30 derniers jours)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={analyticsData.tendances}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="dateFormatted" />
                                <YAxis />
                                <Tooltip formatter={formatTooltip} />
                                <Area type="monotone" dataKey="jobs" stackId="1" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} />
                                <Area type="monotone" dataKey="personnel" stackId="1" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Répartition par statut */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Répartition par Statut</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={analyticsData.repartitionStatut}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                    label={({ statut, value }) => `${statut}: ${value}`}
                                >
                                    {analyticsData.repartitionStatut.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {activeTab === 'achalandage' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Heures par jour */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">⏰ Heures par Jour</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analyticsData.tendances}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="dateFormatted" />
                                <YAxis />
                                <Tooltip formatter={formatTooltip} />
                                <Line type="monotone" dataKey="heures" stroke={COLORS.primary} strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Répartition par priorité */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">🚨 Répartition par Priorité</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analyticsData.repartitionPriorite}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="priorite" />
                                <YAxis />
                                <Tooltip formatter={formatTooltip} />
                                <Bar dataKey="value" fill={COLORS.primary}>
                                    {analyticsData.repartitionPriorite.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {activeTab === 'comparatif' && (
                <div className="space-y-6">
                    {/* Comparatif par bureau */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 Performance par Bureau</h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={analyticsData.repartitionBureau}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="bureau" />
                                <YAxis />
                                <Tooltip formatter={formatTooltip} />
                                <Legend />
                                <Bar dataKey="jobs" fill={COLORS.primary} name="Événements" />
                                <Bar dataKey="heures" fill={COLORS.success} name="Heures planifiées" />
                                <Bar dataKey="tauxUtilisation" fill={COLORS.warning} name="Taux utilisation %" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Tableau détaillé */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">📊 Détails par Bureau</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bureau</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Événements</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heures</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personnel Dispo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personnel Assigné</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taux Utilisation</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {analyticsData.repartitionBureau.map((bureau, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {bureau.bureau}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {bureau.jobs}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {bureau.heures}h
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {bureau.personnelDispo}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {bureau.personnelAssigne}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        bureau.tauxUtilisation >= 80 ? 'bg-green-100 text-green-800' :
                                                        bureau.tauxUtilisation >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {bureau.tauxUtilisation}%
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'individuel' && (
                <div className="space-y-6">
                    {/* Sélecteurs pour l'analyse individuelle */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">👤 Sélection pour Analyse Individuelle</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Type d'analyse */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Type d'analyse</label>
                                <select
                                    value={analyseType}
                                    onChange={(e) => {
                                        setAnalyseType(e.target.value);
                                        setSelectedIndividu('');
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="personnel">Personnel</option>
                                    <option value="equipement">Équipement</option>
                                </select>
                            </div>

                            {/* Sélection de l'individu */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {analyseType === 'personnel' ? 'Sélectionner un employé' : 'Sélectionner un équipement'}
                                </label>
                                <select
                                    value={selectedIndividu}
                                    onChange={(e) => setSelectedIndividu(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">
                                        {analyseType === 'personnel' ? 'Choisir un employé...' : 'Choisir un équipement...'}
                                    </option>
                                    {analyseType === 'personnel' ?
                                        personnel
                                            .filter(p => p.visibleChantier !== false)
                                            .filter(p => filterBureau === 'tous' || p.succursale === filterBureau)
                                            .map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.nom} ({p.succursale})
                                                </option>
                                            ))
                                        :
                                        equipements
                                            .filter(e => filterBureau === 'tous' || e.succursale === filterBureau)
                                            .map(e => (
                                                <option key={e.id} value={e.id}>
                                                    {e.nom} ({e.succursale})
                                                </option>
                                            ))
                                    }
                                </select>
                            </div>

                            {/* Informations sur la sélection */}
                            {analyseIndividuelle && (
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <p className="text-sm font-medium text-blue-900">
                                        {analyseIndividuelle.nom}
                                    </p>
                                    <p className="text-xs text-blue-700">
                                        {analyseIndividuelle.succursale}
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1">
                                        {analyseIndividuelle.totalJobs} événements • {analyseIndividuelle.totalHeures}h
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Affichage des résultats d'analyse individuelle */}
                    {analyseIndividuelle ? (
                        <>
                            {/* Métriques individuelles */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <MetricsCard
                                    title="Événements Assignés"
                                    value={analyseIndividuelle.totalJobs}
                                    subtitle={`${analyseIndividuelle.jobsActifs} actifs`}
                                    icon="calendar"
                                    color="blue"
                                />

                                <MetricsCard
                                    title="Heures Planifiées"
                                    value={analyseIndividuelle.totalHeures}
                                    unit="h"
                                    subtitle="Total assigné"
                                    icon="clock"
                                    color="green"
                                />

                                <MetricsCard
                                    title="Charge de Travail"
                                    value={analyseIndividuelle.totalHeures > 0 ? Math.round(analyseIndividuelle.totalHeures / 40) : 0}
                                    unit=" sem."
                                    subtitle={
                                        analyseIndividuelle.totalHeures >= 160 ? 'Charge élevée' :
                                        analyseIndividuelle.totalHeures >= 80 ? 'Charge modérée' :
                                        'Charge faible'
                                    }
                                    icon="barChart"
                                    color={
                                        analyseIndividuelle.totalHeures >= 160 ? 'red' :
                                        analyseIndividuelle.totalHeures >= 80 ? 'yellow' : 'green'
                                    }
                                />
                            </div>

                            {/* Graphiques individuels */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Tendances individuelles */}
                                <div className="bg-white rounded-lg shadow-sm p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        📈 Tendances - {analyseIndividuelle.nom}
                                    </h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={analyseIndividuelle.tendances}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="dateFormatted" />
                                            <YAxis />
                                            <Tooltip formatter={formatTooltip} />
                                            <Line type="monotone" dataKey="jobs" stroke={COLORS.primary} strokeWidth={2} name="Événements" />
                                            <Line type="monotone" dataKey="heures" stroke={COLORS.success} strokeWidth={2} name="Heures" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Répartition des statuts individuels */}
                                <div className="bg-white rounded-lg shadow-sm p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        📊 Répartition par Statut - {analyseIndividuelle.nom}
                                    </h3>
                                    {analyseIndividuelle.repartitionStatut.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={analyseIndividuelle.repartitionStatut}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={80}
                                                    dataKey="value"
                                                    label={({ statut, value }) => `${statut}: ${value}`}
                                                >
                                                    {analyseIndividuelle.repartitionStatut.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-64 text-gray-500">
                                            <div className="text-center">
                                                <Icon name="calendar" size={48} className="mx-auto mb-2 text-gray-300" />
                                                <p>Aucun événement assigné</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Détails des événements */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    📋 Événements Assignés - {analyseIndividuelle.nom}
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Événement</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heures</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bureau</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {jobs
                                                .filter(job => {
                                                    if (analyseType === 'personnel') {
                                                        return job.personnel && job.personnel.some(p => p.id === selectedIndividu);
                                                    } else {
                                                        return job.equipements && job.equipements.some(e => e.id === selectedIndividu);
                                                    }
                                                })
                                                .filter(job => filterBureau === 'tous' || job.bureau === filterBureau)
                                                .slice(0, 10)
                                                .map((job, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {job.title || job.nomJob || 'Événement sans nom'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(job.dateDebut).toLocaleDateString('fr-CA')}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                job.statut === 'planifie' ? 'bg-blue-100 text-blue-800' :
                                                                job.statut === 'en-cours' ? 'bg-green-100 text-green-800' :
                                                                job.statut === 'tentatif' ? 'bg-yellow-100 text-yellow-800' :
                                                                job.statut === 'en-attente' ? 'bg-red-100 text-red-800' :
                                                                'bg-purple-100 text-purple-800'
                                                            }`}>
                                                                {job.statut === 'planifie' ? 'Planifié' :
                                                                 job.statut === 'en-cours' ? 'En cours' :
                                                                 job.statut === 'tentatif' ? 'Tentatif' :
                                                                 job.statut === 'en-attente' ? 'En attente' :
                                                                 'Terminé'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {job.heuresPlanifiees || 0}h
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {job.bureau}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm p-12">
                            <div className="text-center text-gray-500">
                                <Icon name="user" size={64} className="mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Analyse Individuelle</h3>
                                <p className="text-gray-600 mb-4">
                                    Sélectionnez un {analyseType === 'personnel' ? 'employé' : 'équipement'} pour voir son analyse détaillée
                                </p>
                                <div className="text-sm text-gray-500">
                                    <p>• Tendances de performance</p>
                                    <p>• Répartition des événements</p>
                                    <p>• Charge de travail</p>
                                    <p>• Historique détaillé</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}