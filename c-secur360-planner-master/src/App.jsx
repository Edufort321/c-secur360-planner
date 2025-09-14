// ============== APPLICATION PRINCIPALE ==============
// Composant racine de l'application C-Secur360

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './modules/Auth/AuthContext.jsx';
import { Header } from './modules/Header/Header.jsx';
import { PlanificateurFinal } from './modules/Calendar/PlanificateurFinal.jsx';
import { Dashboard } from './modules/Dashboard/Dashboard.jsx';
import { NotificationContainer } from './components/UI/NotificationContainer.jsx';
import { useNotifications } from './hooks/useNotifications.js';
import { useAppDataWithSync } from './hooks/useAppDataWithSync.js';
import { useScreenSize } from './hooks/useScreenSize.js';

// Import des styles globaux
import './styles/globals.css';

function AppContent() {
    const [selectedView, setSelectedView] = useState('month');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedBureau, setSelectedBureau] = useState(null);
    const [showDashboard, setShowDashboard] = useState(false);

    // Hooks
    const { currentUser, isAdmin } = useAuth();
    const notifications = useNotifications();
    const appData = useAppDataWithSync();
    const screenSize = useScreenSize();

    const handleAdminAccess = () => {
        setShowDashboard(true);
        notifications.success('Accès administrateur activé');
    };

    const handleViewChange = (view) => {
        setSelectedView(view);
        appData.setSelectedView(view);
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        appData.setSelectedDate(date);
    };

    const handleBureauChange = (bureau) => {
        setSelectedBureau(bureau);
    };

    // Fonction pour ajouter un sous-traitant
    const addSousTraitant = (nom) => {
        const newSousTraitant = {
            id: Date.now(),
            nom: nom.trim(),
            specialite: '',
            tarif: '',
            dateCreation: new Date().toISOString()
        };

        const updatedSousTraitants = [...appData.sousTraitants, newSousTraitant];
        appData.setSousTraitants(updatedSousTraitants);
        return newSousTraitant.id;
    };

    if (appData.isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement du planificateur...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                selectedView={selectedView}
                onViewChange={handleViewChange}
                selectedBureau={selectedBureau}
                onBureauChange={handleBureauChange}
                onAdminAccess={handleAdminAccess}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Statut de synchronisation */}
                {appData.syncStatus && (
                    <div className="mb-4 flex items-center justify-between bg-white rounded-lg shadow-sm p-3">
                        <div className="flex items-center space-x-2">
                            <div className={`h-2 w-2 rounded-full ${
                                appData.syncStatus.isConnected ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                            <span className="text-sm text-gray-600">
                                {appData.syncStatus.isConnected ? 'Synchronisé' : 'Mode local'}
                                {appData.syncStatus.isSyncing && ' (synchronisation...)'}
                            </span>
                        </div>
                        {appData.syncStatus.lastSync && (
                            <span className="text-xs text-gray-500">
                                Dernière sync: {new Date(appData.syncStatus.lastSync).toLocaleTimeString('fr-FR')}
                            </span>
                        )}
                    </div>
                )}

                {/* Contenu principal */}
                {showDashboard ? (
                    <Dashboard
                        jobs={appData.jobs}
                        personnel={appData.personnel}
                        equipements={appData.equipements}
                        conges={appData.conges}
                        isAdmin={isAdmin}
                        currentUser={currentUser}
                    />
                ) : (
                    <div className="bg-white rounded-lg shadow h-full">
                        <PlanificateurFinal
                            jobs={appData.jobs}
                            personnel={appData.personnel}
                            equipements={appData.equipements}
                            sousTraitants={appData.sousTraitants}
                            conges={appData.conges}
                            onSaveJob={appData.saveJob}
                            onDeleteJob={appData.deleteJob}
                            onSavePersonnel={appData.savePersonnel}
                            onDeletePersonnel={appData.deletePersonnel}
                            onSaveEquipement={appData.saveEquipement}
                            onDeleteEquipement={appData.deleteEquipement}
                            onSaveConge={appData.saveConge}
                            onDeleteConge={appData.deleteConge}
                            addSousTraitant={addSousTraitant}
                            addNotification={notifications.add}
                            selectedView={selectedView}
                            onViewChange={handleViewChange}
                            selectedDate={selectedDate}
                            onDateChange={handleDateChange}
                            currentUser={currentUser}
                            isAdmin={isAdmin}
                        />
                    </div>
                )}
            </main>

            {/* Conteneur de notifications */}
            <NotificationContainer
                notifications={notifications.notifications}
                onRemoveNotification={notifications.removeNotification}
            />
        </div>
    );
}

export function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;