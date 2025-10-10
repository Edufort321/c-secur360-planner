# 📊 Tables Supabase - C-Secur360 Planner

## ✅ Tables Synchronisées (Aucune perte de données)

Toutes ces tables sont synchronisées avec Supabase en temps réel:

### 1. **jobs** (Événements/Projets)
- Table: `jobs`
- localStorage: `c-secur360-jobs`
- CRUD: `addJob`, `updateJob`, `deleteJob`

### 2. **personnel** (Employés)
- Table: `personnel`
- localStorage: `c-secur360-personnel`
- CRUD: `addPersonnel`, `updatePersonnel`, `deletePersonnel`, `savePersonnel`

### 3. **equipements** (Équipements)
- Table: `equipements`
- localStorage: `c-secur360-equipements`
- CRUD: `addEquipement`, `updateEquipement`, `deleteEquipement`, `saveEquipement`

### 4. **postes** (Postes de travail)
- Table: `postes`
- localStorage: `c-secur360-postes`
- CRUD: `addPoste`, `savePoste`, `deletePoste`

### 5. **succursales** (Succursales/Bureaux)
- Table: `succursales`
- localStorage: `c-secur360-succursales`
- CRUD: `addSuccursale`, `saveSuccursale`, `deleteSuccursale`

### 6. **conges** (Congés)
- Table: `conges`
- localStorage: `c-secur360-conges`
- CRUD: `addConge`, `updateConge`, `deleteConge`, `saveConge`

### 7. **departements** (Départements)
- Table: `departements`
- localStorage: `c-secur360-departements`
- CRUD: `addDepartement`

### 8. **soustraitants** (Sous-traitants) ⚠️ NOUVEAU
- Table: `soustraitants`
- localStorage: `c-secur360-soustraitants`
- CRUD: `addSousTraitant`, `updateSousTraitant`, `deleteSousTraitant`

---

## 🔧 Configuration Supabase Requise

### Étape 1: Créer la table `soustraitants`

Exécute ce SQL dans Supabase SQL Editor:

```sql
-- Créer la table soustraitants
CREATE TABLE IF NOT EXISTS public.soustraitants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL,
    specialite TEXT,
    telephone TEXT,
    email TEXT,
    disponible BOOLEAN DEFAULT true,
    tarif TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activer RLS (Row Level Security)
ALTER TABLE public.soustraitants ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut lire
CREATE POLICY "Enable read access for all users" ON public.soustraitants
    FOR SELECT USING (true);

-- Politique: Tout le monde peut insérer
CREATE POLICY "Enable insert access for all users" ON public.soustraitants
    FOR INSERT WITH CHECK (true);

-- Politique: Tout le monde peut modifier
CREATE POLICY "Enable update access for all users" ON public.soustraitants
    FOR UPDATE USING (true);

-- Politique: Tout le monde peut supprimer
CREATE POLICY "Enable delete access for all users" ON public.soustraitants
    FOR DELETE USING (true);
```

### Étape 2: Activer Realtime

Dans Supabase Dashboard:
1. Va dans **Database** > **Replication**
2. Active **Realtime** pour la table `soustraitants`

---

## 🔄 Comment fonctionne la synchronisation?

### Architecture Offline-First

```
┌─────────────────────────────────────────┐
│  1. UTILISATEUR FAIT UNE ACTION         │
│     (Ajouter, Modifier, Supprimer)      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. SAUVEGARDE IMMÉDIATE LOCALSTORAGE   │
│     ✅ Instantané (pas d'attente)        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. SYNC SUPABASE EN PARALLÈLE          │
│     📡 Si online: sync immédiat          │
│     📴 Si offline: queue de sync         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. REALTIME SYNC (SI AUTRE USER)       │
│     👥 Autres utilisateurs voient        │
│        les changements en temps réel    │
└─────────────────────────────────────────┘
```

### Avantages

✅ **Jamais de perte de données** - Double sauvegarde (localStorage + Supabase)
✅ **Fonctionne offline** - localStorage permet utilisation sans internet
✅ **Temps réel** - Changements visibles instantanément entre utilisateurs
✅ **Sync automatique** - Queue de synchronisation quand connexion rétablie

---

## 📝 États Locaux (Non synchronisés)

Ces données sont stockées UNIQUEMENT localement (ne se synchronisent pas):

- `currentUser` - Utilisateur connecté (session)
- `isAdminMode` - Mode administrateur
- `selectedView` - Vue calendrier sélectionnée
- `selectedDate` - Date sélectionnée
- `lastSaved` - Dernière sauvegarde

⚠️ Ces états sont normaux et ne doivent PAS être synchronisés (navigation UI uniquement)

---

## 🛠️ Récupération des données

Si tu perds tes données localement:

1. **Option 1**: Va sur `/force-resync.html`
2. **Option 2**: Console navigateur: `localStorage.clear()` puis F5
3. **Option 3**: Hard refresh (Ctrl+Shift+R)

Les données reviendront automatiquement depuis Supabase! 🎉

---

## ✅ Checklist Validation

- [x] 7 tables existantes avec sync Supabase
- [x] Nouvelle table `soustraitants` ajoutée au code
- [ ] Table `soustraitants` créée dans Supabase (SQL ci-dessus)
- [ ] Realtime activé pour `soustraitants`

Une fois la table créée dans Supabase, **PLUS AUCUNE DONNÉE NE SERA PERDUE** ✨
