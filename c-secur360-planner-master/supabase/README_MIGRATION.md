# 🔄 Migration Supabase - Données Jobs Avancées

## ⚠️ PROBLÈME ACTUEL

Les événements (jobs) disparaissent quand vous fermez l'application car la table `jobs` dans Supabase ne contient pas toutes les colonnes nécessaires pour stocker:
- Les étapes du projet (Gantt)
- Les horaires personnalisés
- Les équipes
- Les fichiers
- La configuration Gantt
- Le chemin critique

## ✅ SOLUTION

Exécuter la migration SQL pour ajouter les colonnes manquantes.

## 📋 ÉTAPES POUR APPLIQUER LA MIGRATION

### 1. Se connecter à Supabase Dashboard
- URL: https://supabase.com/dashboard/project/zhiyleadhqkfbmjadqjy
- Aller dans **SQL Editor** (icône ⚡)

### 2. Exécuter la migration
- Copier tout le contenu du fichier `migration_add_job_data.sql`
- Coller dans SQL Editor
- Cliquer sur **Run** (▶️)

### 3. Vérifier que la migration a réussi
```sql
-- Vérifier les colonnes de la table jobs
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'jobs'
ORDER BY ordinal_position;
```

Vous devriez voir les nouvelles colonnes:
- `nom` (text)
- `lieu` (text)
- `numero` (text)
- `responsable` (text)
- `sous_traitant` (text)
- `etapes` (jsonb)
- `gantt_view_mode` (text)
- `horaires_personnalises` (jsonb)
- `equipes` (jsonb)
- `fichiers` (jsonb)
- `recurrence` (jsonb)
- `baseline` (jsonb)
- `critical_path` (jsonb)
- `show_critical_path` (boolean)

### 4. Tester
- Créer un nouvel événement dans l'application
- Ajouter des étapes dans l'onglet Étapes
- Sauvegarder
- Fermer l'application
- Rouvrir → Les données devraient être persistées! ✅

## 🔍 VÉRIFIER LES DONNÉES

Pour voir les données dans Supabase:
```sql
-- Voir tous les jobs
SELECT id, titre, nom, client, etapes
FROM jobs
ORDER BY created_at DESC;

-- Voir les étapes d'un job spécifique
SELECT nom, etapes
FROM jobs
WHERE id = 'VOTRE_JOB_ID';
```

## 🐛 TROUBLESHOOTING

### Les données ne se sauvegardent toujours pas
1. Vérifier la console du navigateur (F12) pour voir les erreurs
2. Vérifier que les credentials Supabase sont corrects dans `.env.local`
3. Vérifier la connexion internet
4. Vérifier les permissions RLS (Row Level Security) dans Supabase

### Activer RLS si nécessaire
```sql
-- Activer RLS pour la table jobs
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Créer une policy pour permettre toutes les opérations (DEV ONLY)
CREATE POLICY "Allow all operations for now" ON jobs
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

⚠️ **Note**: En production, créer des policies plus restrictives basées sur l'authentification.

## 🔄 ACTIVER SYNCHRONISATION TEMPS RÉEL

Pour que les utilisateurs voient les changements instantanément:

### 1. Exécuter le script enable_realtime.sql
```sql
-- Copier/coller depuis supabase/enable_realtime.sql
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE personnel;
ALTER PUBLICATION supabase_realtime ADD TABLE equipements;
-- ... etc
```

### 2. Vérifier dans Supabase Dashboard
- Database → Replication
- Vérifier que toutes les tables sont cochées

### 3. Tester le temps réel
1. Ouvrir l'app dans 2 navigateurs différents (ou 2 onglets)
2. Créer un événement dans le premier
3. **Il devrait apparaître instantanément dans le second** ✅

### Comment ça fonctionne:
- Utilisateur A crée un job → Supabase envoie notification
- Utilisateur B reçoit la notification → Affichage instantané
- Pas besoin de rafraîchir la page! 🚀

## 📝 MAPPING DES CHAMPS

FormData (JavaScript) → Supabase (snake_case):
- `formData.nom` → `jobs.nom`
- `formData.client` → `jobs.client`
- `formData.lieu` → `jobs.lieu`
- `formData.dateDebut` → `jobs.date_debut`
- `formData.dateFin` → `jobs.date_fin`
- `formData.etapes` → `jobs.etapes` (JSONB)
- `formData.ganttViewMode` → `jobs.gantt_view_mode`
- `formData.horairesPersonnalises` → `jobs.horaires_personnalises` (JSONB)
- `formData.equipes` → `jobs.equipes` (JSONB)
- etc.

La transformation camelCase ↔ snake_case est gérée automatiquement par `useSupabaseSync.js`.

## 🎯 RÉSUMÉ COMPLET

### ✅ Ce qui est déjà fait (dans le code):
- Sync offline-first (localStorage + Supabase)
- Écoute des changements temps réel
- Transformation automatique des champs
- Queue de sync en cas de déconnexion
- Re-tentative automatique quand online

### 🔧 Ce que VOUS devez faire:
1. **Exécuter migration_add_job_data.sql** → Ajoute colonnes manquantes
2. **Exécuter enable_realtime.sql** → Active synchronisation temps réel
3. **Configurer RLS si nécessaire** → Sécurité (optionnel en dev)

Après ces 2 étapes:
- ✅ Événements persistent entre sessions
- ✅ Synchronisation instantanée entre utilisateurs
- ✅ Fonctionne même hors ligne (sync à la reconnexion)
