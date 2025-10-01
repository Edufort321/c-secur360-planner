# 📋 TODO LIST COMPLÈTE - RESTAURATION VERSION AVANCÉE
## Planificateur C-Secur360 - Migration vers version OLD (Backup)

**Date:** 2025-10-01
**Fichier cible:** `src/modules/Calendar/PlanificateurFinal.jsx`
**Version actuelle:** 1173 lignes
**Version OLD (backup):** 1597 lignes
**Gap:** 424 lignes de fonctionnalités avancées

---

## 🔥 PRIORITÉ 1 : TIMELINE HORAIRE (9 tâches)

### ✅ 1.1 - Créer getAllJobsForCell()
**Fichier:** `PlanificateurFinal.jsx`
**Position:** Après getJobForCell() (~ligne 453)
**Source:** Lignes 456-484 version OLD
**Temps estimé:** 30min

**Code à ajouter:**
```javascript
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
```

### ✅ 1.2 - Modifier getJobForCell() avec support dateFin
**Fichier:** `PlanificateurFinal.jsx`
**Position:** Lignes 423-453 actuelles
**Source:** Lignes 423-453 version OLD
**Temps estimé:** 15min

**Modification:**
```javascript
// Obtenir le job pour une cellule donnée
const getJobForCell = (resourceId, day, resourceType) => {
    const dayString = day.fullDate;

    if (resourceType === 'job') {
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
```

### ✅ 1.3 - Créer composant TimelineCell avec getResourceSchedule()
**Fichier:** `PlanificateurFinal.jsx`
**Position:** Après getAllJobsForCell() (~ligne 485)
**Source:** Lignes 486-711 version OLD (225 lignes complètes)
**Temps estimé:** 2h

**Code complet du composant:**
```javascript
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
```

### ✅ 1.4 - Intégrer TimelineCell dans calendrier
**Fichier:** `PlanificateurFinal.jsx`
**Position:** Lignes 1105-1143 actuelles (tbody calendrier)
**Source:** Lignes 1404-1433 version OLD
**Temps estimé:** 45min

**Remplacer le code actuel:**
```javascript
// ANCIEN CODE (à remplacer):
{continuousDays.map((day, dayIndex) => {
    const job = getJobForCell(resource.id, day, resource.type);

    return (
        <td key={dayIndex} className={`relative p-1 border-r cursor-pointer hover:bg-blue-50 ${
            day.isWeekend ? 'bg-gray-50' : 'bg-white'
        } ${getCellWidth()}`}
        style={{ height: `${CELL_HEIGHT}px` }}
        onClick={() => handleCellClick(resource.id, day, resource.type)}>
            {job && (
                <div className={`w-full h-full rounded text-xs p-1 ...`}>
                    <div className="font-bold truncate">#{job.numRef || job.id}</div>
                    <div className="text-xs truncate">{job.client}</div>
                </div>
            )}
        </td>
    );
})}

// NOUVEAU CODE (de la version OLD):
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
```

---

## ⚠️ PRIORITÉ 2 : MODAL CONFLIT (9 tâches)

### ✅ 2.1 - Créer handleOpenConflictJob()
**Fichier:** `PlanificateurFinal.jsx`
**Position:** Après handleCellClick() (~ligne 453)
**Source:** Lignes 713-716 version OLD
**Temps estimé:** 5min

```javascript
// Fonction pour ouvrir un job en conflit en parallèle
const handleOpenConflictJob = (conflictingJob) => {
    setConflictJob(conflictingJob);
};
```

### ✅ 2.2 - Modal conflit parallèle complet
**Fichier:** `PlanificateurFinal.jsx`
**Position:** Après JobModal principal (~ligne 1169)
**Source:** Lignes 1463-1593 version OLD (130 lignes)
**Temps estimé:** 1h30

```javascript
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
```

### ✅ 2.3-2.6 - Props JobModal étendues
**Fichier:** `PlanificateurFinal.jsx`
**Position:** Lignes ~1155-1169
**Source:** Lignes 1444-1460 version OLD
**Temps estimé:** 10min

