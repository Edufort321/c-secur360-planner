// ============== ENREGISTREMENT DU SERVICE WORKER ==============
// Utilitaire pour enregistrer et gérer le service worker PWA avec mise à jour forcée automatique

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none' // Toujours vérifier les mises à jour
      });

      console.log(' Service Worker enregistré:', registration.scope);

      // Vérifier si une mise à jour vient d'être effectuée
      checkForCompletedUpdate();

      // Écouter les mises à jour
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('= Mise à jour du Service Worker détectée');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nouvelle version disponible - mise à jour forcée automatique
            console.log('=æ Nouvelle version disponible - rechargement automatique');

            // Stocker un flag pour afficher la notification après rechargement
            localStorage.setItem('app-update-completed', 'true');

            // Forcer le nouveau service worker à s'activer
            newWorker.postMessage({ type: 'SKIP_WAITING' });

            // Attendre un court instant et recharger
            setTimeout(() => {
              window.location.reload();
            }, 100);
          }
        });
      });

      // Vérifier les mises à jour toutes les 60 secondes
      setInterval(() => {
        registration.update().catch(err => {
          console.log('Erreur lors de la vérification des mises à jour:', err);
        });
      }, 60000);

      // Vérifier immédiatement s'il y a une mise à jour
      registration.update().catch(err => {
        console.log('Erreur lors de la vérification initiale des mises à jour:', err);
      });

      return registration;
    } catch (error) {
      console.error('L Erreur lors de l\'enregistrement du Service Worker:', error);
    }
  } else {
    console.log('  Service Worker non supporté par ce navigateur');
  }
}

// Vérifier si une mise à jour vient d'être effectuée et afficher une notification
function checkForCompletedUpdate() {
  const updateCompleted = localStorage.getItem('app-update-completed');

  if (updateCompleted === 'true') {
    // Supprimer le flag
    localStorage.removeItem('app-update-completed');

    // Afficher une notification
    showUpdateNotification();
  }
}

// Afficher une notification de mise à jour effectuée
function showUpdateNotification() {
  // Créer un élément de notification toast
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
    max-width: 300px;
  `;

  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">Mise à jour effectuée</div>
        <div style="font-size: 12px; opacity: 0.9;">L'application a été mise à jour avec succès</div>
      </div>
    </div>
  `;

  // Ajouter l'animation CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  // Ajouter au document
  document.body.appendChild(toast);

  // Retirer après 5 secondes avec animation
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 300);
  }, 5000);
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log('Service Worker désenregistré');
      })
      .catch((error) => {
        console.error('Erreur lors du désenregistrement:', error);
      });
  }
}

export function clearCache() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    console.log('Cache vidé');
  }
}
