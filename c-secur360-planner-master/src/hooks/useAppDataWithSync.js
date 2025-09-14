// ============== HOOK APP DATA WITH SYNC ==============
// Hook qui combine useAppData avec synchronisation Google Drive

import { useEffect, useCallback } from 'react';
import { useAppData } from './useAppData.js';
import { useGoogleDrive } from './useGoogleDrive.js';
import { STORAGE_CONFIG } from '../../config/constants.js';

export function useAppDataWithSync() {
    const appData = useAppData();
    const googleDrive = useGoogleDrive();

    // Sauvegarder vers Google Drive avec délai pour éviter les sauvegardes fréquentes
    const saveToCloud = useCallback(async () => {
        if (!googleDrive.isAuthenticated || googleDrive.isSyncing) {
            return;
        }

        try {
            const dataToSync = {
                jobs: appData.jobs,
                personnel: appData.personnel.map(p => {
                    // Exclure les mots de passe de la synchronisation cloud
                    const { password, ...personSansPassword } = p;
                    return personSansPassword;
                }),
                equipements: appData.equipements,
                sousTraitants: appData.sousTraitants,
                conges: appData.conges,
                selectedView: appData.selectedView,
                selectedDate: appData.selectedDate.toISOString(),
                syncVersion: '1.0',
                lastSyncLocal: new Date().toISOString()
            };

            await googleDrive.saveToGoogleDrive(dataToSync);
        } catch (error) {
            console.error('Erreur sync vers cloud:', error);
            // Ne pas bloquer l'application en cas d'erreur de sync
        }
    }, [appData, googleDrive]);

    // Charger depuis Google Drive au démarrage
    const loadFromCloud = useCallback(async () => {
        if (!googleDrive.isAuthenticated || !googleDrive.isInitialized) {
            return;
        }

        try {
            const cloudData = await googleDrive.loadFromGoogleDrive();
            if (cloudData) {
                // Merger les données cloud avec les données locales
                if (cloudData.jobs && Array.isArray(cloudData.jobs)) {
                    appData.setJobs(cloudData.jobs);
                }

                if (cloudData.personnel && Array.isArray(cloudData.personnel)) {
                    // Garder les mots de passe locaux mais mettre à jour les autres infos
                    const mergedPersonnel = appData.personnel.map(localPerson => {
                        const cloudPerson = cloudData.personnel.find(cp => cp.id === localPerson.id);
                        if (cloudPerson) {
                            return { ...cloudPerson, password: localPerson.password };
                        }
                        return localPerson;
                    });
                    appData.setPersonnel(mergedPersonnel);
                }

                if (cloudData.equipements && Array.isArray(cloudData.equipements)) {
                    appData.setEquipements(cloudData.equipements);
                }

                if (cloudData.sousTraitants && Array.isArray(cloudData.sousTraitants)) {
                    appData.setSousTraitants(cloudData.sousTraitants);
                }

                if (cloudData.conges && Array.isArray(cloudData.conges)) {
                    appData.setConges(cloudData.conges);
                }

                if (cloudData.selectedView) {
                    appData.setSelectedView(cloudData.selectedView);
                }

                if (cloudData.selectedDate) {
                    appData.setSelectedDate(new Date(cloudData.selectedDate));
                }

                console.log('✅ Données synchronisées depuis le cloud');
            }
        } catch (error) {
            console.error('Erreur chargement depuis cloud:', error);
            // Continuer avec les données locales en cas d'erreur
        }
    }, [appData, googleDrive]);

    // Synchronisation automatique après changements avec délai
    useEffect(() => {
        if (appData.isLoading || !googleDrive.isInitialized) {
            return;
        }

        const timeoutId = setTimeout(() => {
            if (googleDrive.isAuthenticated) {
                saveToCloud();
            }
        }, STORAGE_CONFIG.SYNC_DELAY);

        return () => clearTimeout(timeoutId);
    }, [
        appData.jobs,
        appData.personnel,
        appData.equipements,
        appData.sousTraitants,
        appData.conges,
        appData.selectedView,
        appData.selectedDate,
        appData.isLoading,
        googleDrive.isInitialized,
        googleDrive.isAuthenticated,
        saveToCloud
    ]);

    // Charger depuis le cloud à la connexion
    useEffect(() => {
        if (googleDrive.isAuthenticated && googleDrive.isInitialized && !appData.isLoading) {
            loadFromCloud();
        }
    }, [googleDrive.isAuthenticated, googleDrive.isInitialized, appData.isLoading, loadFromCloud]);

    // Fonction de synchronisation manuelle
    const forceSync = useCallback(async () => {
        if (googleDrive.isAuthenticated) {
            await saveToCloud();
            await loadFromCloud();
        }
    }, [saveToCloud, loadFromCloud, googleDrive.isAuthenticated]);

    // Fonction de sauvegarde manuelle (pour les boutons de sauvegarde)
    const saveNow = useCallback(async () => {
        // Sauvegarder localement d'abord
        appData.saveData();

        // Puis vers le cloud si connecté
        if (googleDrive.isAuthenticated) {
            await saveToCloud();
        }
    }, [appData, saveToCloud, googleDrive.isAuthenticated]);

    // Retourner toutes les fonctionnalités combinées
    return {
        // Toutes les données et fonctions de useAppData
        ...appData,

        // Fonctionnalités Google Drive
        ...googleDrive,

        // Fonctions de synchronisation
        saveToCloud,
        loadFromCloud,
        forceSync,
        saveNow,

        // États combinés
        isOnline: googleDrive.isAuthenticated,
        canSync: googleDrive.isAuthenticated && !googleDrive.isSyncing,
        syncStatus: {
            isConnected: googleDrive.isAuthenticated,
            isSyncing: googleDrive.isSyncing,
            lastSync: googleDrive.lastSync,
            lastSaved: appData.lastSaved,
            hasError: !!googleDrive.error
        }
    };
}