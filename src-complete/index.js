/**
 * Index principal - Exports des composants restructurés
 * EXTRAIT DE LA VERSION COMPLÈTE B3hoWdZQh
 * Point d'entrée unique pour tous les composants modulaires
 */

// Hooks
export { useAppData } from './hooks/useAppData.js';
export { useGoogleDrive } from './hooks/useGoogleDrive.js';
export { useScreenSize } from './hooks/useScreenSize.js';
export { useNotifications } from './hooks/useNotifications.js';

// Composants UI de base
export { Icon } from './components/UI/Icon.js';
export { PhotoCarousel } from './components/UI/PhotoCarousel.js';
export { DropZone } from './components/UI/DropZone.js';
export { FilePreview } from './components/UI/FilePreview.js';

// Composants modaux
export { Modal } from './components/Modal.js';
export { NotificationContainer } from './components/NotificationContainer.js';
export { EquipementModal } from './components/Modals/EquipementModal.js';
export { CongesModal } from './components/Modals/CongesModal.js';
export { PersonnelModal } from './components/Modals/PersonnelModal.js';

// Composants utilitaires
export { DateNavigator } from './components/DateNavigator.js';
export { ResourceSelector } from './components/ResourceSelector.js';

// Utilitaires
export { 
    getBureauFromSuccursale, 
    getBureauColor, 
    getBureauOptions 
} from './utils/bureauUtils.js';