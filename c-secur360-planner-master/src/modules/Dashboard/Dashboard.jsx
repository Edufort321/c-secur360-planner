import { useState, useEffect } from 'react';
import { Icon } from '../../components/UI/Icon';

export function Dashboard({
    jobs = [],
    personnel = [],
    equipements = [],
    conges = [],
    isAdmin = false,
    currentUser = null
}) {
    const [activeSection, setActiveSection] = useState('overview');
    const [dateRange, setDateRange] = useState('week'); // week, month, year
    const [selectedMetrics, setSelectedMetrics] = useState(['jobs', 'personnel', 'equipements']);

    // Calculs des statistiques
    const stats = {
        totalJobs: jobs.length,
        jobsEnCours: jobs.filter(j => j.statut === 'en_cours').length,
        jobsTermines: jobs.filter(j => j.statut === 'termine').length,
        jobsPlanifies: jobs.filter(j => j.statut === 'planifie').length,
        totalPersonnel: personnel.length,
        personnelDisponible: personnel.filter(p => p.disponible).length,
        totalEquipements: equipements.length,
        equipementsDisponibles: equipements.filter(e => e.disponible).length,
        congesEnAttente: conges.filter(c => c.statut === 'en_attente').length,
        congesApprouves: conges.filter(c => c.statut === 'approuve').length
    };

    // Calculs de performance
    const performance = {
        tauxCompletion: stats.totalJobs > 0 ? Math.round((stats.jobsTermines / stats.totalJobs) * 100) : 0,
        tauxUtilisationPersonnel: stats.totalPersonnel > 0 ? Math.round(((stats.totalPersonnel - stats.personnelDisponible) / stats.totalPersonnel) * 100) : 0,
        tauxUtilisationEquipements: stats.totalEquipements > 0 ? Math.round(((stats.totalEquipements - stats.equipementsDisponibles) / stats.totalEquipements) * 100) : 0
    };

    // Jobs par priorité
    const jobsParPriorite = {
        urgente: jobs.filter(j => j.priorite === 'urgente').length,
        haute: jobs.filter(j => j.priorite === 'haute').length,
        normale: jobs.filter(j => j.priorite === 'normale').length,
        faible: jobs.filter(j => j.priorite === 'faible').length
    };

    // Jobs par bureau
    const jobsParBureau = jobs.reduce((acc, job) => {
        const bureau = job.bureau || 'Non assigné';
        acc[bureau] = (acc[bureau] || 0) + 1;
        return acc;
    }, {});

    // Jobs récents (7 derniers jours)
    const jobsRecents = jobs
        .filter(job => {
            const jobDate = new Date(job.dateCreation);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return jobDate >= weekAgo;
        })
        .sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation))
        .slice(0, 10);

    // Alertes et notifications
    const alertes = [];

    // Congés en attente
    if (stats.congesEnAttente > 0) {
        alertes.push({
            type: 'warning',
            message: `${stats.congesEnAttente} demande${stats.congesEnAttente > 1 ? 's' : ''} de congé en attente`,
            action: 'Traiter les demandes',
            section: 'conges'
        });
    }

    // Équipements nécessitant maintenance
    const equipementsMaintenanceProche = equipements.filter(e => {
        if (!e.prochaineMaintenance) return false;
        const maintenanceDate = new Date(e.prochaineMaintenance);
        const today = new Date();
        const diffDays = Math.ceil((maintenanceDate - today) / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && diffDays >= 0;
    });

    if (equipementsMaintenanceProche.length > 0) {
        alertes.push({
            type: 'info',
            message: `${equipementsMaintenanceProche.length} équipement${equipementsMaintenanceProche.length > 1 ? 's' : ''} nécessite${equipementsMaintenanceProche.length === 1 ? '' : 'nt'} une maintenance prochainement`,
            action: 'Voir les équipements',
            section: 'equipements'
        });
    }

    const StatCard = ({ title, value, subtitle, icon, color = 'blue', trend = null }) => (
        <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: color }}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-semibold text-gray-900">{value}</p>
                    {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                    {trend && (
                        <div className={`flex items-center mt-1 text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                            <Icon name={trend.positive ? 'trending-up' : 'trending-down'} size={14} className="mr-1" />
                            {trend.value}
                        </div>
                    )}
                </div>
                <div className="p-3 rounded-full" style={{ backgroundColor: color + '20' }}>
                    <Icon name={icon} size={24} style={{ color }} />
                </div>
            </div>
        </div>
    );

    const ProgressBar = ({ percentage, color = '#3B82F6', height = 8 }) => (
        <div className="w-full bg-gray-200 rounded-full" style={{ height }}>
            <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                    width: `${percentage}%`,
                    backgroundColor: color
                }}
            />
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard de Gestion</h1>
                    <p className="text-gray-600">
                        Vue d'ensemble des opérations • {currentUser ? `Connecté: ${currentUser.nom}` : 'Mode invité'}
                    </p>
                </div>
                <div className="flex space-x-3">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="week">Cette semaine</option>
                        <option value="month">Ce mois</option>
                        <option value="year">Cette année</option>
                    </select>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <Icon name="download" size={16} className="mr-2" />
                        Export
                    </button>
                </div>
            </div>

            {/* Alertes */}
            {alertes.length > 0 && (
                <div className="space-y-3">
                    {alertes.map((alerte, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-lg border-l-4 ${
                                alerte.type === 'warning'
                                    ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                                    : alerte.type === 'info'
                                        ? 'bg-blue-50 border-blue-400 text-blue-800'
                                        : 'bg-red-50 border-red-400 text-red-800'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Icon
                                        name={alerte.type === 'warning' ? 'alert-triangle' : 'info'}
                                        size={20}
                                        className="mr-2"
                                    />
                                    <span>{alerte.message}</span>
                                </div>
                                <button
                                    onClick={() => setActiveSection(alerte.section)}
                                    className="text-sm underline hover:no-underline"
                                >
                                    {alerte.action}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Navigation du Dashboard */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {[
                    { id: 'overview', label: 'Vue d\'ensemble', icon: 'pie-chart' },
                    { id: 'jobs', label: 'Jobs', icon: 'briefcase' },
                    { id: 'resources', label: 'Ressources', icon: 'users' },
                    { id: 'analytics', label: 'Analytiques', icon: 'bar-chart' }
                ].map(section => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                            activeSection === section.id
                                ? 'bg-white shadow text-blue-600'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        <Icon name={section.icon} size={16} className="mr-2" />
                        {section.label}
                    </button>
                ))}
            </div>

            {/* Contenu principal */}
            {activeSection === 'overview' && (
                <div className="space-y-6">
                    {/* Statistiques principales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Jobs"
                            value={stats.totalJobs}
                            subtitle={`${stats.jobsEnCours} en cours`}
                            icon="briefcase"
                            color="#3B82F6"
                        />
                        <StatCard
                            title="Personnel"
                            value={stats.totalPersonnel}
                            subtitle={`${stats.personnelDisponible} disponibles`}
                            icon="users"
                            color="#10B981"
                        />
                        <StatCard
                            title="Équipements"
                            value={stats.totalEquipements}
                            subtitle={`${stats.equipementsDisponibles} disponibles`}
                            icon="tool"
                            color="#F59E0B"
                        />
                        <StatCard
                            title="Congés"
                            value={stats.congesEnAttente}
                            subtitle="En attente"
                            icon="calendar"
                            color="#EF4444"
                        />
                    </div>

                    {/* Performance */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Taux de Complétion</h3>
                            <div className="text-3xl font-bold text-green-600 mb-2">{performance.tauxCompletion}%</div>
                            <ProgressBar percentage={performance.tauxCompletion} color="#10B981" />
                            <p className="text-sm text-gray-500 mt-2">
                                {stats.jobsTermines} sur {stats.totalJobs} jobs terminés
                            </p>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Utilisation Personnel</h3>
                            <div className="text-3xl font-bold text-blue-600 mb-2">{performance.tauxUtilisationPersonnel}%</div>
                            <ProgressBar percentage={performance.tauxUtilisationPersonnel} color="#3B82F6" />
                            <p className="text-sm text-gray-500 mt-2">
                                {stats.totalPersonnel - stats.personnelDisponible} sur {stats.totalPersonnel} assignés
                            </p>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Utilisation Équipements</h3>
                            <div className="text-3xl font-bold text-yellow-600 mb-2">{performance.tauxUtilisationEquipements}%</div>
                            <ProgressBar percentage={performance.tauxUtilisationEquipements} color="#F59E0B" />
                            <p className="text-sm text-gray-500 mt-2">
                                {stats.totalEquipements - stats.equipementsDisponibles} sur {stats.totalEquipements} utilisés
                            </p>
                        </div>
                    </div>

                    {/* Jobs par priorité et bureau */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Jobs par priorité */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Jobs par Priorité</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center">
                                        <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                                        Urgente
                                    </span>
                                    <span className="font-medium">{jobsParPriorite.urgente}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center">
                                        <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                                        Haute
                                    </span>
                                    <span className="font-medium">{jobsParPriorite.haute}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center">
                                        <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                                        Normale
                                    </span>
                                    <span className="font-medium">{jobsParPriorite.normale}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center">
                                        <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                                        Faible
                                    </span>
                                    <span className="font-medium">{jobsParPriorite.faible}</span>
                                </div>
                            </div>
                        </div>

                        {/* Jobs par bureau */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Jobs par Bureau</h3>
                            <div className="space-y-3">
                                {Object.entries(jobsParBureau).map(([bureau, count], index) => (
                                    <div key={bureau} className="flex items-center justify-between">
                                        <span className="flex items-center">
                                            <span className={`w-3 h-3 rounded-full mr-2 bg-${['blue', 'green', 'yellow', 'purple', 'pink', 'indigo'][index % 6]}-500`}></span>
                                            {bureau}
                                        </span>
                                        <span className="font-medium">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Jobs récents */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-4">Jobs Récents (7 derniers jours)</h3>
                        {jobsRecents.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">Aucun job créé récemment</p>
                        ) : (
                            <div className="space-y-3">
                                {jobsRecents.map(job => (
                                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-3 h-3 rounded-full ${
                                                job.priorite === 'urgente' ? 'bg-red-500' :
                                                job.priorite === 'haute' ? 'bg-orange-500' :
                                                job.priorite === 'normale' ? 'bg-yellow-500' : 'bg-green-500'
                                            }`} />
                                            <div>
                                                <p className="font-medium">{job.nom}</p>
                                                <p className="text-sm text-gray-500">#{job.numeroJob} • {job.bureau}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                job.statut === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                                                job.statut === 'termine' ? 'bg-green-100 text-green-800' :
                                                job.statut === 'planifie' ? 'bg-gray-100 text-gray-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {job.statut === 'en_cours' ? 'En cours' :
                                                 job.statut === 'termine' ? 'Terminé' :
                                                 job.statut === 'planifie' ? 'Planifié' : job.statut}
                                            </span>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(job.dateCreation).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Section Jobs */}
            {activeSection === 'jobs' && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Gestion des Jobs</h3>
                    <p className="text-gray-500">Interface de gestion des jobs à implémenter...</p>
                </div>
            )}

            {/* Section Ressources */}
            {activeSection === 'resources' && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Gestion des Ressources</h3>
                    <p className="text-gray-500">Interface de gestion des ressources à implémenter...</p>
                </div>
            )}

            {/* Section Analytiques */}
            {activeSection === 'analytics' && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Analytiques Avancées</h3>
                    <p className="text-gray-500">Graphiques et analyses avancées à implémenter...</p>
                </div>
            )}
        </div>
    );
}