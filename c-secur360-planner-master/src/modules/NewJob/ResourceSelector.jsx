import { useState } from 'react';
import { Icon } from '../../components/UI/Icon';

export function ResourceSelector({
    personnel,
    equipements,
    sousTraitants,
    selectedPersonnel = [],
    selectedEquipements = [],
    selectedSousTraitants = [],
    onTogglePersonnel,
    onToggleEquipement,
    onToggleSousTraitant,
    onAddSousTraitant,
    newSousTraitant,
    setNewSousTraitant,
    isResourceAvailable = () => true,
    dateDebut,
    dateFin
}) {
    const [activeResourceTab, setActiveResourceTab] = useState('personnel');

    const handleAddSousTraitant = () => {
        if (newSousTraitant.trim()) {
            onAddSousTraitant();
        }
    };

    return (
        <div className="space-y-6">
            {/* Navigation des ressources */}
            <div className="flex border-b">
                <button
                    type="button"
                    onClick={() => setActiveResourceTab('personnel')}
                    className={`px-4 py-2 font-medium transition-colors ${
                        activeResourceTab === 'personnel'
                            ? 'border-b-2 border-purple-600 text-purple-600'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    👥 Personnel ({selectedPersonnel.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveResourceTab('equipements')}
                    className={`px-4 py-2 font-medium transition-colors ${
                        activeResourceTab === 'equipements'
                            ? 'border-b-2 border-purple-600 text-purple-600'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    🔧 Équipements ({selectedEquipements.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveResourceTab('sousTraitants')}
                    className={`px-4 py-2 font-medium transition-colors ${
                        activeResourceTab === 'sousTraitants'
                            ? 'border-b-2 border-purple-600 text-purple-600'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    🏢 Sous-traitants ({selectedSousTraitants.length})
                </button>
            </div>

            {/* Personnel */}
            {activeResourceTab === 'personnel' && (
                <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Icon name="users" size={20} />
                        Personnel ({selectedPersonnel.length} sélectionné{selectedPersonnel.length !== 1 ? 's' : ''})
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                        {personnel.map(person => {
                            const available = isResourceAvailable(person.id, 'personnel', dateDebut, dateFin);
                            const selected = selectedPersonnel.includes(person.id);

                            return (
                                <div
                                    key={person.id}
                                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                        selected ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-200' :
                                        available ? 'border-gray-300 hover:border-blue-300 hover:bg-gray-50' :
                                        'border-red-200 bg-red-50 opacity-60'
                                    }`}
                                    onClick={available ? () => onTogglePersonnel(person.id) : undefined}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-sm">{person.nom}</div>
                                            <div className="text-xs text-gray-600">{person.poste}</div>
                                            {person.specialites && person.specialites.length > 0 && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {person.specialites.slice(0, 2).join(', ')}
                                                    {person.specialites.length > 2 && ' +...'}
                                                </div>
                                            )}
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            selected ? 'bg-blue-500 border-blue-500' :
                                            available ? 'border-green-400' : 'border-red-400'
                                        }`}>
                                            {selected && <Icon name="check" size={12} className="text-white" />}
                                        </div>
                                    </div>
                                    {!available && (
                                        <div className="text-xs text-red-600 mt-1 font-medium">
                                            ⚠️ Non disponible pour cette période
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Équipements */}
            {activeResourceTab === 'equipements' && (
                <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Icon name="tool" size={20} />
                        Équipements ({selectedEquipements.length} sélectionné{selectedEquipements.length !== 1 ? 's' : ''})
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                        {equipements.map(equipement => {
                            const available = isResourceAvailable(equipement.id, 'equipement', dateDebut, dateFin);
                            const selected = selectedEquipements.includes(equipement.id);

                            return (
                                <div
                                    key={equipement.id}
                                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                        selected ? 'bg-green-100 border-green-500 ring-2 ring-green-200' :
                                        available ? 'border-gray-300 hover:border-green-300 hover:bg-gray-50' :
                                        'border-red-200 bg-red-50 opacity-60'
                                    }`}
                                    onClick={available ? () => onToggleEquipement(equipement.id) : undefined}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-sm">{equipement.nom}</div>
                                            <div className="text-xs text-gray-600">{equipement.type}</div>
                                            <div className="text-xs text-gray-500">{equipement.marque}</div>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            selected ? 'bg-green-500 border-green-500' :
                                            available ? 'border-green-400' : 'border-red-400'
                                        }`}>
                                            {selected && <Icon name="check" size={12} className="text-white" />}
                                        </div>
                                    </div>
                                    {!available && (
                                        <div className="text-xs text-red-600 mt-1 font-medium">
                                            ⚠️ Non disponible pour cette période
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Sous-traitants */}
            {activeResourceTab === 'sousTraitants' && (
                <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Icon name="building" size={20} />
                        Sous-traitants ({selectedSousTraitants.length} sélectionné{selectedSousTraitants.length !== 1 ? 's' : ''})
                    </h3>

                    {/* Champ d'ajout de sous-traitant */}
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newSousTraitant}
                                onChange={(e) => setNewSousTraitant(e.target.value)}
                                placeholder="Nom du sous-traitant à ajouter..."
                                className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddSousTraitant();
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={handleAddSousTraitant}
                                disabled={!newSousTraitant.trim()}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Icon name="plus" size={16} />
                                <span className="hidden sm:inline">Ajouter</span>
                            </button>
                        </div>
                        <p className="text-xs text-blue-600 mt-2">
                            💡 Ajoutez des sous-traitants pour ce projet en tapant leur nom ci-dessus
                        </p>
                    </div>

                    {/* Liste des sous-traitants existants */}
                    {sousTraitants.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                            {sousTraitants.map(sousTraitant => {
                                const available = isResourceAvailable(sousTraitant.id, 'sousTraitant', dateDebut, dateFin);
                                const selected = selectedSousTraitants.includes(sousTraitant.id);

                                return (
                                    <div
                                        key={sousTraitant.id}
                                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                            selected ? 'bg-orange-100 border-orange-500 ring-2 ring-orange-200' :
                                            available ? 'border-gray-300 hover:border-orange-300 hover:bg-gray-50' :
                                            'border-red-200 bg-red-50 opacity-60'
                                        }`}
                                        onClick={available ? () => onToggleSousTraitant(sousTraitant.id) : undefined}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-sm">{sousTraitant.nom}</div>
                                                <div className="text-xs text-gray-600">{sousTraitant.specialite}</div>
                                                <div className="text-xs text-gray-500">{sousTraitant.tarif}</div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                selected ? 'bg-orange-500 border-orange-500' :
                                                available ? 'border-green-400' : 'border-red-400'
                                            }`}>
                                                {selected && <Icon name="check" size={12} className="text-white" />}
                                            </div>
                                        </div>
                                        {!available && (
                                            <div className="text-xs text-red-600 mt-1 font-medium">
                                                ⚠️ Non disponible pour cette période
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Résumé de sélection */}
            {(selectedPersonnel.length > 0 || selectedEquipements.length > 0 || selectedSousTraitants.length > 0) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Ressources sélectionnées :</h4>
                    <div className="flex flex-wrap gap-2">
                        {selectedPersonnel.map(id => {
                            const person = personnel.find(p => p.id === id);
                            return person && (
                                <span
                                    key={`p-${id}`}
                                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                                >
                                    <Icon name="user" size={10} className="mr-1" />
                                    {person.nom}
                                </span>
                            );
                        })}
                        {selectedEquipements.map(id => {
                            const equipement = equipements.find(e => e.id === id);
                            return equipement && (
                                <span
                                    key={`e-${id}`}
                                    className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                                >
                                    <Icon name="tool" size={10} className="mr-1" />
                                    {equipement.nom}
                                </span>
                            );
                        })}
                        {selectedSousTraitants.map(id => {
                            const sousTraitant = sousTraitants.find(s => s.id === id);
                            return sousTraitant && (
                                <span
                                    key={`s-${id}`}
                                    className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs"
                                >
                                    <Icon name="building" size={10} className="mr-1" />
                                    {sousTraitant.nom}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}