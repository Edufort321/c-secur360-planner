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

  // Helper: Vérifier si ID valide
  const isValidId = (id) => {
    if (!id) return false;
    // UUID valide OU nombre > 1000 (pour compatibilité temporaire)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(id);
    const isDateNow = /^\d{13}$/.test(String(id));
    const isSimpleNumber = typeof id === 'number' && id < 1000;

    // Rejeter Date.now() et petits nombres (1, 2, 3...)
    if (isDateNow || isSimpleNumber) return false;

    return isUUID || typeof id === 'string';
  };

  // Charger depuis localStorage au montage + AUTO-NETTOYAGE
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsedData = JSON.parse(saved);

        // AUTO-NETTOYAGE: Filtrer les IDs invalides SILENCIEUSEMENT
        const validData = parsedData.filter(item => {
          const valid = isValidId(item.id);
          if (!valid) {
            console.warn(`🗑️ [${table}] Auto-nettoyage: ID invalide supprimé: ${item.id}`);
          }
          return valid;
        });

        // Si des données ont été nettoyées, sauvegarder
        if (validData.length !== parsedData.length) {
          localStorage.setItem(storageKey, JSON.stringify(validData));
          console.log(`✨ [${table}] ${parsedData.length - validData.length} élément(s) nettoyé(s) automatiquement`);
        }

        setData(validData);
        console.log(`=� [${table}] Charg� depuis localStorage:`, validData.length, '�l�ments');
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


  // Transformation inverse: snake_case (Supabase) → camelCase (JavaScript)
  const transformFromSupabase = (data) => {
    if (!data) return data;

    // MAP DE TRANSFORMATION snake_case → camelCase (LECTURE depuis Supabase)
    const reverseFieldMappings = {
      // Champs génériques
      'created_at': 'dateCreation',
      'updated_at': 'dateModification',

      // Personnel
      'niveau_acces': 'niveauAcces',
      'date_embauche': 'dateEmbauche',
      'visible_chantier': 'visibleChantier',

      // Jobs
      'date_debut': 'dateDebut',
      'date_fin': 'dateFin',
      'heure_debut': 'heureDebut',
      'heure_fin': 'heureFin',
      'personnel_ids': 'personnelIds',
      'equipement_ids': 'equipementIds',
      'type_service': 'typeService',
      'created_by': 'createdBy',

      // Equipements
      'numero_serie': 'numeroSerie',
      'date_achat': 'dateAchat',
      'cout_location': 'coutLocation',
      'derniere_maintenance': 'derniereMaintenance',
      'prochaine_maintenance': 'prochaineMaintenance',

      // Succursales
      'code_postal': 'codePostal',
      'nombre_employes': 'nombreEmployes',

      // Postes
      'salaire_min': 'salaireMin',
      'salaire_max': 'salaireMax',
      'competences': 'competencesRequises',

      // Congés
      'personnel_id': 'personnelId',
      'approuve_par': 'approuvePar',

      // Départements
      'responsable_id': 'responsableId'
    };

    const transformed = { ...data };

    // Appliquer toutes les transformations snake_case → camelCase
    Object.keys(reverseFieldMappings).forEach(snakeKey => {
      if (data[snakeKey] !== undefined) {
        const camelKey = reverseFieldMappings[snakeKey];
        transformed[camelKey] = data[snakeKey];
        // Garder AUSSI la version snake_case pour compatibilité
      }
    });

    return transformed;
  };

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
          // TRANSFORMER les données Supabase → JavaScript
          const transformedData = remoteData.map(transformFromSupabase);
          setData(transformedData);
          localStorage.setItem(storageKey, JSON.stringify(transformedData));
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
                  newData = [transformFromSupabase(payload.new), ...newData];
                }
                break;

              case 'UPDATE':
                newData = newData.map(item =>
                  item.id === payload.new.id ? transformFromSupabase(payload.new) : item
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

  // Transformation universelle des données pour Supabase (camelCase → snake_case + nettoyage)
  const transformForSupabase = (data) => {
    if (!data) return data;

    const cleanData = { ...data };

    // MAP DE TRANSFORMATION camelCase → snake_case (TOUTES LES TABLES)
    const fieldMappings = {
      // Champs génériques
      dateCreation: 'created_at',
      dateModification: 'updated_at',

      // Personnel
      niveauAcces: 'niveau_acces',
      dateEmbauche: 'date_embauche',
      visibleChantier: 'visible_chantier',
      specialites: null, // Supprimer si n'existe pas dans Supabase

      // Jobs
      dateDebut: 'date_debut',
      dateFin: 'date_fin',
      heureDebut: 'heure_debut',
      heureFin: 'heure_fin',
      personnelIds: 'personnel_ids',
      equipementIds: 'equipement_ids',
      typeService: 'type_service',
      createdBy: 'created_by',
      sousTraitant: 'sous_traitant',
      ganttViewMode: 'gantt_view_mode',
      horairesPersonnalises: 'horaires_personnalises',
      criticalPath: 'critical_path',
      showCriticalPath: 'show_critical_path',

      // Equipements
      numeroSerie: 'numero_serie',
      dateAchat: 'date_achat',
      coutLocation: 'cout_location',
      derniereMaintenance: 'derniere_maintenance',
      prochaineMaintenance: 'prochaine_maintenance',

      // Succursales
      codePostal: 'code_postal',
      nombreEmployes: 'nombre_employes',

      // Postes
      salaireMin: 'salaire_min',
      salaireMax: 'salaire_max',
      competencesRequises: 'competences',
      responsabilites: null, // Supprimer si n'existe pas dans Supabase

      // Congés
      personnelId: 'personnel_id',
      approuvePar: 'approuve_par',

      // Départements
      responsableId: 'responsable_id'
    };

    // LISTE DES CHAMPS À TOUJOURS SUPPRIMER (n'existent pas dans Supabase)
    const fieldsToRemove = [
      'specialites',
      'responsabilites',
      'dateCreation',
      'dateModification'
    ];

    // Supprimer les champs non-Supabase
    fieldsToRemove.forEach(field => {
      delete cleanData[field];
    });

    // Appliquer toutes les transformations
    Object.keys(fieldMappings).forEach(camelKey => {
      if (data[camelKey] !== undefined) {
        const snakeKey = fieldMappings[camelKey];

        // Si mapping === null, supprimer le champ (n'existe pas dans Supabase)
        if (snakeKey === null) {
          delete cleanData[camelKey];
        } else {
          cleanData[snakeKey] = data[camelKey];
          delete cleanData[camelKey];
        }
      }
    });

    // CONVERSION DES TYPES (pour éviter erreurs PostgreSQL)

    // Convertir strings vides → null pour TOUS les champs
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === '') {
        cleanData[key] = null;
      }
    });

    // Convertir INTEGER fields (si string → int, si vide → null)
    const integerFields = ['nombre_employes', 'salaire', 'montant', 'salaire_min', 'salaire_max'];
    integerFields.forEach(field => {
      if (cleanData[field] !== undefined && cleanData[field] !== null) {
        if (cleanData[field] === '') {
          cleanData[field] = null;
        } else {
          const parsed = parseFloat(cleanData[field]);
          cleanData[field] = isNaN(parsed) ? null : parsed;
        }
      }
    });

    // Convertir BOOLEAN fields (strings → boolean)
    const booleanFields = ['visible_chantier', 'disponible', 'actif'];
    booleanFields.forEach(field => {
      if (cleanData[field] !== undefined && typeof cleanData[field] === 'string') {
        cleanData[field] = cleanData[field] === 'true' || cleanData[field] === '1';
      }
    });

    // Convertir ARRAY fields (strings → arrays si nécessaire)
    const arrayFields = ['personnel_ids', 'equipement_ids', 'competences'];
    arrayFields.forEach(field => {
      if (cleanData[field] !== undefined) {
        if (typeof cleanData[field] === 'string') {
          try {
            cleanData[field] = JSON.parse(cleanData[field]);
          } catch {
            cleanData[field] = [];
          }
        }
        if (!Array.isArray(cleanData[field])) {
          cleanData[field] = [];
        }
      }
    });

    return cleanData;
  };

  // Validation UUID
  const isValidUUID = (str) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const isDateNowId = (id) => {
    return /^\d{13}$/.test(String(id));
  };

  // Sync vers Supabase
  const syncToSupabase = async (type, item, itemId = null) => {
    if (!isSupabaseConfigured()) {
      console.log(`� [${table}] Supabase non configur� - sauvegarde locale uniquement`);
      return { success: true, local: true };
    }

    // BLOQUER les IDs invalides (Date.now) - NE PAS SYNC
    const idToCheck = itemId || item?.id;
    if (idToCheck && isDateNowId(idToCheck)) {
      console.warn(`u26A0uFE0F [${table}] ID invalide detecte (Date.now): ${idToCheck} - SYNC BLOQUE`);
      console.warn(`u27A1uFE0F Utilisez /cleanup-old-data.html pour nettoyer les anciennes donnees`);
      return { success: false, error: "Invalid UUID (Date.now)", blocked: true };
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
    // FORCER UUID valide si ID invalide ou manquant
    const needsNewId = !newItem.id || !isValidId(newItem.id);
    const item = {
      ...newItem,
      id: needsNewId ? crypto.randomUUID() : newItem.id,
      created_at: newItem.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (needsNewId && newItem.id) {
      console.warn(`🔄 [${table}] ID invalide remplacé: ${newItem.id} → ${item.id}`);
    }

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
            const transformedData = remoteData.map(transformFromSupabase);
            setData(transformedData);
            localStorage.setItem(storageKey, JSON.stringify(transformedData));
          }
        });
      }
    }
  };
}
