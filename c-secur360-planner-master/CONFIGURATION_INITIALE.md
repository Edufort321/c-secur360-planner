# 🔧 Configuration Initiale - C-Secur360 Planificateur

## 🔐 Connexion Administrative Initiale

### Utilisateur Administrateur par Défaut
- **Nom d'utilisateur:** `Administrateur`
- **Mot de passe:** `MdlAdm321!$`

Cette connexion vous permettra d'accéder à toutes les fonctionnalités pour configurer votre système.

## 📝 Processus de Configuration des Données Réelles

### 1. Première Connexion
1. Allez sur http://localhost:3009
2. Connectez-vous avec l'utilisateur `Administrateur` et le mot de passe `MdlAdm321!$`
3. Vous aurez accès complet à toutes les fonctionnalités

### 2. Configuration du Personnel
1. Allez dans **Gestion des Ressources**
2. Onglet **Personnel**
3. Cliquez sur **Ajouter Personnel**
4. Ajoutez Eric Dufort avec ses vraies informations:
   - Nom: Eric Dufort
   - Poste: [Votre poste réel]
   - Email: [Votre email réel]
   - Succursale: [Votre bureau]
   - Mot de passe: [Choisissez un mot de passe]
   - Role: Coordonnateur (pour avoir les mêmes droits)

### 3. Configuration des Succursales
1. Dans **Gestion des Ressources**
2. Onglet **Succursales**
3. Ajoutez vos vraies succursales C-Secur360:
   - Nom, adresse, téléphone, responsable

### 4. Configuration des Équipements
1. Onglet **Équipements**
2. Ajoutez votre inventaire réel d'équipements
3. Associez-les aux bonnes succursales

## 💾 Protection de Vos Données

### Sauvegarde Automatique
- Toutes vos données sont sauvegardées automatiquement dans localStorage
- La sauvegarde se fait 1 seconde après chaque modification
- Vos données restent même si vous fermez le navigateur

### Avant les Mises à Jour du Code
Avant que je fasse des modifications au code, vous devriez:

1. **Exporter vos données** (fonctionnalité disponible dans l'interface)
2. **Ou faire une copie du localStorage** en ouvrant la console du navigateur (F12) et tapant:
   ```javascript
   // Exporter toutes vos données
   const data = localStorage.getItem('planificateur-data-v4');
   console.log('Vos données:', data);
   // Copiez et sauvegardez cette chaîne dans un fichier texte
   ```

3. **Pour restaurer vos données** après une mise à jour:
   ```javascript
   // Dans la console du navigateur
   localStorage.setItem('planificateur-data-v4', 'COLLEZ_VOS_DONNEES_ICI');
   // Puis rechargez la page
   ```

### Sécurité des Données
- Les données sont stockées localement sur votre machine
- Aucune donnée n'est envoyée à des serveurs externes
- La synchronisation Google Drive (si activée) chiffre vos données

## 🚀 Prochaines Étapes

1. **Testez d'abord avec des données de test** pour vous familiariser
2. **Configurez vos vraies données** progressivement
3. **Testez toutes les fonctionnalités** (création jobs, assignation ressources, etc.)
4. **Exportez une sauvegarde** avant tout déploiement sur Vercel

## ⚠️ Important

- **Supprimez l'utilisateur "Administrateur" par défaut** une fois votre compte Eric Dufort configuré
- **Changez les mots de passe** des comptes utilisateurs
- **Faites des sauvegardes régulières** de vos données importantes