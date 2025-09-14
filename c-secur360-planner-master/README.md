# C-Secur360 Planificateur

Planificateur de projets C-Secur360 - Application web moderne pour la gestion d'équipes et calendriers de travail.

## 🚀 Version 6.7 - Architecture Modulaire

### ✨ Fonctionnalités

- **🔐 Authentification** - Connexion utilisateurs et admin
- **📱 Header** - Navigation principale responsive
- **📅 Calendrier** - Vue mensuelle/hebdomadaire des projets
- **🎛️ Dashboard** - Interface de gestion administrative
- **➕ Nouveau Job + Gantt** - Création de projets avec diagramme Gantt
- **👥 Ressources** - Gestion personnel et équipements
- **🏖️ Congés** - Système de demandes de congés
- **📱 PWA** - Application Progressive Web App
- **📤 Export** - Export de données multiformat
- **☁️ Sync Google Drive** - Synchronisation cloud automatique

### 🏗️ Architecture

```
src/
├── modules/                 # Modules fonctionnels
│   ├── Auth/               # Authentification
│   ├── Header/             # Navigation
│   ├── Calendar/           # Calendrier principal
│   ├── Dashboard/          # Gestion admin
│   ├── NewJob/             # Jobs + Gantt
│   ├── Resource/           # Personnel & équipements
│   ├── Conge/              # Gestion congés
│   ├── PWA/                # Service Worker
│   └── Export/             # Export données
├── components/UI/          # Composants réutilisables
├── hooks/                  # Hooks React
├── utils/                  # Utilitaires
└── styles/                 # Styles globaux
```

### 🔧 Technologies

- **React 18** - Framework frontend
- **Vite** - Bundler moderne
- **TailwindCSS** - Framework CSS
- **Google Drive API** - Synchronisation cloud
- **Vercel** - Déploiement

### 🚀 Démarrage Rapide

```bash
# Installation
npm install

# Développement
npm run dev

# Build production
npm run build

# Preview build
npm run preview
```

### 🔐 Utilisateurs de Test

| Nom | Mot de passe | Permissions |
|-----|--------------|-------------|
| Alexandre Desrochers | Alex123! | Admin + Coordinateur |
| Marc-André Bisson | Marc456! | Modification |
| Jean-François Lemieux | JF789! | Modification |
| Simon Dubois | Simon321! | Lecture seule |
| Patrick Tremblay | Pat654! | Admin + Coordinateur |
| Michel Gagnon | Mich987! | Modification |

**Admin:** `MdlAdm321!$`

### 🏢 Bureaux

- MDL Sherbrooke 🔵
- MDL Terrebonne 🟢
- MDL Québec 🟠
- DUAL Électrotech 🔴
- CFM 🟣
- Surplec 🔷

### 🚀 Déploiement Vercel

1. **Fork ce repository**
2. **Connectez à Vercel**
3. **Configuration automatique** (déjà prête)
4. **Deploy** 🎉

### 📱 PWA

- Installation native
- Mode offline
- Synchronisation automatique
- Notifications push

### 🔒 Sécurité

- Authentification multi-niveaux
- Sessions sécurisées
- Données locales chiffrées
- HTTPS obligatoire en production

### 🔧 Configuration

Créez un fichier `.env.local` :

```env
# Google Drive (optionnel)
VITE_GOOGLE_CLIENT_ID=your-client-id
VITE_GOOGLE_API_KEY=your-api-key
```

### 📊 Structure des Données

- **Jobs** - Projets avec étapes et dépendances
- **Personnel** - Équipes avec spécialités
- **Équipements** - Matériel avec maintenance
- **Congés** - Demandes et approbations

### 🤝 Contribution

1. Fork le projet
2. Créez une branche (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

### 📄 License

Ce projet est sous licence MIT.

### 💬 Support

Pour toute question ou problème, contactez l'équipe de développement.

---

**C-Secur360** - Planification d'équipes professionnelle 🎯# Version de production prête
