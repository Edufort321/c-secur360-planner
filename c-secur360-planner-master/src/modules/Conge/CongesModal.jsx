import { useState, useEffect } from 'react';
import { Icon } from '../../components/UI/Icon';

export function CongesModal({ isOpen, onClose, personnel, conges, onSaveConge, onDeleteConge }) {
    const [activeTab, setActiveTab] = useState('demandes');
    const [selectedPerson, setSelectedPerson] = useState('');
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [typeConge, setTypeConge] = useState('vacances');
    const [motif, setMotif] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const typesConge = [
        { value: 'vacances', label: '🏖️ Vacances', couleur: '#3B82F6' },
        { value: 'maladie', label: '🤒 Maladie', couleur: '#EF4444' },
        { value: 'personnel', label: '👨‍👩‍👧‍👦 Personnel', couleur: '#8B5CF6' },
        { value: 'formation', label: '📚 Formation', couleur: '#10B981' },
        { value: 'maternite', label: '👶 Maternité/Paternité', couleur: '#F59E0B' },
        { value: 'autre', label: '📝 Autre', couleur: '#6B7280' }
    ];

    const resetForm = () => {
        setSelectedPerson('');
        setDateDebut('');
        setDateFin('');
        setTypeConge('vacances');
        setMotif('');
    };

    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedPerson || !dateDebut || !dateFin) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }

        if (new Date(dateDebut) > new Date(dateFin)) {
            alert('La date de début ne peut pas être postérieure à la date de fin');
            return;
        }

        setIsSubmitting(true);

        try {
            const nouveauConge = {
                id: Date.now(),
                personnelId: selectedPerson,
                dateDebut: new Date(dateDebut),
                dateFin: new Date(dateFin),
                type: typeConge,
                motif: motif.trim(),
                statut: 'en_attente',
                dateCreation: new Date(),
                personnelNom: personnel.find(p => p.id === selectedPerson)?.nom || 'Inconnu'
            };

            await onSaveConge(nouveauConge);
            resetForm();
            setActiveTab('demandes');
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Erreur lors de la sauvegarde du congé');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteConge = async (congeId) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette demande de congé ?')) {
            try {
                await onDeleteConge(congeId);
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                alert('Erreur lors de la suppression du congé');
            }
        }
    };

    const handleApprouverConge = async (congeId, statut) => {
        try {
            const conge = conges.find(c => c.id === congeId);
            if (conge) {
                const congeModifie = {
                    ...conge,
                    statut,
                    dateApprobation: new Date()
                };
                await onSaveConge(congeModifie);
            }
        } catch (error) {
            console.error('Erreur lors de l\'approbation:', error);
            alert('Erreur lors de l\'approbation du congé');
        }
    };

    const getStatutColor = (statut) => {
        switch (statut) {
            case 'approuve': return 'text-green-700 bg-green-100';
            case 'refuse': return 'text-red-700 bg-red-100';
            case 'en_attente': return 'text-yellow-700 bg-yellow-100';
            default: return 'text-gray-700 bg-gray-100';
        }
    };

    const getStatutLabel = (statut) => {
        switch (statut) {
            case 'approuve': return 'Approuvé';
            case 'refuse': return 'Refusé';
            case 'en_attente': return 'En attente';
            default: return 'Inconnu';
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const calculateDuration = (debut, fin) => {
        const diffTime = new Date(fin) - new Date(debut);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    const congesEnAttente = conges.filter(c => c.statut === 'en_attente');
    const congesApprouves = conges.filter(c => c.statut === 'approuve');
    const congesRefuses = conges.filter(c => c.statut === 'refuse');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <Icon name="calendar" className="mr-2" size={24} />
                        Gestion des Congés
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
                    >
                        <Icon name="close" size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b bg-gray-50">
                    <button
                        onClick={() => setActiveTab('demandes')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'demandes'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        📋 Demandes ({congesEnAttente.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('nouvelle')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'nouvelle'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        ➕ Nouvelle Demande
                    </button>
                    <button
                        onClick={() => setActiveTab('historique')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'historique'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        📈 Historique ({congesApprouves.length + congesRefuses.length})
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Tab Demandes */}
                    {activeTab === 'demandes' && (
                        <div className="space-y-4">
                            {congesEnAttente.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Icon name="calendar" size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>Aucune demande de congé en attente</p>
                                </div>
                            ) : (
                                congesEnAttente.map(conge => (
                                    <div key={conge.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h3 className="font-medium text-lg">{conge.personnelNom}</h3>
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatutColor(conge.statut)}`}>
                                                        {getStatutLabel(conge.statut)}
                                                    </span>
                                                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                        {typesConge.find(t => t.value === conge.type)?.label || conge.type}
                                                    </span>
                                                </div>

                                                <div className="text-sm text-gray-600 space-y-1">
                                                    <p><strong>Période:</strong> {formatDate(conge.dateDebut)} - {formatDate(conge.dateFin)} ({calculateDuration(conge.dateDebut, conge.dateFin)} jour{calculateDuration(conge.dateDebut, conge.dateFin) > 1 ? 's' : ''})</p>
                                                    {conge.motif && <p><strong>Motif:</strong> {conge.motif}</p>}
                                                    <p><strong>Demandé le:</strong> {formatDate(conge.dateCreation)}</p>
                                                </div>
                                            </div>

                                            <div className="flex space-x-2 ml-4">
                                                <button
                                                    onClick={() => handleApprouverConge(conge.id, 'approuve')}
                                                    className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                                    title="Approuver"
                                                >
                                                    ✓
                                                </button>
                                                <button
                                                    onClick={() => handleApprouverConge(conge.id, 'refuse')}
                                                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                                    title="Refuser"
                                                >
                                                    ✗
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteConge(conge.id)}
                                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                                    title="Supprimer"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Tab Nouvelle Demande */}
                    {activeTab === 'nouvelle' && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Personnel *
                                    </label>
                                    <select
                                        value={selectedPerson}
                                        onChange={(e) => setSelectedPerson(e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Sélectionner une personne...</option>
                                        {personnel.map(person => (
                                            <option key={person.id} value={person.id}>
                                                {person.nom} - {person.poste}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Type de congé *
                                    </label>
                                    <select
                                        value={typeConge}
                                        onChange={(e) => setTypeConge(e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        {typesConge.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date de début *
                                    </label>
                                    <input
                                        type="date"
                                        value={dateDebut}
                                        onChange={(e) => setDateDebut(e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date de fin *
                                    </label>
                                    <input
                                        type="date"
                                        value={dateFin}
                                        onChange={(e) => setDateFin(e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Motif (optionnel)
                                </label>
                                <textarea
                                    value={motif}
                                    onChange={(e) => setMotif(e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                                    placeholder="Ajoutez des détails sur la demande de congé..."
                                />
                            </div>

                            {/* Durée calculée */}
                            {dateDebut && dateFin && (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        <strong>Durée:</strong> {calculateDuration(dateDebut, dateFin)} jour{calculateDuration(dateDebut, dateFin) > 1 ? 's' : ''}
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('demandes')}
                                    className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? '⏳ Sauvegarde...' : '💾 Créer la demande'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Tab Historique */}
                    {activeTab === 'historique' && (
                        <div className="space-y-4">
                            {[...congesApprouves, ...congesRefuses].length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Icon name="history" size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>Aucun congé dans l'historique</p>
                                </div>
                            ) : (
                                [...congesApprouves, ...congesRefuses]
                                    .sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation))
                                    .map(conge => (
                                        <div key={conge.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <h3 className="font-medium text-lg">{conge.personnelNom}</h3>
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatutColor(conge.statut)}`}>
                                                            {getStatutLabel(conge.statut)}
                                                        </span>
                                                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                            {typesConge.find(t => t.value === conge.type)?.label || conge.type}
                                                        </span>
                                                    </div>

                                                    <div className="text-sm text-gray-600 space-y-1">
                                                        <p><strong>Période:</strong> {formatDate(conge.dateDebut)} - {formatDate(conge.dateFin)} ({calculateDuration(conge.dateDebut, conge.dateFin)} jour{calculateDuration(conge.dateDebut, conge.dateFin) > 1 ? 's' : ''})</p>
                                                        {conge.motif && <p><strong>Motif:</strong> {conge.motif}</p>}
                                                        <p><strong>Demandé le:</strong> {formatDate(conge.dateCreation)}</p>
                                                        {conge.dateApprobation && (
                                                            <p><strong>Traité le:</strong> {formatDate(conge.dateApprobation)}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleDeleteConge(conge.id)}
                                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors ml-4"
                                                    title="Supprimer"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}