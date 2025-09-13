/**
 * Sélecteur de ressources avec équipements et disponibilité
 * EXTRAIT DE LA VERSION COMPLÈTE B3hoWdZQh
 * Composant complet pour sélection de personnel, équipements et sous-traitants
 */

import { Icon } from './UI/Icon.js';

const { useState, useCallback } = React;

export const ResourceSelector = ({ 
    selectedPersonnel = [], 
    selectedEquipements = [], 
    selectedSousTraitants = [],
    onPersonnelChange, 
    onEquipementsChange, 
    onSousTraitantsChange,
    personnel, 
    equipements, 
    sousTraitants,
    dateDebut,
    dateFin,
    jobs,
    currentJobId = null
}) => {
    const [filtrePersonnelBureau, setFiltrePersonnelBureau] = useState('tous');
    const [filtreEquipementBureau, setFiltreEquipementBureau] = useState('tous');
    const [newSousTraitant, setNewSousTraitant] = useState('');
    
    // Vérifier la disponibilité des ressources pour la période
    const isResourceAvailable = useCallback((resourceId, type) => {
        if (!dateDebut || !dateFin) return true;
        
        return !jobs.some(job => {
            if (job.id === currentJobId) return false; // Ignorer le job actuel
            
            const jobStart = new Date(job.dateDebut);
            const jobEnd = new Date(job.dateFin || job.dateDebut);
            const periodStart = new Date(dateDebut);
            const periodEnd = new Date(dateFin);
            
            const isOverlapping = jobStart <= periodEnd && jobEnd >= periodStart;
            
            if (!isOverlapping) return false;
            
            if (type === 'personnel') return job.personnel?.includes(resourceId);
            if (type === 'equipement') return job.equipements?.includes(resourceId);
            if (type === 'sousTraitant') return job.sousTraitants?.includes(resourceId);
            
            return false;
        });
    }, [dateDebut, dateFin, jobs, currentJobId]);

    const togglePersonnel = (id) => {
        const updated = selectedPersonnel.includes(id) 
            ? selectedPersonnel.filter(p => p !== id)
            : [...selectedPersonnel, id];
        onPersonnelChange(updated);
    };

    const toggleEquipement = (id) => {
        const updated = selectedEquipements.includes(id) 
            ? selectedEquipements.filter(e => e !== id)
            : [...selectedEquipements, id];
        onEquipementsChange(updated);
    };

    const toggleSousTraitant = (id) => {
        const updated = selectedSousTraitants.includes(id) 
            ? selectedSousTraitants.filter(s => s !== id)
            : [...selectedSousTraitants, id];
        onSousTraitantsChange(updated);
    };

    const handleAddSousTraitant = () => {
        if (newSousTraitant.trim()) {
            // Pour l'instant, nous ne pouvons pas ajouter de nouveaux sous-traitants depuis ce composant
            // Cette fonction sera implémentée plus tard avec les props nécessaires
            console.warn('Ajout de sous-traitants non implémenté dans ResourceSelector');
            setNewSousTraitant('');
        }
    };

    return React.createElement('div', { className: "space-y-6" },
        // Personnel
        React.createElement('div', null,
            React.createElement('div', { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3" },
                React.createElement('h3', { className: "text-lg font-semibold flex items-center gap-2" },
                    React.createElement(Icon, { name: 'user', size: 20 }),
                    `Personnel (${selectedPersonnel.length} sélectionné${selectedPersonnel.length !== 1 ? 's' : ''})`
                ),
                React.createElement('select', {
                    value: filtrePersonnelBureau,
                    onChange: (e) => setFiltrePersonnelBureau(e.target.value),
                    className: "px-3 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                },
                    React.createElement('option', { value: "tous" }, "Tous les bureaux"),
                    React.createElement('option', { value: "MDL - Sherbrooke" }, "MDL - Sherbrooke"),
                    React.createElement('option', { value: "MDL - Terrebonne" }, "MDL - Terrebonne"),
                    React.createElement('option', { value: "MDL - Québec" }, "MDL - Québec"),
                    React.createElement('option', { value: "DUAL - Électrotech" }, "DUAL - Électrotech"),
                    React.createElement('option', { value: "CFM" }, "CFM"),
                    React.createElement('option', { value: "Surplec" }, "Surplec")
                )
            ),
            React.createElement('div', { className: "grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto" },
                ...personnel.filter(person => {
                    const notCoordonnateur = !person.isCoordonnateur;
                    const matchesBureau = filtrePersonnelBureau === 'tous' || person.succursale === filtrePersonnelBureau;
                    return notCoordonnateur && matchesBureau;
                }).map(person => {
                    const available = isResourceAvailable(person.id, 'personnel');
                    const selected = selectedPersonnel.includes(person.id);
                    
                    return React.createElement('div', {
                        key: person.id,
                        className: `p-3 border rounded-lg cursor-pointer transition-all ${
                            selected ? 'selected-resource' : 
                            available ? 'available-resource hover:shadow-md' : 
                            'busy-resource opacity-60'
                        }`,
                        onClick: available ? () => togglePersonnel(person.id) : undefined
                    },
                        React.createElement('div', { className: "flex items-center justify-between" },
                            React.createElement('div', null,
                                React.createElement('div', { className: "font-medium text-sm" }, person.nom),
                                React.createElement('div', { className: "text-xs text-gray-600" }, person.poste),
                                React.createElement('div', { className: "text-xs text-gray-500" }, person.succursale)
                            ),
                            React.createElement('div', {
                                className: `w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    selected ? 'bg-blue-500 border-blue-500' : 
                                    available ? 'border-green-400' : 'border-red-400'
                                }`
                            }, selected && React.createElement(Icon, { name: 'check', size: 12, className: "text-white" }))
                        ),
                        !available && React.createElement('div', { 
                            className: "text-xs text-red-600 mt-1 font-medium" 
                        }, "⚠️ Non disponible pour cette période")
                    );
                })
            )
        ),

        // Équipements avec vue d'ensemble
        React.createElement('div', null,
            React.createElement('div', { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3" },
                React.createElement('h3', { className: "text-lg font-semibold flex items-center gap-2" },
                    React.createElement(Icon, { name: 'tool', size: 20 }),
                    `Équipements (${selectedEquipements.length} sélectionné${selectedEquipements.length !== 1 ? 's' : ''})`
                ),
                React.createElement('select', {
                    value: filtreEquipementBureau,
                    onChange: (e) => setFiltreEquipementBureau(e.target.value),
                    className: "px-3 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                },
                    React.createElement('option', { value: "tous" }, "Tous les bureaux"),
                    React.createElement('option', { value: "MDL - Sherbrooke" }, "MDL - Sherbrooke"),
                    React.createElement('option', { value: "MDL - Terrebonne" }, "MDL - Terrebonne"),
                    React.createElement('option', { value: "MDL - Québec" }, "MDL - Québec"),
                    React.createElement('option', { value: "DUAL - Électrotech" }, "DUAL - Électrotech"),
                    React.createElement('option', { value: "CFM" }, "CFM"),
                    React.createElement('option', { value: "Surplec" }, "Surplec")
                )
            ),
            React.createElement('div', { className: "grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto" },
                ...equipements.filter(equipement => {
                    const matchesBureau = filtreEquipementBureau === 'tous' || equipement.succursale === filtreEquipementBureau;
                    return matchesBureau;
                }).map(equipement => {
                    const available = isResourceAvailable(equipement.id, 'equipement');
                    const selected = selectedEquipements.includes(equipement.id);
                    
                    return React.createElement('div', {
                        key: equipement.id,
                        className: `p-3 border rounded-lg cursor-pointer transition-all ${
                            selected ? 'selected-resource' : 
                            available ? 'available-resource hover:shadow-md' : 
                            'busy-resource opacity-60'
                        }`,
                        onClick: available ? () => toggleEquipement(equipement.id) : undefined
                    },
                        React.createElement('div', { className: "flex items-center justify-between" },
                            React.createElement('div', null,
                                React.createElement('div', { className: "font-medium text-sm" }, equipement.nom),
                                React.createElement('div', { className: "text-xs text-gray-600" }, equipement.type),
                                React.createElement('div', { className: "text-xs text-gray-500" }, equipement.succursale)
                            ),
                            React.createElement('div', {
                                className: `w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    selected ? 'bg-blue-500 border-blue-500' : 
                                    available ? 'border-green-400' : 'border-red-400'
                                }`
                            }, selected && React.createElement(Icon, { name: 'check', size: 12, className: "text-white" }))
                        ),
                        !available && React.createElement('div', { 
                            className: "text-xs text-red-600 mt-1 font-medium" 
                        }, "⚠️ Non disponible pour cette période")
                    );
                })
            )
        ),

        // Sous-traitants
        React.createElement('div', null,
            React.createElement('h3', { className: "text-lg font-semibold mb-3 flex items-center gap-2" },
                React.createElement(Icon, { name: 'building', size: 20 }),
                `Sous-traitants (${selectedSousTraitants.length} sélectionné${selectedSousTraitants.length !== 1 ? 's' : ''})`
            ),
            
            // Champ d'ajout de sous-traitant
            React.createElement('div', { className: "mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200" },
                React.createElement('div', { className: "flex gap-2" },
                    React.createElement('input', {
                        type: "text",
                        value: newSousTraitant,
                        onChange: (e) => setNewSousTraitant(e.target.value),
                        placeholder: "Nom du sous-traitant à ajouter...",
                        className: "flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500",
                        onKeyPress: (e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSousTraitant();
                            }
                        }
                    }),
                    React.createElement('button', {
                        type: "button",
                        onClick: handleAddSousTraitant,
                        disabled: !newSousTraitant.trim(),
                        className: "px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    },
                        React.createElement(Icon, { name: 'plus', size: 16 }),
                        React.createElement('span', { className: "hidden sm:inline" }, "Ajouter")
                    )
                ),
                React.createElement('p', { className: "text-xs text-blue-600 mt-2" },
                    "💡 Ajoutez des sous-traitants pour ce projet en tapant leur nom ci-dessus"
                )
            ),

            // Liste des sous-traitants existants
            sousTraitants.length > 0 && React.createElement('div', { className: "grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto" },
                ...sousTraitants.map(sousTraitant => {
                    const available = isResourceAvailable(sousTraitant.id, 'sousTraitant');
                    const selected = selectedSousTraitants.includes(sousTraitant.id);
                    
                    return React.createElement('div', {
                        key: sousTraitant.id,
                        className: `p-3 border rounded-lg cursor-pointer transition-all ${
                            selected ? 'selected-resource' : 
                            available ? 'available-resource hover:shadow-md' : 
                            'busy-resource opacity-60'
                        }`,
                        onClick: available ? () => toggleSousTraitant(sousTraitant.id) : undefined
                    },
                        React.createElement('div', { className: "flex items-center justify-between" },
                            React.createElement('div', null,
                                React.createElement('div', { className: "font-medium text-sm" }, sousTraitant.nom),
                                React.createElement('div', { className: "text-xs text-gray-600" }, sousTraitant.specialite),
                                React.createElement('div', { className: "text-xs text-gray-500" }, sousTraitant.tarif)
                            ),
                            React.createElement('div', {
                                className: `w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    selected ? 'bg-blue-500 border-blue-500' : 
                                    available ? 'border-green-400' : 'border-red-400'
                                }`
                            }, selected && React.createElement(Icon, { name: 'check', size: 12, className: "text-white" }))
                        ),
                        !available && React.createElement('div', { 
                            className: "text-xs text-red-600 mt-1 font-medium" 
                        }, "⚠️ Non disponible pour cette période")
                    );
                })
            )
        ),

        // Résumé de sélection avec équipements
        (selectedPersonnel.length > 0 || selectedEquipements.length > 0 || selectedSousTraitants.length > 0) &&
        React.createElement('div', { className: "bg-blue-50 border border-blue-200 rounded-lg p-4" },
            React.createElement('h4', { className: "font-semibold text-blue-900 mb-2" }, "Ressources sélectionnées :"),
            React.createElement('div', { className: "flex flex-wrap gap-2" },
                ...selectedPersonnel.map(id => {
                    const person = personnel.find(p => p.id === id);
                    return person && React.createElement('span', {
                        key: `p-${id}`,
                        className: "resource-badge selected-resource text-xs"
                    },
                        React.createElement(Icon, { name: 'user', size: 10 }),
                        person.nom
                    );
                }),
                ...selectedEquipements.map(id => {
                    const equipement = equipements.find(e => e.id === id);
                    return equipement && React.createElement('span', {
                        key: `e-${id}`,
                        className: "resource-badge selected-resource text-xs"
                    },
                        React.createElement(Icon, { name: 'tool', size: 10 }),
                        equipement.nom
                    );
                }),
                ...selectedSousTraitants.map(id => {
                    const sousTraitant = sousTraitants.find(s => s.id === id);
                    return sousTraitant && React.createElement('span', {
                        key: `s-${id}`,
                        className: "resource-badge selected-resource text-xs"
                    },
                        React.createElement(Icon, { name: 'building', size: 10 }),
                        sousTraitant.nom
                    );
                })
            )
        )
    );
};