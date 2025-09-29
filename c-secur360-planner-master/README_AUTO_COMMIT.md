# 🔄 Système de Commits Automatiques

## Utilisation Simple

### Commandes NPM (Recommandées)
```bash
# Démarrer la surveillance automatique
npm run auto-commit

# Créer un commit immédiat
npm run commit-now

# Voir le statut Git
npm run git-status
```

### Commandes Directes
```bash
# Démarrer la surveillance
node auto-commit.js start

# Commit manuel
node auto-commit.js commit

# Statut Git
node auto-commit.js status
```

## Fonctionnement

1. **Surveillance Automatique**
   - Surveille tous les fichiers `.js`, `.jsx`, `.css`, `package.json`, etc.
   - Détecte les modifications en temps réel
   - Attend 3 minutes après la dernière modification
   - Crée automatiquement un commit avec timestamp

2. **Commits Automatiques**
   - Format: `🔄 AUTO-COMMIT 2025-01-15T14-30-25`
   - Inclut la liste des fichiers modifiés
   - Pousse automatiquement vers GitHub
   - Garde une trace de tous les changements

3. **Protection du Travail**
   - Plus jamais de perte de code
   - Historique complet des modifications
   - Sauvegarde automatique sur GitHub
   - Arrêt propre avec `Ctrl+C`

## Exemple d'Usage

```bash
# Terminal 1: Développement
npm run dev

# Terminal 2: Protection automatique
npm run auto-commit
```

Vos modifications seront automatiquement sauvegardées toutes les 3 minutes!

## Messages de Commit

Les commits automatiques incluent:
- Horodatage précis
- Liste des fichiers modifiés
- Attribution à Claude Code
- Format standardisé pour traçabilité

Exemple:
```
🔄 AUTO-COMMIT 2025-01-15T14-30-25

Sauvegarde automatique des modifications:
- JobModal.jsx, package.json, README.md

🤖 Généré automatiquement par Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```