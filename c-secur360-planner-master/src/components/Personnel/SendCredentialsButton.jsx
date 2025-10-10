// ============== BOUTON ENVOI CREDENTIALS ==============
// Bouton pour envoyer les identifiants par email au personnel

import React, { useState } from 'react';
import { Icon } from '../UI/Icon';
import { generatePassword, sendCredentialsByEmail, copyCredentialsToClipboard } from '../../utils/emailService';

export function SendCredentialsButton({ personnel, onPasswordGenerated }) {
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState(null);

  const pwaUrl = window.location.origin;

  const handleGenerateAndSend = async () => {
    if (!personnel.email) {
      alert('⚠️ Aucune adresse email configurée pour ce personnel!');
      return;
    }

    if (!confirm(`Envoyer les identifiants à ${personnel.prenom} ${personnel.nom}?\n\nEmail: ${personnel.email}`)) {
      return;
    }

    setLoading(true);

    try {
      // Générer le mot de passe
      const password = generatePassword(12);
      setGeneratedPassword(password);

      // Callback pour sauvegarder le mot de passe dans le profil
      if (onPasswordGenerated) {
        await onPasswordGenerated(password);
      }

      // Envoyer par email
      await sendCredentialsByEmail(personnel, password, pwaUrl);

      alert(`✅ Email préparé!\n\n👤 Utilisateur: ${personnel.nom}\n🔑 Mot de passe: ${password}\n\nL'email s'ouvrira dans votre client email.`);

    } catch (error) {
      console.error('Erreur envoi credentials:', error);
      alert(`❌ Erreur lors de l'envoi: ${error.message}`);
    } finally {
      setLoading(false);
      setShowOptions(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!generatedPassword) {
      alert('⚠️ Générez d\'abord un mot de passe!');
      return;
    }

    const result = await copyCredentialsToClipboard(personnel, generatedPassword, pwaUrl);

    if (result.success) {
      alert('✅ Credentials copiés dans le presse-papier!');
    } else {
      alert(`❌ Erreur copie: ${result.error}`);
    }
  };

  const handleGenerateOnly = () => {
    const password = generatePassword(12);
    setGeneratedPassword(password);

    if (onPasswordGenerated) {
      onPasswordGenerated(password);
    }

    alert(`🔑 Mot de passe généré:\n\n${password}\n\n✅ Mot de passe sauvegardé dans le profil.`);
    setShowOptions(false);
  };

  if (!personnel || !personnel.id) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
        title="Envoyer les accès par email"
      >
        <Icon name="mail" size={20} />
        <span>{loading ? 'Envoi...' : 'Envoyer accès'}</span>
      </button>

      {showOptions && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-50 w-80">
          <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <h3 className="font-bold text-lg">📧 Options d'envoi</h3>
            <p className="text-sm opacity-90 mt-1">
              {personnel.prenom} {personnel.nom}
            </p>
            {personnel.email && (
              <p className="text-xs opacity-75 mt-1 flex items-center gap-1">
                <Icon name="mail" size={12} />
                {personnel.email}
              </p>
            )}
          </div>

          <div className="p-4 space-y-2">
            {/* Option 1: Générer + Envoyer */}
            <button
              onClick={handleGenerateAndSend}
              disabled={loading || !personnel.email}
              className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                <Icon name="mail" size={20} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Générer + Envoyer</div>
                <div className="text-xs text-gray-600">
                  Crée un mot de passe et ouvre l'email
                </div>
              </div>
            </button>

            {/* Option 2: Générer seulement */}
            <button
              onClick={handleGenerateOnly}
              disabled={loading}
              className="w-full flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left border border-purple-200"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white">
                <Icon name="key" size={20} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Générer mot de passe</div>
                <div className="text-xs text-gray-600">
                  Crée un mot de passe sans envoyer
                </div>
              </div>
            </button>

            {/* Option 3: Copier (si mot de passe généré) */}
            {generatedPassword && (
              <button
                onClick={handleCopyCredentials}
                className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left border border-green-200"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white">
                  <Icon name="copy" size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Copier les accès</div>
                  <div className="text-xs text-gray-600">
                    Copie dans le presse-papier
                  </div>
                </div>
              </button>
            )}

            {!personnel.email && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>Email manquant</strong><br />
                  Ajoutez une adresse email pour pouvoir envoyer les accès.
                </p>
              </div>
            )}

            {generatedPassword && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-gray-700 mb-2">
                  <strong>Mot de passe actuel:</strong>
                </p>
                <code className="text-sm bg-white px-2 py-1 rounded border border-gray-300 block overflow-x-auto">
                  {generatedPassword}
                </code>
              </div>
            )}
          </div>

          <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={() => setShowOptions(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
