/**
 * Hook combinant les données locales avec la synchronisation Google Drive
 * Sauvegarde automatique et gestion des conflits
 */

import { useAppData } from './useAppData.js';
import { useGoogleDrive } from './useGoogleDrive.js';

const { useState, useCallback, useEffect } = React;

export const useAppDataWithSync = () => {
    const appData = useAppData();
    const googleDrive = useGoogleDrive();
    const [syncTimeout, setSyncTimeout] = useState(null);
    const [lastAutoSave, setLastAutoSave] = useState(null);

    // ============== SAUVEGARDE AUTOMATIQUE ==============
    const scheduleAutoSave = useCallback(() => {
        if (syncTimeout) {
            clearTimeout(syncTimeout);
        }

        const timeout = setTimeout(async () => {
            if (googleDrive.isAuthenticated) {
                try {
                    const dataToSave = {
                        jobs: appData.jobs,
                        personnel: appData.personnel,
                        equipements: appData.equipements,
                        sousTraitants: appData.sousTraitants,
                        typesEquipements: appData.typesEquipements,
                        demandesConges: appData.demandesConges,
                        evenements: appData.evenements,
                        modeTheme: appData.modeTheme
                    };

                    await googleDrive.saveToGoogleDrive(dataToSave);
                    setLastAutoSave(new Date());
                    console.log('💾 Sauvegarde automatique effectuée');
                } catch (error) {
                    console.error('❌ Erreur sauvegarde automatique:', error);
                }
            }
        }, 2000); // 2 secondes après la dernière modification

        setSyncTimeout(timeout);
    }, [syncTimeout, googleDrive, appData]);

    // ============== DÉCLENCHEMENT AUTO-SAVE ==============
    useEffect(() => {
        if (googleDrive.isAuthenticated) {
            scheduleAutoSave();
        }
        
        return () => {
            if (syncTimeout) {
                clearTimeout(syncTimeout);
            }
        };
    }, [
        appData.jobs,
        appData.personnel,
        appData.equipements,
        appData.sousTraitants,
        appData.typesEquipements,
        appData.demandesConges,
        appData.evenements,
        appData.modeTheme,
        googleDrive.isAuthenticated,
        scheduleAutoSave
    ]);

    // ============== CHARGEMENT INITIAL GOOGLE DRIVE ==============
    useEffect(() => {
        const loadInitialData = async () => {
            if (googleDrive.isAuthenticated && googleDrive.isInitialized) {
                try {
                    console.log('📥 Chargement initial depuis Google Drive...');
                    const cloudData = await googleDrive.loadFromGoogleDrive();
                    
                    if (cloudData) {
                        // Gestion des conflits : comparer les dates de modification
                        const localData = appData.exportData();
                        const shouldUseCloudData = !localData.lastModified || 
                            new Date(cloudData.syncedAt || cloudData.lastModified) > new Date(localData.lastModified);

                        if (shouldUseCloudData) {
                            console.log('☁️ Utilisation des données cloud (plus récentes)');
                            appData.importData(cloudData);
                        } else {
                            console.log('💻 Données locales plus récentes, synchronisation vers le cloud...');
                            await googleDrive.saveToGoogleDrive(localData);
                        }
                    }
                } catch (error) {
                    console.error('❌ Erreur chargement initial:', error);
                }
            }
        };

        if (googleDrive.isAuthenticated) {
            loadInitialData();
        }
    }, [googleDrive.isAuthenticated, googleDrive.isInitialized]);

    // ============== SYNCHRONISATION FORCÉE ==============
    const forceSync = useCallback(async () => {
        if (!googleDrive.isAuthenticated) {
            return { success: false, error: 'Non connecté à Google Drive' };
        }

        try {
            const dataToSave = appData.exportData();
            await googleDrive.saveToGoogleDrive(dataToSave);
            setLastAutoSave(new Date());
            return { success: true };
        } catch (error) {
            console.error('❌ Erreur synchronisation forcée:', error);
            return { success: false, error: error.message };
        }
    }, [googleDrive, appData]);

    // ============== IMPORT/EXPORT AVEC SYNC ==============
    const importDataWithSync = useCallback(async (data) => {
        // Importer les données localement
        appData.importData(data);
        
        // Si connecté à Google Drive, synchroniser
        if (googleDrive.isAuthenticated) {
            try {
                await googleDrive.saveToGoogleDrive(data);
                console.log('✅ Données importées et synchronisées');
            } catch (error) {
                console.error('⚠️ Données importées mais synchronisation échouée:', error);
            }
        }
    }, [appData, googleDrive]);

    const exportDataWithSync = useCallback(async () => {
        const data = appData.exportData();
        
        // Ajouter informations de synchronisation
        data.syncInfo = {
            lastAutoSave,
            lastSync: googleDrive.lastSync,
            isAuthenticated: googleDrive.isAuthenticated
        };
        
        return data;
    }, [appData, lastAutoSave, googleDrive.lastSync, googleDrive.isAuthenticated]);

    // ============== GESTION DES CONFLITS ==============
    const resolveConflict = useCallback(async (resolution) => {
        // resolution: 'local' | 'cloud' | 'merge'
        try {
            const cloudData = await googleDrive.loadFromGoogleDrive();
            const localData = appData.exportData();

            switch (resolution) {
                case 'cloud':
                    appData.importData(cloudData);
                    break;
                case 'local':
                    await googleDrive.saveToGoogleDrive(localData);
                    break;
                case 'merge':
                    // Logique de fusion simple : prendre le plus récent par type de donnée
                    const mergedData = {
                        ...localData,
                        ...cloudData,
                        // Fusionner les tableaux (exemple basique)
                        jobs: [...(localData.jobs || []), ...(cloudData.jobs || [])].reduce((acc, current) => {
                            const existing = acc.find(item => item.id === current.id);
                            if (!existing) {
                                acc.push(current);
                            } else if (new Date(current.updatedAt || current.createdAt) > new Date(existing.updatedAt || existing.createdAt)) {
                                const index = acc.findIndex(item => item.id === current.id);
                                acc[index] = current;
                            }
                            return acc;
                        }, [])
                    };
                    appData.importData(mergedData);
                    await googleDrive.saveToGoogleDrive(mergedData);
                    break;
            }
            
            return { success: true };
        } catch (error) {
            console.error('❌ Erreur résolution conflit:', error);
            return { success: false, error: error.message };
        }
    }, [googleDrive, appData]);

    return {
        // Hériter de toutes les fonctionnalités d'appData
        ...appData,
        
        // Fonctionnalités de synchronisation
        googleDrive,
        lastAutoSave,
        syncTimeout: !!syncTimeout,
        
        // Fonctions de synchronisation
        forceSync,
        scheduleAutoSave,
        importDataWithSync,
        exportDataWithSync,
        resolveConflict
    };
};