```javascript
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
        succursales={succursales}          // ✅ AJOUTER
        conges={conges}                    // ✅ AJOUTER
        jobs={jobs}                        // ✅ AJOUTER
        addSousTraitant={addSousTraitant}
        addNotification={addNotification}
        onOpenConflictJob={handleOpenConflictJob} // ✅ AJOUTER
    />
)}
```

---

## 🔧 PRIORITÉ 3 : ÉQUIPEMENTS (3 tâches)

### ✅ 3.1 - Fonction sortEquipements()
**Fichier:** `PlanificateurFinal.jsx`
**Position:** Après sortPersonnel() (~ligne 305)
**Source:** Lignes 305-318 version OLD
**Temps estimé:** 10min

```javascript
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
```

### ✅ 3.2 - Appliquer sortEquipements()
**Fichier:** `PlanificateurFinal.jsx`
**Position:** Dans filteredResources useMemo
**Lignes à modifier:** ~340, 374, 412 (OLD)
**Temps estimé:** 15min

**Modifications:**
```javascript
// Ligne ~340 (vue individuelle équipements)
return sortEquipements(filteredEquipements).map(e => ({...e, type: 'equipement'}));

// Ligne ~374 (vue équipements)
return sortEquipements(equipements.filter(equipement => {
    // ... filtres
})).map(e => ({...e, type: 'equipement'}));

// Ligne ~412 (vue globale)
const filteredEquipements = sortEquipements(equipements.filter(equipement => {
    // ... filtres
})).map(e => ({...e, type: 'equipement'}));
```

### ✅ 3.3 - Filtre visibleChantier équipements
**Fichier:** `PlanificateurFinal.jsx`
**Position:** Dans tous les filtres d'équipements
**Lignes:** ~337, 355, 377, 415
**Temps estimé:** 10min

**Ajouter dans chaque filter:**
```javascript
const filteredEquipements = equipements.filter(equipement => {
    const matchesSearch = equipement.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBureau = filterBureau === 'tous' || equipement.succursale === filterBureau;
    const visibleCalendrier = equipement.visibleChantier === true; // ✅ AJOUTER
    return matchesSearch && matchesBureau && visibleCalendrier;    // ✅ AJOUTER visibleCalendrier
});
```

---

## 🎨 PRIORITÉ 4 : UI AMÉLIORÉE (14 tâches)

### ✅ 4.1 - Pastille couleur succursale
**Fichier:** `PlanificateurFinal.jsx`
**Position:** Lignes ~1036-1048 (cellule nom ressource)
**Source:** Lignes 1336-1340 version OLD
**Temps estimé:** 15min

```javascript
<td className={`px-3 py-4 font-medium border-r ${isMobile ? 'w-[120px]' : 'w-[180px]'} ${
    continuousDays.some(d => d.isToday) ? 'bg-gray-100' : 'bg-white'
}`}>
    <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold flex items-center gap-2 leading-tight`}>
        {/* ✅ AJOUTER pastille couleur */}
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
```

### ✅ 4.2 - Affichage nom avec prénom
**Fichier:** `PlanificateurFinal.jsx`
**Position:** Lignes ~1045-1047
**Source:** Lignes 1348-1351 version OLD
**Temps estimé:** 10min

```javascript
// Dans la cellule nom:
<span title={`${resource.nom}${resource.prenom ? ', ' + resource.prenom : ''}`}>
    {isMobile ? resource.nom.split(' ')[0] :
     `${resource.nom}${resource.prenom ? ', ' + resource.prenom : ''}`}
</span>
```

### ✅ 4.3 - Recherche prénom
**Fichier:** `PlanificateurFinal.jsx`
**Position:** Dans filteredResources (toutes les occurrences de filter personnel)
**Lignes:** ~325-326, 344-345, 365-366, 404-405 OLD
**Temps estimé:** 15min

```javascript
// Remplacer partout:
// AVANT:
const matchesSearch = person.nom.toLowerCase().includes(searchTerm.toLowerCase());

