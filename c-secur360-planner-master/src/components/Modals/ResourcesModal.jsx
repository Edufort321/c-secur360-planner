// ============== MODAL RESSOURCES AVEC AUTHENTIFICATION ==============
// Modal pour gérer Personnel et Équipements avec contrôle d'accès

import React, { useState } from 'react';
import { Modal } from '../UI/Modal';
import { Icon } from '../UI/Icon';
import { Logo } from '../UI/Logo';
import { EquipementModal } from './EquipementModal';
import { PosteModal } from './PosteModal';
import { SuccursaleModal } from '../../modules/Resource/SuccursaleModal';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export function ResourcesModal({
    isOpen,
    onClose,
    personnel = [],
    equipements = [],
    postes = [],
    succursales = [],
    onSavePersonnel,
    onDeletePersonnel,
    onSaveEquipement,
    onDeleteEquipement,
    onSavePoste,
    onDeletePoste,
    onSaveSuccursale,
    onDeleteSuccursale,
    utilisateurConnecte,
    estCoordonnateur,
    peutModifier,
    addNotification
}) {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('succursales'); // Changé de 'personnel' à 'succursales'
    const [showEquipementModal, setShowEquipementModal] = useState(false);
    const [selectedEquipement, setSelectedEquipement] = useState(null);

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

    // Les données sont maintenant passées en props depuis App.jsx

    const [showSuccursaleModal, setShowSuccursaleModal] = useState(false);
    const [selectedSuccursale, setSelectedSuccursale] = useState(null);
    const [showPosteModal, setShowPosteModal] = useState(false);
    const [selectedPoste, setSelectedPoste] = useState(null);

    // Vérifier si l'utilisateur peut accéder aux ressources (basé sur permissions)
    const peutAccederRessources = () => {
        if (!utilisateurConnecte) return false;

        // Accès basé sur niveau_acces ou permissions
        const niveauAcces = utilisateurConnecte.niveau_acces;
        const permissions = utilisateurConnecte.permissions || {};

        // Administrateurs et coordinateurs ont accès
        if (niveauAcces === 'administration' || niveauAcces === 'coordination') return true;
        if (permissions.estCoordonnateur || permissions.peutModifier) return true;

        return false;
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

    // Obtenir la couleur d'une succursale
    const getSuccursaleColor = (nomSuccursale) => {
        const succursaleObj = succursales.find(s => s.nom === nomSuccursale);
        return succursaleObj?.couleur || '#6B7280'; // Couleur grise par défaut
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
            addNotification(t('admin.filter.nameRequired'), 'error');
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
        addNotification(t('admin.filter.savedSuccess', `Filtre "${nouveauFiltre.nom}" sauvegardé avec succès`), 'success');
    };

    const appliquerFiltre = (filtreSauvegarde) => {
        setFiltres(filtreSauvegarde.criteres);
        setActiveTab(filtreSauvegarde.onglet);
        addNotification(t('admin.filter.applied', `Filtre "${filtreSauvegarde.nom}" appliqué`), 'success');
    };

    const supprimerFiltre = (filtreId) => {
        const filtre = filtresSauvegardes.find(f => f.id === filtreId);
        if (window.confirm(t('admin.filter.confirmDelete', `Êtes-vous sûr de vouloir supprimer le filtre "${filtre.nom}" ?`))) {
            setFiltresSauvegardes(prev => prev.filter(f => f.id !== filtreId));
            addNotification(t('admin.filter.deleteSuccess', `Filtre "${filtre.nom}" supprimé`), 'success');
        }
    };

    // Les fonctions de gestion sont maintenant centralisées dans useAppData

    const supprimerPoste = (posteId) => {
        const poste = postes.find(p => p.id === posteId);
        if (poste && window.confirm(t('admin.position.confirmDelete', `Êtes-vous sûr de vouloir supprimer le poste "${poste.nom}" ?`))) {
            onDeletePoste(posteId);
            addNotification(t('admin.position.deleteSuccess', `Poste "${poste.nom}" supprimé avec succès`), 'success');
        }
    };

    const supprimerSuccursale = (succursaleId) => {
        const succursale = succursales.find(s => s.id === succursaleId);
        if (!succursale) return;

        // Vérifier si des ressources utilisent cette succursale
        const personnelUtilisant = personnel.filter(p => p.succursale === succursale.nom);
        const equipementsUtilisant = equipements.filter(e => e.succursale === succursale.nom);

        if (personnelUtilisant.length > 0 || equipementsUtilisant.length > 0) {
            addNotification(
                t('admin.branch.deleteError', `Impossible de supprimer "${succursale.nom}". ${personnelUtilisant.length} personne(s) et ${equipementsUtilisant.length} équipement(s) l'utilisent.`),
                'error'
            );
            return;
        }

        if (window.confirm(t('admin.branch.confirmDelete', `Êtes-vous sûr de vouloir supprimer la succursale "${succursale.nom}" ?`))) {
            if (onDeleteSuccursale) {
                onDeleteSuccursale(succursaleId);
                addNotification(t('admin.branch.deleteSuccess', `Succursale "${succursale.nom}" supprimée avec succès`), 'success');
            }
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
        addNotification(t('admin.filter.exportSuccess'), 'success');
    };

    const importerFiltres = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const filtresImportes = JSON.parse(e.target.result);
                    setFiltresSauvegardes(prev => [...prev, ...filtresImportes]);
                    addNotification(t('admin.filter.importSuccess', `${filtresImportes.length} filtre(s) importé(s) avec succès`), 'success');
                } catch (error) {
                    addNotification(t('admin.filter.importError'), 'error');
                }
            };
            reader.readAsText(file);
        }
        event.target.value = '';
    };

    // Réinitialiser à la fermeture
    const handleClose = () => {
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
                                    <h2 className="text-xl font-bold text-white">{t('admin.resource.title')}</h2>
                                    <p className="text-sm text-gray-300">{t('admin.resource.subtitle')}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                title={t('action.close')}
                            >
                                <Icon name="close" size={20} />
                            </button>
                        </div>

                        {/* Contenu scrollable */}
                        <div className="flex-1 p-6 overflow-y-auto min-h-0">
                            <div className="space-y-6">
                    {/* Message d'accès refusé si permissions insuffisantes */}
                    {!peutAccederRessources() && (
                        <div className="bg-slate-100 border border-slate-300 rounded-lg p-6 text-center">
                            <div className="mb-4">
                                <Icon name="shield" size={48} className="mx-auto text-slate-700 mb-3" />
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                    Accès non autorisé
                                </h3>
                                <p className="text-slate-800">
                                    Vous n'avez pas les permissions nécessaires pour accéder à la gestion des ressources.
                                </p>
                                <p className="text-sm text-slate-700 mt-2">
                                    Contactez un administrateur pour obtenir les droits d'accès.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Interface ressources - visible selon permissions */}
                    {peutAccederRessources() && (
                        <>
                            {/* Onglets et contrôles */}
                            <div className="border-b border-gray-200 space-y-4">
                                <nav className="-mb-px flex space-x-8">
                                    <button
                                        onClick={() => handleTabChange('succursales')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === 'succursales'
                                                ? 'border-blue-600 text-blue-700'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <Icon name="building" size={16} className="inline mr-2" />
                                        Succursales/Départements ({succursales.length})
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
                                        {t('resource.equipment')} ({activeTab === 'equipements' ? filtrerEquipements().length : equipements.length})
                                    </button>
                                    <button
                                        onClick={() => handleTabChange('postes')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === 'postes'
                                                ? 'border-indigo-500 text-indigo-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <Icon name="briefcase" size={16} className="inline mr-2" />
                                        {t('admin.position.title')} ({postes.length})
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
                                        {t('admin.filter.management')} ({filtresSauvegardes.length})
                                    </button>
                                </nav>

                                {/* Filtres et contrôles de vue - seulement pour Équipements */}
                                {activeTab === 'equipements' && (
                                    <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                    {/* Mode de vue */}
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-700">{t('filter.view')}:</label>
                                        <select
                                            value={viewMode}
                                            onChange={(e) => setViewMode(e.target.value)}
                                            className="text-sm border rounded px-3 py-1 focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="grid">{t('admin.view.grid')}</option>
                                            <option value="individual">{t('admin.view.individual')}</option>
                                        </select>
                                    </div>

                                    {/* Filtre par bureau */}
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-700">{t('filter.office')}:</label>
                                        <select
                                            value={filtres.bureau}
                                            onChange={(e) => updateFiltre('bureau', e.target.value)}
                                            className="text-sm border rounded px-3 py-1 focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="tous">{t('resource.allOffices')}</option>
                                            {getBureauxUniques().map(bureau => (
                                                <option key={bureau} value={bureau}>{bureau}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filtre par type (équipements seulement) */}
                                    {activeTab === 'equipements' && (
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm font-medium text-gray-700">{t('filter.type')}:</label>
                                            <select
                                                value={filtres.type}
                                                onChange={(e) => updateFiltre('type', e.target.value)}
                                                className="text-sm border rounded px-3 py-1 focus:ring-2 focus:ring-orange-500"
                                            >
                                                <option value="tous">{t('admin.filter.allTypes')}</option>
                                                {getTypesEquipements().map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Filtre par disponibilité */}
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-700">{t('admin.filter.availability')}:</label>
                                        <select
                                            value={filtres.disponibilite}
                                            onChange={(e) => updateFiltre('disponibilite', e.target.value)}
                                            className="text-sm border rounded px-3 py-1 focus:ring-2 focus:ring-green-500"
                                        >
                                            <option value="tous">{t('admin.filter.all')}</option>
                                            <option value="disponible">{t('status.available')}</option>
                                            <option value="indisponible">{t('status.unavailable')}</option>
                                        </select>
                                    </div>

                                    {/* Recherche */}
                                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                        <label className="text-sm font-medium text-gray-700">{t('form.search')}:</label>
                                        <input
                                            type="text"
                                            value={filtres.recherche}
                                            onChange={(e) => updateFiltre('recherche', e.target.value)}
                                            placeholder={t('admin.filter.searchPlaceholder')}
                                            className="flex-1 text-sm border rounded px-3 py-1 focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>

                                    {/* Bouton reset */}
                                    <button
                                        onClick={resetFiltres}
                                        className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                        title={t('admin.filter.reset')}
                                    >
                                        <Icon name="refresh" size={16} />
                                    </button>
                                </div>
                                )}
                            </div>

                            {/* Contenu Équipements */}
                            {activeTab === 'equipements' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {t('admin.equipment.management')}
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
                                                    {t('admin.view.backToList')}
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
                                                {t('admin.equipment.add')}
                                            </button>
                                        </div>
                                    </div>

                                    {viewMode === 'individual' && selectedResource ? (
                                        // Vue individuelle équipement
                                        <div className="bg-white border rounded-lg p-6">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div
                                                    className="w-16 h-16 rounded-full flex items-center justify-center text-white"
                                                    style={{ backgroundColor: getSuccursaleColor(selectedResource.succursale) }}
                                                >
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
                                                            ? 'bg-blue-100 text-blue-900'
                                                            : 'bg-slate-200 text-slate-900'
                                                    }`}>
                                                        {selectedResource.disponible !== false ? t('status.available') : t('status.unavailable')}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3">{t('admin.equipment.technicalInfo')}</h3>
                                                    <div className="space-y-2">
                                                        <p><strong>{t('filter.type')}:</strong> {selectedResource.type}</p>
                                                        <p><strong>{t('admin.equipment.model')}:</strong> {selectedResource.modele || t('admin.notSpecified')}</p>
                                                        <p><strong>{t('admin.equipment.serialNumber')}:</strong> {selectedResource.numeroSerie || t('admin.notSpecified')}</p>
                                                        <p><strong>{t('filter.office')}:</strong> {selectedResource.succursale}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3">{t('admin.equipment.statusMaintenance')}</h3>
                                                    <div className="space-y-2">
                                                        <p><strong>{t('admin.equipment.condition')}:</strong> {selectedResource.etat || t('admin.equipment.good')}</p>
                                                        <p><strong>{t('admin.equipment.lastMaintenance')}:</strong> {selectedResource.derniereMaintenance || t('admin.equipment.notSpecified')}</p>
                                                        <p><strong>{t('admin.equipment.nextMaintenance')}:</strong> {selectedResource.prochaineMaintenance || t('admin.equipment.notPlanned')}</p>
                                                        <p><strong>{t('admin.equipment.notes')}:</strong> {selectedResource.notes || t('admin.equipment.noNotes')}</p>
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
                                                    {t('action.edit')}
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
                                                        <div
                                                            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                                                            style={{ backgroundColor: getSuccursaleColor(equipement.succursale) }}
                                                        >
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
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-slate-200 text-slate-800'
                                                        }`}>
                                                            {equipement.disponible !== false ? t('status.available') : t('status.unavailable')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {filtrerEquipements().length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <Icon name="tool" size={48} className="mx-auto mb-4 opacity-50" />
                                            <p>{t('admin.equipment.noResults')}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Contenu Gestion des Filtres */}
                            {activeTab === 'filtres' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {t('admin.filter.management')}
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
                                                {t('admin.filter.import')}
                                            </label>
                                            <button
                                                onClick={exporterFiltres}
                                                disabled={filtresSauvegardes.length === 0}
                                                className="px-3 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                            >
                                                <Icon name="download" size={16} className="mr-1" />
                                                {t('admin.filter.export')}
                                            </button>
                                            <button
                                                onClick={() => setShowNewFilterForm(!showNewFilterForm)}
                                                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
                                            >
                                                <Icon name="plus" size={16} className="mr-1" />
                                                {t('admin.filter.newFilter')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Formulaire nouveau filtre */}
                                    {showNewFilterForm && (
                                        <div className="bg-slate-50 border border-slate-300 rounded-lg p-4">
                                            <h4 className="font-semibold text-slate-800 mb-3">{t('admin.filter.createNew')}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        {t('admin.filter.name')} *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={nouveauFiltre.nom}
                                                        onChange={(e) => setNouveauFiltre(prev => ({ ...prev, nom: e.target.value }))}
                                                        placeholder={t('admin.filter.namePlaceholder')}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        {t('admin.filter.description')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={nouveauFiltre.description}
                                                        onChange={(e) => setNouveauFiltre(prev => ({ ...prev, description: e.target.value }))}
                                                        placeholder={t('admin.filter.descriptionPlaceholder')}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-white p-3 rounded border mb-4">
                                                <p className="text-sm text-gray-600 mb-2">{t('admin.filter.currentCriteria')}:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                        {t('admin.filter.tab')}: {activeTab === 'personnel' ? t('resource.personnel') : t('resource.equipment')}
                                                    </span>
                                                    {filtres.bureau !== 'tous' && (
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-900 rounded text-xs">
                                                            {t('filter.office')}: {filtres.bureau}
                                                        </span>
                                                    )}
                                                    {filtres.type !== 'tous' && (
                                                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                                                            {t('filter.type')}: {filtres.type}
                                                        </span>
                                                    )}
                                                    {filtres.disponibilite !== 'tous' && (
                                                        <span className="px-2 py-1 bg-slate-200 text-slate-900 rounded text-xs">
                                                            {t('admin.filter.availability')}: {filtres.disponibilite}
                                                        </span>
                                                    )}
                                                    {filtres.recherche && (
                                                        <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded text-xs">
                                                            {t('form.search')}: "{filtres.recherche}"
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <button
                                                    onClick={sauvegarderFiltre}
                                                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
                                                >
                                                    <Icon name="save" size={16} className="mr-1" />
                                                    {t('action.save')}
                                                </button>
                                                <button
                                                    onClick={() => setShowNewFilterForm(false)}
                                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                                >
                                                    {t('action.cancel')}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Liste des filtres sauvegardés */}
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-3">{t('admin.filter.savedFilters')} ({filtresSauvegardes.length})</h4>

                                        {filtresSauvegardes.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                <Icon name="filter" size={48} className="mx-auto mb-4 opacity-50" />
                                                <p className="mb-2">{t('admin.filter.noSavedFilters')}</p>
                                                <p className="text-sm">{t('admin.filter.configureHint')}</p>
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
                                                                className="p-1 text-slate-700 hover:bg-slate-200 rounded"
                                                                title={t('action.delete')}
                                                            >
                                                                <Icon name="trash" size={16} />
                                                            </button>
                                                        </div>

                                                        <div className="space-y-2 mb-4">
                                                            <div className="flex flex-wrap gap-1">
                                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                                    {filtre.onglet === 'personnel' ? t('resource.personnel') : t('resource.equipment')}
                                                                </span>
                                                                {filtre.criteres.bureau !== 'tous' && (
                                                                    <span className="px-2 py-1 bg-blue-100 text-blue-900 rounded text-xs">
                                                                        {filtre.criteres.bureau}
                                                                    </span>
                                                                )}
                                                                {filtre.criteres.type !== 'tous' && (
                                                                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                                                                        {filtre.criteres.type}
                                                                    </span>
                                                                )}
                                                                {filtre.criteres.disponibilite !== 'tous' && (
                                                                    <span className="px-2 py-1 bg-slate-200 text-slate-900 rounded text-xs">
                                                                        {filtre.criteres.disponibilite}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500">{t('admin.filter.createdOn')} {filtre.dateCreation}</p>
                                                        </div>

                                                        <button
                                                            onClick={() => appliquerFiltre(filtre)}
                                                            className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
                                                        >
                                                            <Icon name="play" size={16} className="mr-1" />
                                                            {t('admin.filter.apply')}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Contenu Postes */}
                            {activeTab === 'postes' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {t('admin.position.management')}
                                        </h3>
                                        <button
                                            onClick={() => {
                                                setSelectedPoste(null);
                                                setShowPosteModal(true);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                        >
                                            <Icon name="plus" size={16} />
                                            {t('admin.position.add')}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {postes.map((poste) => (
                                            <div
                                                key={poste.id}
                                                className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white">
                                                            <Icon name="briefcase" size={20} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">{poste.nom}</h4>
                                                            <p className="text-sm text-gray-600">{poste.departement}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedPoste(poste);
                                                                setShowPosteModal(true);
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 rounded transition-colors"
                                                            title={t('action.edit')}
                                                        >
                                                            <Icon name="edit" size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => supprimerPoste(poste.id)}
                                                            className="p-2 text-gray-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                                                            title="Supprimer"
                                                        >
                                                            <Icon name="trash" size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <Icon name="dollar" size={14} />
                                                        <span>{t('admin.position.salary')}: {poste.salaireMin}$ - {poste.salaireMax}$</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Icon name="users" size={14} />
                                                        <span>{t('resource.personnel')}: {personnel.filter(p => p.poste === poste.nom).length}</span>
                                                    </div>
                                                </div>

                                                {poste.description && (
                                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                                        <p className="text-sm text-gray-600">{poste.description}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {postes.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <Icon name="briefcase" size={48} className="mx-auto mb-4 opacity-50" />
                                            <p>{t('admin.position.noPositions')}</p>
                                            <p className="text-sm mt-2">{t('admin.position.createHint')}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Contenu Succursales */}
                            {activeTab === 'succursales' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {t('admin.branch.management')}
                                        </h3>
                                        <button
                                            onClick={() => {
                                                setSelectedSuccursale(null);
                                                setShowSuccursaleModal(true);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors"
                                        >
                                            <Icon name="plus" size={16} />
                                            {t('admin.branch.add')}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {succursales.map((succursale) => (
                                            <div
                                                key={succursale.id}
                                                className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                                            <Icon name="building" size={20} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">{succursale.nom}</h4>
                                                            <span className={`px-2 py-1 rounded text-xs ${
                                                                succursale.actif
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-slate-200 text-slate-800'
                                                            }`}>
                                                                {succursale.actif ? t('admin.branch.active') : t('admin.branch.inactive')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedSuccursale(succursale);
                                                                setShowSuccursaleModal(true);
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-blue-700 hover:bg-blue-200 rounded transition-colors"
                                                            title={t('action.edit')}
                                                        >
                                                            <Icon name="edit" size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => supprimerSuccursale(succursale.id)}
                                                            className="p-2 text-gray-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                                                            title="Supprimer"
                                                        >
                                                            <Icon name="trash" size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <Icon name="location" size={14} />
                                                        <span className="text-xs">{succursale.adresse}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Icon name="phone" size={14} />
                                                        <span>{succursale.telephone}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Icon name="user" size={14} />
                                                        <span>{succursale.responsable}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-4 border-t border-gray-100">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">{t('resource.personnel')}:</span>
                                                        <span className="font-medium">
                                                            {personnel.filter(p => p.succursale === succursale.nom).length}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">{t('resource.equipment')}:</span>
                                                        <span className="font-medium">
                                                            {equipements.filter(e => e.succursale === succursale.nom).length}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {succursales.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <Icon name="building" size={48} className="mx-auto mb-4 opacity-50" />
                                            <p>{t('admin.branch.noBranches')}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                            </div>
                        </div>
                    </div>
                </div>
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
                    succursalesDisponibles={succursales}
                />
            )}

            {/* Modal Poste */}
            {showPosteModal && (
                <PosteModal
                    isOpen={showPosteModal}
                    onClose={() => {
                        setShowPosteModal(false);
                        setSelectedPoste(null);
                    }}
                    onSave={(posteData) => {
                        onSavePoste(posteData);
                        addNotification(t('admin.position.saveSuccess', `Poste "${posteData.nom}" ${selectedPoste ? 'modifié' : 'ajouté'} avec succès`), 'success');
                    }}
                    poste={selectedPoste}
                    addNotification={addNotification}
                />
            )}

            {/* Modal Succursale */}
            {showSuccursaleModal && (
                <SuccursaleModal
                    isOpen={showSuccursaleModal}
                    onClose={() => {
                        setShowSuccursaleModal(false);
                        setSelectedSuccursale(null);
                    }}
                    onSave={(succursaleData) => {
                        onSaveSuccursale(succursaleData);
                        addNotification(t('admin.branch.saveSuccess', `Succursale "${succursaleData.nom}" ${selectedSuccursale ? 'modifiée' : 'ajoutée'} avec succès`), 'success');
                    }}
                    onDelete={null}
                    succursale={selectedSuccursale}
                    succursales={succursales}
                    personnel={personnel}
                    onSavePersonnel={onSavePersonnel}
                    onDeletePersonnel={onDeletePersonnel}
                    postes={postes}
                    departements={[]}
                    addNotification={addNotification}
                />
            )}
        </>
    );
}