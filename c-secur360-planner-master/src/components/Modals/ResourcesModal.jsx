// ============== MODAL RESSOURCES AVEC AUTHENTIFICATION ==============
// Modal pour gérer Personnel et Équipements avec contrôle d'accès

import React, { useState } from 'react';
import { Modal } from '../UI/Modal';
import { Icon } from '../UI/Icon';
import { Logo } from '../UI/Logo';
import { PersonnelModal } from './PersonnelModal';
import { EquipementModal } from './EquipementModal';

export function ResourcesModal({
    isOpen,
    onClose,
    personnel = [],
    equipements = [],
    onSavePersonnel,
    onDeletePersonnel,
    onSaveEquipement,
    onDeleteEquipement,
    utilisateurConnecte,
    estCoordonnateur,
    peutModifier,
    addNotification
}) {
    const [activeTab, setActiveTab] = useState('personnel');
    const [showPersonnelModal, setShowPersonnelModal] = useState(false);
    const [showEquipementModal, setShowEquipementModal] = useState(false);
    const [selectedPersonnel, setSelectedPersonnel] = useState(null);
    const [selectedEquipement, setSelectedEquipement] = useState(null);
    const [motDePasseAdmin, setMotDePasseAdmin] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showAdminPassword, setShowAdminPassword] = useState(false);

    // États pour les filtres et vues
    const [viewMode, setViewMode] = useState('grid'); // 'grid', 'individual'
    const [selectedResource, setSelectedResource] = useState(null);
    const [filtres, setFiltres] = useState({
        bureau: 'tous',
        type: 'tous',
        disponibilite: 'tous',
        recherche: ''
    });

    // États pour l'onglet gestion des filtres
    const [filtresSauvegardes, setFiltresSauvegardes] = useState([]);
    const [nouveauFiltre, setNouveauFiltre] = useState({
        nom: '',
        description: '',
        criteres: { ...filtres }
    });
    const [showNewFilterForm, setShowNewFilterForm] = useState(false);

    // Vérifier si l'utilisateur peut accéder aux ressources
    const peutAccederRessources = () => {
        return estCoordonnateur() || isAuthenticated;
    };

    // Obtenir les bureaux uniques
    const getBureauxUniques = () => {
        const bureaux = new Set();
        personnel.forEach(p => p.succursale && bureaux.add(p.succursale));
        equipements.forEach(e => e.succursale && bureaux.add(e.succursale));
        return Array.from(bureaux).sort();
    };

    // Obtenir les types d'équipements uniques
    const getTypesEquipements = () => {
        const types = new Set();
        equipements.forEach(e => e.type && types.add(e.type));
        return Array.from(types).sort();
    };

    // Filtrer le personnel selon les critères
    const filtrerPersonnel = () => {
        return personnel.filter(person => {
            // Filtre par bureau
            if (filtres.bureau !== 'tous' && person.succursale !== filtres.bureau) {
                return false;
            }

            // Filtre par disponibilité
            if (filtres.disponibilite !== 'tous') {
                const disponible = person.disponible !== false;
                if (filtres.disponibilite === 'disponible' && !disponible) return false;
                if (filtres.disponibilite === 'indisponible' && disponible) return false;
            }

            // Filtre par recherche
            if (filtres.recherche) {
                const recherche = filtres.recherche.toLowerCase();
                return person.nom.toLowerCase().includes(recherche) ||
                       person.poste.toLowerCase().includes(recherche);
            }

            return true;
        });
    };

    // Filtrer les équipements selon les critères
    const filtrerEquipements = () => {
        return equipements.filter(equipement => {
            // Filtre par bureau
            if (filtres.bureau !== 'tous' && equipement.succursale !== filtres.bureau) {
                return false;
            }

            // Filtre par type
            if (filtres.type !== 'tous' && equipement.type !== filtres.type) {
                return false;
            }

            // Filtre par disponibilité
            if (filtres.disponibilite !== 'tous') {
                const disponible = equipement.disponible !== false;
                if (filtres.disponibilite === 'disponible' && !disponible) return false;
                if (filtres.disponibilite === 'indisponible' && disponible) return false;
            }

            // Filtre par recherche
            if (filtres.recherche) {
                const recherche = filtres.recherche.toLowerCase();
                return equipement.nom.toLowerCase().includes(recherche) ||
                       equipement.type.toLowerCase().includes(recherche);
            }

            return true;
        });
    };

    // Mettre à jour un filtre
    const updateFiltre = (key, value) => {
        setFiltres(prev => ({ ...prev, [key]: value }));
    };

    // Réinitialiser les filtres
    const resetFiltres = () => {
        setFiltres({
            bureau: 'tous',
            type: 'tous',
            disponibilite: 'tous',
            recherche: ''
        });
    };

    // Gestion des filtres sauvegardés
    const sauvegarderFiltre = () => {
        if (!nouveauFiltre.nom.trim()) {
            addNotification('Veuillez donner un nom à votre filtre', 'error');
            return;
        }

        const nouveauFiltreComplet = {
            id: Date.now(),
            nom: nouveauFiltre.nom,
            description: nouveauFiltre.description,
            criteres: { ...filtres },
            dateCreation: new Date().toLocaleDateString('fr-FR'),
            onglet: activeTab
        };

        setFiltresSauvegardes(prev => [...prev, nouveauFiltreComplet]);
        setNouveauFiltre({ nom: '', description: '', criteres: { ...filtres } });
        setShowNewFilterForm(false);
        addNotification(`Filtre "${nouveauFiltre.nom}" sauvegardé avec succès`, 'success');
    };

    const appliquerFiltre = (filtreSauvegarde) => {
        setFiltres(filtreSauvegarde.criteres);
        setActiveTab(filtreSauvegarde.onglet);
        addNotification(`Filtre "${filtreSauvegarde.nom}" appliqué`, 'success');
    };

    const supprimerFiltre = (filtreId) => {
        const filtre = filtresSauvegardes.find(f => f.id === filtreId);
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer le filtre "${filtre.nom}" ?`)) {
            setFiltresSauvegardes(prev => prev.filter(f => f.id !== filtreId));
            addNotification(`Filtre "${filtre.nom}" supprimé`, 'success');
        }
    };

    const exporterFiltres = () => {
        const dataStr = JSON.stringify(filtresSauvegardes, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `filtres_ressources_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        addNotification('Filtres exportés avec succès', 'success');
    };

    const importerFiltres = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const filtresImportes = JSON.parse(e.target.result);
                    setFiltresSauvegardes(prev => [...prev, ...filtresImportes]);
                    addNotification(`${filtresImportes.length} filtre(s) importé(s) avec succès`, 'success');
                } catch (error) {
                    addNotification('Erreur lors de l\'importation des filtres', 'error');
                }
            };
            reader.readAsText(file);
        }
        event.target.value = '';
    };

    // Authentification pour accéder aux ressources
    const handleAuthentication = (e) => {
        e.preventDefault();

        // Vérifier le mot de passe admin
        if (motDePasseAdmin === 'MdlAdm321!$' || estCoordonnateur()) {
            setIsAuthenticated(true);
            addNotification('Accès aux ressources autorisé', 'success');
        } else {
            addNotification('Mot de passe incorrect', 'error');
            setMotDePasseAdmin('');
        }
    };

    // Réinitialiser à la fermeture
    const handleClose = () => {
        setIsAuthenticated(false);
        setMotDePasseAdmin('');
        setActiveTab('personnel');
        setSelectedResource(null);
        setViewMode('grid');
        resetFiltres();
        onClose();
    };

    // Réinitialiser la ressource sélectionnée quand on change d'onglet
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSelectedResource(null);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Modal avec header noir personnalisé */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col">
                        {/* Header noir comme le principal */}
                        <div className="flex-shrink-0 flex items-center justify-between p-6 bg-gray-900 rounded-t-xl">
                            <div className="flex items-center gap-4">
                                <Logo size="normal" showText={false} />
                                <div>
                                    <h2 className="text-xl font-bold text-white">Gestion des Ressources</h2>
                                    <p className="text-sm text-gray-300">Personnel et Équipements</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                title="Fermer"
                            >
                                <Icon name="close" size={20} />
                            </button>
                        </div>

                        {/* Contenu scrollable */}
                        <div className="flex-1 p-6 overflow-y-auto min-h-0">
                            <div className="space-y-6">
                    {/* Authentification requise */}
                    {!peutAccederRessources() && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                            <div className="mb-4">
                                <Icon name="shield" size={48} className="mx-auto text-yellow-600 mb-3" />
                                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                                    Accès Restreint
                                </h3>
                                <p className="text-yellow-700">
                                    Cette section nécessite une authentification administrative.
                                </p>
                            </div>

                            <form onSubmit={handleAuthentication} className="max-w-md mx-auto">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-yellow-800 mb-2">
                                        Mot de passe administrateur
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showAdminPassword ? "text" : "password"}
                                            value={motDePasseAdmin}
                                            onChange={(e) => setMotDePasseAdmin(e.target.value)}
                                            className="w-full px-3 py-2 pr-12 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                            placeholder="Entrez le mot de passe admin..."
                                            autoFocus
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowAdminPassword(!showAdminPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-600 hover:text-yellow-800 transition-colors"
                                            title={showAdminPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                        >
                                            <Icon name={showAdminPassword ? "eye_off" : "eye"} size={20} />
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors font-medium"
                                >
                                    <Icon name="key" size={16} className="inline mr-2" />
                                    Authentifier
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Interface ressources - visible après authentification */}
                    {peutAccederRessources() && (
                        <>
                            {/* Onglets et contrôles */}
                            <div className="border-b border-gray-200 space-y-4">
                                <nav className="-mb-px flex space-x-8">
                                    <button
                                        onClick={() => handleTabChange('personnel')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === 'personnel'
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <Icon name="users" size={16} className="inline mr-2" />
                                        Personnel ({activeTab === 'personnel' ? filtrerPersonnel().length : personnel.length})
                                    </button>
                                    <button
                                        onClick={() => handleTabChange('equipements')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === 'equipements'
                                                ? 'border-orange-500 text-orange-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <Icon name="tool" size={16} className="inline mr-2" />
                                        Équipements ({activeTab === 'equipements' ? filtrerEquipements().length : equipements.length})
                                    </button>
                                    <button
                                        onClick={() => handleTabChange('filtres')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === 'filtres'
                                                ? 'border-purple-500 text-purple-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <Icon name="filter" size={16} className="inline mr-2" />
                                        Gestion Filtres ({filtresSauvegardes.length})
                                    </button>
                                </nav>

                                {/* Filtres et contrôles de vue - seulement pour Personnel et Équipements */}
                                {(activeTab === 'personnel' || activeTab === 'equipements') && (
                                    <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                    {/* Mode de vue */}
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-700">Vue:</label>
                                        <select
                                            value={viewMode}
                                            onChange={(e) => setViewMode(e.target.value)}
                                            className="text-sm border rounded px-3 py-1 focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="grid">Grille</option>
                                            <option value="individual">Individuelle</option>
                                        </select>
                                    </div>

                                    {/* Filtre par bureau */}
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-700">Bureau:</label>
                                        <select
                                            value={filtres.bureau}
                                            onChange={(e) => updateFiltre('bureau', e.target.value)}
                                            className="text-sm border rounded px-3 py-1 focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="tous">Tous les bureaux</option>
                                            {getBureauxUniques().map(bureau => (
                                                <option key={bureau} value={bureau}>{bureau}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filtre par type (équipements seulement) */}
                                    {activeTab === 'equipements' && (
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm font-medium text-gray-700">Type:</label>
                                            <select
                                                value={filtres.type}
                                                onChange={(e) => updateFiltre('type', e.target.value)}
                                                className="text-sm border rounded px-3 py-1 focus:ring-2 focus:ring-orange-500"
                                            >
                                                <option value="tous">Tous les types</option>
                                                {getTypesEquipements().map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Filtre par disponibilité */}
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-700">Disponibilité:</label>
                                        <select
                                            value={filtres.disponibilite}
                                            onChange={(e) => updateFiltre('disponibilite', e.target.value)}
                                            className="text-sm border rounded px-3 py-1 focus:ring-2 focus:ring-green-500"
                                        >
                                            <option value="tous">Tous</option>
                                            <option value="disponible">Disponible</option>
                                            <option value="indisponible">Indisponible</option>
                                        </select>
                                    </div>

                                    {/* Recherche */}
                                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                        <label className="text-sm font-medium text-gray-700">Recherche:</label>
                                        <input
                                            type="text"
                                            value={filtres.recherche}
                                            onChange={(e) => updateFiltre('recherche', e.target.value)}
                                            placeholder="Nom, poste, type..."
                                            className="flex-1 text-sm border rounded px-3 py-1 focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>

                                    {/* Bouton reset */}
                                    <button
                                        onClick={resetFiltres}
                                        className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                        title="Réinitialiser les filtres"
                                    >
                                        <Icon name="refresh" size={16} />
                                    </button>
                                </div>
                                )}
                            </div>

                            {/* Contenu Personnel */}
                            {activeTab === 'personnel' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Gestion du Personnel
                                            {viewMode === 'individual' && selectedResource && (
                                                <span className="ml-3 text-base font-normal text-blue-600">
                                                    → {selectedResource.nom}
                                                </span>
                                            )}
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            {viewMode === 'individual' && selectedResource && (
                                                <button
                                                    onClick={() => setSelectedResource(null)}
                                                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                                >
                                                    <Icon name="arrow-left" size={16} className="mr-1" />
                                                    Retour à la liste
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setSelectedPersonnel(null);
                                                    setShowPersonnelModal(true);
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <Icon name="userPlus" size={16} />
                                                Ajouter Personnel
                                            </button>
                                        </div>
                                    </div>

                                    {viewMode === 'individual' && selectedResource ? (
                                        // Vue individuelle
                                        <div className="bg-white border rounded-lg p-6">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                                    {selectedResource.nom.charAt(0)}
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-gray-900">{selectedResource.nom}</h2>
                                                    <p className="text-lg text-gray-600">{selectedResource.poste}</p>
                                                    <p className="text-sm text-gray-500">{selectedResource.succursale}</p>
                                                </div>
                                                <div className="ml-auto">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                        selectedResource.disponible !== false
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {selectedResource.disponible !== false ? 'Disponible' : 'Indisponible'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3">Informations de contact</h3>
                                                    <div className="space-y-2">
                                                        <p><strong>Téléphone:</strong> {selectedResource.telephone || 'Non renseigné'}</p>
                                                        <p><strong>Email:</strong> {selectedResource.email || 'Non renseigné'}</p>
                                                        <p><strong>Bureau:</strong> {selectedResource.succursale}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3">Détails du poste</h3>
                                                    <div className="space-y-2">
                                                        <p><strong>Poste:</strong> {selectedResource.poste}</p>
                                                        <p><strong>Département:</strong> {selectedResource.departement || 'Non renseigné'}</p>
                                                        <p><strong>Compétences:</strong> {selectedResource.competences || 'Non renseignées'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-6 flex justify-end">
                                                <button
                                                    onClick={() => {
                                                        setSelectedPersonnel(selectedResource);
                                                        setShowPersonnelModal(true);
                                                    }}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    <Icon name="edit" size={16} className="mr-2" />
                                                    Modifier
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // Vue grille avec sélection individuelle
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                                            {filtrerPersonnel().map((person) => (
                                                <div
                                                    key={person.id}
                                                    className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                                    onClick={() => {
                                                        if (viewMode === 'individual') {
                                                            setSelectedResource(person);
                                                        } else {
                                                            setSelectedPersonnel(person);
                                                            setShowPersonnelModal(true);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                            {person.nom.charAt(0)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-gray-900">{person.nom}</h4>
                                                            <p className="text-sm text-gray-600">{person.poste}</p>
                                                        </div>
                                                        {viewMode === 'individual' && (
                                                            <Icon name="eye" size={16} className="text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500 flex justify-between">
                                                        <span>{person.succursale}</span>
                                                        <span className={`px-2 py-1 rounded text-xs ${
                                                            person.disponible !== false
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-red-100 text-red-700'
                                                        }`}>
                                                            {person.disponible !== false ? 'Disponible' : 'Indisponible'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {filtrerPersonnel().length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <Icon name="users" size={48} className="mx-auto mb-4 opacity-50" />
                                            <p>Aucun personnel trouvé avec les critères sélectionnés</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Contenu Équipements */}
                            {activeTab === 'equipements' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Gestion des Équipements
                                            {viewMode === 'individual' && selectedResource && (
                                                <span className="ml-3 text-base font-normal text-orange-600">
                                                    → {selectedResource.nom}
                                                </span>
                                            )}
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            {viewMode === 'individual' && selectedResource && (
                                                <button
                                                    onClick={() => setSelectedResource(null)}
                                                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                                >
                                                    <Icon name="arrow-left" size={16} className="mr-1" />
                                                    Retour à la liste
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setSelectedEquipement(null);
                                                    setShowEquipementModal(true);
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                            >
                                                <Icon name="plus" size={16} />
                                                Ajouter Équipement
                                            </button>
                                        </div>
                                    </div>

                                    {viewMode === 'individual' && selectedResource ? (
                                        // Vue individuelle équipement
                                        <div className="bg-white border rounded-lg p-6">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white">
                                                    <Icon name="tool" size={24} />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-gray-900">{selectedResource.nom}</h2>
                                                    <p className="text-lg text-gray-600">{selectedResource.type}</p>
                                                    <p className="text-sm text-gray-500">{selectedResource.succursale}</p>
                                                </div>
                                                <div className="ml-auto">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                        selectedResource.disponible !== false
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {selectedResource.disponible !== false ? 'Disponible' : 'Indisponible'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3">Informations techniques</h3>
                                                    <div className="space-y-2">
                                                        <p><strong>Type:</strong> {selectedResource.type}</p>
                                                        <p><strong>Modèle:</strong> {selectedResource.modele || 'Non renseigné'}</p>
                                                        <p><strong>Numéro de série:</strong> {selectedResource.numeroSerie || 'Non renseigné'}</p>
                                                        <p><strong>Bureau:</strong> {selectedResource.succursale}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3">État et maintenance</h3>
                                                    <div className="space-y-2">
                                                        <p><strong>État:</strong> {selectedResource.etat || 'Bon'}</p>
                                                        <p><strong>Dernière maintenance:</strong> {selectedResource.derniereMaintenance || 'Non renseignée'}</p>
                                                        <p><strong>Prochaine maintenance:</strong> {selectedResource.prochaineMaintenance || 'Non planifiée'}</p>
                                                        <p><strong>Notes:</strong> {selectedResource.notes || 'Aucune note'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-6 flex justify-end">
                                                <button
                                                    onClick={() => {
                                                        setSelectedEquipement(selectedResource);
                                                        setShowEquipementModal(true);
                                                    }}
                                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                                >
                                                    <Icon name="edit" size={16} className="mr-2" />
                                                    Modifier
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // Vue grille avec sélection individuelle
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                                            {filtrerEquipements().map((equipement) => (
                                                <div
                                                    key={equipement.id}
                                                    className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                                    onClick={() => {
                                                        if (viewMode === 'individual') {
                                                            setSelectedResource(equipement);
                                                        } else {
                                                            setSelectedEquipement(equipement);
                                                            setShowEquipementModal(true);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white">
                                                            <Icon name="tool" size={16} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-gray-900">{equipement.nom}</h4>
                                                            <p className="text-sm text-gray-600">{equipement.type}</p>
                                                        </div>
                                                        {viewMode === 'individual' && (
                                                            <Icon name="eye" size={16} className="text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500 flex justify-between">
                                                        <span>{equipement.succursale}</span>
                                                        <span className={`px-2 py-1 rounded text-xs ${
                                                            equipement.disponible !== false
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-red-100 text-red-700'
                                                        }`}>
                                                            {equipement.disponible !== false ? 'Disponible' : 'Indisponible'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {filtrerEquipements().length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <Icon name="tool" size={48} className="mx-auto mb-4 opacity-50" />
                                            <p>Aucun équipement trouvé avec les critères sélectionnés</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Contenu Gestion des Filtres */}
                            {activeTab === 'filtres' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Gestion des Filtres
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="file"
                                                accept=".json"
                                                onChange={importerFiltres}
                                                className="hidden"
                                                id="import-filtres"
                                            />
                                            <label
                                                htmlFor="import-filtres"
                                                className="cursor-pointer px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                            >
                                                <Icon name="upload" size={16} className="mr-1" />
                                                Importer
                                            </label>
                                            <button
                                                onClick={exporterFiltres}
                                                disabled={filtresSauvegardes.length === 0}
                                                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                            >
                                                <Icon name="download" size={16} className="mr-1" />
                                                Exporter
                                            </button>
                                            <button
                                                onClick={() => setShowNewFilterForm(!showNewFilterForm)}
                                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                            >
                                                <Icon name="plus" size={16} className="mr-1" />
                                                Nouveau Filtre
                                            </button>
                                        </div>
                                    </div>

                                    {/* Formulaire nouveau filtre */}
                                    {showNewFilterForm && (
                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-purple-800 mb-3">Créer un nouveau filtre</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Nom du filtre *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={nouveauFiltre.nom}
                                                        onChange={(e) => setNouveauFiltre(prev => ({ ...prev, nom: e.target.value }))}
                                                        placeholder="Ex: Personnel Bureau Paris"
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Description
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={nouveauFiltre.description}
                                                        onChange={(e) => setNouveauFiltre(prev => ({ ...prev, description: e.target.value }))}
                                                        placeholder="Description optionnelle"
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-white p-3 rounded border mb-4">
                                                <p className="text-sm text-gray-600 mb-2">Critères actuels qui seront sauvegardés :</p>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                        Onglet: {activeTab === 'personnel' ? 'Personnel' : 'Équipements'}
                                                    </span>
                                                    {filtres.bureau !== 'tous' && (
                                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                                            Bureau: {filtres.bureau}
                                                        </span>
                                                    )}
                                                    {filtres.type !== 'tous' && (
                                                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                                                            Type: {filtres.type}
                                                        </span>
                                                    )}
                                                    {filtres.disponibilite !== 'tous' && (
                                                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                                            Disponibilité: {filtres.disponibilite}
                                                        </span>
                                                    )}
                                                    {filtres.recherche && (
                                                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                                                            Recherche: "{filtres.recherche}"
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <button
                                                    onClick={sauvegarderFiltre}
                                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                                >
                                                    <Icon name="save" size={16} className="mr-1" />
                                                    Sauvegarder
                                                </button>
                                                <button
                                                    onClick={() => setShowNewFilterForm(false)}
                                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                                >
                                                    Annuler
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Liste des filtres sauvegardés */}
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-3">Filtres sauvegardés ({filtresSauvegardes.length})</h4>

                                        {filtresSauvegardes.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                <Icon name="filter" size={48} className="mx-auto mb-4 opacity-50" />
                                                <p className="mb-2">Aucun filtre sauvegardé</p>
                                                <p className="text-sm">Configurez vos filtres et cliquez sur "Nouveau Filtre" pour les sauvegarder</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {filtresSauvegardes.map((filtre) => (
                                                    <div key={filtre.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div>
                                                                <h5 className="font-medium text-gray-900">{filtre.nom}</h5>
                                                                {filtre.description && (
                                                                    <p className="text-sm text-gray-600 mt-1">{filtre.description}</p>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => supprimerFiltre(filtre.id)}
                                                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                                title="Supprimer"
                                                            >
                                                                <Icon name="trash" size={16} />
                                                            </button>
                                                        </div>

                                                        <div className="space-y-2 mb-4">
                                                            <div className="flex flex-wrap gap-1">
                                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                                    {filtre.onglet === 'personnel' ? 'Personnel' : 'Équipements'}
                                                                </span>
                                                                {filtre.criteres.bureau !== 'tous' && (
                                                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                                                        {filtre.criteres.bureau}
                                                                    </span>
                                                                )}
                                                                {filtre.criteres.type !== 'tous' && (
                                                                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                                                                        {filtre.criteres.type}
                                                                    </span>
                                                                )}
                                                                {filtre.criteres.disponibilite !== 'tous' && (
                                                                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                                                        {filtre.criteres.disponibilite}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500">Créé le {filtre.dateCreation}</p>
                                                        </div>

                                                        <button
                                                            onClick={() => appliquerFiltre(filtre)}
                                                            className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                                        >
                                                            <Icon name="play" size={16} className="mr-1" />
                                                            Appliquer
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Personnel */}
            {showPersonnelModal && (
                <PersonnelModal
                    isOpen={showPersonnelModal}
                    onClose={() => {
                        setShowPersonnelModal(false);
                        setSelectedPersonnel(null);
                    }}
                    onSave={onSavePersonnel}
                    onDelete={onDeletePersonnel}
                    personnel={selectedPersonnel}
                    addNotification={addNotification}
                    utilisateurConnecte={utilisateurConnecte}
                    estCoordonnateur={estCoordonnateur}
                />
            )}

            {/* Modal Équipement */}
            {showEquipementModal && (
                <EquipementModal
                    isOpen={showEquipementModal}
                    onClose={() => {
                        setShowEquipementModal(false);
                        setSelectedEquipement(null);
                    }}
                    onSave={onSaveEquipement}
                    onDelete={onDeleteEquipement}
                    equipement={selectedEquipement}
                    addNotification={addNotification}
                    utilisateurConnecte={utilisateurConnecte}
                    peutModifier={peutModifier}
                />
            )}
        </>
    );
}