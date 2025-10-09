// ============== ENREGISTREMENT DU SERVICE WORKER ==============
// Utilitaire pour enregistrer et g�rer le service worker PWA avec mise � jour forc�e automatique

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none' // Toujours v�rifier les mises � jour
      });

      console.log(' Service Worker enregistr�:', registration.scope);

      // V�rifier si une mise � jour vient d'�tre effectu�e
      checkForCompletedUpdate();

      // �couter les mises � jour
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('= Mise � jour du Service Worker d�tect�e');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nouvelle version disponible - mise � jour forc�e automatique
            console.log('=� Nouvelle version disponible - rechargement automatique');

            // Stocker un flag pour afficher la notification apr�s rechargement
            localStorage.setItem('app-update-completed', 'true');

            // Forcer le nouveau service worker � s'activer
            newWorker.postMessage({ type: 'SKIP_WAITING' });

            // Attendre un court instant et recharger
            setTimeout(() => {
              window.location.reload();
            }, 100);
          }
        });
      });

      // V�rifier les mises � jour toutes les 60 secondes
      setInterval(() => {
        registration.update().catch(err => {
          console.log('Erreur lors de la v�rification des mises � jour:', err);
        });
      }, 60000);

      // V�rifier imm�diatement s'il y a une mise � jour
      registration.update().catch(err => {
        console.log('Erreur lors de la v�rification initiale des mises � jour:', err);
      });

      return registration;
    } catch (error) {
      console.error('L Erreur lors de l\'enregistrement du Service Worker:', error);
    }
  } else {
    console.log('� Service Worker non support� par ce navigateur');
  }
}

// V�rifier si une mise � jour vient d'�tre effectu�e et afficher une notification
function checkForCompletedUpdate() {
  const updateCompleted = localStorage.getItem('app-update-completed');

  if (updateCompleted === 'true') {
    // Supprimer le flag
    localStorage.removeItem('app-update-completed');

    // Afficher une notification
    showUpdateNotification();
  }
}

// Afficher une notification de mise � jour effectu�e
function showUpdateNotification() {
  // Cr�er un �l�ment de notification toast
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
        <div style="font-weight: 600; margin-bottom: 4px;">Mise � jour effectu�e</div>
        <div style="font-size: 12px; opacity: 0.9;">L'application a �t� mise � jour avec succ�s</div>
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

  // Retirer apr�s 5 secondes avec animation
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
        console.log('Service Worker d�senregistr�');
      })
      .catch((error) => {
        console.error('Erreur lors du d�senregistrement:', error);
      });
  }
}

export function clearCache() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    console.log('Cache vid�');
  }
}
