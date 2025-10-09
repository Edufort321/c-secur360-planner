// ============== HOOK APP DATA WITH SYNC ==============
// Hook simplifié qui utilise useAppData avec Supabase
// Google Drive désactivé - remplacé par Supabase

import { useAppData } from './useAppData.js';

export function useAppDataWithSync() {
    const appData = useAppData();

    // Retourner toutes les fonctionnalités de useAppData
    // Supabase sync est déjà géré dans useAppData via useSupabaseSync
    return {
        ...appData,

        // Fonctions de compatibilité (pour ne pas casser l'interface)
        saveToCloud: async () => {
            // Supabase sync automatique via useSupabaseSync
            appData.saveData();
        },
        loadFromCloud: async () => {
            // Supabase sync automatique via useSupabaseSync
        },
        forceSync: async () => {
            // Supabase sync automatique via useSupabaseSync
            appData.saveData();
        },
        saveNow: async () => {
            appData.saveData();
        },

        // États de sync (pour compatibilité UI)
        isOnline: appData.isOnline || false,
        canSync: true,
        isAuthenticated: false, // Google Drive désactivé
        isSyncing: false,
        syncStatus: {
            isConnected: appData.isOnline || false,
            isSyncing: false,
            lastSync: appData.lastSaved,
            lastSaved: appData.lastSaved,
            hasError: false
        }
    };
}
