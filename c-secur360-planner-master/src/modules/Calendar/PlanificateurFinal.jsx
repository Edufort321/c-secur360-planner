import { useState, useEffect, useCallback } from 'react';
import { Icon } from '../../components/UI/Icon';
import { DateNavigator } from '../../components/DateNavigator';
import { JobModal } from '../NewJob/JobModal';
import { CongesModal } from '../Conge/CongesModal';
import { PersonnelModal } from '../Resource/PersonnelModal';
import { EquipementModal } from '../Resource/EquipementModal';

export function PlanificateurFinal({
    jobs = [],
    personnel = [],
    equipements = [],
    sousTraitants = [],
    conges = [],
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
    selectedView = 'month',
    onViewChange,
    selectedDate = new Date(),
    onDateChange,
    currentUser = null,
    isAdmin = false
}) {
    // États pour les modals
    const [activeModal, setActiveModal] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedCell, setSelectedCell] = useState(null);

    // Vue du calendrier
    const [calendarDays, setCalendarDays] = useState([]);
    const [weekDays, setWeekDays] = useState([]);

    // Générer les jours du calendrier
    const generateCalendarDays = useCallback(() => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);

        // Commencer au dimanche de la semaine
        startDate.setDate(firstDay.getDate() - firstDay.getDay());

        const days = [];
        const current = new Date(startDate);

        // Générer 42 jours (6 semaines)
        for (let i = 0; i < 42; i++) {
            days.push({
                date: new Date(current),
                dateString: current.toISOString().split('T')[0],
                isCurrentMonth: current.getMonth() === month,
                isToday: current.toDateString() === new Date().toDateString(),
                isSelected: current.toDateString() === selectedDate.toDateString()
            });
            current.setDate(current.getDate() + 1);
        }

        setCalendarDays(days);
    }, [selectedDate]);

    // Générer les jours de la semaine
    const generateWeekDays = useCallback(() => {
        const startOfWeek = new Date(selectedDate);
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            days.push({
                date: new Date(day),
                dateString: day.toISOString().split('T')[0],
                isToday: day.toDateString() === new Date().toDateString(),
                isSelected: day.toDateString() === selectedDate.toDateString()
            });
        }

        setWeekDays(days);
    }, [selectedDate]);

    // Mettre à jour les jours quand la date change
    useEffect(() => {
        if (selectedView === 'month') {
            generateCalendarDays();
        } else {
            generateWeekDays();
        }
    }, [selectedDate, selectedView, generateCalendarDays, generateWeekDays]);

    // Obtenir les jobs pour une date donnée
    const getJobsForDate = (dateString) => {
        return jobs.filter(job => {
            const jobStart = new Date(job.dateDebut).toISOString().split('T')[0];
            const jobEnd = job.dateFin ? new Date(job.dateFin).toISOString().split('T')[0] : jobStart;
            return dateString >= jobStart && dateString <= jobEnd;
        });
    };

    // Obtenir les congés pour une date donnée
    const getCongesForDate = (dateString) => {
        return conges.filter(conge => {
            if (conge.statut !== 'approuve') return false;
            const congeStart = new Date(conge.dateDebut).toISOString().split('T')[0];
            const congeEnd = new Date(conge.dateFin).toISOString().split('T')[0];
            return dateString >= congeStart && dateString <= congeEnd;
        });
    };

    // Gérer le clic sur une cellule
    const handleCellClick = (day, event) => {
        event.stopPropagation();
        setSelectedCell({
            date: day.dateString,
            personnelId: null
        });
        setSelectedItem(null);
        setActiveModal('job');
    };

    // Gérer le clic sur un job
    const handleJobClick = (job, event) => {
        event.stopPropagation();
        setSelectedItem(job);
        setSelectedCell(null);
        setActiveModal('job');
    };

    // Fermer les modals
    const closeModal = () => {
        setActiveModal(null);
        setSelectedItem(null);
        setSelectedCell(null);
    };

    // Composant d'une cellule de jour
    const DayCell = ({ day, isWeekView = false }) => {
        const dayJobs = getJobsForDate(day.dateString);
        const dayConges = getCongesForDate(day.dateString);

        return (
            <div
                className={`${isWeekView ? 'min-h-32' : 'min-h-24'} border border-gray-200 p-1 cursor-pointer hover:bg-gray-50 transition-colors ${
                    day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${
                    day.isToday ? 'ring-2 ring-blue-500' : ''
                } ${
                    day.isSelected ? 'bg-blue-50' : ''
                }`}
                onClick={(e) => handleCellClick(day, e)}
            >
                {/* Numéro du jour */}
                <div className={`text-sm font-medium mb-1 ${
                    day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${
                    day.isToday ? 'text-blue-600' : ''
                }`}>
                    {day.date.getDate()}
                </div>

                {/* Jobs */}
                <div className="space-y-1">
                    {dayJobs.slice(0, isWeekView ? 8 : 3).map(job => (
                        <div
                            key={job.id}
                            className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${
                                job.priorite === 'urgente' ? 'bg-red-100 text-red-800' :
                                job.priorite === 'haute' ? 'bg-orange-100 text-orange-800' :
                                job.priorite === 'normale' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                            }`}
                            onClick={(e) => handleJobClick(job, e)}
                            title={`${job.nom} - ${job.lieu}`}
                        >
                            #{job.numeroJob}: {job.nom}
                        </div>
                    ))}

                    {/* Indicateur s'il y a plus de jobs */}
                    {dayJobs.length > (isWeekView ? 8 : 3) && (
                        <div className="text-xs text-gray-500">
                            +{dayJobs.length - (isWeekView ? 8 : 3)} autre{dayJobs.length - (isWeekView ? 8 : 3) > 1 ? 's' : ''}
                        </div>
                    )}
                </div>

                {/* Congés */}
                {dayConges.length > 0 && (
                    <div className="mt-1">
                        {dayConges.slice(0, 2).map(conge => (
                            <div
                                key={conge.id}
                                className="text-xs p-1 bg-purple-100 text-purple-800 rounded truncate"
                                title={`Congé: ${conge.personnelNom} - ${conge.type}`}
                            >
                                🏖️ {conge.personnelNom}
                            </div>
                        ))}
                        {dayConges.length > 2 && (
                            <div className="text-xs text-purple-600">
                                +{dayConges.length - 2} congé{dayConges.length - 2 > 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header avec navigation */}
            <div className="flex items-center justify-between p-4 bg-white border-b">
                <DateNavigator
                    selectedDate={selectedDate}
                    onDateChange={onDateChange}
                    selectedView={selectedView}
                    onViewChange={onViewChange}
                />

                {/* Actions */}
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setActiveModal('personnel')}
                        className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="Gérer le personnel"
                    >
                        <Icon name="users" size={16} className="mr-1" />
                        Personnel
                    </button>

                    <button
                        onClick={() => setActiveModal('equipement')}
                        className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        title="Gérer les équipements"
                    >
                        <Icon name="tool" size={16} className="mr-1" />
                        Équipements
                    </button>

                    <button
                        onClick={() => setActiveModal('conges')}
                        className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        title="Gérer les congés"
                    >
                        <Icon name="calendar" size={16} className="mr-1" />
                        Congés
                    </button>

                    <button
                        onClick={() => {
                            setSelectedItem(null);
                            setSelectedCell({ date: new Date().toISOString().split('T')[0] });
                            setActiveModal('job');
                        }}
                        className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        title="Nouveau job"
                    >
                        <Icon name="plus" size={16} className="mr-1" />
                        Nouveau Job
                    </button>
                </div>
            </div>

            {/* Calendrier principal */}
            <div className="flex-1 bg-white">
                {selectedView === 'month' ? (
                    <div className="h-full flex flex-col">
                        {/* En-têtes des jours */}
                        <div className="grid grid-cols-7 border-b bg-gray-50">
                            {['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(day => (
                                <div key={day} className="p-3 text-center font-medium text-gray-700 border-r last:border-r-0">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Grille du calendrier */}
                        <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                            {calendarDays.map((day, index) => (
                                <DayCell key={index} day={day} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col">
                        {/* En-têtes de la semaine */}
                        <div className="grid grid-cols-7 border-b bg-gray-50">
                            {weekDays.map(day => (
                                <div key={day.dateString} className={`p-3 text-center font-medium border-r last:border-r-0 ${
                                    day.isToday ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                                }`}>
                                    <div>{['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][day.date.getDay()]}</div>
                                    <div className="text-lg">{day.date.getDate()}</div>
                                </div>
                            ))}
                        </div>

                        {/* Vue semaine */}
                        <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                            {weekDays.map(day => (
                                <DayCell key={day.dateString} day={day} isWeekView={true} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {activeModal === 'job' && (
                <JobModal
                    isOpen={true}
                    onClose={closeModal}
                    job={selectedItem}
                    onSave={onSaveJob}
                    onDelete={onDeleteJob}
                    personnel={personnel}
                    equipements={equipements}
                    sousTraitants={sousTraitants}
                    addSousTraitant={addSousTraitant}
                    jobs={jobs}
                    selectedCell={selectedCell}
                    addNotification={addNotification}
                    peutModifier={true}
                    estCoordonnateur={isAdmin}
                />
            )}

            {activeModal === 'conges' && (
                <CongesModal
                    isOpen={true}
                    onClose={closeModal}
                    personnel={personnel}
                    conges={conges}
                    onSaveConge={onSaveConge}
                    onDeleteConge={onDeleteConge}
                />
            )}

            {activeModal === 'personnel' && (
                <PersonnelModal
                    isOpen={true}
                    onClose={closeModal}
                    personnel={selectedItem}
                    onSave={onSavePersonnel}
                    onDelete={onDeletePersonnel}
                />
            )}

            {activeModal === 'equipement' && (
                <EquipementModal
                    isOpen={true}
                    onClose={closeModal}
                    equipement={selectedItem}
                    onSave={onSaveEquipement}
                    onDelete={onDeleteEquipement}
                />
            )}
        </div>
    );
}