// APRÈS:
const matchesSearch = person.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   (person.prenom && person.prenom.toLowerCase().includes(searchTerm.toLowerCase()));
```

### ✅ 4.4 - Poste + département
**Fichier:** `PlanificateurFinal.jsx`
**Position:** Lignes ~1054-1058
**Source:** Lignes 1362-1368 version OLD
**Temps estimé:** 10min

```javascript
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
```

### ✅ 4.5 - Highlight jour actuel (cellules fixes)
**Fichier:** `PlanificateurFinal.jsx`
**Position:** Lignes 1034-1061 (tbody ressources)
**Source:** Lignes 1330-1371 version OLD
**Temps estimé:** 15min

```javascript
{filteredResources.map((resource) => (
    <tr key={resource.id} className={`border-b hover:bg-gray-50 ${
        continuousDays.some(d => d.isToday) ? 'bg-gray-100' : ''
    }`} style={{ height: '89px' }}>
        <td className={`px-3 py-4 font-medium border-r ${isMobile ? 'w-[120px]' : 'w-[180px]'} ${
            continuousDays.some(d => d.isToday) ? 'bg-gray-100' : 'bg-white'
        }`}>
            {/* ... contenu ... */}
        </td>
        {!isMobile && (
            <td className={`px-2 py-4 text-xs w-[100px] ${
                continuousDays.some(d => d.isToday) ? 'bg-gray-100' : 'bg-white'
            }`}>
                {/* ... contenu ... */}
            </td>
        )}
    </tr>
))}
```

### ✅ 4.6 - Highlight jour actuel (cellules données)
**Fichier:** `PlanificateurFinal.jsx`
**Position:** Lignes 1105-1143 (tbody dates)
**Source:** Lignes 1410-1416 version OLD
**Temps estimé:** 10min

```javascript
{filteredResources.map((resource) => (
    <tr key={`dates-${resource.id}`} className={`border-b hover:bg-gray-50 h-20 ${
        continuousDays.some(d => d.isToday) ? 'bg-gray-100' : ''
    }`}>
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
                    {/* ... contenu ... */}
                </td>
            );
        })}
    </tr>
))}
```

### ✅ 4.7 - Style header jour actuel
**Fichier:** `PlanificateurFinal.jsx`
**Position:** Lignes ~1074-1096 (thead dates)
**Source:** Lignes 1383-1399 version OLD
**Temps estimé:** 15min

```javascript
<tr className="h-20">
    {continuousDays.map((day, index) =>
        <th
            key={index}
            className={`px-1 py-4 text-center text-xs border-r border-gray-600 w-20 bg-gray-900 ${
                day.isToday ? 'text-yellow-400 font-bold' : 'text-white'
            } cursor-pointer hover:bg-gray-700 transition-colors`}
            onDoubleClick={() => handleDateDoubleClick(day.date)}
            title={t('calendar.doubleClickFullDate')}
        >
            <div className="font-medium leading-tight">
                {day.displayShort}
            </div>
            <div className={`${isMobile ? 'text-xs' : 'text-sm'} leading-tight ${
                day.isToday ? 'font-bold' : ''
            }`}>
                {day.dayNumber}
            </div>
        </th>
    )}
</tr>
```

### ✅ 4.8 - day.displayShort
**Position:** Dans header dates
**Action:** Utiliser directement `day.displayShort`
**Temps estimé:** 5min

### ✅ 4.9 - Hover header dates
**Position:** Classe du `<th>` header
**Action:** Ajouter `hover:bg-gray-700 transition-colors`
**Temps estimé:** 2min

### ✅ 4.10 - Title tooltip header
**Position:** Props du `<th>` header
**Action:** Ajouter `title={t('calendar.doubleClickFullDate')}`
**Temps estimé:** 2min

### ✅ 4.11 - Hauteur cellules 89px
**Fichier:** `PlanificateurFinal.jsx`
**Position:** Ligne 39 + style inline tr
**Source:** Ligne 39 OLD + ligne 1330 OLD
**Temps estimé:** 5min

```javascript
// Ligne 39:
const CELL_HEIGHT = 89; // pixels (au lieu de 80)

// Et dans chaque <tr> de ressources:
<tr style={{ height: '89px' }}>
```

### ✅ 4.12-4.13 - Conteneur scrollable
**Fichier:** `PlanificateurFinal.jsx`
**Position:** Ligne ~1011 (div conteneur calendrier)
**Source:** Ligne 1306 version OLD
**Temps estimé:** 5min

```javascript
// AVANT:
<div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">

