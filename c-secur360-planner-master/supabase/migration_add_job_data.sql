-- ============== MIGRATION: Ajouter colonnes pour données avancées jobs ==============
-- Exécuter dans SQL Editor de Supabase Dashboard
-- https://supabase.com/dashboard/project/zhiyleadhqkfbmjadqjy/editor

-- Ajouter colonnes JSONB pour stocker les données complexes
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS etapes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS gantt_view_mode TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS horaires_personnalises JSONB DEFAULT '{}'::jsonb;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS equipes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS fichiers JSONB DEFAULT '[]'::jsonb;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS recurrence JSONB DEFAULT NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS baseline JSONB DEFAULT NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS critical_path JSONB DEFAULT '[]'::jsonb;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS show_critical_path BOOLEAN DEFAULT false;

-- Ajouter autres champs manquants du formulaire
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS nom TEXT; -- Nom du job (différent de titre)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS lieu TEXT; -- Lieu d'intervention
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS sous_traitant TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS numero TEXT; -- Numéro de job
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS responsable TEXT;

-- Commentaires pour documentation
COMMENT ON COLUMN jobs.etapes IS 'Étapes du projet avec hiérarchie, durée, dépendances (JSONB)';
COMMENT ON COLUMN jobs.gantt_view_mode IS 'Mode de vue Gantt: 6h, 12h, 24h, day, week, month';
COMMENT ON COLUMN jobs.horaires_personnalises IS 'Horaires personnalisés par jour (JSONB)';
COMMENT ON COLUMN jobs.equipes IS 'Équipes assignées au projet (JSONB)';
COMMENT ON COLUMN jobs.fichiers IS 'Fichiers attachés au projet (JSONB)';
COMMENT ON COLUMN jobs.recurrence IS 'Configuration de récurrence (JSONB)';
COMMENT ON COLUMN jobs.baseline IS 'Baseline sauvegardée pour comparaison (JSONB)';
COMMENT ON COLUMN jobs.critical_path IS 'IDs des tâches sur le chemin critique (JSONB array)';
COMMENT ON COLUMN jobs.show_critical_path IS 'Afficher le chemin critique dans Gantt';

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_jobs_nom ON jobs(nom);
CREATE INDEX IF NOT EXISTS idx_jobs_lieu ON jobs(lieu);
CREATE INDEX IF NOT EXISTS idx_jobs_numero ON jobs(numero);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
