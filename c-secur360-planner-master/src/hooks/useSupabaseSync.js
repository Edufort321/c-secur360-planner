// ============== HOOK SUPABASE SYNC ==============
// Gestion offline-first avec synchronisation temps réel multi-utilisateurs

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Hook pour synchronisation offline-first avec Supabase
 *
 * Stratégie:
 * - LECTURE: Toujours depuis localStorage (instant)
 * - ÉCRITURE: localStorage + Supabase en parallèle
 * - REALTIME: Écoute changements Supabase ’ met à jour localStorage
 * - OFFLINE: Queue de sync, re-tentative quand online
 *
 * @param {string} table - Nom de la table Supabase
 * @param {string} storageKey - Clé localStorage
 * @param {Array} defaultData - Données par défaut si aucune donnée
 */
export function useSupabaseSync(table, storageKey, defaultData = []) {
  const [data, setData] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const channelRef = useRef(null);

  // Charger depuis localStorage au montage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setData(JSON.parse(saved));
        console.log(`=æ [${table}] Chargé depuis localStorage:`, JSON.parse(saved).length, 'éléments');
      } else {
        setData(defaultData);
        localStorage.setItem(storageKey, JSON.stringify(defaultData));
      }
    } catch (error) {
      console.error(`L [${table}] Erreur chargement localStorage:`, error);
      setData(defaultData);
    }
  }, [table, storageKey]);

  // Sauvegarder dans localStorage à chaque changement
  useEffect(() => {
    if (data.length > 0 || data.length === 0) { // Permettre array vide
      localStorage.setItem(storageKey, JSON.stringify(data));
    }
  }, [data, storageKey]);

  // Sync initial depuis Supabase (si configuré et online)
  useEffect(() => {
    if (!isSupabaseConfigured() || !isOnline) {
      console.log(`  [${table}] Supabase non configuré ou offline - mode local uniquement`);
      return;
    }

    const syncFromSupabase = async () => {
      try {
        const { data: remoteData, error } = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (remoteData && remoteData.length > 0) {
          setData(remoteData);
          localStorage.setItem(storageKey, JSON.stringify(remoteData));
          setLastSync(new Date());
          console.log(` [${table}] Sync initial:`, remoteData.length, 'éléments');
        }
      } catch (error) {
        console.error(`L [${table}] Erreur sync initial:`, error);
      }
    };

    syncFromSupabase();
  }, [table, storageKey, isOnline]);

  // Écoute temps réel Supabase (si configuré)
  useEffect(() => {
    if (!isSupabaseConfigured() || !isOnline) return;

    // Créer le canal de realtime
    const channel = supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: table
        },
        (payload) => {
          console.log(`= [${table}] Changement reçu:`, payload.eventType, payload.new || payload.old);

          setData(prevData => {
            let newData = [...prevData];

            switch (payload.eventType) {
              case 'INSERT':
                // Vérifier si pas déjà présent (éviter doublons)
                if (!newData.find(item => item.id === payload.new.id)) {
                  newData = [payload.new, ...newData];
                }
                break;

              case 'UPDATE':
                newData = newData.map(item =>
                  item.id === payload.new.id ? payload.new : item
                );
                break;

              case 'DELETE':
                newData = newData.filter(item => item.id !== payload.old.id);
                break;
            }

            // Sauvegarder dans localStorage
            localStorage.setItem(storageKey, JSON.stringify(newData));
            return newData;
          });
        }
      )
      .subscribe((status) => {
        console.log(`=á [${table}] Realtime status:`, status);
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        console.log(`= [${table}] Canal realtime fermé`);
      }
    };
  }, [table, storageKey, isOnline]);

  // Écouter online/offline
  useEffect(() => {
    const handleOnline = () => {
      console.log('< [Global] Connexion rétablie');
      setIsOnline(true);
      processSyncQueue();
    };

    const handleOffline = () => {
      console.log('=ô [Global] Connexion perdue - mode offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Traiter la queue de sync quand online
  const processSyncQueue = async () => {
    if (syncQueue.length === 0 || !isOnline || !isSupabaseConfigured()) return;

    console.log(`= [${table}] Traitement queue:`, syncQueue.length, 'opérations');

    for (const operation of syncQueue) {
      try {
        await syncToSupabase(operation.type, operation.data, operation.id);
      } catch (error) {
        console.error(`L [${table}] Erreur sync queue:`, error);
      }
    }

    setSyncQueue([]);
  };

  // Sync vers Supabase
  const syncToSupabase = async (type, item, itemId = null) => {
    if (!isSupabaseConfigured()) {
      console.log(`  [${table}] Supabase non configuré - sauvegarde locale uniquement`);
      return { success: true, local: true };
    }

    if (!isOnline) {
      // Ajouter à la queue
      setSyncQueue(prev => [...prev, { type, data: item, id: itemId }]);
      console.log(`=å [${table}] Ajouté à la queue:`, type);
      return { success: true, queued: true };
    }

    try {
      let result;

      switch (type) {
        case 'INSERT':
          const { data: insertData, error: insertError } = await supabase
            .from(table)
            .insert([item])
            .select()
            .single();
          if (insertError) throw insertError;
          result = insertData;
          break;

        case 'UPDATE':
          const { data: updateData, error: updateError } = await supabase
            .from(table)
            .update(item)
            .eq('id', itemId)
            .select()
            .single();
          if (updateError) throw updateError;
          result = updateData;
          break;

        case 'DELETE':
          const { error: deleteError } = await supabase
            .from(table)
            .delete()
            .eq('id', itemId);
          if (deleteError) throw deleteError;
          result = { id: itemId };
          break;
      }

      console.log(` [${table}] Sync Supabase:`, type, result);
      return { success: true, data: result };

    } catch (error) {
      console.error(`L [${table}] Erreur sync Supabase:`, error);

      // Si offline pendant l'opération, ajouter à la queue
      if (!navigator.onLine) {
        setSyncQueue(prev => [...prev, { type, data: item, id: itemId }]);
      }

      return { success: false, error };
    }
  };

  // CRUD Operations (localStorage-first)

  const add = useCallback(async (newItem) => {
    const item = {
      ...newItem,
      id: newItem.id || crypto.randomUUID(),
      created_at: newItem.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 1. Mettre à jour localStorage immédiatement
    setData(prev => [item, ...prev]);

    // 2. Sync Supabase en background
    const result = await syncToSupabase('INSERT', item);

    return { success: true, data: item, synced: result.success };
  }, [table]);

  const update = useCallback(async (itemId, updates) => {
    const updatedItem = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // 1. Mettre à jour localStorage immédiatement
    setData(prev => prev.map(item =>
      item.id === itemId ? { ...item, ...updatedItem } : item
    ));

    // 2. Sync Supabase en background
    const result = await syncToSupabase('UPDATE', updatedItem, itemId);

    return { success: true, synced: result.success };
  }, [table]);

  const remove = useCallback(async (itemId) => {
    // 1. Supprimer de localStorage immédiatement
    setData(prev => prev.filter(item => item.id !== itemId));

    // 2. Sync Supabase en background
    const result = await syncToSupabase('DELETE', null, itemId);

    return { success: true, synced: result.success };
  }, [table]);

  return {
    data,
    add,
    update,
    remove,
    isOnline,
    lastSync,
    syncQueue: syncQueue.length,
    refresh: () => {
      // Force refresh depuis Supabase
      if (isSupabaseConfigured() && isOnline) {
        supabase.from(table).select('*').then(({ data: remoteData }) => {
          if (remoteData) {
            setData(remoteData);
            localStorage.setItem(storageKey, JSON.stringify(remoteData));
          }
        });
      }
    }
  };
}