// APRÈS:
<div className="bg-white rounded-lg shadow-sm overflow-hidden max-h-[calc(100vh-200px)] overflow-y-auto">
```

### ✅ 4.14 - Border-r-2
**Fichier:** `PlanificateurFinal.jsx`
**Position:** Ligne ~1014
**Source:** Ligne 1309 version OLD
**Temps estimé:** 2min

```javascript
// AVANT:
<div className="flex-shrink-0 border-r border-gray-300">

// APRÈS:
<div className="flex-shrink-0 border-r-2 border-gray-300">
```

---

## 🎨 PRIORITÉ 5 : MODE COULEUR (2 tâches)

### ✅ 5.1-5.2 - Select mode couleur
**Fichier:** `PlanificateurFinal.jsx`
**Position:** Remplacer lignes 818-831 actuelles
**Source:** Lignes 818-827 version OLD
**Temps estimé:** 15min

```javascript
// SUPPRIMER le code actuel (lignes 818-831):
{filterType !== 'dashboard' && (
    <button onClick={() => setColorMode(colorMode === 'priorite' ? 'succursale' : 'priorite')}
            className={`px-3 py-2 text-sm rounded-lg border ...`}>
        {colorMode === 'priorite' ? '🎯' : '🏢'}
    </button>
)}

// AJOUTER après le sélecteur de période (après ligne ~520):
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
```

---

## 🌍 PRIORITÉ 6 : TRADUCTIONS (6 tâches)

### ✅ 6.1 - Traduction 'Aujourd'hui'
**Fichier:** `PlanificateurFinal.jsx`
**Ligne:** 494
**Temps estimé:** 2min

```javascript
// AVANT:
<button onClick={goToToday} className="...">
    Aujourd'hui
</button>

// APRÈS:
<button onClick={goToToday} className="...">
    {t('calendar.today')}
</button>
```

### ✅ 6.2 - Traduction 'Filtres'
**Fichier:** `PlanificateurFinal.jsx`
**Ligne:** 564
**Temps estimé:** 2min

```javascript
// AVANT:
<span className="text-sm font-medium text-gray-700">Filtres</span>

// APRÈS:
<span className="text-sm font-medium text-gray-700">{t('filter.filters')}</span>
```

### ✅ 6.3 - Traduction 'Rechercher'
**Fichier:** `PlanificateurFinal.jsx`
**Ligne:** 811
**Temps estimé:** 2min

```javascript
// AVANT:
<input type="text" placeholder="Rechercher..." ... />

// APRÈS:
<input type="text" placeholder={t('form.searchPlaceholder')} ... />
```

### ✅ 6.4 - Labels vues
**Fichier:** `PlanificateurFinal.jsx`
**Lignes:** 629-633
**Source:** Lignes 936-940 version OLD
**Temps estimé:** 10min

```javascript
// AVANT:
{ value: 'personnel', label: 'Personnel', desc: 'Afficher uniquement le personnel' },
{ value: 'equipements', label: 'Équipements', desc: 'Afficher uniquement les équipements' },
{ value: 'global', label: 'Vue globale', desc: 'Personnel et équipements ensemble' },
{ value: 'jobs', label: 'Événements', desc: 'Afficher uniquement les événements' },
{ value: 'dashboard', label: 'Dashboard', desc: 'Vue analytique complète' }

