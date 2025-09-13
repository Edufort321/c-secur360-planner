/**
 * Hook useAppDataWithSync - Version B3hoWdZQh
 * EXTRAIT DE LA VERSION COMPLÈTE
 * Intègre les données avec Google Drive sync
 */

import { useAppData } from './useAppData.js';
import { useGoogleDrive } from './useGoogleDrive.js';

const { useState, useEffect } = React;

export const useAppDataWithSync = () => {
            const appData = useAppData();
            const googleDrive = useGoogleDrive();
            const [syncTimeout, setSyncTimeout] = useState(null);

            // Sauvegarde automatique après 2 secondes d'inactivité
            const scheduleAutoSave = React.useCallback(() => {
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
                                modeTheme: appData.modeTheme
                            };
                            
                            await googleDrive.saveToGoogleDrive(dataToSave);
                            console.log('💾 Sauvegarde automatique effectuée');
                        } catch (error) {
                            console.error('❌ Erreur sauvegarde automatique:', error);
                        }
                    }
                }, 2000);

                setSyncTimeout(timeout);
            }, [appData, googleDrive, syncTimeout]);

            // Déclencher la sauvegarde lors des modifications
            React.useEffect(() => {
                scheduleAutoSave();
            }, [appData.jobs, appData.personnel, appData.equipements, appData.sousTraitants, scheduleAutoSave]);

            // Chargement automatique au démarrage si connecté
            React.useEffect(() => {
                const loadInitialData = async () => {
                    if (googleDrive.isAuthenticated && !googleDrive.isSyncing) {
                        try {
                            const cloudData = await googleDrive.loadFromGoogleDrive();
                            if (cloudData) {
                                // Comparer avec localStorage et prendre le plus récent
                                const localData = localStorage.getItem('planificateurData');
                                const localTimestamp = localData ? JSON.parse(localData).lastModified : null;
                                const cloudTimestamp = cloudData.lastModified;

                                if (!localTimestamp || new Date(cloudTimestamp) > new Date(localTimestamp)) {
                                    console.log('📥 Application des données cloud');
                                    if (cloudData.jobs) appData.setJobs(cloudData.jobs);
                                    if (cloudData.personnel) appData.setPersonnel(cloudData.personnel);
                                    if (cloudData.equipements) appData.setEquipements(cloudData.equipements);
                                    if (cloudData.sousTraitants) appData.setSousTraitants(cloudData.sousTraitants);
                                    if (cloudData.typesEquipements) appData.setTypesEquipements(cloudData.typesEquipements);
                                    if (cloudData.demandesConges) appData.setDemandesConges(cloudData.demandesConges);
                                    if (cloudData.modeTheme) appData.setModeTheme(cloudData.modeTheme);
                                } else {
                                    console.log('💾 Données locales plus récentes');
                                }
                            }
                        } catch (error) {
                            console.error('❌ Erreur chargement initial:', error);
                        }
                    }
                };

                if (googleDrive.isInitialized) {
                    loadInitialData();
                }
            }, [googleDrive.isAuthenticated, googleDrive.isInitialized]);

            // Nettoyage
            React.useEffect(() => {
                return () => {
                    if (syncTimeout) {
                        clearTimeout(syncTimeout);
                    }
                };
            }, [syncTimeout]);

            return {
                ...appData,
                googleDrive,
                forceSync: async () => {
                    if (googleDrive.isAuthenticated) {
                        const dataToSave = {
                            jobs: appData.jobs,
                            personnel: appData.personnel,
                            equipements: appData.equipements,
                            sousTraitants: appData.sousTraitants,
                            typesEquipements: appData.typesEquipements,
                            demandesConges: appData.demandesConges,
                            modeTheme: appData.modeTheme
                        };
                        await googleDrive.saveToGoogleDrive(dataToSave);
                    }
                }
            };
