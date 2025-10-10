// ============== SERVICE EMAIL ==============
// Service pour envoyer les credentials et lien PWA par email

/**
 * Génère un mot de passe aléatoire sécurisé
 * @param {number} length - Longueur du mot de passe (défaut: 12)
 * @returns {string} Mot de passe généré
 */
export function generatePassword(length = 12) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%&*';

  const all = uppercase + lowercase + numbers + symbols;

  let password = '';
  // Garantir au moins 1 de chaque type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Remplir le reste
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Mélanger
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Génère le template HTML de l'email
 */
function generateEmailTemplate(personnel, password, pwaUrl) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vos accès C-Secur360</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 3px solid #667eea;
    }
    .header h1 {
      color: #667eea;
      margin: 0;
    }
    .credentials {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .credential-item {
      margin: 10px 0;
    }
    .credential-label {
      font-weight: bold;
      color: #555;
    }
    .credential-value {
      font-size: 18px;
      color: #667eea;
      font-family: 'Courier New', monospace;
      background: white;
      padding: 8px 12px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 5px;
    }
    .pwa-section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
    }
    .pwa-button {
      display: inline-block;
      background: white;
      color: #667eea;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin-top: 15px;
      transition: transform 0.2s;
    }
    .pwa-button:hover {
      transform: translateY(-2px);
    }
    .instructions {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .instructions h3 {
      margin-top: 0;
      color: #856404;
    }
    .step {
      margin: 10px 0;
      padding-left: 25px;
      position: relative;
    }
    .step::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #888;
      font-size: 12px;
    }
    .warning {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Bienvenue sur C-Secur360</h1>
      <p>Planificateur Mobile</p>
    </div>

    <p>Bonjour <strong>${personnel.prenom} ${personnel.nom}</strong>,</p>

    <p>Votre compte a été créé avec succès! Voici vos informations de connexion:</p>

    <div class="credentials">
      <div class="credential-item">
        <div class="credential-label">👤 Nom d'utilisateur:</div>
        <div class="credential-value">${personnel.nom}</div>
      </div>
      <div class="credential-item">
        <div class="credential-label">🔑 Mot de passe:</div>
        <div class="credential-value">${password}</div>
      </div>
    </div>

    <div class="warning">
      ⚠️ <strong>Important:</strong> Conservez ce mot de passe en lieu sûr. Vous pourrez le modifier après votre première connexion.
    </div>

    <div class="pwa-section">
      <h2 style="margin-top: 0;">📱 Installation sur mobile</h2>
      <p>Installez l'application sur votre téléphone pour un accès rapide et hors-ligne!</p>
      <a href="${pwaUrl}" class="pwa-button">
        Ouvrir l'application
      </a>
    </div>

    <div class="instructions">
      <h3>📲 Comment installer sur votre téléphone:</h3>

      <p><strong>Sur iPhone/iPad (Safari):</strong></p>
      <div class="step">Ouvrez le lien ci-dessus dans Safari</div>
      <div class="step">Appuyez sur le bouton "Partager" (carré avec flèche vers le haut)</div>
      <div class="step">Sélectionnez "Sur l'écran d'accueil"</div>
      <div class="step">Confirmez en appuyant sur "Ajouter"</div>

      <p style="margin-top: 20px;"><strong>Sur Android (Chrome):</strong></p>
      <div class="step">Ouvrez le lien ci-dessus dans Chrome</div>
      <div class="step">Appuyez sur les 3 points en haut à droite</div>
      <div class="step">Sélectionnez "Installer l'application"</div>
      <div class="step">Confirmez l'installation</div>
    </div>

    <div class="instructions">
      <h3>🎯 Informations de votre compte:</h3>
      <div class="step"><strong>Poste:</strong> ${personnel.poste || 'Non défini'}</div>
      <div class="step"><strong>Département:</strong> ${personnel.departement || 'Non défini'}</div>
      <div class="step"><strong>Succursale:</strong> ${personnel.succursale || 'Non défini'}</div>
      <div class="step"><strong>Niveau d'accès:</strong> ${personnel.niveau_acces || 'consultation'}</div>
    </div>

    <p style="margin-top: 30px;">
      Si vous avez des questions ou rencontrez des difficultés, n'hésitez pas à contacter votre administrateur.
    </p>

    <div class="footer">
      <p>Cet email a été généré automatiquement par C-Secur360 Planificateur</p>
      <p>© ${new Date().getFullYear()} C-Secur360 - Tous droits réservés</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Envoie les credentials par email via mailto (client email local)
 * Pour production, utiliser un service email (SendGrid, AWS SES, etc.)
 */
export async function sendCredentialsByEmail(personnel, password, pwaUrl) {
  const subject = `🔐 Vos accès C-Secur360 - ${personnel.prenom} ${personnel.nom}`;

  // Version texte simple pour mailto
  const bodyText = `
Bonjour ${personnel.prenom} ${personnel.nom},

Votre compte C-Secur360 a été créé avec succès!

=== VOS IDENTIFIANTS ===
👤 Nom d'utilisateur: ${personnel.nom}
🔑 Mot de passe: ${password}

⚠️ IMPORTANT: Conservez ce mot de passe en lieu sûr.

=== INSTALLATION DE L'APPLICATION ===
📱 Lien: ${pwaUrl}

INSTALLATION SUR IPHONE/IPAD:
1. Ouvrez le lien dans Safari
2. Appuyez sur "Partager" (carré avec flèche)
3. Sélectionnez "Sur l'écran d'accueil"
4. Confirmez

INSTALLATION SUR ANDROID:
1. Ouvrez le lien dans Chrome
2. Appuyez sur les 3 points
3. Sélectionnez "Installer l'application"
4. Confirmez

=== VOTRE PROFIL ===
Poste: ${personnel.poste || 'Non défini'}
Département: ${personnel.departement || 'Non défini'}
Succursale: ${personnel.succursale || 'Non défini'}
Niveau d'accès: ${personnel.niveau_acces || 'consultation'}

Pour toute question, contactez votre administrateur.

---
C-Secur360 Planificateur
© ${new Date().getFullYear()} C-Secur360
  `.trim();

  // Encoder pour mailto
  const mailtoLink = `mailto:${personnel.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;

  // Pour un vrai service email (à implémenter plus tard):
  // return await fetch('/api/send-email', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     to: personnel.email,
  //     subject,
  //     html: generateEmailTemplate(personnel, password, pwaUrl),
  //     text: bodyText
  //   })
  // });

  // Pour l'instant, ouvrir le client email local
  window.open(mailtoLink);

  return {
    success: true,
    method: 'mailto',
    message: 'Client email ouvert'
  };
}

/**
 * Copie les credentials dans le presse-papier
 */
export async function copyCredentialsToClipboard(personnel, password, pwaUrl) {
  const text = `
🔐 ACCÈS C-SECUR360 - ${personnel.prenom} ${personnel.nom}

👤 Nom d'utilisateur: ${personnel.nom}
🔑 Mot de passe: ${password}
📱 Application: ${pwaUrl}

Poste: ${personnel.poste || 'Non défini'}
Succursale: ${personnel.succursale || 'Non défini'}
  `.trim();

  try {
    await navigator.clipboard.writeText(text);
    return { success: true, message: 'Copié dans le presse-papier!' };
  } catch (error) {
    console.error('Erreur copie presse-papier:', error);
    return { success: false, error: error.message };
  }
}