// APRÈS:
{ value: 'personnel', label: t('viewType.personnel'), desc: t('filter.personnelOnly') },
{ value: 'equipements', label: t('viewType.equipment'), desc: t('filter.equipmentOnly') },
{ value: 'global', label: t('viewType.global'), desc: t('filter.globalView') },
{ value: 'jobs', label: t('viewType.events'), desc: t('filter.eventsOnly') },
{ value: 'dashboard', label: t('viewType.dashboard'), desc: t('filter.dashboardView') }
```

### ✅ 6.5 - Clés traduction manquantes
**Fichiers:** `src/translations/fr.json` et `src/translations/en.json`
**Temps estimé:** 20min

**Ajouter dans fr.json:**
```json
{
  "resource": {
    "clientNotDefined": "Client non défini",
    "officeNotDefined": "Bureau non défini",
    "nameFirstName": "Nom / Prénom",
    "eventClient": "Événement / Client",
    "equipment": {
      "short": "Équip."
    }
  },
  "event": {
    "conflictEvent": "Événement en conflit",
    "conflictWarning": "Cet événement a des ressources en conflit",
    "modifyEvent": "Modifier l'événement",
    "assignedResources": "Ressources assignées"
  },
  "calendar": {
    "doubleClickFullDate": "Double-cliquer pour voir la date complète",
    "colorMode": "Mode de couleur",
    "colorByBranch": "Couleur par bureau",
    "colorByPriority": "Couleur par priorité"
  },
  "viewType": {
    "personnel": "Personnel",
    "equipment": "Équipements",
    "global": "Vue globale",
    "events": "Événements",
    "dashboard": "Dashboard",
    "globalFocus": "Vue globale",
    "personnelFocus": "Focus Personnel",
    "equipmentFocus": "Focus Équipements"
  },
  "filter": {
    "personnelOnly": "Afficher uniquement le personnel",
    "equipmentOnly": "Afficher uniquement les équipements",
    "globalView": "Personnel et équipements ensemble",
    "eventsOnly": "Afficher uniquement les événements",
    "dashboardView": "Vue analytique complète"
  }
}
```

**Ajouter dans en.json:**
```json
{
  "resource": {
    "clientNotDefined": "Client not defined",
    "officeNotDefined": "Office not defined",
    "nameFirstName": "Name / First Name",
    "eventClient": "Event / Client",
    "equipment": {
      "short": "Equip."
    }
  },
  "event": {
    "conflictEvent": "Conflict Event",
    "conflictWarning": "This event has conflicting resources",
    "modifyEvent": "Modify Event",
    "assignedResources": "Assigned Resources"
  },
  "calendar": {
    "doubleClickFullDate": "Double-click to see full date",
    "colorMode": "Color mode",
    "colorByBranch": "Color by branch",
    "colorByPriority": "Color by priority"
  },
  "viewType": {
    "personnel": "Personnel",
    "equipment": "Equipment",
    "global": "Global View",
    "events": "Events",
    "dashboard": "Dashboard",
    "globalFocus": "Global Focus",
    "personnelFocus": "Personnel Focus",
    "equipmentFocus": "Equipment Focus"
  },
  "filter": {
    "personnelOnly": "Show personnel only",
    "equipmentOnly": "Show equipment only",
    "globalView": "Personnel and equipment together",
    "eventsOnly": "Show events only",
    "dashboardView": "Complete analytics view"
  }
}
```

### ✅ 6.6 - Corriger fallbacks t()
**Fichier:** `PlanificateurFinal.jsx`
**Lignes:** 124, 147, 172, 251, 394, 395
**Temps estimé:** 10min

```javascript
// AVANT:
t ? t('resource.allOffices') : 'Tous les bureaux'

// APRÈS:
t('resource.allOffices')

