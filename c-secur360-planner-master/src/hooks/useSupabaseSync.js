// ============== HOOK SUPABASE SYNC ==============
// Gestion offline-first avec synchronisation temps r�el multi-utilisateurs

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Hook pour synchronisation offline-first avec Supabase
 *
 * Strat�gie:
 * - LECTURE: Toujours depuis localStorage (instant)
 * - �CRITURE: localStorage + Supabase en parall�le
 * - REALTIME: �coute changements Supabase � met � jour localStorage
 * - OFFLINE: Queue de sync, re-tentative quand online
 *
 * @param {string} table - Nom de la table Supabase
 * @param {string} storageKey - Cl� localStorage
 * @param {Array} defaultData - Donn�es par d�faut si aucune donn�e
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
        console.log(`=� [${table}] Charg� depuis localStorage:`, JSON.parse(saved).length, '�l�ments');
      } else {
        setData(defaultData);
        localStorage.setItem(storageKey, JSON.stringify(defaultData));
      }
    } catch (error) {
      console.error(`L [${table}] Erreur chargement localStorage:`, error);
      setData(defaultData);
    }
  }, [table, storageKey]);

  // Sauvegarder dans localStorage � chaque changement
  useEffect(() => {
    if (data.length > 0 || data.length === 0) { // Permettre array vide
      localStorage.setItem(storageKey, JSON.stringify(data));
    }
  }, [data, storageKey]);

  // Sync initial depuis Supabase (si configur� et online)
  useEffect(() => {
    if (!isSupabaseConfigured() || !isOnline) {
      console.log(`� [${table}] Supabase non configur� ou offline - mode local uniquement`);
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
          console.log(` [${table}] Sync initial:`, remoteData.length, '�l�ments');
        }
      } catch (error) {
        console.error(`L [${table}] Erreur sync initial:`, error);
      }
    };

    syncFromSupabase();
  }, [table, storageKey, isOnline]);

  // �coute temps r�el Supabase (si configur�)
  useEffect(() => {
    if (!isSupabaseConfigured() || !isOnline) return;

    // Cr�er le canal de realtime
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
          console.log(`= [${table}] Changement re�u:`, payload.eventType, payload.new || payload.old);

          setData(prevData => {
            let newData = [...prevData];

            switch (payload.eventType) {
              case 'INSERT':
                // V�rifier si pas d�j� pr�sent (�viter doublons)
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
        console.log(`=� [${table}] Realtime status:`, status);
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        console.log(`= [${table}] Canal realtime ferm�`);
      }
    };
  }, [table, storageKey, isOnline]);

  // �couter online/offline
  useEffect(() => {
    const handleOnline = () => {
      console.log('< [Global] Connexion r�tablie');
      setIsOnline(true);
      processSyncQueue();
    };

    const handleOffline = () => {
      console.log('=� [Global] Connexion perdue - mode offline');
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

    console.log(`= [${table}] Traitement queue:`, syncQueue.length, 'op�rations');

    for (const operation of syncQueue) {
      try {
        await syncToSupabase(operation.type, operation.data, operation.id);
      } catch (error) {
        console.error(`L [${table}] Erreur sync queue:`, error);
      }
    }

    setSyncQueue([]);
  };

  // Transformation des données pour Supabase (camelCase → snake_case)
  const transformForSupabase = (data) => {
    if (!data || table !== 'succursales') return data;

    const { codePostal, nombreEmployes, dateCreation, dateModification, ...rest } = data;

    // Convertir nombre_employes: string vide → null, string nombre → int
    let nombreEmployesValue = null;
    if (nombreEmployes !== undefined && nombreEmployes !== '') {
      const parsed = parseInt(nombreEmployes, 10);
      nombreEmployesValue = isNaN(parsed) ? null : parsed;
    }

    return {
      ...rest,
      ...(codePostal !== undefined && { code_postal: codePostal }),
      ...(nombreEmployes !== undefined && { nombre_employes: nombreEmployesValue })
    };
  };

  // Sync vers Supabase
  const syncToSupabase = async (type, item, itemId = null) => {
    if (!isSupabaseConfigured()) {
      console.log(`� [${table}] Supabase non configur� - sauvegarde locale uniquement`);
      return { success: true, local: true };
    }

    if (!isOnline) {
      // Ajouter � la queue
      setSyncQueue(prev => [...prev, { type, data: item, id: itemId }]);
      console.log(`=� [${table}] Ajout� � la queue:`, type);
      return { success: true, queued: true };
    }

    try {
      let result;
      const transformedItem = transformForSupabase(item);

      switch (type) {
        case 'INSERT':
          const { data: insertData, error: insertError } = await supabase
            .from(table)
            .insert([transformedItem])
            .select()
            .single();
          if (insertError) throw insertError;
          result = insertData;
          break;

        case 'UPDATE':
          const { data: updateData, error: updateError } = await supabase
            .from(table)
            .update(transformedItem)
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

      // Si offline pendant l'op�ration, ajouter � la queue
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

    // 1. Mettre � jour localStorage imm�diatement
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

    // 1. Mettre � jour localStorage imm�diatement
    setData(prev => prev.map(item =>
      item.id === itemId ? { ...item, ...updatedItem } : item
    ));

    // 2. Sync Supabase en background
    const result = await syncToSupabase('UPDATE', updatedItem, itemId);

    return { success: true, synced: result.success };
  }, [table]);

  const remove = useCallback(async (itemId) => {
    // 1. Supprimer de localStorage imm�diatement
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
