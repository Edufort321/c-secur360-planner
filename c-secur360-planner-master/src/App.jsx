// ============== APPLICATION C-SECUR360 VERSION ORIGINALE ==============
// Reproduction EXACTE de la version originale avec système d'authentification intégré

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserLoginModal } from './components/Auth/UserLoginModal.jsx';
import { PlanificateurFinal } from './modules/Calendar/PlanificateurFinal.jsx';
import { NotificationContainer } from './components/UI/NotificationContainer.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { Header } from './components/Header/Header.jsx';
import { useNotifications } from './hooks/useNotifications.js';
import { useAppDataWithSync } from './hooks/useAppDataWithSync.js';
import { useScreenSize } from './hooks/useScreenSize.js';
import { Logo } from './components/UI/Logo.jsx';
import { ResourcesModal } from './components/Modals/ResourcesModal.jsx';
import { CongesModal } from './components/Modals/CongesModal.jsx';
import { JobModal } from './modules/NewJob/JobModal.jsx';

// Import des styles de la version originale
import './styles/original.css';

export function App() {
    // Hook pour les données de l'application
    const appData = useAppDataWithSync();
    const { notifications, addNotification } = useNotifications();
    const { isMobile, isTablet } = useScreenSize();

    // États d'authentification utilisateur - VERSION ORIGINALE
    const [utilisateurConnecte, setUtilisateurConnecte] = useState(null);
    const [showUserLogin, setShowUserLogin] = useState(true);
    const [loginForm, setLoginForm] = useState({ nom: '', motDePasse: '' });

    // États pour les modals accessibles via le menu hamburger
    const [showCreateEvent, setShowCreateEvent] = useState(false);
    const [showCongesManagement, setShowCongesManagement] = useState(false);
    const [showResourcesManagement, setShowResourcesManagement] = useState(false);

    // Authentification utilisateur - VERSION ORIGINALE
    const handleUserLogin = (utilisateurIdentifie, motDePasse) => {
        console.log('📥 Réception des données d\'authentification:', {
            utilisateur: utilisateurIdentifie?.nom,
            motDePasse: motDePasse,
            longueurMotDePasse: motDePasse?.length,
            typeMotDePasse: typeof motDePasse
        });

        if (!utilisateurIdentifie) {
            console.error('❌ Utilisateur non fourni');
            addNotification('Erreur: Utilisateur non trouvé', 'error');
            return;
        }

        if (!motDePasse) {
            console.error('❌ Mot de passe non fourni');
            addNotification('Erreur: Mot de passe requis', 'error');
            return;
        }

        console.log('🔍 Vérification:', {
            motDePasseAttendu: utilisateurIdentifie.motDePasse,
            motDePasseSaisi: motDePasse,
            typesIdentiques: typeof utilisateurIdentifie.motDePasse === typeof motDePasse
        });

        // Vérification du mot de passe
        if (utilisateurIdentifie.motDePasse === motDePasse) {
            console.log('✅ CONNEXION RÉUSSIE pour:', utilisateurIdentifie.nom);
            setUtilisateurConnecte(utilisateurIdentifie);
            setShowUserLogin(false);
            addNotification(`Connexion réussie - ${utilisateurIdentifie.nom}`, 'success');
        } else {
            console.log('❌ ÉCHEC DE CONNEXION pour:', utilisateurIdentifie.nom);
            console.log('Attendu:', utilisateurIdentifie.motDePasse, 'Reçu:', motDePasse);
            addNotification('Mot de passe incorrect', 'error');
        }
    };

    // Fonctions de permissions - VERSION ORIGINALE
    const peutModifier = () => {
        if (!utilisateurConnecte) return false;
        if (!utilisateurConnecte.permissions) return false;
        return utilisateurConnecte.permissions.peutModifier === true;
    };

    const estCoordonnateur = () => {
        if (!utilisateurConnecte) return false;
        if (!utilisateurConnecte.permissions) return false;
        return utilisateurConnecte.permissions.estCoordonnateur === true;
    };

    // Fonction pour ajouter un sous-traitant - VERSION ORIGINALE
    const addSousTraitant = useCallback((newSousTraitant) => {
        if (newSousTraitant && newSousTraitant.trim()) {
            const nouveauSousTraitant = {
                id: Date.now(),
                nom: newSousTraitant.trim(),
                specialite: "À spécifier",
                telephone: "",
                email: "",
                disponible: true,
                tarif: "À négocier"
            };
            appData.setSousTraitants(prev => [...prev, nouveauSousTraitant]);
            return nouveauSousTraitant.id;
        }
        return null;
    }, [appData.setSousTraitants]);

    // Debug au démarrage
    useEffect(() => {
        console.log('%c🚀 DÉMARRAGE APPLICATION C-SECUR360 V6.7', 'background: #4CAF50; color: white; padding: 10px; font-size: 16px;');
        console.log('✅ Hooks chargés:', {
            personnelCount: appData.personnel.length,
            equipementsCount: appData.equipements.length,
            jobsCount: appData.jobs.length
        });
    }, []);

    // Affichage du chargement
    if (appData.isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="flex justify-center mb-4 animate-pulse">
                        <Logo size="xl" showText={false} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Chargement C-Secur360</h2>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Initialisation du planificateur...</p>
                </div>
            </div>
        );
    }

    return (
        <ThemeProvider>
            <div className="min-h-screen bg-gray-50">
                {/* Système de notifications */}
                <NotificationContainer notifications={notifications} />

                {/* Modal de login utilisateur - OBLIGATOIRE POUR ACCÉDER */}
                <UserLoginModal
                    isOpen={showUserLogin}
                    personnel={appData.personnel}
                    loginForm={loginForm}
                    setLoginForm={setLoginForm}
                    onLogin={handleUserLogin}
                    onClose={() => {}} // Pas de fermeture possible sans connexion
                />

                {/* Application principale - visible seulement si connecté */}
                {utilisateurConnecte && !showUserLogin && (
                    <>
                        {/* Header avec logo officiel et menu hamburger */}
                        <Header
                            utilisateurConnecte={utilisateurConnecte}
                            onLogout={() => {
                                setUtilisateurConnecte(null);
                                setShowUserLogin(true);
                                addNotification('Déconnexion réussie', 'info');
                            }}
                            onCreateEvent={() => setShowCreateEvent(true)}
                            onManageConges={() => setShowCongesManagement(true)}
                            onManageResources={() => setShowResourcesManagement(true)}
                        />

                        {/* Interface PlanificateurFinal complète */}
                        <PlanificateurFinal
                            // Données
                            jobs={appData.jobs}
                            personnel={appData.personnel}
                            equipements={appData.equipements}
                            sousTraitants={appData.sousTraitants}
                            conges={appData.conges}

                            // Fonctions de sauvegarde
                            onSaveJob={appData.saveJob}
                            onDeleteJob={appData.deleteJob}
                            onSavePersonnel={appData.savePersonnel}
                            onDeletePersonnel={appData.deletePersonnel}
                            onSaveEquipement={appData.saveEquipement}
                            onDeleteEquipement={appData.deleteEquipement}
                            onSaveConge={appData.saveConge}
                            onDeleteConge={appData.deleteConge}

                            // Utilitaires
                            addSousTraitant={addSousTraitant}
                            addNotification={addNotification}

                            // Utilisateur connecté et permissions
                            utilisateurConnecte={utilisateurConnecte}
                            peutModifier={peutModifier}
                            estCoordonnateur={estCoordonnateur}
                        />

                        {/* Modals accessibles via le menu hamburger */}

                        {/* Modal Créer Événement */}
                        {showCreateEvent && (
                            <JobModal
                                isOpen={showCreateEvent}
                                onClose={() => setShowCreateEvent(false)}
                                onSave={appData.saveJob}
                                onDelete={appData.deleteJob}
                                job={null}
                                personnel={appData.personnel}
                                equipements={appData.equipements}
                                sousTraitants={appData.sousTraitants}
                                addSousTraitant={addSousTraitant}
                                addNotification={addNotification}
                            />
                        )}

                        {/* Modal Gestion Congés */}
                        {showCongesManagement && (
                            <CongesModal
                                isOpen={showCongesManagement}
                                onClose={() => setShowCongesManagement(false)}
                                onSave={appData.saveConge}
                                onDelete={appData.deleteConge}
                                conge={null}
                                personnel={appData.personnel}
                                addNotification={addNotification}
                                utilisateurConnecte={utilisateurConnecte}
                                peutModifier={peutModifier}
                            />
                        )}

                        {/* Modal Gestion Ressources */}
                        {showResourcesManagement && (
                            <ResourcesModal
                                isOpen={showResourcesManagement}
                                onClose={() => setShowResourcesManagement(false)}
                                personnel={appData.personnel}
                                equipements={appData.equipements}
                                onSavePersonnel={appData.savePersonnel}
                                onDeletePersonnel={appData.deletePersonnel}
                                onSaveEquipement={appData.saveEquipement}
                                onDeleteEquipement={appData.deleteEquipement}
                                utilisateurConnecte={utilisateurConnecte}
                                estCoordonnateur={estCoordonnateur}
                                peutModifier={peutModifier}
                                addNotification={addNotification}
                            />
                        )}
                    </>
                )}
            </div>
        </ThemeProvider>
    );
}

export default App;