// Appliquer partout où il y a des fallbacks avec opérateur ternaire
```

---

## 🧪 PRIORITÉ 7 : TESTS (5 tâches)

### ✅ 7.1 - Test getAllJobsForCell multi-jours
**Temps estimé:** 30min
**Procédure:**
1. Créer un job avec dateDebut="2025-10-01" et dateFin="2025-10-03"
2. Naviguer vers cette période dans le calendrier
3. Vérifier que le job s'affiche les 1, 2 et 3 octobre
4. Vérifier qu'il ne s'affiche PAS le 30 sept ni le 4 octobre

### ✅ 7.2 - Test TimelineCell horaires personnalisés
**Temps estimé:** 45min
**Procédure:**
1. Créer job standard 8h-17h
2. Vérifier affichage timeline sur grille 6h-20h
3. Créer job avec horairesIndividuels pour une ressource spécifique
4. Vérifier que la ressource affiche l'horaire personnalisé
5. Tester joursTravailles (ressource ne travaille que certains jours)

### ✅ 7.3 - Test modal conflit parallèle
**Temps estimé:** 30min
**Procédure:**
1. Créer 2 jobs en conflit (même ressource, horaires qui se chevauchent)
2. Ouvrir le premier job dans modal principal
3. Cliquer sur indicateur de conflit
4. Vérifier modal orange à droite
5. Vérifier affichage parallèle (2 modals visibles)
6. Cliquer "Modifier événement" dans modal conflit
7. Vérifier que modal conflit se ferme et job s'ouvre dans modal principal

### ✅ 7.4 - Test conflits multi-layers
**Temps estimé:** 30min
**Procédure:**
1. Créer 3 jobs même ressource même jour:
   - Job A: 8h-12h
   - Job B: 10h-14h (conflit avec A)
   - Job C: 13h-17h (conflit avec B)
2. Vérifier organisation en lignes (layers):
   - Ligne 1: Job A
   - Ligne 2: Job B
   - Ligne 3: Job C
3. Vérifier hauteur cellule divisée (89px / 3 = ~30px par ligne)

### ✅ 7.5 - Test responsive mobile
**Temps estimé:** 30min
**Procédure:**
1. Réduire fenêtre à <768px
2. Vérifier timeline visible et fonctionnelle
3. Vérifier header dates compacté
4. Vérifier pastilles couleur visibles
5. Vérifier modal conflit sur mobile (ajuster si nécessaire)
6. Tester navigation tactile

---

## 📊 RÉCAPITULATIF

| Priorité | Description | Tâches | Temps estimé | Fichiers affectés |
|----------|-------------|--------|--------------|-------------------|
| **P1** | Timeline horaire | 4 | 4-5h | PlanificateurFinal.jsx |
| **P2** | Modal conflit | 6 | 2h | PlanificateurFinal.jsx |
| **P3** | Équipements | 3 | 35min | PlanificateurFinal.jsx |
| **P4** | UI améliorée | 14 | 2h | PlanificateurFinal.jsx |
| **P5** | Mode couleur | 2 | 15min | PlanificateurFinal.jsx |
| **P6** | Traductions | 6 | 50min | PlanificateurFinal.jsx, fr.json, en.json |
| **P7** | Tests | 5 | 2h30 | - |
| **TOTAL** | | **48** | **12-13h** | 3 fichiers |

---

## 🎯 ORDRE D'IMPLÉMENTATION RECOMMANDÉ

1. ✅ **P1.1-1.2** - getAllJobsForCell + getJobForCell avec dateFin (base)
2. ✅ **P1.3** - Composant TimelineCell complet (fonctionnalité critique)
3. ✅ **P1.4** - Intégration TimelineCell dans calendrier
4. ✅ **P2** - Modal conflit (dépend de P1)
5. ✅ **P4.11** - Hauteur 89px (requis pour timeline)
6. ✅ **P4.1-4.10, 4.12-4.14** - UI (améliorations visuelles)
7. ✅ **P3** - Équipements (rapide)
8. ✅ **P5** - Mode couleur (rapide)
9. ✅ **P6** - Traductions (finalisation)
10. ✅ **P7** - Tests (validation complète)

---

## 📝 NOTES IMPORTANTES

- **Fidélité au backup:** Copier le code EXACTEMENT depuis la version OLD sans modifications
- **Tests progressifs:** Tester après chaque priorité complétée
- **Sauvegarde:** Créer commit Git après chaque priorité
- **Props validation:** Vérifier que les props succursales, conges, jobs sont bien passées depuis le parent (App.jsx)
- **Dépendances:** P2 dépend de P1, ne pas inverser l'ordre
- **CELL_HEIGHT:** Utilisé par TimelineCell, changer en début (P4.11)

---

## ✅ CHECKLIST FINALE

Avant de considérer la migration complète:

- [ ] Timeline horaire 6h-20h fonctionne
- [ ] Jobs multi-jours s'affichent correctement
- [ ] Horaires personnalisés par ressource fonctionnent
- [ ] Conflits détectés et affichés en multi-layers
- [ ] Modal conflit parallèle fonctionne
- [ ] Pastilles couleur succursale visibles
- [ ] Prénom affiché et recherchable
- [ ] Jour actuel highlighté (jaune + gris)
- [ ] Équipements triés correctement
- [ ] Traductions complètes (FR + EN)
- [ ] Tests responsive mobile OK
- [ ] Aucune régression fonctionnelle
- [ ] Performance acceptable (pas de lag)

---

**Document créé le:** 2025-10-01
**Dernière mise à jour:** 2025-10-01
**Version:** 1.0
**Auteur:** Claude Code Assistant
