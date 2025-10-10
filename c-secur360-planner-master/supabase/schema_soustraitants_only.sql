-- ============== AJOUT TABLE SOUSTRAITANTS UNIQUEMENT ==============
-- À exécuter dans SQL Editor de Supabase Dashboard
-- (Les autres tables existent déjà)

-- ============== TABLE: soustraitants ==============
CREATE TABLE IF NOT EXISTS soustraitants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Trigger auto-update (la fonction existe déjà)
CREATE TRIGGER update_soustraitants_updated_at BEFORE UPDATE ON soustraitants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE soustraitants ENABLE ROW LEVEL SECURITY;

-- Politique
CREATE POLICY "Permettre tout pour soustraitants" ON soustraitants FOR ALL USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE soustraitants;

-- ============== FIN ==============
-- Table soustraitants créée avec succès! ✅
