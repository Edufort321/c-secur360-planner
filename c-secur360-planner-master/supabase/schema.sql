-- ============== SCHEMA SUPABASE - C-SECUR360 PLANIFICATEUR ==============
-- � ex�cuter dans SQL Editor de Supabase Dashboard
-- https://supabase.com/dashboard/project/YOUR_PROJECT/editor

-- Extension UUID (si pas d�j� activ�e)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============== TABLE: personnel ==============
CREATE TABLE IF NOT EXISTS personnel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  prenom TEXT,
  poste TEXT,
  departement TEXT,
  succursale TEXT,
  password TEXT, -- Mot de passe (� hasher en prod)
  niveau_acces TEXT CHECK (niveau_acces IN ('consultation', 'modification', 'coordination', 'administration')),
  permissions JSONB DEFAULT '{}'::jsonb,
  telephone TEXT,
  email TEXT,
  date_embauche DATE,
  salaire NUMERIC(10, 2),
  visible_chantier BOOLEAN DEFAULT true,
  disponible BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherches fr�quentes
CREATE INDEX IF NOT EXISTS idx_personnel_nom ON personnel(nom);
CREATE INDEX IF NOT EXISTS idx_personnel_succursale ON personnel(succursale);
CREATE INDEX IF NOT EXISTS idx_personnel_disponible ON personnel(disponible);

-- ============== TABLE: jobs ==============
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titre TEXT NOT NULL,
  client TEXT,
  adresse TEXT,
  ville TEXT,
  code_postal TEXT,
  date_debut DATE,
  date_fin DATE,
  heure_debut TIME,
  heure_fin TIME,
  statut TEXT CHECK (statut IN ('planifie', 'en_cours', 'termine', 'annule')),
  priorite TEXT CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
  couleur TEXT,
  personnel_ids UUID[], -- Array d'IDs personnel assign�s
  equipement_ids UUID[], -- Array d'IDs �quipements assign�s
  notes TEXT,
  description TEXT,
  type_service TEXT,
  montant NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES personnel(id)
);

-- Index pour recherches et filtres
CREATE INDEX IF NOT EXISTS idx_jobs_date_debut ON jobs(date_debut);
CREATE INDEX IF NOT EXISTS idx_jobs_statut ON jobs(statut);
CREATE INDEX IF NOT EXISTS idx_jobs_client ON jobs(client);

-- ============== TABLE: equipements ==============
CREATE TABLE IF NOT EXISTS equipements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  type TEXT,
  succursale TEXT,
  departement TEXT,
  marque TEXT,
  modele TEXT,
  numero_serie TEXT,
  disponible BOOLEAN DEFAULT true,
  couleur TEXT DEFAULT '#10B981',
  etat TEXT,
  date_achat DATE,
  cout_location DECIMAL(10,2),
  derniere_maintenance DATE,
  prochaine_maintenance DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_equipements_type ON equipements(type);
CREATE INDEX IF NOT EXISTS idx_equipements_succursale ON equipements(succursale);
CREATE INDEX IF NOT EXISTS idx_equipements_disponible ON equipements(disponible);

-- ============== TABLE: succursales ==============
CREATE TABLE IF NOT EXISTS succursales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT UNIQUE NOT NULL,
  adresse TEXT,
  ville TEXT,
  province TEXT DEFAULT 'QC',
  code_postal TEXT,
  telephone TEXT,
  fax TEXT,
  email TEXT,
  responsable TEXT,
  nombre_employes INTEGER,
  couleur TEXT DEFAULT '#1E40AF',
  actif BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== TABLE: postes ==============
CREATE TABLE IF NOT EXISTS postes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  departement TEXT,
  description TEXT,
  salaire_min NUMERIC(10, 2),
  salaire_max NUMERIC(10, 2),
  competences TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== TABLE: conges ==============
