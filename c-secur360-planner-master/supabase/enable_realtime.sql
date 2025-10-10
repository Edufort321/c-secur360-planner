-- ============== ACTIVER REALTIME SUPABASE ==============
-- Exécuter dans SQL Editor de Supabase Dashboard
-- https://supabase.com/dashboard/project/zhiyleadhqkfbmjadqjy/editor

-- Activer Realtime pour la table jobs
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;

-- Activer Realtime pour la table personnel
ALTER PUBLICATION supabase_realtime ADD TABLE personnel;

-- Activer Realtime pour la table equipements
ALTER PUBLICATION supabase_realtime ADD TABLE equipements;

-- Activer Realtime pour la table succursales
ALTER PUBLICATION supabase_realtime ADD TABLE succursales;

-- Activer Realtime pour la table postes
ALTER PUBLICATION supabase_realtime ADD TABLE postes;

-- Activer Realtime pour la table conges
ALTER PUBLICATION supabase_realtime ADD TABLE conges;

-- Vérifier que Realtime est activé
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
