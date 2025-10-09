// ============== CLIENT SUPABASE ==============
// Configuration du client Supabase pour sync temps réel

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Créer le client Supabase avec configuration optimale
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  }
});

// Helper: Vérifier si Supabase est configuré
export const isSupabaseConfigured = () => {
  return supabaseUrl !== 'https://your-project.supabase.co' &&
         supabaseAnonKey !== 'your-anon-key';
};

// Helper: Vérifier la connexion
export const checkConnection = async () => {
  try {
    const { error } = await supabase.from('personnel').select('count', { count: 'exact', head: true });
    return !error;
  } catch (error) {
    console.error('L Supabase non accessible:', error);
    return false;
  }
};

console.log('=á Supabase client initialisé:', isSupabaseConfigured() ? ' Configuré' : '  Variables ENV manquantes');