CREATE TABLE IF NOT EXISTS conges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personnel_id UUID REFERENCES personnel(id) ON DELETE CASCADE,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  type TEXT CHECK (type IN ('vacances', 'maladie', 'personnel', 'formation', 'autre')),
  statut TEXT CHECK (statut IN ('en_attente', 'approuve', 'refuse')) DEFAULT 'en_attente',
  raison TEXT,
  notes TEXT,
  approuve_par UUID REFERENCES personnel(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_conges_personnel ON conges(personnel_id);
CREATE INDEX IF NOT EXISTS idx_conges_dates ON conges(date_debut, date_fin);
CREATE INDEX IF NOT EXISTS idx_conges_statut ON conges(statut);

-- ============== TABLE: departements ==============
CREATE TABLE IF NOT EXISTS departements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT UNIQUE NOT NULL,
  description TEXT,
  responsable_id UUID REFERENCES personnel(id),
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== TABLE: soustraitants ==============
CREATE TABLE IF NOT EXISTS soustraitants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  specialite TEXT,
  telephone TEXT,
  email TEXT,
  disponible BOOLEAN DEFAULT true,
  tarif TEXT,
  adresse TEXT,
  ville TEXT,
  code_postal TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_soustraitants_nom ON soustraitants(nom);
CREATE INDEX IF NOT EXISTS idx_soustraitants_disponible ON soustraitants(disponible);
CREATE INDEX IF NOT EXISTS idx_soustraitants_specialite ON soustraitants(specialite);

-- ============== TRIGGERS: Mise à jour automatique updated_at ==============
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger � toutes les tables
CREATE TRIGGER update_personnel_updated_at BEFORE UPDATE ON personnel
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipements_updated_at BEFORE UPDATE ON equipements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_succursales_updated_at BEFORE UPDATE ON succursales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_postes_updated_at BEFORE UPDATE ON postes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conges_updated_at BEFORE UPDATE ON conges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_soustraitants_updated_at BEFORE UPDATE ON soustraitants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============== ROW LEVEL SECURITY (RLS) ==============
-- Activer RLS sur toutes les tables
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipements ENABLE ROW LEVEL SECURITY;
ALTER TABLE succursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE postes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conges ENABLE ROW LEVEL SECURITY;
ALTER TABLE departements ENABLE ROW LEVEL SECURITY;
ALTER TABLE soustraitants ENABLE ROW LEVEL SECURITY;

-- Politique: Permettre toutes opérations pour le moment (à affiner selon besoins)
-- NOTE: En production, créer des politiques plus restrictives basées sur auth.uid()

CREATE POLICY "Permettre tout pour personnel" ON personnel FOR ALL USING (true);
CREATE POLICY "Permettre tout pour jobs" ON jobs FOR ALL USING (true);
CREATE POLICY "Permettre tout pour equipements" ON equipements FOR ALL USING (true);
CREATE POLICY "Permettre tout pour succursales" ON succursales FOR ALL USING (true);
CREATE POLICY "Permettre tout pour postes" ON postes FOR ALL USING (true);
CREATE POLICY "Permettre tout pour conges" ON conges FOR ALL USING (true);
CREATE POLICY "Permettre tout pour departements" ON departements FOR ALL USING (true);
CREATE POLICY "Permettre tout pour soustraitants" ON soustraitants FOR ALL USING (true);

-- ============== VUES UTILES ==============

-- Vue: Personnel avec leur succursale compl�te
CREATE OR REPLACE VIEW v_personnel_complet AS
SELECT
  p.*,
  s.adresse as succursale_adresse,
  s.ville as succursale_ville,
  s.couleur as succursale_couleur
FROM personnel p
LEFT JOIN succursales s ON p.succursale = s.nom;

-- Vue: Jobs avec compteurs
CREATE OR REPLACE VIEW v_jobs_stats AS
SELECT
  j.*,
  CARDINALITY(j.personnel_ids) as nb_personnel,
  CARDINALITY(j.equipement_ids) as nb_equipements
FROM jobs j;

-- ============== DONN�ES DE TEST ==============
-- Ins�rer quelques donn�es de test (optionnel)

INSERT INTO succursales (nom, ville, couleur) VALUES
  ('C-Secur360 Sherbrooke', 'Sherbrooke', '#1E40AF'),
  ('C-Secur360 Montr�al', 'Montr�al', '#DC2626'),
  ('C-Secur360 Qu�bec', 'Qu�bec', '#059669')
ON CONFLICT (nom) DO NOTHING;

-- ============== CONFIGURATION REALTIME ==============
-- Activer realtime sur toutes les tables

-- Note: Exécuter dans SQL Editor:
-- ALTER PUBLICATION supabase_realtime ADD TABLE personnel;
-- ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
-- ALTER PUBLICATION supabase_realtime ADD TABLE equipements;
-- ALTER PUBLICATION supabase_realtime ADD TABLE succursales;
-- ALTER PUBLICATION supabase_realtime ADD TABLE postes;
-- ALTER PUBLICATION supabase_realtime ADD TABLE conges;
-- ALTER PUBLICATION supabase_realtime ADD TABLE departements;
-- ALTER PUBLICATION supabase_realtime ADD TABLE soustraitants;

-- OU via Dashboard: Database > Replication > Enable realtime for tables

-- ============== FIN ==============
-- Schema créé avec succès !
-- 8 tables synchronisées: personnel, jobs, equipements, succursales, postes, conges, departements, soustraitants
-- Prochaine étape: Configurer .env.local avec VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
